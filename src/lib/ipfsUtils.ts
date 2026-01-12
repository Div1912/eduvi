/**
 * IPFS Hash Validation Utilities
 * 
 * Validates IPFS CID formats to prevent URL injection attacks.
 */

// IPFS CIDv0: starts with Qm, 46 chars total, base58
const CIDV0_PATTERN = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;

// IPFS CIDv1: starts with b (base32) or z (base58), variable length
const CIDV1_BASE32_PATTERN = /^b[a-z2-7]{58,}$/;
const CIDV1_BASE58_PATTERN = /^z[1-9A-HJ-NP-Za-km-z]+$/;

/**
 * Validates if a string is a valid IPFS CID (v0 or v1)
 */
export function isValidIPFSHash(hash: string | null | undefined): boolean {
  if (!hash || typeof hash !== 'string') {
    return false;
  }

  // Remove ipfs:// prefix if present
  const cleaned = hash.replace(/^ipfs:\/\//i, '').trim();

  if (!cleaned) {
    return false;
  }

  // Check for path traversal or URL authority attacks
  if (cleaned.includes('/') || cleaned.includes('@') || cleaned.includes(':') || cleaned.includes('\\')) {
    return false;
  }

  // Validate against known CID patterns
  return (
    CIDV0_PATTERN.test(cleaned) ||
    CIDV1_BASE32_PATTERN.test(cleaned) ||
    CIDV1_BASE58_PATTERN.test(cleaned)
  );
}

/**
 * Safely constructs an IPFS gateway URL from a hash.
 * Returns null if the hash is invalid.
 */
export function getSafeIPFSUrl(hash: string | null | undefined): string | null {
  if (!hash || typeof hash !== 'string') {
    return null;
  }

  // Remove ipfs:// prefix if present
  const cleaned = hash.replace(/^ipfs:\/\//i, '').trim();

  if (!isValidIPFSHash(cleaned)) {
    console.warn('Invalid IPFS hash detected:', hash);
    return null;
  }

  return `https://ipfs.io/ipfs/${cleaned}`;
}

/**
 * Cleans an IPFS hash by removing the ipfs:// prefix
 */
export function cleanIPFSHash(hash: string | null | undefined): string {
  if (!hash || typeof hash !== 'string') {
    return '';
  }
  return hash.replace(/^ipfs:\/\//i, '').trim();
}
