import React, { useState, useEffect } from 'react';
import { db } from './db/localDatabase';
import { Seat, PaymentTransaction } from './types';
import { AppShell } from './components/layout/AppShell';
import { DevSimulatorBar } from './components/common/DevSimulatorBar';
import { ReceiptModal } from './components/common/ReceiptModal';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { SeatDrawer } from './components/common/SeatDrawer';
import { QRScannerModal } from './components/common/QRScannerModal';

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

export function App() {
  const [, setTick] = useState(0);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState('STU-1024');
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

  // Global keyboard shortcuts (Ctrl+K for search)
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

  const handleNavigate = (screenId: string, param?: any) => {
    if (param && screenId === 'student-profile') {
      setSelectedStudentId(param);
    }
    setCurrentScreen(screenId);
  };

  const renderScreen = () => {
    switch (currentScreen) {
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
            onSelectStudent={id => {
              setSelectedStudentId(id);
              setCurrentScreen('student-profile');
            }}
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
        return <SetupWizardScreen onNavigate={handleNavigate} />;

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
        return <StaffScreen />;

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
