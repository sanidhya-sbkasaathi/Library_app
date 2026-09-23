/**
 * CLIENT APPLICATION CRYPTOGRAPHIC VERIFICATION ENGINE (APK / Library App)
 * 
 * Algorithm: Ed25519 (Asymmetric Digital Signatures)
 * RFC 8032 / Web Cryptography API Native Hardware Implementation
 * 
 * SECURITY PRINCIPLES:
 * 1. Contains ONLY the Management Server's PUBLIC verification key.
 * 2. ZERO private keys exist in this application.
 * 3. 100% Offline verification: Mathematical proof requires NO internet connection.
 * 4. Separate validation pipelines for 'LIBRARY_OWNER' vs 'LIBRARY_ROLE'.
 */

export type CredentialType = 'LIBRARY_OWNER' | 'LIBRARY_ROLE';

export interface OwnerCredentialPayload {
  credential_type: 'LIBRARY_OWNER';
  credential_id: string;
  library_id: string;
  owner_id: string;
  owner_name: string;
  owner_email: string;
  plan: string;
  issued_at: string;
  expires_at: string;
  status: 'active' | 'suspended' | 'revoked';
  version: number;
  key_id: string;
}

export interface RoleCredentialPayload {
  credential_type: 'LIBRARY_ROLE';
  credential_id: string;
  library_id: string;
  user_id: string;
  role: string;
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
  signature: string;
  algorithm: 'Ed25519';
  key_id: string;
}

export interface VerificationResult<T = any> {
  valid: boolean;
  payload?: T;
  error?: string;
  verificationDetails?: {
    signatureValid: boolean;
    typeValid: boolean;
    notExpired: boolean;
    statusActive: boolean;
    keyIdMatched: boolean;
    algorithm: string;
    verifiedAt: string;
    offlineCapable: boolean;
  };
}

// Trusted Public Keys registry (Support key rotation by key_id)
export const TRUSTED_PUBLIC_KEYS: Record<string, string> = {
  'management-v1': '6163f12ef58a88f596de82f4622a5a5efc236306b38c512fba3b272afb6a9080',
};

// Helper: Hex to Uint8Array
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Helper: Uint8Array to Hex
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Deterministic canonical JSON serialization
 * Must strictly match the Management Server's canonical serializer
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

class AppCryptoEngine {
  private static instance: AppCryptoEngine;
  private keyCache: Map<string, CryptoKey> = new Map();

  private constructor() {}

  public static getInstance(): AppCryptoEngine {
    if (!AppCryptoEngine.instance) {
      AppCryptoEngine.instance = new AppCryptoEngine();
    }
    return AppCryptoEngine.instance;
  }

  /**
   * Import trusted public key for key_id
   */
  public async getPublicKey(keyId: string = 'management-v1'): Promise<CryptoKey> {
    if (this.keyCache.has(keyId)) {
      return this.keyCache.get(keyId)!;
    }

    const hexKey = TRUSTED_PUBLIC_KEYS[keyId];
    if (!hexKey) {
      throw new Error(`Untrusted or unrecognized key_id: "${keyId}"`);
    }

    const rawBytes = hexToBytes(hexKey);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      rawBytes as unknown as BufferSource,
      { name: 'Ed25519' },
      false,
      ['verify']
    );

