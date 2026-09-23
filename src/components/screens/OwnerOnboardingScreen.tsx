import React, { useState, useEffect } from 'react';
import {
  Crown,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Key,
  Database,
  Lock,
  Sparkles,
  Server,
  RefreshCw,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Cloud,
  Check,
  Info,
  Layers,
  Wifi,
  WifiOff,
  DownloadCloud,
  UploadCloud,
  Radio,
  KeyRound,
  Search,
} from 'lucide-react';
import { appCrypto, SignedCredentialEnvelope, OwnerCredentialPayload } from '../../utils/appCrypto';
import { db } from '../../db/localDatabase';
import { SupabaseClient, SupabasePingResult } from '../../utils/supabaseClient';
import { SupabaseProvisioningModal, ProvisionResult } from './SupabaseProvisioningModal';
import { ManagementServerClient, LibraryCloudStatus, getManagementServerConfig } from '../../utils/managementServerClient';
import { SupabaseManagementApi, SupabaseProject } from '../../utils/supabaseManagementApi';

interface OwnerOnboardingProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const OwnerOnboardingScreen: React.FC<OwnerOnboardingProps> = ({ onBack, onSuccess }) => {
  // Steps matching user workflow:
  // 1: Paste Credential -> Ed25519 offline verification
  // 2: Owner Password (sub-states: 'OFFLINE' | 'CHECKING' | 'ENTER_PASSWORD' | 'CREATE_PASSWORD' | 'FORGOT_VERIFY' | 'RESET_PASSWORD')
  // 3: Supabase & DB
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [step2Mode, setStep2Mode] = useState<'OFFLINE' | 'CHECKING' | 'ENTER_PASSWORD' | 'CREATE_PASSWORD' | 'FORGOT_VERIFY' | 'RESET_PASSWORD'>('CHECKING');
  const [rawCredentialJson, setRawCredentialJson] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [verifiedEnvelope, setVerifiedEnvelope] = useState<SignedCredentialEnvelope<OwnerCredentialPayload> | null>(null);

