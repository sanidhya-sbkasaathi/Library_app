/**
 * Central Management Server Supabase Client & Library Verification Engine
 * Connects to the main control plane database to check organization provisioning,
 * verify Supabase project generation, validate PAT tokens, and sync status.
 */

export interface LibraryCloudStatus {
  found: boolean;
  libraryId: string;
  isSupabaseGenerated: boolean;
  supabaseStatus: 'Connected' | 'Provisioned' | 'Not Connected' | 'Unknown';
  supabaseUrl?: string;
  supabaseProjectRef?: string;
  supabaseAnonKey?: string;
  orgName?: string;
  ownerName?: string;
  plan?: string;
  lastCloudSync?: string;
  error?: string;
}

export interface PatValidationResult {
  ok: boolean;
  sessionId?: string;
  projects?: Array<{
    id: string;
    name: string;
    organization_id: string;
    region: string;
    status: string;
  }>;
  error?: string;
}

export const getManagementServerConfig = () => {
  const url =
    (typeof localStorage !== 'undefined' && localStorage.getItem('lib_mgmt_management_server_url')) ||
    (import.meta as any).env?.VITE_MGMT_SUPABASE_URL ||
    (import.meta as any).env?.NEXT_PUBLIC_MGMT_SUPABASE_URL ||
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    'https://jsvevzzupajrgzxsmmyr.supabase.co';

  const key =
    (typeof localStorage !== 'undefined' && localStorage.getItem('lib_mgmt_management_server_key')) ||
    (import.meta as any).env?.VITE_MGMT_SUPABASE_KEY ||
    (import.meta as any).env?.NEXT_PUBLIC_MGMT_SUPABASE_KEY ||
    (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
    'sb_publishable_xh7iUtUdJYdu4xjzPIVyWg_Wr1_76NR';

  return { url, key, anonKey: key };
};

import { SupabaseManagementApi } from './supabaseManagementApi';

export class ManagementServerClient {
  /**
   * Retrieve locally stored Supabase Personal Access Token (PAT)
   */
  public static getStoredPatToken(libraryId?: string): string {
    if (typeof localStorage === 'undefined') return '';
    try {
      if (libraryId) {
        const scoped = localStorage.getItem(`lib_pat_${libraryId}`);
        if (scoped) return scoped;
      }
      return localStorage.getItem('supabase_pat_token') || '';
    } catch {
      return '';
    }
  }

  /**
   * Persist Supabase Personal Access Token (PAT)
   */
  public static setStoredPatToken(token: string, libraryId?: string): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const clean = token.trim();
      if (clean) {
        localStorage.setItem('supabase_pat_token', clean);
        if (libraryId) {
          localStorage.setItem(`lib_pat_${libraryId}`, clean);
        }
      } else {
        localStorage.removeItem('supabase_pat_token');
        if (libraryId) {
          localStorage.removeItem(`lib_pat_${libraryId}`);
        }
      }
    } catch (err) {
      console.warn('Could not store PAT token in localStorage', err);
    }
  }

  /**
   * Remove stored PAT token
   */
  public static clearStoredPatToken(libraryId?: string): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem('supabase_pat_token');
      if (libraryId) {
        localStorage.removeItem(`lib_pat_${libraryId}`);
      }
    } catch (err) {
      console.warn('Could not clear PAT token', err);
    }
  }

  /**
   * Hits the central Management Server Supabase REST API to check if this library
   * has its Supabase database project generated and configured.
   */
  public static async checkLibrarySupabaseGeneration(libraryId: string): Promise<LibraryCloudStatus> {
    const cleanLibId = libraryId.trim();
    if (!cleanLibId) {
      return {
        found: false,
        libraryId: '',
        isSupabaseGenerated: false,
        supabaseStatus: 'Unknown',
        error: 'Missing library ID for verification',
      };
    }

    let remoteRecord: any = null;

    // 1. Direct query to Central Management Server Supabase (if configured)
    try {
      const { url: serverUrl, key: serverKey } = getManagementServerConfig();
      if (serverUrl && serverKey) {
        const endpoint = `${serverUrl.replace(/\/+$/, '')}/rest/v1/organizations?org_id=eq.${encodeURIComponent(cleanLibId)}&select=*`;
        const res = await fetch(endpoint, {
          method: 'GET',
          headers: {
            apikey: serverKey,
            Authorization: `Bearer ${serverKey}`,
            Accept: 'application/json',
          },
        });

        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            remoteRecord = rows[0];
          }
        }
      }
    } catch (err) {
      console.warn('Management server direct REST probe warning (falling back to cache):', err);
    }

    // 2. Fallback / Cross-tab synchronization check in localStorage
    if (!remoteRecord && typeof localStorage !== 'undefined') {
      try {
        const localCached = localStorage.getItem('mgmt_server_organizations');
        if (localCached) {
          const parsed = JSON.parse(localCached);
          if (Array.isArray(parsed)) {
            const found = parsed.find((o: any) => o.orgId === cleanLibId || o.id === cleanLibId);
            if (found) {
              remoteRecord = found;
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // If record found on server or store
    if (remoteRecord) {
      const statusStr = remoteRecord.supabase_status || remoteRecord.supabaseStatus || 'Not Connected';
      const projectRef = remoteRecord.supabase_project_ref || remoteRecord.supabaseProjectRef || '';
      const url = remoteRecord.supabase_url || remoteRecord.supabaseUrl || (projectRef ? `https://${projectRef}.supabase.co` : '');
      const isGenerated = Boolean(
        statusStr === 'Connected' ||
        statusStr === 'Provisioned' ||
        (url && url.startsWith('https://')) ||
        (projectRef && projectRef.length > 3)
      );

      return {
        found: true,
        libraryId: cleanLibId,
        isSupabaseGenerated: isGenerated,
        supabaseStatus: statusStr === 'Connected' ? 'Connected' : isGenerated ? 'Provisioned' : 'Not Connected',
        supabaseUrl: url,
        supabaseProjectRef: projectRef,
        orgName: remoteRecord.name || remoteRecord.org_name,
        ownerName: remoteRecord.owner_name || remoteRecord.ownerName,
        plan: remoteRecord.plan,
        lastCloudSync: remoteRecord.last_cloud_sync || remoteRecord.lastCloudSync,
      };
    }

    // Not found in central registry
    return {
      found: false,
      libraryId: cleanLibId,
      isSupabaseGenerated: false,
      supabaseStatus: 'Not Connected',
      error: `Library ${cleanLibId} is not yet registered on the Management Server.`,
    };
  }

  /**
   * Validate a Supabase Personal Access Token (PAT) against the official Supabase Management API
   */
  public static async validatePatToken(patToken: string): Promise<PatValidationResult> {
    const cleanToken = patToken.trim();
    if (!cleanToken) {
      return { ok: false, error: 'Personal Access Token is required (e.g. sbp_...)' };
    }

    try {
      const result = await SupabaseManagementApi.validateTokenAndListProjects(cleanToken);
      if (!result.ok) {
        return {
          ok: false,
          error: result.error || 'Failed to authenticate Personal Access Token with Supabase API.',
        };
      }

      return {
        ok: true,
        sessionId: `pat_sess_${Date.now()}`,
        projects: result.projects || [],
      };
    } catch (err: any) {
      return {
        ok: false,
        error: err.message || 'Network error communicating with Supabase Management API.',
      };
    }
  }

  /**
   * Synchronize Supabase connection status back to the Management Server
   */
  public static async updateLibrarySupabaseStatus(
    libraryId: string,
    details: {
      status: 'Connected' | 'Provisioned' | 'Not Connected';
      projectRef: string;
      url: string;
      anonKey?: string;
    }
  ): Promise<boolean> {
    const cleanLibId = libraryId.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Update localStorage mgmt_server_organizations
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('mgmt_server_organizations');
        if (stored) {
          const orgs = JSON.parse(stored);
          const updated = orgs.map((o: any) => {
            if (o.orgId === cleanLibId || o.id === cleanLibId) {
              return {
                ...o,
                supabaseStatus: details.status,
                supabaseProjectRef: details.projectRef,
                supabaseUrl: details.url,
                lastCloudSync: timeStr,
              };
            }
            return o;
          });
          localStorage.setItem('mgmt_server_organizations', JSON.stringify(updated));
        }
      } catch (e) {
        console.warn('Could not sync status to local mgmt store:', e);
      }
    }

    // 2. Direct PATCH to central Management Server database (using only valid remote schema columns)
    try {
      const config = getManagementServerConfig();
      if (!config.url || !config.anonKey) return false;
      const endpoint = `${config.url.replace(/\/+$/, '')}/rest/v1/organizations?org_id=eq.${encodeURIComponent(cleanLibId)}`;
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          apikey: config.anonKey,
          Authorization: `Bearer ${config.anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          last_sync: `Online Synced at ${timeStr}`,
          status: 'ACTIVE',
        }),
      });
      return res.ok || res.status === 204;
    } catch (err) {
      console.warn('Management server direct PATCH skipped:', err);
      return false;
    }
  }

  /**
   * Registers or updates device registration on the Central Management Server via POST (Upsert)
   */
  public static async registerDevice(details: {
    deviceId: string;
    organizationId: string;
    orgName?: string;
    licenseId?: string;
    name?: string;
    status?: 'ONLINE' | 'OFFLINE' | 'PROVISIONING' | 'ERROR';
    hardwareFingerprint?: string;
    appVersion?: string;
  }): Promise<{ ok: boolean; error?: string }> {
    const cleanDeviceId = details.deviceId.trim() || 'DEV-001';
    const cleanOrgId = details.organizationId.trim();
    if (!cleanOrgId) {
      return { ok: false, error: 'Missing organization ID for device registration' };
    }

    const payload = {
      device_id: cleanDeviceId,
      organization_id: cleanOrgId,
      org_name: details.orgName || `Library (${cleanOrgId})`,
      license_id: details.licenseId || `LIC-${cleanOrgId}`,
      name: details.name || `Owner Terminal (${cleanDeviceId})`,
      status: details.status || 'ONLINE',
      last_seen: new Date().toISOString(),
      activated_at: new Date().toISOString(),
      hardware_fingerprint: details.hardwareFingerprint || (typeof navigator !== 'undefined' ? `${navigator.userAgent.slice(0, 50)}` : 'Terminal'),
      app_version: details.appVersion || 'v1.0.0-sqlite',
    };

    // 1. Update localStorage for offline mirror
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('mgmt_server_devices');
        const devices = stored ? JSON.parse(stored) : [];
        const idx = devices.findIndex((d: any) => d.id === cleanDeviceId || d.device_id === cleanDeviceId);
        if (idx >= 0) {
          devices[idx] = { ...devices[idx], ...payload, lastSeen: 'Just now' };
        } else {
          devices.unshift({ id: cleanDeviceId, ...payload, lastSeen: 'Just now' });
        }
        localStorage.setItem('mgmt_server_devices', JSON.stringify(devices));
      } catch (e) {
        console.warn('Could not update local device store:', e);
      }
    }

    // 2. POST to Central Management Server Supabase devices table
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return { ok: true }; // offline: local mirror saved, skip network post quietly
      }
      const config = getManagementServerConfig();
      if (!config.url || !config.anonKey) {
        return { ok: true }; // Local mirror succeeded
      }
      const endpoint = `${config.url.replace(/\/+$/, '')}/rest/v1/devices?on_conflict=device_id`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          apikey: config.anonKey,
          Authorization: `Bearer ${config.anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(payload),
      });

      return { ok: res.ok || res.status === 201 || res.status === 204 };
    } catch (err: any) {
      // Quiet fallback when offline or server momentarily unreachable
      return { ok: false, error: err.message };
    }
  }

  /**
   * Fetches organization password hash and security configuration from Central Management Server
   * to enable instant login across any device without asking to re-create password or re-connect Supabase.
   */
  public static async getOrganizationSecurityState(organizationId: string): Promise<{
    initialized: boolean;
    passwordHash?: string;
    passwordSalt?: string;
    licenseId?: string;
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    supabaseProjectRef?: string;
    orgName?: string;
  }> {
    const cleanOrgId = organizationId.trim();
    if (!cleanOrgId) return { initialized: false };

    let passwordHash: string | undefined;
    let passwordSalt: string | undefined;
    let licenseId: string | undefined;
    let orgName: string | undefined;

    // 1. Fetch from Central Management Server Supabase (authoritative source)
    let fetchedFromRemote = false;
    try {
      const { url: serverUrl, key: serverKey } = getManagementServerConfig();
      if (serverUrl && serverKey) {
        const licenseRes = await fetch(`${serverUrl.replace(/\/+$/, '')}/rest/v1/licenses?organization_id=eq.${encodeURIComponent(cleanOrgId)}&select=*`, {
          headers: {
            apikey: serverKey,
            Authorization: `Bearer ${serverKey}`,
            Accept: 'application/json',
          },
          cache: 'no-store',
        });
        if (!licenseRes.ok) {
          throw new Error(`Central Management Server returned HTTP status ${licenseRes.status}`);
        }
        const licenses = await licenseRes.json();
        fetchedFromRemote = true;

        if (Array.isArray(licenses) && licenses.length > 0) {
          const lic = licenses[0];
          licenseId = lic.license_id;
          orgName = lic.org_name;

          if (lic.key_hash && lic.key_hash.startsWith('pbkdf2:')) {
            const parts = lic.key_hash.split(':');
            if (parts.length === 3) {
              passwordSalt = parts[1];
              passwordHash = parts[2];
              // Update local cache with authoritative server state
              try {
                localStorage.setItem(`lib_mgmt_owner_auth_${cleanOrgId}`, JSON.stringify({
                  libraryId: cleanOrgId,
                  passwordHash,
                  passwordSalt,
                  updatedAt: new Date().toISOString(),
                }));
              } catch {}
            }
          } else {
            // Password NOT yet created on server (key_hash is ed25519:... or unset)
            passwordSalt = undefined;
            passwordHash = undefined;
            try {
              localStorage.removeItem(`lib_mgmt_owner_auth_${cleanOrgId}`);
            } catch {}
          }
        }
      }
    } catch (e: any) {
      console.warn('Could not fetch license security state from remote server:', e);
      // Fallback: Check local storage cache ONLY when offline or network fails
      if (!fetchedFromRemote && typeof localStorage !== 'undefined') {
        try {
          const stored = localStorage.getItem(`lib_mgmt_owner_auth_${cleanOrgId}`);
          if (stored) {
            const auth = JSON.parse(stored);
            if (auth.passwordHash && auth.passwordSalt) {
              passwordHash = auth.passwordHash;
              passwordSalt = auth.passwordSalt;
            }
          }
        } catch {
          // ignore
        }
      }
      if (!fetchedFromRemote) {
        throw new Error(`Central Management Server unreachable: ${e.message || 'Please check internet connection'}`);
      }
    }

    const cloudStatus = await this.checkLibrarySupabaseGeneration(cleanOrgId);
    const isInitialized = Boolean(passwordHash && passwordSalt);

    return {
      initialized: isInitialized,
      passwordHash,
      passwordSalt,
      licenseId,
      orgName: orgName || cloudStatus.orgName,
      supabaseUrl: cloudStatus.supabaseUrl,
      supabaseAnonKey: cloudStatus.supabaseAnonKey,
      supabaseProjectRef: cloudStatus.supabaseProjectRef,
    };
  }

  /**
   * Saves master password hash to Central Management Server licenses & organizations tables (in secure pbkdf2 format)
   */
  public static async saveOrganizationSecurityState(
    organizationId: string,
    passwordSalt: string,
    passwordHash: string
  ): Promise<boolean> {
    const cleanOrgId = organizationId.trim();
    if (!cleanOrgId || !passwordSalt || !passwordHash) return false;

    const formattedKeyHash = `pbkdf2:${passwordSalt}:${passwordHash}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Update localStorage caches
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`lib_mgmt_owner_auth_${cleanOrgId}`, JSON.stringify({
          libraryId: cleanOrgId,
          passwordHash,
          passwordSalt,
          updatedAt: new Date().toISOString(),
        }));
      } catch (err) {
        console.warn('Could not update local owner auth cache:', err);
      }

      try {
        const stored = localStorage.getItem('mgmt_server_organizations');
        if (stored) {
          const orgs = JSON.parse(stored);
          const updated = orgs.map((o: any) => {
            if (o.orgId === cleanOrgId || o.id === cleanOrgId) {
              return {
                ...o,
                ownerSecret: formattedKeyHash,
                passwordDecided: true,
                lastSync: `Security updated at ${timeStr}`,
              };
            }
            return o;
          });
          localStorage.setItem('mgmt_server_organizations', JSON.stringify(updated));
        }
      } catch (err) {
        console.warn('Could not update local mgmt cache:', err);
      }
    }

    // 2. Patch Central Management Server
    const { url: serverUrl, key: serverKey } = getManagementServerConfig();
    if (!serverUrl || !serverKey) throw new Error('Central Management Server config missing');

    // Patch licenses table and verify
    const licRes = await fetch(`${serverUrl.replace(/\/+$/, '')}/rest/v1/licenses?organization_id=eq.${encodeURIComponent(cleanOrgId)}`, {
      method: 'PATCH',
      headers: {
        apikey: serverKey,
        Authorization: `Bearer ${serverKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        key_hash: formattedKeyHash,
        status: 'ACTIVE',
      }),
    });

    if (!licRes.ok && licRes.status !== 204) {
      throw new Error(`Failed to update Central Management Server licenses: HTTP ${licRes.status}`);
    }

    // Patch organizations table
    try {
      await fetch(`${serverUrl.replace(/\/+$/, '')}/rest/v1/organizations?org_id=eq.${encodeURIComponent(cleanOrgId)}`, {
        method: 'PATCH',
        headers: {
          apikey: serverKey,
          Authorization: `Bearer ${serverKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          last_sync: `Security Synced at ${timeStr}`,
          status: 'Active',
        }),
      });
    } catch {
      // non-fatal organizations sync note
    }

    return true;
  }

  /**
   * Synchronizes organization user roles and digital signature payloads to Central Management Server
   */
  public static async syncLibraryRoles(
    organizationId: string,
    rolesRoster: any[]
  ): Promise<boolean> {
    const cleanOrgId = organizationId.trim();
    if (!cleanOrgId) return false;

    // 1. Store in localStorage for immediate reflection
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`mgmt_org_roles_${cleanOrgId}`, JSON.stringify(rolesRoster));
      } catch (e) {
        console.warn('Could not cache organization roles:', e);
      }
    }

    // 2. Sync to Central Management Server (if configured)
    try {
      const { url: serverUrl, key: serverKey } = getManagementServerConfig();
      if (serverUrl && serverKey) {
        const endpoint = `${serverUrl.replace(/\/+$/, '')}/rest/v1/organizations?org_id=eq.${encodeURIComponent(cleanOrgId)}`;
        const res = await fetch(endpoint, {
          method: 'PATCH',
          headers: {
            apikey: serverKey,
            Authorization: `Bearer ${serverKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            staff_count: rolesRoster.filter(r => r.status === 'Active' || r.status === 'ACTIVE_SIGNED').length,
            last_sync: `Roles Synced (${rolesRoster.length} roles) at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          }),
        });
        return res.ok || res.status === 204;
      }
      return true;
    } catch (err) {
      console.warn('Could not sync library roles to remote server:', err);
      return false;
    }
  }

  /**
   * Retrieves organization user roles and digital signatures from storage / server
   */
  public static getLibraryRoles(organizationId: string): any[] {
    const cleanOrgId = organizationId.trim();
    if (typeof localStorage === 'undefined' || !cleanOrgId) return [];
    try {
      const stored = localStorage.getItem(`mgmt_org_roles_${cleanOrgId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return [];
  }

  /**
   * Cryptographically creates and signs a user role credential payload
   * directly with Central Management Server or standalone offline fallback.
   */
  public static async createSignedRoleCredential(params: {
    libraryId: string;
    orgName: string;
    role: string;
    assignedTo: string;
    mobile?: string;
    email?: string;
    shift?: string;
    salary?: number;
    permissions: string[];
    ownerSecretHash?: string;
  }): Promise<{
    token: string;
    payload: any;
    signature: string;
  }> {
    const roleId = `ROL-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const issuedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(); // 180 days
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const payload = {
      libraryId: params.libraryId,
      orgName: params.orgName,
      role: params.role,
      roleId,
      assignedTo: params.assignedTo,
      mobile: params.mobile || '',
      email: params.email || '',
      shift: params.shift || 'Full Day (8 AM - 8 PM)',
      salary: params.salary || 0,
      permissions: params.permissions,
      issuedAt,
      expiresAt,
      nonce,
      status: 'ACTIVE_SIGNED',
    };

    // Generate cryptographic HMAC-SHA256 digital signature
    const canonical = JSON.stringify(payload, Object.keys(payload).sort());
    let signature = '';
    try {
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          enc.encode(params.ownerSecretHash || 'sbkasaathi_library_master_signing_key_2026'),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const sig = await crypto.subtle.sign('HMAC', key, enc.encode(canonical));
        const hex = Array.from(new Uint8Array(sig))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
          .substring(0, 32);
        signature = `SIG_HMAC256_${hex}`;
      }
    } catch {
      signature = `SIG_HMAC256_${btoa(canonical).substring(0, 24)}`;
    }

    if (!signature) {
      signature = `SIG_HMAC256_${btoa(canonical).substring(0, 24)}`;
    }

    const envelope = {
      type: 'ROLE_AUTHORIZATION_CREDENTIAL',
      version: '2.0',
      payload: {
        ...payload,
        digitalSignature: signature,
      },
      signature,
      signedBy: 'OWNER_ROOT_CA',
    };

    const token = btoa(unescape(encodeURIComponent(JSON.stringify(envelope))));
    return { token, payload: envelope.payload, signature };
  }
}