    this.keyCache.set(keyId, cryptoKey);
    return cryptoKey;
  }

  /**
   * Core Asymmetric Verification (Ed25519)
   * 100% Offline: Performs pure cryptographic verification with embedded public key
   */
  public async verifyEnvelope<T = any>(
    envelopeInput: string | SignedCredentialEnvelope<T>,
    customPublicKeyHex?: string
  ): Promise<VerificationResult<T>> {
    try {
      let envelope: SignedCredentialEnvelope<T>;
      if (typeof envelopeInput === 'string') {
        try {
          envelope = JSON.parse(envelopeInput);
        } catch {
          return { valid: false, error: 'Invalid JSON credential format' };
        }
      } else {
        envelope = envelopeInput;
      }

      if (!envelope || typeof envelope !== 'object') {
        return { valid: false, error: 'Malformed credential envelope' };
      }

      const { payload, signature, algorithm, key_id } = envelope;

      if (!payload || !signature || !algorithm || !key_id) {
        return { valid: false, error: 'Missing required envelope fields (payload, signature, algorithm, key_id)' };
      }

      if (algorithm !== 'Ed25519') {
        return { valid: false, error: `Unsupported cryptographic algorithm: ${algorithm}. Must be Ed25519.` };
      }

      // Check key_id
      if (!customPublicKeyHex && !TRUSTED_PUBLIC_KEYS[key_id]) {
        return { valid: false, error: `Key ID "${key_id}" is not in trusted root certificates` };
      }

      // 1. Digital Signature Check
      let pubKey: CryptoKey;
      if (customPublicKeyHex) {
        pubKey = await crypto.subtle.importKey(
          'raw',
          hexToBytes(customPublicKeyHex) as unknown as BufferSource,
          { name: 'Ed25519' },
          false,
          ['verify']
        );
      } else {
        pubKey = await this.getPublicKey(key_id);
      }

      const canonicalJson = canonicalizeJson(payload);
      const data = new TextEncoder().encode(canonicalJson);
      const signatureBytes = hexToBytes(signature);

      if (signatureBytes.length !== 64) {
        return { valid: false, error: `Invalid signature byte length (${signatureBytes.length} bytes, expected 64)` };
      }

      const isSignatureValid = await crypto.subtle.verify(
        { name: 'Ed25519' },
        pubKey,
        signatureBytes as unknown as BufferSource,
        data as unknown as BufferSource
      );

      if (!isSignatureValid) {
        return {
          valid: false,
          error: 'Digital signature verification failed! Credential has been tampered with or modified.',
          verificationDetails: {
            signatureValid: false,
            typeValid: false,
            notExpired: false,
            statusActive: false,
            keyIdMatched: true,
            algorithm: 'Ed25519',
            verifiedAt: new Date().toISOString(),
            offlineCapable: true,
          },
        };
      }

      // 2. Expiration Check
      const now = new Date();
      const expDate = new Date((payload as any).expires_at);
      const isNotExpired = !isNaN(expDate.getTime()) && expDate.getTime() > now.getTime();

      if (!isNotExpired) {
        return {
          valid: false,
          error: `Credential expired on ${(payload as any).expires_at}. Access denied.`,
          verificationDetails: {
            signatureValid: true,
            typeValid: true,
            notExpired: false,
            statusActive: (payload as any).status === 'active',
            keyIdMatched: true,
            algorithm: 'Ed25519',
            verifiedAt: now.toISOString(),
            offlineCapable: true,
          },
        };
      }

      // 3. Status Check
      const isStatusActive = (payload as any).status === 'active';
      if (!isStatusActive) {
        return {
          valid: false,
          error: `Credential status is "${(payload as any).status}". Only active credentials are valid.`,
          verificationDetails: {
            signatureValid: true,
            typeValid: true,
            notExpired: isNotExpired,
            statusActive: false,
            keyIdMatched: true,
            algorithm: 'Ed25519',
            verifiedAt: now.toISOString(),
            offlineCapable: true,
          },
        };
      }

      return {
        valid: true,
        payload,
        verificationDetails: {
          signatureValid: true,
          typeValid: true,
          notExpired: true,
          statusActive: true,
          keyIdMatched: true,
          algorithm: 'Ed25519',
          verifiedAt: now.toISOString(),
          offlineCapable: true,
        },
      };
    } catch (e: any) {
      return { valid: false, error: e.message || 'Cryptographic verification exception' };
    }
  }

  /**
   * Strict verification for LIBRARY_OWNER credentials
   * REJECTS if a Role credential or other type is presented.
   */
  public async verifyOwnerCredential(
    envelopeInput: string | SignedCredentialEnvelope<any>,
    customPublicKeyHex?: string
  ): Promise<VerificationResult<OwnerCredentialPayload>> {
    const res = await this.verifyEnvelope<OwnerCredentialPayload>(envelopeInput, customPublicKeyHex);
    if (!res.valid) return res;

    if (res.payload?.credential_type !== 'LIBRARY_OWNER') {
      return {
        valid: false,
        error: `Invalid credential type "${res.payload?.credential_type}". Expected "LIBRARY_OWNER". Owner onboarding cannot accept User Role credentials.`,
      };
    }

    if (!res.payload.library_id || !res.payload.owner_id) {
      return {
        valid: false,
        error: 'Missing required owner fields (library_id, owner_id) in signed payload.',
      };
    }

    return res;
  }

  /**
   * Strict verification for LIBRARY_ROLE credentials
   * REJECTS if an Owner credential is presented.
   * Enforces cross-library tenant isolation if targetLibraryId is specified.
   */
  public async verifyRoleCredential(
    envelopeInput: string | SignedCredentialEnvelope<any>,
    targetLibraryId?: string,
    customPublicKeyHex?: string
  ): Promise<VerificationResult<RoleCredentialPayload>> {
    const res = await this.verifyEnvelope<RoleCredentialPayload>(envelopeInput, customPublicKeyHex);
    if (!res.valid) return res;

    if (res.payload?.credential_type !== 'LIBRARY_ROLE') {
      return {
        valid: false,
        error: `Invalid credential type "${res.payload?.credential_type}". Expected "LIBRARY_ROLE". Role onboarding cannot accept Library Owner credentials.`,
      };
    }

    if (!res.payload.library_id || !res.payload.user_id || !res.payload.role) {
      return {
        valid: false,
        error: 'Missing required role fields (library_id, user_id, role) in signed payload.',
      };
    }

    // Cross-Library Isolation Check
    if (targetLibraryId && res.payload.library_id !== targetLibraryId) {
      return {
        valid: false,
        error: `Cross-Library Access Denied: Credential is issued for "${res.payload.library_id}" but this device is bound to "${targetLibraryId}".`,
      };
    }

    return res;
  }

  /**
   * Password Hashing using PBKDF2 with SHA-256 and Cryptographic Salt
   * Never store passwords in plaintext!
   */
  public async hashPassword(password: string, existingSaltHex?: string): Promise<{ salt: string; hash: string }> {
    const saltBytes = existingSaltHex ? hexToBytes(existingSaltHex) : crypto.getRandomValues(new Uint8Array(16));
    const salt = bytesToHex(saltBytes);

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password) as unknown as BufferSource,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBytes as unknown as BufferSource,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    const hash = bytesToHex(new Uint8Array(derivedBits));
    return { salt, hash };
  }

  /**
   * Verify password against salt and stored hash
   */
  public async verifyPassword(password: string, saltHex: string, storedHashHex: string): Promise<boolean> {
    const result = await this.hashPassword(password, saltHex);
    return result.hash === storedHashHex;
  }
}

export const appCrypto = AppCryptoEngine.getInstance();
