import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { ethers } from 'https://esm.sh/ethers@6.13.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// IMPORTANT: This message MUST be identical to the frontend message.
const SIGN_MESSAGE = 'EduVerify login: Sign this message to verify wallet ownership';

const FRIENDLY_VERIFY_ERROR = 'Wallet verification failed. Please reconnect your wallet and try again.';

interface NonceRequest {
  wallet_address: string;
}

interface VerifyRequest {
  wallet_address: string;
  signature: string;
  message: string;
}

// Validate Ethereum address format
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Service role is required to manage Auth users + bypass RLS for profile/roles creation.
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();

    // Backward-compatible endpoint: returns the fixed message (no nonce, no dynamic text)
    if (action === 'nonce' || action === 'wallet-auth') {
      const { wallet_address } = body as NonceRequest;

      if (!wallet_address || !isValidAddress(wallet_address)) {
        return new Response(JSON.stringify({ error: 'Invalid wallet address' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ message: SIGN_MESSAGE }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: Verify signature and create session
    if (action === 'verify') {
      const { wallet_address, signature, message } = body as VerifyRequest;

      if (!wallet_address || !isValidAddress(wallet_address) || !signature || !message) {
        return new Response(JSON.stringify({ error: FRIENDLY_VERIFY_ERROR }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Ensure deterministic, identical message (prevents newline/punctuation/space mismatches)
      if (message !== SIGN_MESSAGE) {
        return new Response(JSON.stringify({ error: FRIENDLY_VERIFY_ERROR }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const normalizedAddress = wallet_address.toLowerCase();

      // Recover address via ethers.verifyMessage(message, signature)
      let recoveredAddress: string;
      try {
        recoveredAddress = ethers.verifyMessage(message, signature).toLowerCase();
      } catch (e) {
        console.error('Signature verification failed:', e);
        return new Response(JSON.stringify({ error: FRIENDLY_VERIFY_ERROR }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (recoveredAddress !== normalizedAddress) {
        return new Response(JSON.stringify({ error: FRIENDLY_VERIFY_ERROR }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Deterministic email identity for this wallet.
      const email = `${normalizedAddress}@wallet.eduverify.local`;

      // Try to locate an existing profile by wallet address (fast, doesn't require listing users)
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id')
        .eq('wallet_address', normalizedAddress)
        .maybeSingle();

      if (profileError) {
        console.error('Failed to lookup profile:', profileError);
        return new Response(JSON.stringify({ error: 'Failed to verify wallet' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let userId: string;
      let userEmail: string = email;

      if (existingProfile?.user_id) {
        userId = existingProfile.user_id;
        const { data: userData, error: getUserError } = await supabase.auth.admin.getUserById(userId);

        if (getUserError || !userData?.user) {
          console.error('Failed to fetch user by id:', getUserError);
          return new Response(JSON.stringify({ error: 'Failed to verify wallet' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        userEmail = userData.user.email ?? email;
      } else {
        // Create new Auth user
        const { data: newUserData, error: createError } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            wallet_address: normalizedAddress,
          },
        });

        if (createError || !newUserData?.user) {
          console.error('Failed to create user:', createError);
          return new Response(JSON.stringify({ error: 'Failed to create user account' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        userId = newUserData.user.id;
        userEmail = newUserData.user.email ?? email;

        // Ensure profile exists and is linked to user_id
        if (existingProfile) {
          await supabase
            .from('profiles')
            .update({ user_id: userId })
            .eq('id', existingProfile.id);
        } else {
          await supabase.from('profiles').insert({
            user_id: userId,
            wallet_address: normalizedAddress,
            role: 'student',
          });
        }

        // Ensure default role exists
        const { data: existingRole, error: roleLookupError } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .eq('role', 'student')
          .maybeSingle();

        if (roleLookupError) {
          console.error('Failed to lookup user role:', roleLookupError);
        } else if (!existingRole) {
          const { error: roleInsertError } = await supabase
            .from('user_roles')
            .insert({ user_id: userId, role: 'student' });
          if (roleInsertError) {
            console.error('Failed to insert user role:', roleInsertError);
          }
        }
      }

      // Generate a magic link token for client-side session establishment.
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: userEmail,
      });

      if (linkError || !linkData) {
        console.error('Failed to generate auth link:', linkError);
        return new Response(JSON.stringify({ error: 'Failed to create session' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: userId,
            email: userEmail,
            wallet_address: normalizedAddress,
          },
          token_hash: linkData.properties.hashed_token,
          verification_url: linkData.properties.action_link,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Wallet auth error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

