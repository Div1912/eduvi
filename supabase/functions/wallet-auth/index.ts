import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { ethers } from 'https://esm.sh/ethers@6.13.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NonceRequest {
  wallet_address: string;
}

interface VerifyRequest {
  wallet_address: string;
  signature: string;
  nonce: string;
}

// Validate Ethereum address format
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Generate a cryptographically secure nonce
function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role for nonce management
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();

    // Action: Get nonce for wallet
    if (action === 'nonce' || action === 'wallet-auth') {
      const { wallet_address } = body as NonceRequest;

      if (!wallet_address || !isValidAddress(wallet_address)) {
        return new Response(
          JSON.stringify({ error: 'Invalid wallet address' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const normalizedAddress = wallet_address.toLowerCase();
      const nonce = generateNonce();
      const message = `Sign this message to authenticate with EduVerify.\n\nNonce: ${nonce}\nWallet: ${normalizedAddress}\nTimestamp: ${new Date().toISOString()}`;

      // Store nonce in database
      const { error: insertError } = await supabase
        .from('auth_nonces')
        .insert({
          wallet_address: normalizedAddress,
          nonce,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        });

      if (insertError) {
        console.error('Failed to create nonce:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create authentication challenge' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ nonce, message }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Verify signature and create session
    if (action === 'verify') {
      const { wallet_address, signature, nonce } = body as VerifyRequest;

      if (!wallet_address || !isValidAddress(wallet_address)) {
        return new Response(
          JSON.stringify({ error: 'Invalid wallet address' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!signature || !nonce) {
        return new Response(
          JSON.stringify({ error: 'Missing signature or nonce' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const normalizedAddress = wallet_address.toLowerCase();

      // Verify nonce exists and is not expired/used
      const { data: nonceData, error: nonceError } = await supabase
        .from('auth_nonces')
        .select('*')
        .eq('wallet_address', normalizedAddress)
        .eq('nonce', nonce)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (nonceError || !nonceData) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired nonce' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Recreate the message that was signed
      const message = `Sign this message to authenticate with EduVerify.\n\nNonce: ${nonce}\nWallet: ${normalizedAddress}\nTimestamp: ${nonceData.created_at}`;

      // Verify the signature
      let recoveredAddress: string;
      try {
        recoveredAddress = ethers.verifyMessage(message, signature).toLowerCase();
      } catch (e) {
        console.error('Signature verification failed:', e);
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (recoveredAddress !== normalizedAddress) {
        return new Response(
          JSON.stringify({ error: 'Signature does not match wallet address' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark nonce as used
      await supabase
        .from('auth_nonces')
        .update({ used: true })
        .eq('id', nonceData.id);

      // Check if user exists with this wallet
      const email = `${normalizedAddress}@wallet.eduverify.local`;
      
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const user = existingUser?.users?.find(u => 
        u.user_metadata?.wallet_address === normalizedAddress
      );

      let session;
      
      if (user) {
        // User exists, create a session
        const { data: signInData, error: signInError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: user.email!,
        });

        if (signInError) {
          console.error('Failed to generate session:', signInError);
          return new Response(
            JSON.stringify({ error: 'Failed to create session' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Extract token from the link and sign in
        const tokenHash = new URL(signInData.properties.hashed_token, 'http://dummy').searchParams.get('token') || signInData.properties.hashed_token;
        
        const { data: sessionData, error: sessionError } = await supabase.auth.admin.getUserById(user.id);
        
        if (sessionError) {
          console.error('Failed to get user:', sessionError);
          return new Response(
            JSON.stringify({ error: 'Failed to retrieve user' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Return user info for client-side session handling
        session = { user: sessionData.user };
      } else {
        // Create new user with wallet address in metadata
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            wallet_address: normalizedAddress,
          },
        });

        if (createError) {
          console.error('Failed to create user:', createError);
          return new Response(
            JSON.stringify({ error: 'Failed to create user account' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create profile for new user
        await supabase
          .from('profiles')
          .insert({
            user_id: newUser.user.id,
            wallet_address: normalizedAddress,
            role: 'student', // Default role
          });

        // Assign default student role
        await supabase
          .from('user_roles')
          .insert({
            user_id: newUser.user.id,
            role: 'student',
          });

        session = { user: newUser.user };
      }

      // Generate a proper session token for the user
      const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: session.user.email!,
        options: {
          redirectTo: '/',
        }
      });

      if (tokenError) {
        console.error('Failed to generate token:', tokenError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate session token' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          user: {
            id: session.user.id,
            email: session.user.email,
            wallet_address: normalizedAddress,
          },
          // Return the magic link token for client to verify
          token_hash: tokenData.properties.hashed_token,
          verification_url: tokenData.properties.action_link,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Wallet auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
