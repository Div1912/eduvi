import { supabase } from '@/integrations/supabase/client';

const WALLET_AUTH_URL = 'https://iagnculfrgjpkjlihvem.supabase.co/functions/v1/wallet-auth';

interface NonceResponse {
  nonce: string;
  message: string;
}

interface VerifyResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    wallet_address: string;
  };
  token_hash: string;
  verification_url: string;
}

/**
 * Request a nonce for wallet signature authentication
 */
export async function requestNonce(walletAddress: string): Promise<NonceResponse> {
  const response = await fetch(`${WALLET_AUTH_URL}/nonce`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ wallet_address: walletAddress }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to request nonce');
  }

  return response.json();
}

/**
 * Sign a message using MetaMask
 */
export async function signMessage(message: string): Promise<string> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  }) as string[];

  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts available');
  }

  const signature = await window.ethereum.request({
    method: 'personal_sign',
    params: [message, accounts[0]],
  }) as string;

  return signature;
}

/**
 * Verify signature and create Supabase session
 */
export async function verifySignature(
  walletAddress: string,
  signature: string,
  nonce: string
): Promise<VerifyResponse> {
  const response = await fetch(`${WALLET_AUTH_URL}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      wallet_address: walletAddress,
      signature,
      nonce,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to verify signature');
  }

  return response.json();
}

/**
 * Complete wallet authentication flow
 */
export async function authenticateWithWallet(walletAddress: string): Promise<{
  user: VerifyResponse['user'];
  session: boolean;
}> {
  // Step 1: Request nonce
  const { nonce, message } = await requestNonce(walletAddress);

  // Step 2: Sign the message
  const signature = await signMessage(message);

  // Step 3: Verify signature and get session
  const verifyResult = await verifySignature(walletAddress, signature, nonce);

  // Step 4: Complete the magic link verification to establish session
  if (verifyResult.verification_url) {
    // Extract token from verification URL and verify it
    const url = new URL(verifyResult.verification_url);
    const token = url.searchParams.get('token') || url.hash.replace('#access_token=', '').split('&')[0];
    const type = url.searchParams.get('type') || 'magiclink';
    
    if (token) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: verifyResult.token_hash,
        type: 'magiclink',
      });

      if (error) {
        console.error('OTP verification error:', error);
        // Try alternative verification
        const { error: altError } = await supabase.auth.verifyOtp({
          email: verifyResult.user.email,
          token: token,
          type: 'magiclink',
        });
        
        if (altError) {
          console.error('Alternative verification error:', altError);
        }
      }
    }
  }

  return {
    user: verifyResult.user,
    session: true,
  };
}

/**
 * Sign out from both wallet and Supabase
 */
export async function signOutWallet(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Get current authenticated user's wallet address
 */
export async function getAuthenticatedWallet(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.wallet_address || null;
}
