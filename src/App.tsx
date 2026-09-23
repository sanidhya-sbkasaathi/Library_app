import React, { useState, useEffect } from 'react';
import { db } from './db/localDatabase';
import { Seat, PaymentTransaction, Role } from './types';
import { AppShell } from './components/layout/AppShell';
import { DevSimulatorBar } from './components/common/DevSimulatorBar';
import { ReceiptModal } from './components/common/ReceiptModal';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { SeatDrawer } from './components/common/SeatDrawer';
import { QRScannerModal } from './components/common/QRScannerModal';
import { isScreenPermitted, ROLE_META } from './utils/rolePermissions';
import { ShieldAlert, Database } from 'lucide-react';

// Screens
import { DashboardScreen } from './components/screens/DashboardScreen';
import { SeatsScreen } from './components/screens/SeatsScreen';
import {
  StudentsDirectoryScreen,
  StudentProfileScreen,
} from './components/screens/StudentsScreens';
import {
  AdmissionsListScreen,
  NewAdmissionWizardScreen,
} from './components/screens/AdmissionsScreens';
import {
  FeesDashboardScreen,
  TransactionsScreen,
  CollectPaymentScreen,
} from './components/screens/FinanceScreens';
import {
  SeatTransferScreen,
  LockersScreen,
  VisitorsScreen,
  ComplaintsScreen,
  NoticesScreen,
  StaffScreen,
} from './components/screens/OperationsScreens';
import { ReportsDashboardScreen } from './components/screens/ReportingScreens';
import { QRIdCardsScreen } from './components/screens/PrintingScreens';
import {
  SyncCenterScreen,
  AuditLogsScreen,
  BackupCenterScreen,
  GeneralSettingsScreen,
  SystemDiagnosticsScreen,
} from './components/screens/SystemScreens';
import {
  WelcomeScreen,
  SetupWizardScreen,
  LoginScreen,
} from './components/screens/SetupAndAuthScreens';
import {
  DeviceActivationScreen,
  LocalDatabaseInspectorScreen,
} from './components/screens/ActivationAndDbInspector';
import { OnboardingLandingScreen } from './components/screens/OnboardingLandingScreen';
import { OwnerOnboardingScreen } from './components/screens/OwnerOnboardingScreen';
import { RoleOnboardingScreen } from './components/screens/RoleOnboardingScreen';
import { StaffRolesScreen } from './components/screens/StaffRolesScreen';
import { MembershipPlansScreen } from './components/screens/MembershipPlansScreen';
import { SupabaseDbManagementScreen } from './components/screens/SupabaseDbManagementScreen';

import { LoginUnlockScreen } from './components/screens/LoginUnlockScreen';

const OAuthCallbackHandler: React.FC = () => {
  const [status, setStatus] = useState('Completing Supabase Authorization...');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!code || !state) {
      setStatus('No authorization code or state found in callback URL.');
      return;
    }

    fetch('/api/supabase/oauth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        state,
        redirectUri: window.location.origin + '/oauth/callback',
      }),
    })
      .then(async res => {
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          throw new Error('OAuth server endpoint is only available during local web development. Please use the Personal Access Token (PAT) connection.');
        }
      })
      .then(data => {
        if (data.success) {
          setIsSuccess(true);
          setStatus('Supabase authorized successfully! Closing popup...');
          if (window.opener) {
            window.opener.postMessage({ type: 'SUPABASE_OAUTH_SUCCESS', data }, '*');
          }
          setTimeout(() => window.close(), 1200);
        } else {
          setStatus(`Authorization error: ${data.error || 'Exchange failed'}`);
        }
      })
      .catch(err => setStatus(`Connection note: ${err.message}`));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
      <div className="max-w-sm w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto">
          <Database className={`w-7 h-7 ${isSuccess ? '' : 'animate-pulse'}`} />
        </div>
        <h2 className="text-base font-bold">Supabase Cloud Connection</h2>
        <p className="text-xs text-slate-400 leading-relaxed">{status}</p>
      </div>
    </div>
  );
};

