import { Role } from '../types';

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  'Super Admin': ['ALL_PERMISSIONS'],
  'Owner': ['ALL_PERMISSIONS'],
  'Manager': [
    'STUDENT_ADMISSION',
    'FEES_COLLECTION',
    'SEAT_ALLOCATE',
    'ATTENDANCE_SCAN',
    'LOCKER_ASSIGN',
    'VISITOR_LOG',
    'COMPLAINT_MANAGE',
    'NOTICE_POST',
    'FINANCIAL_REPORTS',
    'ROLE_MANAGE',
  ],
  'Receptionist': [
    'STUDENT_ADMISSION',
    'FEES_COLLECTION',
    'SEAT_ALLOCATE',
    'ATTENDANCE_SCAN',
    'VISITOR_LOG',
    'COMPLAINT_MANAGE',
    'NOTICE_POST',
  ],
  'Librarian': [
    'SEAT_ALLOCATE',
    'ATTENDANCE_SCAN',
    'LOCKER_ASSIGN',
    'NOTICE_POST',
  ],
  'Accountant': [
    'FEES_COLLECTION',
    'FINANCIAL_REPORTS',
  ],
  'Security': [
    'ATTENDANCE_SCAN',
    'VISITOR_LOG',
    'COMPLAINT_MANAGE',
  ],
  'Viewer': [
    'VIEW_DASHBOARD',
    'VIEW_SEATS',
  ],
};

export const ROLE_ALLOWED_SCREENS: Record<Role, string[]> = {
  'Super Admin': ['*'],
  'Owner': ['*'],
  'Manager': [
    'dashboard',
    'seats',
    'students',
    'student-profile',
    'student-add-edit',
    'admissions',
    'new-admission',
    'memberships',
    'attendance-live',
    'attendance-history',
    'fees-dashboard',
    'transactions',
    'collect-payment',
    'receipt-details',
    'lockers',
    'visitors',
    'complaints',
    'notices',
    'documents',
    'reports-dashboard',
    'staff',
    'staff-attendance',
    'staff-roles',
    'notifications',
    'activity-timeline',
    'settings',
  ],
  'Receptionist': [
    'dashboard',
    'students',
    'student-profile',
    'student-add-edit',
    'admissions',
    'new-admission',
    'seats',
    'attendance-live',
    'attendance-history',
    'fees-dashboard',
    'transactions',
    'collect-payment',
    'receipt-details',
    'visitors',
    'complaints',
    'notices',
    'notifications',
  ],
  'Librarian': [
    'dashboard',
    'seats',
    'students',
    'student-profile',
    'lockers',
    'attendance-live',
    'attendance-history',
    'notices',
    'documents',
    'notifications',
  ],
  'Accountant': [
    'dashboard',
    'fees-dashboard',
    'transactions',
    'collect-payment',
    'receipt-details',
    'reports-dashboard',
    'financial-reports',
    'expenses',
    'income',
    'notifications',
  ],
  'Security': [
    'dashboard',
    'attendance-live',
    'attendance-history',
    'visitors',
    'complaints',
    'notifications',
  ],
  'Viewer': [
    'dashboard',
    'seats',
    'notices',
    'notifications',
  ],
};

/**
 * Check if the active role or custom permissions allow access to a specific screen
 */
