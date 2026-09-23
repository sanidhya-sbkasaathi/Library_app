/**
 * LOCAL/SIMULATOR CRYPTOGRAPHIC SIGNING ENGINE (For Onboarding & Dev Simulator)
 * 
 * Algorithm: Ed25519 (Asymmetric Digital Signatures)
 * RFC 8032 / Web Cryptography API Native Hardware Implementation
 */

export type CredentialType = 'LIBRARY_OWNER' | 'LIBRARY_ROLE';

export interface OwnerCredentialPayload {
  credential_type: 'LIBRARY_OWNER';
  credential_id: string; // e.g. "OWNER-9F82A4C1"
  library_id: string;    // e.g. "ORG-ABC001" or "LIB-ZEBRA"
  owner_id: string;      // e.g. "USER-OWN-101"
  owner_name: string;
  owner_email: string;
  plan: string;          // 'Basic' | 'Professional' | 'Enterprise'
  issued_at: string;     // ISO timestamp
  expires_at: string;    // ISO timestamp (YYYY-MM-DD or full ISO)
  status: 'active' | 'suspended' | 'revoked';
  version: number;       // e.g. 1
  key_id: string;        // e.g. "management-v1"
}

export interface RoleCredentialPayload {
  credential_type: 'LIBRARY_ROLE';
  credential_id: string; // e.g. "ROLE-81BC77D2"
  library_id: string;    // MUST match target organization's library_id
  user_id: string;       // e.g. "USER-100"
  role: string;          // 'Librarian' | 'Manager' | 'Receptionist' | 'Accountant' | 'Staff'
  user_name?: string;
  user_email?: string;
  issued_at: string;
  expires_at: string;
  status: 'active' | 'suspended' | 'revoked';
  version: number;
  key_id: string;
}

export interface SignedCredentialEnvelope<T = OwnerCredentialPayload | RoleCredentialPayload> {
  payload: T;
  signature: string;     // 64-byte Ed25519 signature in hexadecimal
  algorithm: 'Ed25519';
  key_id: string;
}

// Master Management Server Signing Keys (key_id: 'management-v1')
const MASTER_KEY_ID = 'management-v1';

// PKCS#8 48-byte DER representation of the Ed25519 private key
const MANAGEMENT_PRIVATE_KEY_PKCS8_HEX =
  '302e020100300506032b6570042204207e61ff5ff41e77845e8ed8281acbd29678c78c80b9dd18d6a21f474c1ca488d1';

// Corresponding 32-byte Ed25519 public key in hexadecimal
export const MANAGEMENT_PUBLIC_KEY_HEX =
  '6163f12ef58a88f596de82f4622a5a5efc236306b38c512fba3b272afb6a9080';

// Helper: Hex string to Uint8Array
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Helper: Uint8Array to Hex string
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Deterministic canonical JSON serialization
 * Sorts object keys recursively to guarantee identical byte representations.
 */
export function canonicalizeJson(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalizeJson).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map(k => `${JSON.stringify(k)}:${canonicalizeJson(obj[k])}`);
  return '{' + pairs.join(',') + '}';
}

class ServerCryptoEngine {
  private static instance: ServerCryptoEngine;
  private cachedPrivateKey: CryptoKey | null = null;
  private cachedPublicKey: CryptoKey | null = null;

  private constructor() {}

  public static getInstance(): ServerCryptoEngine {
    if (!ServerCryptoEngine.instance) {
      ServerCryptoEngine.instance = new ServerCryptoEngine();
    }
    return ServerCryptoEngine.instance;
  }

  /**
   * Import the server's Ed25519 private key into SubtleCrypto
   */
  private async getPrivateKey(): Promise<CryptoKey> {
    if (this.cachedPrivateKey) return this.cachedPrivateKey;

    const privateBytes = hexToBytes(MANAGEMENT_PRIVATE_KEY_PKCS8_HEX);
    this.cachedPrivateKey = await crypto.subtle.importKey(
      'pkcs8',
      privateBytes as unknown as BufferSource,
      { name: 'Ed25519' },
      false,
      ['sign']
    );
    return this.cachedPrivateKey;
  }

  /**
   * Import the server's Ed25519 public key into SubtleCrypto
   */
  public async getPublicKey(): Promise<CryptoKey> {
    if (this.cachedPublicKey) return this.cachedPublicKey;

    const publicBytes = hexToBytes(MANAGEMENT_PUBLIC_KEY_HEX);
    this.cachedPublicKey = await crypto.subtle.importKey(
      'raw',
      publicBytes as unknown as BufferSource,
      { name: 'Ed25519' },
      true,
      ['verify']
    );
    return this.cachedPublicKey;
  }

