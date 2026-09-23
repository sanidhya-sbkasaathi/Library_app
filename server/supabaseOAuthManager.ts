import crypto from 'crypto';

export interface OAuthSession {
  sessionId: string;
  state: string;
  codeVerifier: string;
  codeChallenge: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresAt?: number;
  isPat?: boolean; // True if using Personal Access Token fallback
  createdAt: number;
}

export interface SupabaseProject {
  id: string;
  name: string;
  organization_id: string;
  region: string;
  status: string;
  created_at: string;
}

export interface SupabaseApiKey {
  name: string;
  api_key: string;
}

class SupabaseOAuthManager {
  private static instance: SupabaseOAuthManager;
  private sessions: Map<string, OAuthSession> = new Map();

  // Environment configurations (can be set in .env or defaults)
  private clientId: string = process.env.SUPABASE_OAUTH_CLIENT_ID || 'library_management_system';
  private clientSecret: string = process.env.SUPABASE_OAUTH_CLIENT_SECRET || '';
  private redirectUri: string = process.env.SUPABASE_OAUTH_REDIRECT_URI || 'http://localhost:5173/oauth/callback';

  private constructor() {
    // Clean up expired sessions periodically (1 hour TTL)
    const cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, session] of this.sessions.entries()) {
        if (now - session.createdAt > 3600000) {
          this.sessions.delete(key);
        }
      }
    }, 600000);
    if (cleanupTimer && typeof cleanupTimer.unref === 'function') {
      cleanupTimer.unref();
    }
  }

  public static getInstance(): SupabaseOAuthManager {
    if (!SupabaseOAuthManager.instance) {
      SupabaseOAuthManager.instance = new SupabaseOAuthManager();
    }
    return SupabaseOAuthManager.instance;
  }

  /**
   * Helper: Generate URL-safe base64 string without padding
   */
  private base64Url(buffer: Buffer): string {
    return buffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Step 1: Initiate OAuth Authorization with PKCE (RFC 7636)
   */
  public initiateOAuth(redirectUriOverride?: string, clientIdOverride?: string): {
    success: boolean;
    sessionId: string;
    authUrl?: string;
    state?: string;
    codeChallenge?: string;
    error?: string;
  } {
    const rawClientId = (clientIdOverride || this.clientId || '').trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawClientId);

    if (!rawClientId || !isUuid) {
      return {
        success: false,
        sessionId: '',
        error: 'Invalid or missing Supabase OAuth Client ID. Supabase requires a valid UUID from your registered OAuth App (Supabase Dashboard -> Account -> OAuth Apps). To connect immediately without registering an OAuth app, please use the Personal Access Token tab.',
      };
    }

    const sessionId = crypto.randomUUID();
    const state = this.base64Url(crypto.randomBytes(32));
    const codeVerifier = this.base64Url(crypto.randomBytes(32));

    // SHA-256 code challenge
    const hash = crypto.createHash('sha256').update(codeVerifier).digest();
    const codeChallenge = this.base64Url(hash);

    const redirectUri = redirectUriOverride || this.redirectUri;

    this.sessions.set(sessionId, {
      sessionId,
      state,
      codeVerifier,
      codeChallenge,
      createdAt: Date.now(),
    });

    const params = new URLSearchParams({
      client_id: rawClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      scope: 'all',
    });

    const authUrl = `https://api.supabase.com/v1/oauth/authorize?${params.toString()}`;

    return {
      success: true,
      sessionId,
      authUrl,
      state,
      codeChallenge,
    };
  }

  /**
   * Step 2: Handle OAuth Callback & Exchange Authorization Code for Tokens
   */
  public async exchangeCode(params: {
    sessionId?: string;
    code: string;
    state: string;
    redirectUri?: string;
  }): Promise<{ success: boolean; sessionId: string; error?: string }> {
    let session: OAuthSession | undefined;

    // Find session by sessionId or by state parameter
    if (params.sessionId && this.sessions.has(params.sessionId)) {
      session = this.sessions.get(params.sessionId);
    } else {
      for (const s of this.sessions.values()) {
        if (s.state === params.state) {
          session = s;
          break;
        }
      }
    }

    if (!session || session.state !== params.state) {
      return {
        success: false,
        sessionId: '',
        error: 'Invalid or expired OAuth state parameter (CSRF check failed).',
      };
    }

    const redirectUri = params.redirectUri || this.redirectUri;

    try {
      const bodyParams = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        code: params.code,
        redirect_uri: redirectUri,
        code_verifier: session.codeVerifier,
      });

      if (this.clientSecret) {
        bodyParams.append('client_secret', this.clientSecret);
      }

      const res = await fetch('https://api.supabase.com/v1/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: bodyParams.toString(),
      });

      if (!res.ok) {
        const errText = await res.text();
        return {
          success: false,
          sessionId: session.sessionId,
          error: `Supabase OAuth token exchange failed (${res.status}): ${errText}`,
        };
      }

      const tokenData = (await res.json()) as any;
      session.accessToken = tokenData.access_token;
      session.refreshToken = tokenData.refresh_token;
      session.tokenType = tokenData.token_type || 'Bearer';
      session.expiresAt = Date.now() + (tokenData.expires_in || 3600) * 1000;
      session.isPat = false;

      return {
        success: true,
        sessionId: session.sessionId,
      };
    } catch (err: any) {
      return {
        success: false,
        sessionId: session.sessionId,
        error: err.message || 'Network error communicating with Supabase OAuth server.',
      };
    }
  }

  /**
   * Connect using Personal Access Token fallback (sbp_...)
   * Stored purely in server memory, never sent to browser client.
   */
  public async connectWithToken(personalAccessToken: string): Promise<{
    success: boolean;
    sessionId: string;
    error?: string;
  }> {
    const cleanToken = personalAccessToken.trim();
    if (!cleanToken) {
      return { success: false, sessionId: '', error: 'Personal access token is required.' };
    }

    // Verify token by querying projects
    try {
      const res = await fetch('https://api.supabase.com/v1/projects', {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        return {
          success: false,
          sessionId: '',
          error: `Invalid Supabase token (${res.status}). Verify your token from supabase.com/account/tokens.`,
        };
      }

      const sessionId = crypto.randomUUID();
      this.sessions.set(sessionId, {
        sessionId,
        state: 'pat_direct',
        codeVerifier: '',
        codeChallenge: '',
        accessToken: cleanToken,
        tokenType: 'Bearer',
        isPat: true,
        createdAt: Date.now(),
      });

      return { success: true, sessionId };
    } catch (err: any) {
      return { success: false, sessionId: '', error: err.message || 'Unable to reach Supabase API.' };
    }
  }

  /**
   * Retrieve active session token
   */
  public getAccessToken(sessionId: string): string | null {
    const session = this.sessions.get(sessionId);
    if (!session || !session.accessToken) return null;
    return session.accessToken;
  }

  /**
   * Step 3: Fetch Owner's Projects from authorized Management API
   */
  public async listProjects(sessionId: string): Promise<{
    success: boolean;
    projects?: SupabaseProject[];
    error?: string;
  }> {
    const token = this.getAccessToken(sessionId);
    if (!token) {
      return { success: false, error: 'Unauthorized session or session expired. Please connect Supabase again.' };
    }

    try {
      const res = await fetch('https://api.supabase.com/v1/projects', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        return {
          success: false,
          error: `Management API error (${res.status}): ${await res.text()}`,
        };
      }

      const projects = (await res.json()) as SupabaseProject[];
      return { success: true, projects };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to list projects from Supabase.' };
    }
  }

  /**
   * Fetch project public API keys (anon key)
   */
  public async getProjectApiKeys(sessionId: string, projectRef: string): Promise<{
    success: boolean;
    anonKey?: string;
    error?: string;
  }> {
    const token = this.getAccessToken(sessionId);
    if (!token) return { success: false, error: 'Unauthorized' };

    try {
      const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        return { success: false, error: `Failed to fetch API keys: ${res.statusText}` };
      }

      const keys = (await res.json()) as SupabaseApiKey[];
      const anon = keys.find(k => k.name === 'anon');
      return { success: true, anonKey: anon?.api_key };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

export const supabaseOAuth = SupabaseOAuthManager.getInstance();