export function isScreenPermitted(
  screenId: string,
  role: Role = 'Owner',
  customPermissions: string[] = []
): boolean {
  // Always allowed for onboarding, login, notifications, and dashboard
  if (['dashboard', 'notifications', 'login', 'onboarding-landing', 'onboarding-owner', 'onboarding-role'].includes(screenId)) {
    return true;
  }

  if (role === 'Owner' || role === 'Super Admin') return true;
  if (customPermissions.includes('ALL_PERMISSIONS')) return true;

  // Custom permission overrides
  if (customPermissions.length > 0) {
    if (customPermissions.includes('STUDENT_ADMISSION') && ['students', 'student-profile', 'student-add-edit', 'admissions', 'new-admission'].includes(screenId)) return true;
    if (customPermissions.includes('FEES_COLLECTION') && ['fees-dashboard', 'transactions', 'collect-payment', 'receipt-details'].includes(screenId)) return true;
    if (customPermissions.includes('SEAT_ALLOCATE') && ['seats', 'reservations', 'seat-transfer'].includes(screenId)) return true;
    if (customPermissions.includes('ATTENDANCE_SCAN') && ['attendance-live', 'attendance-history'].includes(screenId)) return true;
    if (customPermissions.includes('LOCKER_ASSIGN') && ['lockers'].includes(screenId)) return true;
    if (customPermissions.includes('VISITOR_LOG') && ['visitors'].includes(screenId)) return true;
    if (customPermissions.includes('COMPLAINT_MANAGE') && ['complaints'].includes(screenId)) return true;
    if (customPermissions.includes('NOTICE_POST') && ['notices'].includes(screenId)) return true;
    if (customPermissions.includes('FINANCIAL_REPORTS') && ['reports-dashboard', 'financial-reports'].includes(screenId)) return true;
    if (customPermissions.includes('ROLE_MANAGE') && ['staff', 'staff-attendance', 'staff-roles', 'roles'].includes(screenId)) return true;
    if (customPermissions.includes('DB_MIGRATE') && ['supabase-db-management', 'sync-center', 'backup-center'].includes(screenId)) return true;
  }

  const allowedScreens = ROLE_ALLOWED_SCREENS[role] || ROLE_ALLOWED_SCREENS['Viewer'];
  if (allowedScreens.includes('*')) return true;
  return allowedScreens.includes(screenId);
}

/**
 * Check if the active role has a specific granular capability
 */
export function hasPermission(
  permission: string,
  role: Role = 'Owner',
  customPermissions: string[] = []
): boolean {
  if (role === 'Owner' || role === 'Super Admin') return true;
  if (customPermissions.includes('ALL_PERMISSIONS') || customPermissions.includes(permission)) return true;

  const standardPermissions = ROLE_PERMISSIONS[role] || [];
  return standardPermissions.includes(permission);
}

export interface RoleMeta {
  title: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
}

export const ROLE_META: Record<Role, RoleMeta> = {
  'Super Admin': {
    title: 'Super Admin',
    badgeBg: 'bg-purple-500/15 dark:bg-purple-500/20',
    badgeText: 'text-purple-700 dark:text-purple-300',
    badgeBorder: 'border-purple-300 dark:border-purple-500/30',
    description: 'Full Root / Central Architecture Access',
  },
  'Owner': {
    title: 'Library Owner',
    badgeBg: 'bg-amber-500/15 dark:bg-amber-500/20',
    badgeText: 'text-amber-800 dark:text-amber-300',
    badgeBorder: 'border-amber-300 dark:border-amber-500/30',
    description: 'Complete Library Ownership & Database Authority',
  },
  'Manager': {
    title: 'Operations Manager',
    badgeBg: 'bg-blue-500/15 dark:bg-blue-500/20',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-300 dark:border-blue-500/30',
    description: 'Full Day-to-Day Operations & Staff Oversight',
  },
  'Receptionist': {
    title: 'Front Desk Receptionist',
    badgeBg: 'bg-cyan-500/15 dark:bg-cyan-500/20',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    badgeBorder: 'border-cyan-300 dark:border-cyan-500/30',
    description: 'Admissions, Desk Bookings, Fees & Inquiries',
  },
  'Librarian': {
    title: 'Hall Librarian',
    badgeBg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-300 dark:border-emerald-500/30',
    description: 'Reading Halls, Desks, Lockers & Notices',
  },
  'Accountant': {
    title: 'Financial Accountant',
    badgeBg: 'bg-teal-500/15 dark:bg-teal-500/20',
    badgeText: 'text-teal-700 dark:text-teal-300',
    badgeBorder: 'border-teal-300 dark:border-teal-500/30',
    description: 'Fee Collections, Invoices, Ledger & P&L',
  },
  'Security': {
    title: 'Security Officer',
    badgeBg: 'bg-rose-500/15 dark:bg-rose-500/20',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-300 dark:border-rose-500/30',
    description: 'Gate QR Attendance, Visitors & Incident Logs',
  },
  'Viewer': {
    title: 'Read-Only Viewer',
    badgeBg: 'bg-slate-500/15 dark:bg-slate-500/20',
    badgeText: 'text-slate-700 dark:text-slate-300',
    badgeBorder: 'border-slate-300 dark:border-slate-500/30',
    description: 'Public Desk Availability & Notice Board',
  },
};