  /**
   * Sign arbitrary canonical bytes with Ed25519
   */
  public async signPayload(canonicalJsonString: string): Promise<string> {
    const privKey = await this.getPrivateKey();
    const data = new TextEncoder().encode(canonicalJsonString);
    const signatureBuffer = await crypto.subtle.sign({ name: 'Ed25519' }, privKey, data);
    return bytesToHex(new Uint8Array(signatureBuffer));
  }

  /**
   * Issue and digitally sign an official LIBRARY OWNER credential
   */
  public async issueOwnerCredential(params: {
    libraryId: string;
    ownerId?: string;
    ownerName: string;
    ownerEmail: string;
    plan: string;
    durationYears?: number;
  }): Promise<SignedCredentialEnvelope<OwnerCredentialPayload>> {
    const duration = params.durationYears || 1;
    const now = new Date();
    const expiry = new Date(now.getTime() + duration * 365 * 86400000);

    const credentialId = `OWNER-${Math.random().toString(36).substring(2, 6).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const ownerId = params.ownerId || `USER-OWN-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const payload: OwnerCredentialPayload = {
      credential_type: 'LIBRARY_OWNER',
      credential_id: credentialId,
      library_id: params.libraryId,
      owner_id: ownerId,
      owner_name: params.ownerName,
      owner_email: params.ownerEmail,
      plan: params.plan,
      issued_at: now.toISOString(),
      expires_at: expiry.toISOString().split('T')[0],
      status: 'active',
      version: 1,
      key_id: MASTER_KEY_ID,
    };

    const canonicalJson = canonicalizeJson(payload);
    const signature = await this.signPayload(canonicalJson);

    return {
      payload,
      signature,
      algorithm: 'Ed25519',
      key_id: MASTER_KEY_ID,
    };
  }

  /**
   * Issue and digitally sign an official LIBRARY ROLE credential (e.g. Librarian, Accountant)
   */
  public async issueRoleCredential(params: {
    libraryId: string;
    role: string;
    userId?: string;
    userName?: string;
    userEmail?: string;
    validDays?: number;
  }): Promise<SignedCredentialEnvelope<RoleCredentialPayload>> {
    const validDays = params.validDays || 365;
    const now = new Date();
    const expiry = new Date(now.getTime() + validDays * 86400000);

    const credentialId = `ROLE-${Math.random().toString(36).substring(2, 6).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const userId = params.userId || `USER-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const payload: RoleCredentialPayload = {
      credential_type: 'LIBRARY_ROLE',
      credential_id: credentialId,
      library_id: params.libraryId,
      user_id: userId,
      role: params.role,
      user_name: params.userName || params.role,
      user_email: params.userEmail,
      issued_at: now.toISOString(),
      expires_at: expiry.toISOString().split('T')[0],
      status: 'active',
      version: 1,
      key_id: MASTER_KEY_ID,
    };

    const canonicalJson = canonicalizeJson(payload);
    const signature = await this.signPayload(canonicalJson);

    return {
      payload,
      signature,
      algorithm: 'Ed25519',
      key_id: MASTER_KEY_ID,
    };
  }

  /**
   * Helper to verify a signed credential envelope directly
   */
  public async verifyCredential(envelope: SignedCredentialEnvelope): Promise<{
    valid: boolean;
    error?: string;
  }> {
    try {
      if (!envelope || !envelope.payload || !envelope.signature) {
        return { valid: false, error: 'Malformed envelope structure' };
      }
      if (envelope.algorithm !== 'Ed25519') {
        return { valid: false, error: `Unsupported algorithm: ${envelope.algorithm}` };
      }
      if (envelope.key_id !== MASTER_KEY_ID) {
        return { valid: false, error: `Untrusted key_id: ${envelope.key_id}` };
      }

      const pubKey = await this.getPublicKey();
      const canonicalJson = canonicalizeJson(envelope.payload);
      const data = new TextEncoder().encode(canonicalJson);
      const signatureBytes = hexToBytes(envelope.signature);

      const isValid = await crypto.subtle.verify(
        { name: 'Ed25519' },
        pubKey,
        signatureBytes as unknown as BufferSource,
        data
      );

      return { valid: isValid, error: isValid ? undefined : 'Cryptographic signature mismatch' };
    } catch (e: any) {
      return { valid: false, error: e.message || 'Signature verification error' };
    }
  }
}

export const serverCrypto = ServerCryptoEngine.getInstance();
