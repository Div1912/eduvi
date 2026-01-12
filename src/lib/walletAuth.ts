import { supabase } from '@/integrations/supabase/client';

const WALLET_AUTH_URL = 'https://iagnculfrgjpkjlihvem.supabase.co/functions/v1/wallet-auth';

// IMPORTANT: This message MUST be identical to the backend message.
export const WALLET_SIGN_MESSAGE =
  'EduVerify login: Sign this message to verify wallet ownership' as const;

const FRIENDLY_VERIFY_ERROR =
  'Wallet verification failed. Please reconnect your wallet and try again.';

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

function toFriendlyAuthError(): Error {
  return new Error(FRIENDLY_VERIFY_ERROR);
}

/**
 * Sign the fixed login message using MetaMask (personal_sign).
 * Ensures we sign with the currently connected wallet address.
 */
export async function signLoginMessage(connectedWalletAddress: string): Promise<{
  signature: string;
  message: typeof WALLET_SIGN_MESSAGE;
  wallet_address: string;
}> {
  if (!window.ethereum) {
    // This is user-facing and actionable.
    throw new Error('MetaMask is not installed');
  }

  const accounts = (await window.ethereum.request({
    method: 'eth_requestAccounts',
  })) as string[];

  const activeAddress = accounts?.[0];

  if (!activeAddress) {
    throw toFriendlyAuthError();
  }

  // Ensure we sign with the address the app considers "connected".
  if (activeAddress.toLowerCase() !== connectedWalletAddress.toLowerCase()) {
    throw toFriendlyAuthError();
  }

  const signature = (await window.ethereum.request({
    method: 'personal_sign',
    params: [WALLET_SIGN_MESSAGE, activeAddress],
  })) as string;

  return {
    signature,
    message: WALLET_SIGN_MESSAGE,
    wallet_address: activeAddress,
  };
}

/**
 * Verify signature via the wallet-auth edge function.
 */
export async function verifySignature(payload: {
  wallet_address: string;
  signature: string;
  message: typeof WALLET_SIGN_MESSAGE;
}): Promise<VerifyResponse> {
  const response = await fetch(`${WALLET_AUTH_URL}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    // Never surface backend technical details to end-users for auth.
    throw toFriendlyAuthError();
  }

  return response.json();
}

/**
 * Complete wallet authentication flow
 */
export async function authenticateWithWallet(connectedWalletAddress: string): Promise<{
  user: VerifyResponse['user'];
  session: boolean;
}> {
  // Step 1: Sign the fixed message
  const signed = await signLoginMessage(connectedWalletAddress);

  // Step 2: Verify signature and get magic link token hash
  const verifyResult = await verifySignature({
    wallet_address: signed.wallet_address,
    signature: signed.signature,
    message: signed.message,
  });

  // Step 3: Establish Supabase session
  const { error } = await supabase.auth.verifyOtp({
    token_hash: verifyResult.token_hash,
    type: 'magiclink',
  });

  if (error) {
    throw toFriendlyAuthError();
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.user_metadata?.wallet_address || null;
}