export function App() {
  const [, setTick] = useState(0);
  const [sessionUnlocked, setSessionUnlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('lib_mgmt_session_unlocked') === 'true';
    }
    return false;
  });

  const [currentScreen, setCurrentScreen] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('lib_mgmt_active_screen') || localStorage.getItem('lib_mgmt_active_screen');
      if (saved) {
        return saved;
      }
    }
    return 'dashboard';
  });
  const isOnboarding = currentScreen.startsWith('onboarding-');

  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedStudent = sessionStorage.getItem('lib_mgmt_selected_student') || localStorage.getItem('lib_mgmt_selected_student');
      if (savedStudent) return savedStudent;
    }
    return '';
  });
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [activeReceiptTx, setActiveReceiptTx] = useState<PaymentTransaction | null>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Subscribe to local reactive database
  useEffect(() => {
    const unsub = db.subscribe(() => {
      setTick(t => t + 1);
    });
    return unsub;
  }, []);

  // Global keyboard shortcuts (Ctrl+K for search) - called unconditionally at top of component
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (typeof window !== 'undefined' && window.location.pathname === '/oauth/callback') {
    return <OAuthCallbackHandler />;
  }

  // Strict Signature Verification Gate: Never allow dashboard access if unbound
  if (db.bindingState === 'UNBOUND' || !db.boundCredentialEnvelope) {
    if (currentScreen === 'onboarding-owner') {
      return (
        <OwnerOnboardingScreen
          onBack={() => setCurrentScreen('onboarding-landing')}
          onSuccess={() => {
            setSessionUnlocked(true);
            try { sessionStorage.setItem('lib_mgmt_session_unlocked', 'true'); } catch (e) {}
            setCurrentScreen('dashboard');
          }}
        />
      );
    }
    if (currentScreen === 'onboarding-role') {
      return (
        <RoleOnboardingScreen
          onBack={() => setCurrentScreen('onboarding-landing')}
          onSuccess={() => {
            setSessionUnlocked(true);
            try { sessionStorage.setItem('lib_mgmt_session_unlocked', 'true'); } catch (e) {}
            setCurrentScreen('dashboard');
          }}
        />
      );
    }
    return (
      <OnboardingLandingScreen
        onSelectOwner={() => setCurrentScreen('onboarding-owner')}
        onSelectRole={() => setCurrentScreen('onboarding-role')}
      />
    );
  }

  // Session Password Protection Gate: Ask password on subsequent desktop launches
  if (!sessionUnlocked) {
    return (
      <LoginUnlockScreen
        onUnlock={() => {
          setSessionUnlocked(true);
          try { sessionStorage.setItem('lib_mgmt_session_unlocked', 'true'); } catch (e) {}
          setCurrentScreen('dashboard');
        }}
        onUnbind={() => {
          setSessionUnlocked(false);
          try { sessionStorage.removeItem('lib_mgmt_session_unlocked'); } catch (e) {}
          setCurrentScreen('onboarding-landing');
        }}
      />
    );
  }

  const handleNavigate = (screenId: string, param?: any) => {
    if (param && (screenId === 'student-profile' || screenId === 'student-add-edit')) {
      setSelectedStudentId(param);
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('lib_mgmt_selected_student', param);
          localStorage.setItem('lib_mgmt_selected_student', param);
        }
      } catch (e) {}
    }
    setCurrentScreen(screenId);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('lib_mgmt_active_screen', screenId);
        localStorage.setItem('lib_mgmt_active_screen', screenId);
      }
    } catch (e) {}
  };

  const renderScreen = () => {
    const currentRole: Role = (db.currentUser?.role as Role) || (db.boundRole as Role) || 'Owner';
    const customPermissions = db.boundCredentialEnvelope?.permissions || db.currentUser?.permissions || [];

    // Strict Security Guard: Block unauthorized direct screen routing
    if (!isScreenPermitted(currentScreen, currentRole, customPermissions)) {
      const roleMeta = ROLE_META[currentRole] || ROLE_META['Viewer'];
      return (
        <div className="max-w-xl mx-auto my-12 p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-rose-200 dark:border-rose-900/60 shadow-2xl text-center space-y-4 backdrop-blur-md animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Access Restricted: Role Permission Required
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your active session is authorized under <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${roleMeta.badgeBg} ${roleMeta.badgeText} ${roleMeta.badgeBorder}`}>{roleMeta.title}</span>.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Requested Screen:</span>
              <span className="font-mono text-cyan-600 dark:text-cyan-400">{currentScreen}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Enforcement Mode:</span>
              <span className="text-rose-600 dark:text-rose-400 font-semibold">Strict Role-Based Access Control</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
              This module requires elevated permissions. Please ask your Library Owner to issue an updated digital signature token if access is required.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => handleNavigate('dashboard')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition cursor-pointer"
            >
              Return to Authorized Dashboard
            </button>
          </div>
        </div>
      );
    }

    switch (currentScreen) {
      case 'onboarding-landing':
        return (
          <OnboardingLandingScreen
            onSelectOwner={() => handleNavigate('onboarding-owner')}
            onSelectRole={() => handleNavigate('onboarding-role')}
          />
        );

      case 'onboarding-owner':
        return (
          <OwnerOnboardingScreen
            onBack={() => handleNavigate('onboarding-landing')}
            onSuccess={() => handleNavigate('dashboard')}
          />
        );

      case 'onboarding-role':
        return (
          <RoleOnboardingScreen
            onBack={() => handleNavigate('onboarding-landing')}
            onSuccess={() => handleNavigate('dashboard')}
          />
        );

      case 'dashboard':
        return (
          <DashboardScreen
            onNavigate={handleNavigate}
            onOpenReceipt={tx => setActiveReceiptTx(tx)}
            onOpenQRScanner={() => setIsQRScannerOpen(true)}
          />
        );

      case 'welcome':
        return <WelcomeScreen onNavigate={handleNavigate} />;

      case 'setup-wizard':
        return <SetupWizardScreen onNavigate={handleNavigate} />;

      case 'login':
        return <LoginScreen onNavigate={handleNavigate} />;

      case 'seats':
        return (
          <SeatsScreen
            onSelectSeat={seat => setSelectedSeat(seat)}
            onNavigate={handleNavigate}
          />
        );

      case 'students':
        return (
          <StudentsDirectoryScreen
            onSelectStudent={id => handleNavigate('student-profile', id)}
            onNavigate={handleNavigate}
          />
        );

      case 'student-profile':
        return (
          <StudentProfileScreen
            studentId={selectedStudentId}
            onNavigate={handleNavigate}
            onOpenReceipt={tx => setActiveReceiptTx(tx)}
          />
        );

      case 'student-add-edit':
        return <NewAdmissionWizardScreen onNavigate={handleNavigate} onOpenReceipt={tx => setActiveReceiptTx(tx)} />;

      case 'admissions':
        return (
          <AdmissionsListScreen
            onNavigate={handleNavigate}
            onOpenReceipt={tx => setActiveReceiptTx(tx)}
          />
        );

      case 'new-admission':
        return (
          <NewAdmissionWizardScreen
            onNavigate={handleNavigate}
            onOpenReceipt={tx => setActiveReceiptTx(tx)}
          />
        );

      case 'memberships':
      case 'membership-plans':
      case 'plans':
        return <MembershipPlansScreen onNavigate={handleNavigate} />;

      case 'attendance-live':
      case 'attendance-history':
        return (
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/70 shadow-xl flex justify-between items-center">
              <div>
                <h1 className="text-xl font-extrabold text-white">Live Attendance & Biometric Gate</h1>
                <p className="text-xs text-slate-400 mt-1">Real-time turnstile verification and offline QR scanning</p>
              </div>
              <button
                onClick={() => setIsQRScannerOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl text-xs shadow-lg"
              >
                Launch QR Camera Scanner
              </button>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-xl">
              <h3 className="font-bold text-sm text-white mb-3">Today's Check-in Log</h3>
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-2">Student ID</th>
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Seat</th>
                    <th className="pb-2">Check In</th>
                    <th className="pb-2">Check Out</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {db.attendance.map(a => (
                    <tr key={a.id}>
                      <td className="py-2.5 font-mono text-cyan-400 font-bold">{a.studentId}</td>
                      <td className="py-2.5 text-white font-semibold">{a.studentName}</td>
                      <td className="py-2.5 font-mono text-slate-300">Seat {a.seatNumber}</td>
                      <td className="py-2.5 text-slate-400">{a.checkIn}</td>
                      <td className="py-2.5 text-slate-400">{a.checkOut || 'Active Inside'}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'fees-dashboard':
        return (
          <FeesDashboardScreen
            onNavigate={handleNavigate}
            onOpenReceipt={tx => setActiveReceiptTx(tx)}
          />
        );

      case 'transactions':
        return (
          <TransactionsScreen
            onNavigate={handleNavigate}
            onOpenReceipt={tx => setActiveReceiptTx(tx)}
          />
        );

      case 'collect-payment':
        return (
          <CollectPaymentScreen
            onNavigate={handleNavigate}
            onOpenReceipt={tx => setActiveReceiptTx(tx)}
          />
        );

      case 'receipt-details':
        return (
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/70 shadow-xl space-y-4">
            <h1 className="text-xl font-bold text-white">Receipt Printing Center</h1>
            <p className="text-xs text-slate-400">Click Print Receipt on any transaction or below to preview.</p>
            <button
              onClick={() => setActiveReceiptTx(db.payments[0])}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl text-xs"
            >
              Open Thermal 80mm Preview
            </button>
          </div>
        );

      case 'reservations':
      case 'rooms':
        return (
          <SeatsScreen
            onSelectSeat={seat => setSelectedSeat(seat)}
            onNavigate={handleNavigate}
          />
        );

      case 'seat-transfer':
        return <SeatTransferScreen onNavigate={handleNavigate} />;

      case 'lockers':
        return <LockersScreen />;

      case 'visitors':
        return <VisitorsScreen />;

      case 'complaints':
        return <ComplaintsScreen />;

      case 'notices':
        return <NoticesScreen />;

      case 'staff':
      case 'staff-attendance':
      case 'staff-roles':
      case 'roles':
        return <StaffRolesScreen onNavigate={handleNavigate} />;

      case 'expenses':
      case 'income':
        return (
          <FeesDashboardScreen
            onNavigate={handleNavigate}
            onOpenReceipt={tx => setActiveReceiptTx(tx)}
          />
        );

      case 'reports-dashboard':
      case 'student-reports':
      case 'financial-reports':
      case 'operational-reports':
        return <ReportsDashboardScreen />;

      case 'qr-id-cards':
      case 'print-center':
        return <QRIdCardsScreen />;

      case 'sync-center':
      case 'devices':
      case 'offline-simulator':
        return <SyncCenterScreen />;

      case 'audit-logs':
      case 'security-center':
        return <AuditLogsScreen />;

      case 'backup-center':
      case 'restore-center':
        return <BackupCenterScreen />;

      case 'supabase-db-management':
      case 'supabase-settings':
      case 'supabase-cloud':
        return <SupabaseDbManagementScreen onNavigate={handleNavigate} />;

      case 'general-settings':
      case 'operational-settings':
      case 'system-settings':
        return <GeneralSettingsScreen />;

      case 'device-activation':
        return <DeviceActivationScreen onSuccess={() => handleNavigate('dashboard')} />;

      case 'local-db-inspector':
      case 'local-database':
        return <LocalDatabaseInspectorScreen />;

      case 'help-system':
      case 'system-diagnostics':
      case 'activity-timeline':
      case 'global-search':
      case 'multi-tenant-switcher':
      case 'org-setup':
      case 'device-verification':
      case 'password-recovery':
      case 'library-profile':
      case 'library-config':
      case 'associations':
      case 'leave':
      case 'documents':
      case 'notifications':
      case 'notification-rules':
      default:
        return <SystemDiagnosticsScreen />;
    }
  };

  return (
    <AppShell
      currentScreen={currentScreen}
      onNavigate={handleNavigate}
      onOpenSearch={() => setIsSearchOpen(true)}
      isOnboarding={isOnboarding}
    >
      {/* Dev Mode Offline Simulator Dock */}
      <DevSimulatorBar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
      />

      {/* Main Screen Body */}
      {renderScreen()}

      {/* Global Modals & Drawers */}
      <ReceiptModal
        isOpen={!!activeReceiptTx}
        onClose={() => setActiveReceiptTx(null)}
        transaction={activeReceiptTx}
        associationName={db.getCurrentAssociation().name}
      />

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      <SeatDrawer
        seat={selectedSeat}
        isOpen={!!selectedSeat}
        onClose={() => setSelectedSeat(null)}
        onNavigate={handleNavigate}
      />

      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onSuccess={msg => {
          console.log('Attendance logged:', msg);
        }}
      />
    </AppShell>
  );
}

export default App;