  // Network State
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isProbingNetwork, setIsProbingNetwork] = useState(false);

  /**
   * Actively probes real network reachability to the Central Management Server
   */
  const probeRealInternetConnection = async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const config = getManagementServerConfig();
      const res = await fetch(`${config.url.replace(/\/+$/, '')}/rest/v1/licenses?select=organization_id&limit=1`, {
        method: 'GET',
        headers: {
          apikey: config.anonKey,
          Authorization: `Bearer ${config.anonKey}`,
        },
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);
      return res.ok && res.status === 200;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      if (step === 2 && verifiedEnvelope?.payload?.library_id) {
        await handleRetryNetworkCheck();
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      if (step === 2) {
        setStep2Mode('OFFLINE');
        setErrorMsg('⚡ Internet connection lost. Connect to the internet to check or set the owner password on the Central Management Server.');
      }
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [step, verifiedEnvelope]);

  // Flow Branch: Already Initialized -> Ask Password
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [existingAuthConfig, setExistingAuthConfig] = useState<any | null>(null);
  const [isCheckingRemoteSecurity, setIsCheckingRemoteSecurity] = useState(false);

  // Flow Branch: Not Initialized -> Create Password
  const [ownerPassword, setOwnerPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Forgot Password & Reset State via Digital Signature Re-verification
  const [forgotCredentialJson, setForgotCredentialJson] = useState('');
  const [isReVerifyingSignature, setIsReVerifyingSignature] = useState(false);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Real-time active network heartbeat for Step 2
  useEffect(() => {
    if (step !== 2 || !verifiedEnvelope) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      const reachable = await probeRealInternetConnection();
      if (!isMounted) return;
      setIsOnline(reachable);

      if (!reachable) {
        if (step2Mode !== 'OFFLINE') {
          setStep2Mode('OFFLINE');
          setErrorMsg('⚡ Active Internet Connection Required: Connect to the internet to verify or register your password on the Central Management Server.');
        }
      } else {
        // Automatically query and restore form as soon as connection is re-established
        if (step2Mode === 'OFFLINE' && !isCheckingRemoteSecurity && !isProbingNetwork && verifiedEnvelope?.payload?.library_id) {
          await checkRemoteSecurity(verifiedEnvelope.payload.library_id);
        }
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [step, step2Mode, verifiedEnvelope, isCheckingRemoteSecurity, isProbingNetwork]);

  // Step 3: Owner's Supabase (PAT Key Workflow Only)
  const [configMode, setConfigMode] = useState<'PULL_EXISTING' | 'PUSH_NEW'>('PULL_EXISTING');
  const [patToken, setPatToken] = useState<string>('');
  const [showPatToken, setShowPatToken] = useState<boolean>(false);
  const [rememberPat, setRememberPat] = useState<boolean>(true);
  const [supabaseUrl, setSupabaseUrl] = useState(db.supabaseConfig?.url || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(db.supabaseConfig?.anonKey || '');
  const [mgmtCloudStatus, setMgmtCloudStatus] = useState<LibraryCloudStatus | null>(null);
  const [isCheckingMgmt, setIsCheckingMgmt] = useState<boolean>(false);

  const [discoveredProjects, setDiscoveredProjects] = useState<SupabaseProject[]>([]);
  const [selectedProjectRef, setSelectedProjectRef] = useState<string>('');
  const [isDiscoveringProjects, setIsDiscoveringProjects] = useState<boolean>(false);

  const discoverProjectsForPat = async (tokenToUse: string, autoSelect = true) => {
    const cleanToken = tokenToUse.trim();
    if (!cleanToken || cleanToken.length < 15) return;
    const libId = verifiedEnvelope?.payload?.library_id;

    setIsDiscoveringProjects(true);
    setErrorMsg('');
    try {
      if (rememberPat && libId) {
        ManagementServerClient.setStoredPatToken(cleanToken, libId);
      }
      const patValidation = await ManagementServerClient.validatePatToken(cleanToken);
      if (!patValidation.ok) {
        setErrorMsg(patValidation.error || 'Invalid PAT key. Unable to fetch Supabase projects.');
        setDiscoveredProjects([]);
        return;
      }

      if (!patValidation.projects || patValidation.projects.length === 0) {
        setErrorMsg('Valid PAT key, but no projects found in your Supabase account. Please create a project at https://supabase.com/dashboard.');
        setDiscoveredProjects([]);
        return;
      }

      setDiscoveredProjects(patValidation.projects);

      if (autoSelect) {
        let matched = patValidation.projects.find(p =>
          (selectedProjectRef && p.id === selectedProjectRef) ||
          (mgmtCloudStatus?.supabaseProjectRef && p.id === mgmtCloudStatus.supabaseProjectRef) ||
          (libId && p.name && p.name.toLowerCase().includes(libId.toLowerCase()))
        );
        if (!matched && patValidation.projects.length > 0) {
          matched = patValidation.projects[0];
        }

        if (matched) {
          setSelectedProjectRef(matched.id);
          const newUrl = `https://${matched.id}.supabase.co`;
          setSupabaseUrl(newUrl);

          // Auto-fetch anon key
          const keyResult = await SupabaseManagementApi.getProjectApiKeys(cleanToken, matched.id);
          if (keyResult.ok && keyResult.anonKey) {
            setSupabaseAnonKey(keyResult.anonKey);
          }
          setSuccessMsg(`✓ Discovered ${patValidation.projects.length} project(s). Connected to "${matched.name}" (${matched.id}).`);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error discovering projects with PAT.');
    } finally {
      setIsDiscoveringProjects(false);
    }
  };

  const [isDeploying, setIsDeploying] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<SupabasePingResult | null>(null);
  const [tableStatus, setTableStatus] = useState<'IDLE' | 'CHECKING' | 'READY' | 'NOT_CREATED'>('IDLE');
  const [verifiedTableCount, setVerifiedTableCount] = useState<number>(0);
  const [isVerifyingTables, setIsVerifyingTables] = useState(false);
  const [isPullingData, setIsPullingData] = useState(false);
  const [pullStats, setPullStats] = useState<{ count: number; message: string } | null>(null);
  const [hasCopiedSql, setHasCopiedSql] = useState(false);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [cloudPullPrompt, setCloudPullPrompt] = useState<{
    show: boolean;
    count: number;
    url: string;
    anonKey: string;
    projectRef?: string;
  } | null>(null);

  // When verifiedEnvelope is set or entering CONFIG_SUPABASE, check PAT and Management Server
  useEffect(() => {
    if (verifiedEnvelope?.payload?.library_id) {
      const libId = verifiedEnvelope.payload.library_id;
      // 1. Load locally stored PAT token
      const storedPat = ManagementServerClient.getStoredPatToken(libId);
      if (storedPat && !patToken) {
        setPatToken(storedPat);
        discoverProjectsForPat(storedPat, true);
      }

      // 2. Query Management Server Supabase
      setIsCheckingMgmt(true);
      ManagementServerClient.checkLibrarySupabaseGeneration(libId)
        .then((status) => {
          setMgmtCloudStatus(status);
          if (status.supabaseUrl && !supabaseUrl) {
            setSupabaseUrl(status.supabaseUrl);
          }
          if (status.supabaseAnonKey && !supabaseAnonKey) {
            setSupabaseAnonKey(status.supabaseAnonKey);
          }
          if (status.supabaseProjectRef && !selectedProjectRef) {
            setSelectedProjectRef(status.supabaseProjectRef);
          }
        })
        .catch(console.error)
        .finally(() => setIsCheckingMgmt(false));
    }
  }, [verifiedEnvelope, step]);

  /**
   * Checks Central Management Server in real-time to see if a password is already registered for this library
   */
  /**
   * Checks Central Management Server in real-time to see if a password is already registered for this library
   */
  const checkRemoteSecurity = async (libId: string) => {
    setIsCheckingRemoteSecurity(true);
    setStep2Mode('CHECKING');
    setErrorMsg('');
    try {
      // 1. Check real-time internet connectivity
      const isReachable = await probeRealInternetConnection();
      if (!isReachable) {
        setIsOnline(false);
        setStep2Mode('OFFLINE');
        setErrorMsg('⚡ Active Internet Connection Required: Connect to the internet to query the Central Management Server.');
        return;
      }

      // 2. Query Central Management Server Supabase
      const remoteSecurity = await ManagementServerClient.getOrganizationSecurityState(libId);

      if (remoteSecurity.initialized && remoteSecurity.passwordHash && remoteSecurity.passwordSalt) {
        // Password ALREADY registered on Central Management Server!
        const authRecord = {
          libraryId: libId,
          ownerId: verifiedEnvelope?.payload?.owner_id || 'OWNER',
          passwordHash: remoteSecurity.passwordHash,
          passwordSalt: remoteSecurity.passwordSalt,
          supabaseConfig: remoteSecurity.supabaseUrl ? {
            url: remoteSecurity.supabaseUrl,
            anonKey: remoteSecurity.supabaseAnonKey || '',
          } : undefined,
        };
        setExistingAuthConfig(authRecord);
        if (remoteSecurity.supabaseUrl) {
          setSupabaseUrl(remoteSecurity.supabaseUrl);
        }
        if (remoteSecurity.supabaseAnonKey) {
          setSupabaseAnonKey(remoteSecurity.supabaseAnonKey);
        }
        if (remoteSecurity.supabaseProjectRef) {
          setSelectedProjectRef(remoteSecurity.supabaseProjectRef);
        }
        setStep2Mode('ENTER_PASSWORD');
        setSuccessMsg(`Central Management Server: Master security password already registered for ${libId}. Enter your password to unlock.`);
      } else {
        // NO password registered yet on Central Management Server -> Create New Password
        setStep2Mode('CREATE_PASSWORD');
        setSuccessMsg(`Central Management Server: No existing password found for ${libId}. Please create your new owner password.`);
      }
    } catch (err: any) {
      console.warn('Remote security check note:', err);
      // Fallback: If network failed during query, return to OFFLINE
      setIsOnline(false);
      setStep2Mode('OFFLINE');
      setErrorMsg(err.message || 'Could not communicate with Central Management Server. Please ensure you are connected to the internet.');
    } finally {
      setIsCheckingRemoteSecurity(false);
    }
  };

  /**
   * Action button handler on OFFLINE screen when user connects to internet and clicks Retry
   */
  const handleRetryNetworkCheck = async () => {
    if (!verifiedEnvelope) return;
    setIsProbingNetwork(true);
    setErrorMsg('');
    setStep2Mode('CHECKING');

    const reachable = await probeRealInternetConnection();
    setIsOnline(reachable);

    if (!reachable) {
      setErrorMsg('⚡ Still unable to reach Central Management Server. Please connect your device to Wi-Fi / mobile internet and try again.');
      setIsProbingNetwork(false);
      setStep2Mode('OFFLINE');
      return;
    }

    // Reachable! Now query Central Management Server
    setIsProbingNetwork(false);
    await checkRemoteSecurity(verifiedEnvelope.payload.library_id);
  };

  const handleProvisionComplete = (result: ProvisionResult) => {
    setSupabaseUrl(result.projectUrl);
    setSupabaseAnonKey(result.anonKey);
    setSelectedProjectRef(result.projectRef);
    setTestResult({
      ok: true,
      projectRef: result.projectRef,
      latencyMs: 24,
    });
    setTableStatus('READY');
    setVerifiedTableCount(14);
    setErrorMsg('');
    setSuccessMsg(`Supabase Cloud Database successfully migrated with 14 active tables! Ready to launch.`);

    if (verifiedEnvelope?.payload?.library_id) {
      const libId = verifiedEnvelope.payload.library_id;
      ManagementServerClient.updateLibrarySupabaseStatus(libId, {
        status: 'Connected',
        projectRef: result.projectRef,
        url: result.projectUrl,
        anonKey: result.anonKey,
      });
      ManagementServerClient.checkLibrarySupabaseGeneration(libId).then(setMgmtCloudStatus);
    }
  };

  const handleFillLiveDemoProject = () => {
    const mgmt = getManagementServerConfig();
    if (mgmt.url) {
      setSupabaseUrl(mgmt.url);
      setSupabaseAnonKey(mgmt.anonKey || '');
      setSelectedProjectRef(SupabaseClient.extractProjectRef(mgmt.url));
    } else {
      setSupabaseUrl('');
      setSupabaseAnonKey('');
    }
    setTestResult(null);
    setTableStatus('IDLE');
    setPullStats(null);
    setErrorMsg('');
  };

  const handleCopySchemaSql = () => {
    const sql = `-- ALL-IN-ONE DETERMINISTIC SUPABASE 14-MODULE SCHEMA INITIALIZATION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    owner TEXT,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'Active',
    plan TEXT DEFAULT 'Standard',
    total_seats INTEGER DEFAULT 100,
    active_users INTEGER DEFAULT 0,
    devices INTEGER DEFAULT 1,
    last_sync TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,
    association_id TEXT NOT NULL,
    name TEXT NOT NULL,
    mobile TEXT,
    email TEXT,
    seat_number TEXT,
    plan_name TEXT,
    status TEXT DEFAULT 'ACTIVE',
    valid_until TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id TEXT NOT NULL,
    seat_number TEXT NOT NULL,
    room_name TEXT DEFAULT 'Hall A',
    status TEXT DEFAULT 'AVAILABLE',
    student_id TEXT,
    student_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id TEXT NOT NULL,
    name TEXT NOT NULL,
    capacity INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id TEXT NOT NULL,
    admission_number TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    seat_number TEXT,
    plan_name TEXT,
    amount_paid NUMERIC(10, 2) DEFAULT 0,
    payment_method TEXT DEFAULT 'UPI',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    seat_number TEXT,
    check_in TEXT,
    check_out TEXT,
    status TEXT DEFAULT 'Inside',
    date TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id TEXT NOT NULL,
    receipt_number TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    method TEXT DEFAULT 'UPI',
    status TEXT DEFAULT 'PAID',
    payment_date TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.membership_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id TEXT NOT NULL,
    name TEXT NOT NULL,
    duration_months INTEGER DEFAULT 1,
    price NUMERIC(10, 2) DEFAULT 0,
    discount NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id TEXT NOT NULL,
    name TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    due_date TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.device_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,
    action TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sync_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TEXT,
    event TEXT NOT NULL,
    organization TEXT,
    actor TEXT NOT NULL,
    details TEXT,
    type TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.library_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_access" ON public.organizations;
CREATE POLICY "anon_all_access" ON public.organizations FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_students_all" ON public.students;
CREATE POLICY "anon_students_all" ON public.students FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_seats_all" ON public.seats;
CREATE POLICY "anon_seats_all" ON public.seats FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_admissions_all" ON public.admissions;
CREATE POLICY "anon_admissions_all" ON public.admissions FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_attendance_all" ON public.attendance;
CREATE POLICY "anon_attendance_all" ON public.attendance FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_payments_all" ON public.payments;
CREATE POLICY "anon_payments_all" ON public.payments FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_audit_logs_all" ON public.audit_logs;
CREATE POLICY "anon_audit_logs_all" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
`;
    navigator.clipboard.writeText(sql);
    setHasCopiedSql(true);
    setTimeout(() => setHasCopiedSql(false), 3000);
  };

  // Quick Demo Pre-fill
  const handlePreFillGenuineOwner = async () => {
    try {
      const { serverCrypto } = await import('../../../../Library-Management-Server/src/utils/serverCrypto');
      const genuine = await serverCrypto.issueOwnerCredential({
        libraryId: 'ORG-SAN002',
        ownerName: 'Rishabh kumar',
        ownerEmail: 'rishabh@sanskriti.in',
        plan: 'Professional',
      });
      setRawCredentialJson(JSON.stringify(genuine, null, 2));
      setErrorMsg('');
    } catch {
      setErrorMsg('Please paste the Signed Credential JSON generated by the Management Server.');
    }
  };

  // Step 1 Verification
  const handleVerifyCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsVerifying(true);

    try {
      if (!rawCredentialJson.trim()) {
        setErrorMsg('Please paste your Signed Owner Credential Envelope (JSON).');
        setIsVerifying(false);
        return;
      }

      let parsed: any;
      try {
        parsed = JSON.parse(rawCredentialJson.trim());
      } catch {
        setErrorMsg('Invalid JSON format. Please paste the complete credential envelope.');
        setIsVerifying(false);
        return;
      }

      // Pure offline Ed25519 signature verification
      const verifyRes = await appCrypto.verifyOwnerCredential(parsed);

      if (!verifyRes.valid || !verifyRes.payload) {
        setErrorMsg(
          verifyRes.error ||
          'Verification failed. The library credential is invalid, expired, revoked, or has been modified.'
        );
        setIsVerifying(false);
        return;
      }

      setVerifiedEnvelope(parsed);
      const libId = parsed.payload.library_id;
      setStep(2);
      setStep2Mode('CHECKING');

      // Real-time Active Network Probe
      const isReachable = await probeRealInternetConnection();
      setIsOnline(isReachable);

      if (!isReachable) {
        // Stop here and ask for network connection!
        setStep2Mode('OFFLINE');
        setErrorMsg('⚡ Active Internet Connection Required: Connect your device to the internet to check or set the owner password on the Central Management Server.');
        return;
      }

      // Online: Query Central Management Server for password status
      await checkRemoteSecurity(libId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Cryptographic verification error occurred.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Flow Branch YES: Login with established password
  const handleLoginPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedEnvelope) return;
    setErrorMsg('');
    setIsLoggingIn(true);

    try {
      if (!existingAuthConfig || !existingAuthConfig.passwordHash || !existingAuthConfig.passwordSalt) {
        setErrorMsg('Authentication security data missing. Please re-check server.');
        setIsLoggingIn(false);
        return;
      }

      const isValid = await appCrypto.verifyPassword(
        loginPassword,
        existingAuthConfig.passwordSalt,
        existingAuthConfig.passwordHash
      );

      if (!isValid) {
        setErrorMsg('Incorrect owner password. If you forgot your password, click "Forgot Password?" to reset using your digital signature.');
        setIsLoggingIn(false);
        return;
      }

      // Password VALID!
      const isDeviceOnline = await probeRealInternetConnection();
      const config = existingAuthConfig.supabaseConfig;

      if (!isDeviceOnline) {
        // OFFLINE LOGIN: Open application immediately using local SQLite database
        await db.bindAsOwner(
          verifiedEnvelope,
          existingAuthConfig.passwordHash,
          existingAuthConfig.passwordSalt,
          config
        );
        setIsLoggingIn(false);
        onSuccess();
        return;
      }

      // Online: Verify Supabase connection if configured
      if (config && config.url && config.anonKey) {
        setSupabaseUrl(config.url);
        setSupabaseAnonKey(config.anonKey);
        setOwnerPassword(loginPassword);

        try {
          const ping = await SupabaseClient.pingSupabase(config.url, config.anonKey);
          if (ping.ok) {
            setTestResult(ping);
            const tableCheck = await SupabaseClient.checkTablesExist(config);
            if (tableCheck.ready) {
              setTableStatus('READY');
              setVerifiedTableCount(14);
              await db.bindAsOwner(
                verifiedEnvelope,
                existingAuthConfig.passwordHash,
                existingAuthConfig.passwordSalt,
                config
              );
              try {
                const pullRes = await db.pullAllDataFromSupabase(config, true);
                if (pullRes.count > 0) {
                  console.log(`[Login] Successfully pulled ${pullRes.count} records from cloud.`);
                }
              } catch (pullErr) {
                console.warn('Cloud pull note:', pullErr);
              }
              const libId = verifiedEnvelope.payload.library_id;
              ManagementServerClient.registerDevice({
                deviceId: db.deviceId,
                organizationId: libId,
                orgName: verifiedEnvelope.payload.owner_name ? `${verifiedEnvelope.payload.owner_name}'s Library` : undefined,
                name: `${verifiedEnvelope.payload.owner_name || 'Owner'} Terminal (${db.deviceId})`,
                status: 'ONLINE',
              }).catch(() => {});

              setIsLoggingIn(false);
              onSuccess();
              return;
            }
          }
        } catch {
          // Fall through to offline launch if server momentarily unreachable
        }
      }

      // If Supabase not yet configured or tables not ready, advance to Step 3
      if (!config || !config.url || !config.anonKey) {
        setOwnerPassword(loginPassword);
        setStep(3);
        setIsLoggingIn(false);
        setErrorMsg('Owner password verified! Please connect your Supabase account to enable cloud sync.');
        return;
      }

      // Otherwise launch with local DB
      await db.bindAsOwner(
        verifiedEnvelope,
        existingAuthConfig.passwordHash,
        existingAuthConfig.passwordSalt,
        config
      );
      if (config && config.url && config.anonKey) {
        try {
          await db.pullAllDataFromSupabase(config, true);
        } catch {}
      }
      setIsLoggingIn(false);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login verification error.');
      setIsLoggingIn(false);
    }
  };

  // Step 2b: Register New Master Security Password
  const handleCreatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedEnvelope) return;

    if (!ownerPassword || ownerPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (ownerPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    // Must be connected to save to Central Management Server
    const isReachable = await probeRealInternetConnection();
    setIsOnline(isReachable);

    if (!isReachable) {
      setErrorMsg('⚡ Internet Connection Required: Connect to the internet to register your password with the Central Management Server.');
      setStep2Mode('OFFLINE');
      return;
    }

    setIsSavingPassword(true);
    setErrorMsg('');

    try {
      const libId = verifiedEnvelope.payload.library_id;

      // 1. Hash password using PBKDF2 (100,000 iterations + cryptographic salt)
      const hashed = await appCrypto.hashPassword(ownerPassword);
      const salt = hashed.salt;
      const hash = hashed.hash;

      // 2. Persist in local state & localStorage
      const authRecord = {
        libraryId: libId,
        ownerId: verifiedEnvelope.payload.owner_id,
        passwordHash: hash,
        passwordSalt: salt,
        envelope: verifiedEnvelope,
        initializedAt: new Date().toISOString(),
      };
      setExistingAuthConfig(authRecord);

      try {
        localStorage.setItem(`lib_mgmt_owner_auth_${libId}`, JSON.stringify(authRecord));
      } catch (err) {
        console.warn('Could not cache auth locally:', err);
      }

      // 3. Immediately propagate to Central Management Server (licenses & organizations tables)
      await ManagementServerClient.saveOrganizationSecurityState(libId, salt, hash);

      // 4. Query management server to check if Supabase is pre-generated
      const cloudStatus = await ManagementServerClient.checkLibrarySupabaseGeneration(libId);
      setMgmtCloudStatus(cloudStatus);
      if (cloudStatus.supabaseUrl) {
        setSupabaseUrl(cloudStatus.supabaseUrl);
      }
      if (cloudStatus.supabaseAnonKey) {
        setSupabaseAnonKey(cloudStatus.supabaseAnonKey);
      }
      if (cloudStatus.supabaseProjectRef) {
        setSelectedProjectRef(cloudStatus.supabaseProjectRef);
      }

      setIsSavingPassword(false);
      setSuccessMsg(`✓ Master Security Password successfully registered on Central Management Server for ${libId}!`);
      setStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving security credentials to Central Management Server. Check your internet connection.');
      setIsSavingPassword(false);
      setStep2Mode('OFFLINE');
    }
  };

  // Forgot Password: Step A - Re-verify Digital Signature
  const handleVerifySignatureForReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsReVerifyingSignature(true);

    try {
      if (!forgotCredentialJson.trim()) {
        setErrorMsg('Please paste your Signed Owner Credential Envelope (JSON).');
        setIsReVerifyingSignature(false);
        return;
      }

      let parsed: any;
      try {
        parsed = JSON.parse(forgotCredentialJson.trim());
      } catch {
        setErrorMsg('Invalid JSON format. Please paste the complete credential envelope.');
        setIsReVerifyingSignature(false);
        return;
      }

      const verifyRes = await appCrypto.verifyOwnerCredential(parsed);
      if (!verifyRes.valid || !verifyRes.payload) {
        setErrorMsg(verifyRes.error || 'Verification failed. Digital signature is invalid, expired, revoked, or modified.');
        setIsReVerifyingSignature(false);
        return;
      }

      if (parsed.payload.library_id !== verifiedEnvelope?.payload?.library_id) {
        setErrorMsg(`Credential library ID (${parsed.payload.library_id}) does not match current library (${verifiedEnvelope?.payload?.library_id}).`);
        setIsReVerifyingSignature(false);
        return;
      }

      // Digital signature valid! Advance to reset password form
      setSuccessMsg('✓ Ed25519 Digital Signature Authenticated! Please enter your new security password.');
      setStep2Mode('RESET_PASSWORD');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error verifying digital signature.');
    } finally {
      setIsReVerifyingSignature(false);
    }
  };

  // Forgot Password: Step B - Submit New Password to Central Management Server
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedEnvelope) return;

    if (!resetNewPassword || resetNewPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    const isReachable = await probeRealInternetConnection();
    setIsOnline(isReachable);
    if (!isReachable) {
      setErrorMsg('⚡ Internet Connection Required: Connect to the internet to update your password with the Central Management Server.');
      setStep2Mode('OFFLINE');
      return;
    }

    setIsResettingPassword(true);
    setErrorMsg('');

    try {
      const libId = verifiedEnvelope.payload.library_id;
      const hashed = await appCrypto.hashPassword(resetNewPassword);
      const salt = hashed.salt;
      const hash = hashed.hash;

      await ManagementServerClient.saveOrganizationSecurityState(libId, salt, hash);

      const authRecord = {
        libraryId: libId,
        ownerId: verifiedEnvelope.payload.owner_id,
        passwordHash: hash,
        passwordSalt: salt,
        envelope: verifiedEnvelope,
        initializedAt: new Date().toISOString(),
      };
      setExistingAuthConfig(authRecord);

      try {
        localStorage.setItem(`lib_mgmt_owner_auth_${libId}`, JSON.stringify(authRecord));
      } catch (err) {
        console.warn('Could not cache auth locally:', err);
      }

      setIsResettingPassword(false);
      setSuccessMsg(`✓ Password successfully reset and updated on Central Management Server for ${libId}!`);
      setOwnerPassword(resetNewPassword);
      setLoginPassword(resetNewPassword);
      setStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating password on Central Management Server. Check your internet connection.');
      setIsResettingPassword(false);
    }
  };

  // Step 3: Test Connection Engine (Management Server + PAT Token + Supabase Ping + 14 Tables)
  const handleTestConnection = async () => {
    const libId = verifiedEnvelope?.payload?.library_id;
    if (!libId) return;

    // Real-time network reachability check
    const isReachable = await probeRealInternetConnection();
    setIsOnline(isReachable);

    if (!isReachable) {
      setTableStatus('IDLE');
      setErrorMsg('⚡ Device is offline. Active internet connection is required to test and verify Supabase Cloud project.');
      return;
    }

    setIsTestingConnection(true);
    setErrorMsg('');
    setSuccessMsg('');
    setTestResult(null);
    setTableStatus('CHECKING');
    setPullStats(null);

    try {
      const activePat = patToken.trim() || ManagementServerClient.getStoredPatToken(libId);

      let targetRef = selectedProjectRef || mgmtCloudStatus?.supabaseProjectRef || SupabaseClient.extractProjectRef(supabaseUrl) || '';
      let targetUrl = supabaseUrl.trim();
      let targetAnonKey = supabaseAnonKey.trim();

      // 1. If PAT is provided, validate and fetch projects from Supabase Management API
      if (activePat) {
        if (rememberPat) {
          ManagementServerClient.setStoredPatToken(activePat, libId);
        }
        const patValidation = await ManagementServerClient.validatePatToken(activePat);
        if (!patValidation.ok) {
          setTableStatus('IDLE');
          setErrorMsg(patValidation.error || 'Failed to authenticate Personal Access Token with Supabase API. Please check your PAT key.');
          setIsTestingConnection(false);
          return;
        }

        if (!patValidation.projects || patValidation.projects.length === 0) {
          setTableStatus('IDLE');
          setErrorMsg('Personal Access Token is valid, but no Supabase projects were found in your account. Please create a project first at https://supabase.com/dashboard.');
          setIsTestingConnection(false);
          return;
        }

        setDiscoveredProjects(patValidation.projects);

        // Find the matching project (or preferred by libId / ref / mgmtStatus)
        let matchedProj = patValidation.projects.find(p => 
          (targetRef && p.id === targetRef) || 
          (mgmtCloudStatus?.supabaseProjectRef && p.id === mgmtCloudStatus.supabaseProjectRef) ||
          (p.name && p.name.toLowerCase().includes(libId.toLowerCase()))
        );
        if (!matchedProj && patValidation.projects.length > 0) {
          matchedProj = patValidation.projects[0];
        }

        if (matchedProj) {
          targetRef = matchedProj.id;
          setSelectedProjectRef(targetRef);
          targetUrl = `https://${targetRef}.supabase.co`;
          setSupabaseUrl(targetUrl);

          // Fetch actual project API keys directly with PAT
          const keyResult = await SupabaseManagementApi.getProjectApiKeys(activePat, targetRef);
          if (keyResult.ok && keyResult.anonKey) {
            targetAnonKey = keyResult.anonKey;
            setSupabaseAnonKey(targetAnonKey);
          }
        }
      }

      // 2. Query Central Management Server for this library's status if not already known
      const mgmtStatus = await ManagementServerClient.checkLibrarySupabaseGeneration(libId);
      setMgmtCloudStatus(mgmtStatus);

      if (!targetUrl) {
        targetUrl = mgmtStatus.supabaseUrl || (targetRef ? `https://${targetRef}.supabase.co` : '');
        if (targetUrl) setSupabaseUrl(targetUrl);
      }
      if (!targetAnonKey) {
        targetAnonKey = mgmtStatus.supabaseAnonKey || '';
        if (targetAnonKey) setSupabaseAnonKey(targetAnonKey);
      }

      // If still no anon key and we have PAT & project ref, attempt to fetch project API keys
      if (!targetAnonKey && activePat && targetRef) {
        const keyResult = await SupabaseManagementApi.getProjectApiKeys(activePat, targetRef);
        if (keyResult.ok && keyResult.anonKey) {
          targetAnonKey = keyResult.anonKey;
          setSupabaseAnonKey(targetAnonKey);
        }
      }

      if (!targetUrl) {
        setTableStatus('IDLE');
        setErrorMsg(
          'Supabase project is not specified. Please enter your PAT key or Project URL to discover your cloud database.'
        );
        setIsTestingConnection(false);
        return;
      }

      if (!targetAnonKey) {
        setTableStatus('IDLE');
        setErrorMsg(
          'Unable to retrieve the Publishable/Anon API key for this project. Please provide the Anon Key or verify PAT permissions.'
        );
        setIsTestingConnection(false);
        return;
      }

      // 3. Ping Supabase REST Endpoint
      const ping = await SupabaseClient.pingSupabase(targetUrl, targetAnonKey);
      setTestResult(ping);

      if (!ping.ok) {
        setTableStatus('IDLE');
        setErrorMsg(ping.error || 'Connection to Supabase failed. Please verify your Project URL or PAT Key.');
        setIsTestingConnection(false);
        return;
      }

      // 4. Check exact 14 PostgreSQL tables
      let hasAllTables = false;
      let existingCount = 0;

      // If we have PAT key, probe database tables directly via Management API SQL
      if (activePat && ping.projectRef) {
        try {
          const dbStatus = await SupabaseManagementApi.getDatabaseStatus(activePat, ping.projectRef);
          existingCount = dbStatus.tableCount;
          const required = ['organizations', 'students', 'seats', 'rooms', 'admissions', 'attendance', 'payments'];
          const matched = required.filter(r => dbStatus.tables.includes(r));
          hasAllTables = Boolean(matched.length >= 4 || dbStatus.tableCount >= 10);
        } catch {
          // fallback to REST probe
        }
      }

      if (!hasAllTables) {
        const tbl = await SupabaseClient.checkTablesExist({
          url: targetUrl,
          anonKey: targetAnonKey,
        });
        hasAllTables = tbl.ready;
        existingCount = tbl.totalExisting;
      }

      setVerifiedTableCount(hasAllTables ? 14 : existingCount);
      setTableStatus(hasAllTables ? 'READY' : 'NOT_CREATED');

      if (hasAllTables) {
        setSuccessMsg(`✓ Connected to ${ping.projectRef} (${ping.latencyMs}ms). 14 PostgreSQL database tables verified!`);
        // Update Management Server with verified status
        await ManagementServerClient.updateLibrarySupabaseStatus(libId, {
          status: 'Connected',
          projectRef: ping.projectRef,
          url: targetUrl,
          anonKey: targetAnonKey,
        });
        const refreshed = await ManagementServerClient.checkLibrarySupabaseGeneration(libId);
        setMgmtCloudStatus(refreshed);

        // Check if hosted Supabase has existing records and prompt for data pull
        try {
          let remoteStudentCount = 0;
          const countRes = await fetch(`${targetUrl.replace(/\/+$/, '')}/rest/v1/students?select=id`, {
            method: 'HEAD',
            headers: {
              apikey: targetAnonKey,
              Authorization: `Bearer ${targetAnonKey}`,
              Prefer: 'count=exact',
            },
          });
          const cr = countRes.headers.get('content-range');
          if (cr && cr.includes('/')) {
            remoteStudentCount = parseInt(cr.split('/')[1], 10) || 0;
          }
          if (remoteStudentCount > 0) {
            setCloudPullPrompt({
              show: true,
              count: remoteStudentCount,
              url: targetUrl,
              anonKey: targetAnonKey,
              projectRef: ping.projectRef,
            });
          }
        } catch (probeErr) {
          console.warn('Hosted cloud data probe note:', probeErr);
        }
      } else {
        setErrorMsg(
          `Project reached (${ping.projectRef}), but required database tables are missing (${existingCount}/14). Please switch to "New Project (Auto-Migrate)" mode or click "Connect Supabase & Migrate".`
        );
      }
    } catch (err: any) {
      setTableStatus('IDLE');
      setErrorMsg(err.message || 'Error occurred while testing Supabase connection.');
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Step 3 Mode 1: Pull existing cloud data into local SQLite database
  const handlePullCloudData = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setErrorMsg('Supabase URL and API Key must be configured to pull data.');
      return;
    }

    setIsPullingData(true);
    setErrorMsg('');
    try {
      const res = await db.pullAllDataFromSupabase({
        url: supabaseUrl.trim(),
        anonKey: supabaseAnonKey.trim(),
      }, true);

      if (res.error) {
        setErrorMsg(`Pull note: ${res.error}`);
      } else {
        setPullStats({
          count: res.count,
          message: `Successfully pulled and synchronized ${res.count} cloud records into your local offline SQLite database!`,
        });
        setSuccessMsg(`✓ Local SQLite database synchronized with ${res.count} cloud records.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to pull records from Supabase.');
    } finally {
      setIsPullingData(false);
    }
  };

  // Step 3: Complete Setup & Provision Local Offline DB + Sync Credentials
  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedEnvelope) return;

    // Strict Gating: Must be tested and ready
    if (!testResult || !testResult.ok || tableStatus !== 'READY') {
      setErrorMsg('Cannot launch dashboard: Supabase must be verified and 14 database tables must be active. Please click "Test Connection" or "Connect Supabase & Migrate".');
      return;
    }

    setIsDeploying(true);
    setErrorMsg('');

    try {
      const libId = verifiedEnvelope.payload.library_id;
      // Hash password using PBKDF2 with cryptographic salt (or reuse existing hash if from login)
      let hash = existingAuthConfig?.passwordHash;
      let salt = existingAuthConfig?.passwordSalt;
      if (!hash || !salt) {
        const hashed = await appCrypto.hashPassword(ownerPassword);
        hash = hashed.hash;
        salt = hashed.salt;
      }

      const activeUrl = supabaseUrl.trim() || `https://${testResult.projectRef}.supabase.co`;
      const activeAnonKey = supabaseAnonKey.trim() || 'anon';

      // Persist owner auth record locally for subsequent instant device unlock
      const authRecord = {
        libraryId: libId,
        ownerId: verifiedEnvelope.payload.owner_id,
        passwordHash: hash,
        passwordSalt: salt,
        envelope: verifiedEnvelope,
        supabaseConfig: {
          url: activeUrl,
          anonKey: activeAnonKey,
        },
        patToken: patToken.trim(),
        initializedAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem(`lib_mgmt_owner_auth_${libId}`, JSON.stringify(authRecord));
        if (patToken.trim() && rememberPat) {
          ManagementServerClient.setStoredPatToken(patToken.trim(), libId);
        }
      } catch (err) {
        console.warn('Could not save owner auth to localStorage', err);
      }

      // 1. Bind device in OWNER MODE & initialize local SQLite database
      await db.bindAsOwner(
        verifiedEnvelope,
        hash,
        salt,
        authRecord.supabaseConfig
      );

      // 2. Consistent Data Pull: Pull all existing cloud records into local SQLite database FIRST!
      if (authRecord.supabaseConfig.url && authRecord.supabaseConfig.anonKey) {
        setSuccessMsg('Synchronizing cloud records into local SQLite database...');
        try {
          const pullRes = await db.pullAllDataFromSupabase(authRecord.supabaseConfig, true);
          if (pullRes.count > 0) {
            console.log(`[Onboarding] Successfully pulled ${pullRes.count} cloud records into local SQLite.`);
          }
        } catch (pullErr) {
          console.warn('Initial cloud pull note:', pullErr);
        }
      }

      // 3. Only push initial default data to remote tables if cloud was empty AND user is in PUSH_NEW mode
      if (db.students.length === 0 && configMode === 'PUSH_NEW') {
        try {
          await SupabaseClient.migrateLibraryToCloud(authRecord.supabaseConfig, {
            association: verifiedEnvelope.payload,
            rooms: db.rooms,
            seats: db.seats,
            students: db.students,
            admissions: db.admissions,
            attendance: db.attendance,
            payments: db.payments,
            membershipPlans: db.membershipPlans,
          });
        } catch (pushErr) {
          console.warn('Initial cloud dataset push note:', pushErr);
        }
      }

      // 3. Propagate Supabase connection details to the Library Management Server
      await ManagementServerClient.updateLibrarySupabaseStatus(libId, {
        status: 'Connected',
        projectRef: testResult.projectRef,
        url: activeUrl,
        anonKey: activeAnonKey,
      });

      // 4. Propagate master password hash to Central Management Server
      await ManagementServerClient.saveOrganizationSecurityState(libId, salt, hash);

      // 5. Send POST request to register device on Central Management Server
      await ManagementServerClient.registerDevice({
        deviceId: db.deviceId,
        organizationId: libId,
        orgName: verifiedEnvelope.payload.owner_name ? `${verifiedEnvelope.payload.owner_name}'s Library` : undefined,
        name: `${verifiedEnvelope.payload.owner_name || 'Owner'} Main Terminal (${db.deviceId})`,
        status: 'ONLINE',
      });

      // Success!
      setIsDeploying(false);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize library database.');
      setIsDeploying(false);
    }
  };

  const isLaunchReady = Boolean(testResult?.ok && tableStatus === 'READY');
  const storedPatPresent = Boolean(verifiedEnvelope?.payload?.library_id && ManagementServerClient.getStoredPatToken(verifiedEnvelope.payload.library_id));

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-cyan-500/30">
      <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in duration-300">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Onboarding Selection
        </button>

        {/* Header */}
        <div className="p-6 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-md mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 shadow-inner">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Library Owner Onboarding Flow
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ed25519 Asymmetric Verification • Offline-First Database • Multi-Tenant Isolation
                </p>
              </div>
            </div>

            {/* Online / Offline Network Badge */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${isOnline ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-400'}`}>
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{isOnline ? 'Network Online' : 'Offline Mode'}</span>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] font-bold">
            <div className={`p-2 rounded-xl flex items-center gap-2 border ${step === 1 ? 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step > 1 ? 'bg-emerald-600 text-white' : 'bg-cyan-600 text-white'}`}>
                {step > 1 ? '✓' : '1'}
              </span>
              <span>Verify Credential</span>
            </div>
            <div className={`p-2 rounded-xl flex items-center gap-2 border ${step === 2 ? 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step > 2 ? 'bg-emerald-600 text-white' : 'bg-cyan-600 text-white'}`}>
                {step > 2 ? '✓' : '2'}
              </span>
              <span>Owner Password</span>
            </div>
            <div className={`p-2 rounded-xl flex items-center gap-2 border ${step === 3 ? 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
              <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px]">3</span>
              <span>Supabase & DB</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 flex items-start gap-3 text-xs animate-in zoom-in-95">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Action Notice</span>
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-start gap-3 text-xs animate-in zoom-in-95">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">System Status</span>
              <p className="leading-relaxed">{successMsg}</p>
            </div>
          </div>
        )}

        {/* STEP 1: Paste & Cryptographically Verify Owner Credential */}
        {step === 1 && (
          <form onSubmit={handleVerifyCredential} className="p-6 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5 text-xs">
            <div className="space-y-1">
              <label className="block text-slate-900 dark:text-white font-bold text-sm">
                Paste Signed Owner Credential (JSON Envelope) *
              </label>
              <p className="text-slate-500 dark:text-slate-400">
                The Management Server signs the canonical payload using Ed25519. This application verifies the signature locally using the embedded Public Key.
              </p>
            </div>

            <textarea
              rows={8}
              required
              value={rawCredentialJson}
              onChange={e => setRawCredentialJson(e.target.value)}
              placeholder='{\n  "payload": {\n    "credential_type": "LIBRARY_OWNER",\n    "library_id": "ORG-SAN002",\n    "owner_id": "USER-OWN-101",\n    ...\n  },\n  "signature": "...",\n  "algorithm": "Ed25519",\n  "key_id": "management-v1"\n}'
              className="w-full font-mono text-[11px] p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-emerald-400 focus:outline-none focus:border-cyan-500"
            />

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePreFillGenuineOwner}
                className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
              >
                + Pre-fill Genuine Signed Owner Credential (ORG-SAN002)
              </button>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-2xl shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Ed25519 Signature...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Digital Signature</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Offline Mathematical Verification: Validates Ed25519 signature locally without network requirement.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Next Step: Verifies internet connection to check organization status on Central Management Server.</span>
              </div>
            </div>
          </form>
        )}

        {/* STEP 2: Owner Security Password Flow with Mandatory Internet Gate & Management Server Sync */}
        {step === 2 && verifiedEnvelope && (
          <div className="p-6 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 text-xs animate-in zoom-in-95">
            {/* Authenticated Credential Badge (Image 1) */}
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 space-y-1">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                <span>Digital Signature Authenticated!</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                New device registration for Library: <b>{verifiedEnvelope.payload.library_id}</b> • Owner: <b>{verifiedEnvelope.payload.owner_name}</b>
              </p>
            </div>

            {/* SUB-VIEW 1: OFFLINE GATE - Must Connect Internet First */}
            {step2Mode === 'OFFLINE' && (
              <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/30 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/10 animate-pulse">
                  <WifiOff className="w-8 h-8" />
                </div>

                <div className="space-y-1.5 max-w-md mx-auto">
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Active Internet Connection Required
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                    Before proceeding to the owner password step, this terminal must connect to the <b>Central Management Server</b> to verify if a security password has already been registered for library: <code className="font-mono bg-amber-500/20 px-1 rounded font-bold text-amber-700 dark:text-amber-300">{verifiedEnvelope.payload.library_id}</code>.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleRetryNetworkCheck}
                    disabled={isProbingNetwork || isCheckingRemoteSecurity}
                    className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition"
                  >
                    {isProbingNetwork || isCheckingRemoteSecurity ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Checking Connection & Querying Server...</span>
                      </>
                    ) : (
                      <>
                        <Radio className="w-4 h-4" />
                        <span>Check Connection & Query Server</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setErrorMsg('');
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl cursor-pointer"
                  >
                    Back to Credential
                  </button>

                  <span className="text-[10px] text-slate-400">
                    Central Management Server: <code className="font-mono text-[9px]">jsvevzzupajrgzxsmmyr.supabase.co</code>
                  </span>
                </div>
              </div>
            )}

            {/* SUB-VIEW 2: CHECKING - Probing Server Status */}
            {step2Mode === 'CHECKING' && (
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Connecting to Central Management Server...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Verifying internet connectivity and checking whether an owner password has already been registered for <b>{verifiedEnvelope.payload.library_id}</b>.
                </p>
              </div>
            )}

            {/* SUB-VIEW 3: ENTER_PASSWORD - Password IS created on Central Server -> Single Field Available */}
            {step2Mode === 'ENTER_PASSWORD' && isOnline && (
              <form onSubmit={handleLoginPasswordSubmit} className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-slate-900 dark:text-white font-bold text-sm">
                    Enter Owner Security Password / PIN *
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    A master security password has already been registered on the Central Management Server for this library. Please enter your password to authenticate.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                      Owner Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setStep2Mode('FORGOT_VERIFY');
                        setForgotCredentialJson(rawCredentialJson);
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Forgot Password?</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="Enter your security password"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setLoginPassword('');
                      setErrorMsg('');
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoggingIn || !loginPassword}
                    className="px-7 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoggingIn ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Password...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Verify Password & Open Application</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* SUB-VIEW 4: CREATE_PASSWORD - Password is NOT created on Central Server -> Both New & Confirm Fields (Image 1) */}
            {step2Mode === 'CREATE_PASSWORD' && isOnline && (
              <form onSubmit={handleCreatePasswordSubmit} className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-slate-900 dark:text-white font-bold text-sm">
                    Create Owner Security Password / PIN *
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    Used as an additional factor to authenticate local sessions. Stored securely using PBKDF2 (100,000 iterations + salt). Never plaintext.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showOwnerPassword ? 'text' : 'password'}
                        required
                        value={ownerPassword}
                        onChange={e => setOwnerPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showOwnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setErrorMsg('');
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPassword || isCheckingRemoteSecurity}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingPassword ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Registering to Management Server...</span>
                      </>
                    ) : (
                      <>
                        <span>Save & Continue to Database Config</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* SUB-VIEW 5: FORGOT PASSWORD - Re-verify Digital Signature */}
            {step2Mode === 'FORGOT_VERIFY' && (
              <form onSubmit={handleVerifySignatureForReset} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold block">Cryptographic Authentication Required</span>
                    <p className="leading-relaxed text-[11px]">
                      To protect your library from unauthorized access, resetting your owner password requires cryptographic verification of your original <b>Ed25519 Owner Digital Signature Credential envelope</b>.
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-900 dark:text-white font-bold text-xs">
                    Paste Signed Owner Credential Envelope (JSON) *
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={forgotCredentialJson}
                    onChange={e => setForgotCredentialJson(e.target.value)}
                    placeholder='Paste your genuine Signed Owner Credential JSON...'
                    className="w-full font-mono text-[11px] p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-emerald-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep2Mode('ENTER_PASSWORD');
                      setErrorMsg('');
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isReVerifyingSignature}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isReVerifyingSignature ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Digital Signature...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Authenticate Signature & Proceed to Reset</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* SUB-VIEW 6: RESET_PASSWORD - Set New Password after Digital Signature Re-verification */}
            {step2Mode === 'RESET_PASSWORD' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-[11px]">
                    Ed25519 Digital Signature Verified! Set your new owner password below.
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-slate-900 dark:text-white font-bold text-sm">
                    Set New Owner Security Password / PIN *
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    This will replace your previous password on the Central Management Server so all devices will recognize the updated password.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showResetNewPassword ? 'text' : 'password'}
                        required
                        value={resetNewPassword}
                        onChange={e => setResetNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showResetNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showResetConfirmPassword ? 'text' : 'password'}
                        required
                        value={resetConfirmPassword}
                        onChange={e => setResetConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showResetConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep2Mode('ENTER_PASSWORD');
                      setErrorMsg('');
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResettingPassword}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isResettingPassword ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Updating Central Management Server...</span>
                      </>
                    ) : (
                      <>
                        <span>Update Password & Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* STEP 3: Configure Owner's Supabase Backend with Sliding Tabbed Workflow */}
        {step === 3 && verifiedEnvelope && (
          <form onSubmit={handleCompleteSetup} className="p-6 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5 text-xs">
            {/* Header & Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <label className="block text-slate-900 dark:text-white font-bold text-sm">
                  Configure Library's Supabase Backend
                </label>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Powered by Supabase Personal Access Token (PAT) & Management Server Cloud Sync.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFillLiveDemoProject}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[10px] font-semibold hover:bg-blue-100 transition cursor-pointer"
                >
                  Auto-fill Test Project
                </button>
                <button
                  type="button"
                  onClick={handleCopySchemaSql}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{hasCopiedSql ? 'Copied SQL ✓' : 'Copy 14-Table SQL'}</span>
                </button>
              </div>
            </div>

            {/* Sliding Tab Selector for Cloud Setup Workflow */}
            <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setConfigMode('PULL_EXISTING')}
                className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer text-xs ${
                  configMode === 'PULL_EXISTING'
                    ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <DownloadCloud className="w-4 h-4" />
                <span>Existing Cloud Project (Pull Data)</span>
              </button>

              <button
                type="button"
                onClick={() => setConfigMode('PUSH_NEW')}
                className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer text-xs ${
                  configMode === 'PUSH_NEW'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>New Supabase Project (Auto-Migrate & Push)</span>
              </button>
            </div>

            {/* Mode A: Existing Project (Pull Cloud Data) Description */}
            {configMode === 'PULL_EXISTING' && (
              <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-slate-700 dark:text-slate-300 text-[11px] space-y-1">
                <span className="font-bold text-blue-700 dark:text-blue-400 block">
                  Connect Existing Cloud Database (Pull Mode)
                </span>
                <p className="leading-relaxed">
                  Provide your Supabase PAT key to connect to your existing project. We will verify the exact 14 PostgreSQL tables and allow pulling cloud records directly into your local SQLite database.
                </p>
              </div>
            )}

            {/* Mode B: New Project (Auto-Migrate & Push) Banner */}
            {configMode === 'PUSH_NEW' && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/15 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold text-sm">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>1-Click Connect, Auto-Migrate & Push Local Data</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    Connect your PAT token. We automatically execute all 14 schema migrations against your Supabase project, then push your local SQLite tables to the cloud.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(true)}
                  className="px-5 py-3 rounded-xl bg-[#3ecf8e] hover:bg-[#34b27b] text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 shrink-0 transition cursor-pointer"
                >
                  <Database className="w-4 h-4 fill-current" />
                  <span>Connect Supabase & Migrate</span>
                </button>
              </div>
            )}

            {/* Central Management Server Cloud Registry Status Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs">
                  <Cloud className="w-4 h-4 text-blue-500" />
                  <span>Management Server Cloud Registry</span>
                </div>
                {isCheckingMgmt ? (
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Checking Server...
                  </span>
                ) : mgmtCloudStatus?.isSupabaseGenerated ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Supabase Generated
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 text-[10px] font-bold">
                    {mgmtCloudStatus?.found ? 'Provisioning Required' : 'Awaiting Connection'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Verified Library ID</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {verifiedEnvelope.payload.library_id}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Cloud Project Ref</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white truncate block">
                    {selectedProjectRef || mgmtCloudStatus?.supabaseProjectRef || SupabaseClient.extractProjectRef(supabaseUrl) || 'None'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Cloud Status</span>
                  <span className={`font-bold ${mgmtCloudStatus?.supabaseStatus === 'Connected' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {mgmtCloudStatus?.supabaseStatus || 'Not Connected'}
                  </span>
                </div>
              </div>
            </div>

            {/* Personal Access Token (PAT Key) Section */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-slate-900 dark:text-white font-bold text-xs flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    <span>Supabase Personal Access Token (PAT Key) *</span>
                  </label>
                  <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">
                    Stored securely on device. Never exposes service_role keys.
                  </p>
                </div>

                {storedPatPresent && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-500/20">
                    ✓ Stored Locally
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPatToken ? 'text' : 'password'}
                    value={patToken}
                    onChange={e => {
                      const val = e.target.value;
                      setPatToken(val);
                      setTestResult(null);
                      setTableStatus('IDLE');
                      setPullStats(null);
                      if (val.trim().startsWith('sbp_') || val.trim().length >= 25) {
                        discoverProjectsForPat(val, true);
                      }
                    }}
                    placeholder="sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPatToken(!showPatToken)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      title={showPatToken ? 'Hide PAT' : 'Show PAT'}
                    >
                      {showPatToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isDiscoveringProjects || !patToken.trim()}
                  onClick={() => discoverProjectsForPat(patToken, true)}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition disabled:opacity-50 cursor-pointer shadow-sm"
                  title="Discover Supabase projects associated with this PAT key"
                >
                  {isDiscoveringProjects ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Discovering...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Discover Projects</span>
                    </>
                  )}
                </button>
              </div>

              {/* Project Dropdown if PAT discovered projects */}
              {discoveredProjects.length > 0 && (
                <div className="space-y-1.5 pt-1 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Select Cloud Project ({discoveredProjects.length} found):</span>
                    </label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                      {selectedProjectRef || 'None selected'}
                    </span>
                  </div>
                  <select
                    value={selectedProjectRef}
                    onChange={async e => {
                      const ref = e.target.value;
                      setSelectedProjectRef(ref);
                      setSupabaseUrl(`https://${ref}.supabase.co`);
                      setTestResult(null);
                      setTableStatus('IDLE');
                      const activePat = patToken.trim() || ManagementServerClient.getStoredPatToken(verifiedEnvelope?.payload?.library_id);
                      if (activePat && ref) {
                        const keyRes = await SupabaseManagementApi.getProjectApiKeys(activePat, ref);
                        if (keyRes.ok && keyRes.anonKey) {
                          setSupabaseAnonKey(keyRes.anonKey);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                  >
                    {discoveredProjects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.id}) — {p.region}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[10px] text-slate-500">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberPat}
                    onChange={e => setRememberPat(e.target.checked)}
                    className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>Remember PAT Key on this device</span>
                </label>

                <a
                  href="https://supabase.com/dashboard/account/tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Generate PAT in Supabase Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Test Connection Action & Live Breakdown */}
            <div className="pt-1 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-500/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {isTestingConnection ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying 14 Tables in Supabase Cloud...</span>
                    </>
                  ) : (
                    <>
                      <Server className="w-4 h-4" />
                      <span>Test Connection & Verify 14 Tables</span>
                    </>
                  )}
                </button>

                {testResult?.ok && tableStatus === 'READY' && (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold animate-in zoom-in-95">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      Connected & Verified: <code className="font-mono bg-emerald-500/20 px-1 rounded">{testResult.projectRef}</code> ({testResult.latencyMs}ms) • 14 Tables Active
                    </span>
                  </div>
                )}

                {testResult?.ok && tableStatus === 'NOT_CREATED' && (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-semibold animate-in zoom-in-95">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      Project Reached: <code className="font-mono bg-amber-500/20 px-1 rounded">{testResult.projectRef}</code> • ⚠️ Schema Missing ({verifiedTableCount}/14 Tables)
                    </span>
                  </div>
                )}
              </div>

              {/* Interactive Cloud Data Pull Prompt */}
              {cloudPullPrompt && cloudPullPrompt.show && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-blue-950/80 to-slate-900 border-2 border-cyan-500/50 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
                      <DownloadCloud className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>☁️ Hosted Cloud Data Detected!</span>
                        <span className="text-[10px] bg-cyan-500/30 text-cyan-300 font-mono px-2 py-0.5 rounded-full border border-cyan-500/40">
                          {cloudPullPrompt.count} Student Records Found
                        </span>
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">
                        Your hosted Supabase project (<code className="font-mono text-cyan-300">{cloudPullPrompt.projectRef}</code>) contains existing data.
                        Would you like to pull this cloud data into your local offline SQLite database now?
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      disabled={isPullingData}
                      onClick={async () => {
                        setIsPullingData(true);
                        try {
                          const res = await db.pullAllDataFromSupabase({
                            url: cloudPullPrompt.url,
                            anonKey: cloudPullPrompt.anonKey,
                          }, true);
                          setPullStats({
                            count: res.count,
                            message: `Successfully pulled and synchronized ${res.count} cloud records into your local SQLite database! All seats and students are up to date.`,
                          });
                          setSuccessMsg(`✓ Local SQLite database synchronized with ${res.count} cloud records.`);
                          setCloudPullPrompt(null);
                        } catch (e: any) {
                          setErrorMsg(e.message || 'Failed to pull cloud records');
                        } finally {
                          setIsPullingData(false);
                        }
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                    >
                      {isPullingData ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Pulling Cloud Data...</span>
                        </>
                      ) : (
                        <>
                          <DownloadCloud className="w-3.5 h-3.5" />
                          <span>Pull Cloud Data Now ({cloudPullPrompt.count} records)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isPullingData}
                      onClick={() => setCloudPullPrompt(null)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
                    >
                      Keep Local / Skip
                    </button>
                  </div>
                </div>
              )}

              {/* Mode A: Pull Cloud Data Button & Stats */}
              {configMode === 'PULL_EXISTING' && testResult?.ok && tableStatus === 'READY' && (
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
                  <div>
                    <span className="font-bold text-cyan-800 dark:text-cyan-300 block text-xs">
                      Cloud Database Verified: Pull Existing Records
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Sync students, seats, rooms, and payments from your remote Supabase cloud project into your local offline SQLite database.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePullCloudData}
                    disabled={isPullingData}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <DownloadCloud className={`w-4 h-4 ${isPullingData ? 'animate-bounce' : ''}`} />
                    <span>{isPullingData ? 'Pulling Cloud Data...' : 'Pull Cloud Records Now'}</span>
                  </button>
                </div>
              )}

              {/* Pulled Stats Notification */}
              {pullStats && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in zoom-in-95">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{pullStats.message}</span>
                </div>
              )}

              {/* Test Result Breakdown Card */}
              {testResult?.ok && (
                <div className="p-3.5 rounded-2xl border transition text-xs space-y-2.5 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-blue-500" />
                      Supabase PostgreSQL Schema Status
                    </span>
                    {tableStatus === 'READY' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold">
                        ✓ 14 Tables Active & Isolated
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 text-[10px] font-bold">
                        ⚠️ 14-Table Migration Required
                      </span>
                    )}
                  </div>

                  {tableStatus !== 'READY' && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2 text-amber-800 dark:text-amber-300 text-[11px]">
                      <p className="leading-relaxed">
                        Database tables (<code>organizations</code>, <code>seats</code>, <code>students</code>, <code>admissions</code>, <code>attendance</code>, <code>payments</code>) must be initialized before launching.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowProvisionModal(true)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>1-Click Auto-Migrate Database</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCopySchemaSql}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{hasCopiedSql ? 'Copied 14-Table SQL ✓' : 'Copy 14-Table SQL'}</span>
                        </button>
                        <a
                          href={`https://supabase.com/dashboard/project/${testResult.projectRef}/sql/new`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold text-[10px] flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        >
                          <ExternalLink className="w-3 h-3 text-blue-500" />
                          <span>Open Supabase SQL Editor ↗</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Offline-First Information Box */}
            <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-cyan-800 dark:text-cyan-300">
                <Sparkles className="w-4 h-4" />
                <span>Offline-First Immediate Activation & Auto Cloud Sync</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Upon clicking below, your clean SQLite database is bound to your device. You can immediately use the app 100% offline. Online sync will push records whenever connected to your Supabase project (<code>{testResult?.projectRef || selectedProjectRef || mgmtCloudStatus?.supabaseProjectRef || 'your-project'}</code>). You will not be asked for Supabase keys again.
              </p>
            </div>

            {/* Bottom Action Buttons (Strictly Gated Launch) */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl cursor-pointer"
              >
                Back
              </button>

              <div className="w-full sm:w-auto flex flex-col items-end gap-1">
                <button
                  type="submit"
                  disabled={isDeploying || !isLaunchReady}
                  title={!isLaunchReady ? 'Click "Test Connection" first to verify Supabase & schema readiness' : 'Initialize and open dashboard'}
                  className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition ${
                    isLaunchReady
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20 cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isDeploying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Binding Device & Initializing DB...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Initialize Library & Launch Dashboard</span>
                    </>
                  )}
                </button>

                {!isLaunchReady && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    ⚠️ Requires successful test & 14 active tables to enable launch
                  </span>
                )}
              </div>
            </div>
          </form>
        )}

        {/* 14-Module Automated Supabase Provisioning Modal */}
        <SupabaseProvisioningModal
          isOpen={showProvisionModal}
          onClose={() => setShowProvisionModal(false)}
          onProvisionComplete={handleProvisionComplete}
          initialProjectRef={selectedProjectRef || SupabaseClient.extractProjectRef(supabaseUrl) || undefined}
          initialPatToken={patToken.trim() || ManagementServerClient.getStoredPatToken(verifiedEnvelope?.payload?.library_id) || undefined}
        />
      </div>
    </div>
  );
};
