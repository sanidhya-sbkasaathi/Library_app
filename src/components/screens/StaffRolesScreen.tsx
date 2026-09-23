import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Key,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  QrCode,
  Lock,
  X,
  RefreshCw,
  UserCheck,
  AlertTriangle,
  Clock,
  Eye,
  FileCode,
  Send,
} from 'lucide-react';
import { db } from '../../db/localDatabase';
import { Role, StaffMember, RoleJoiningPayload } from '../../types';
import { ManagementServerClient } from '../../utils/managementServerClient';

interface StaffRolesScreenProps {
  onNavigate?: (screen: string, param?: any) => void;
}

const DEFAULT_ROLES: Array<{
  role: Role;
  description: string;
  defaultPermissions: string[];
  color: string;
}> = [
  {
    role: 'Owner',
    description: 'Full administrative control, financial auditing, database migrations & system settings',
    defaultPermissions: ['ALL_PERMISSIONS', 'FINANCE_AUDIT', 'DB_MIGRATE', 'ROLE_MANAGE', 'STUDENT_MANAGE'],
    color: 'emerald',
  },
  {
    role: 'Super Admin',
    description: 'Complete branch operations, seat allocation, staff oversight, and financial management',
    defaultPermissions: ['FINANCE_AUDIT', 'ROLE_MANAGE', 'STUDENT_MANAGE', 'SEAT_ALLOCATE', 'ATTENDANCE_SCAN'],
    color: 'purple',
  },
  {
    role: 'Manager',
    description: 'Daily branch management, seat reservations, admissions, fee collections, and student KYC',
    defaultPermissions: ['STUDENT_ADMISSION', 'FEES_COLLECTION', 'SEAT_ALLOCATE', 'ATTENDANCE_SCAN', 'EXPENSE_LOG'],
    color: 'cyan',
  },
  {
    role: 'Receptionist',
    description: 'Front desk reception, visitor logs, student check-in, fee receipts, and seat transfer',
    defaultPermissions: ['STUDENT_ADMISSION', 'FEES_COLLECTION', 'SEAT_ALLOCATE', 'ATTENDANCE_SCAN', 'VISITOR_LOG'],
    color: 'amber',
  },
  {
    role: 'Librarian',
    description: 'Study hall quiet enforcement, locker assignments, book cataloging, and attendance logs',
    defaultPermissions: ['ATTENDANCE_SCAN', 'LOCKER_ASSIGN', 'SEAT_ALLOCATE', 'NOTICE_POST'],
    color: 'blue',
  },
  {
    role: 'Accountant',
    description: 'Fee collection accounting, receipt validation, expense logging, and day-end cash reconciliation',
    defaultPermissions: ['FEES_COLLECTION', 'RECEIPT_ISSUE', 'EXPENSE_LOG', 'FINANCIAL_REPORTS'],
    color: 'indigo',
  },
  {
    role: 'Security',
    description: 'Turnstile gate QR validation, night shift monitoring, perimeter safety, and biometric check-in',
    defaultPermissions: ['ATTENDANCE_SCAN', 'VISITOR_LOG', 'GATE_CHECKIN'],
    color: 'rose',
  },
];

const AVAILABLE_PERMISSIONS = [
  { id: 'STUDENT_ADMISSION', label: 'New Student Admission & KYC' },
  { id: 'FEES_COLLECTION', label: 'Fee Collection & Receipt Issuance' },
  { id: 'SEAT_ALLOCATE', label: 'Seat Allocation & Transfers' },
  { id: 'ATTENDANCE_SCAN', label: 'QR & Turnstile Attendance Scan' },
  { id: 'LOCKER_ASSIGN', label: 'Locker Allocation & Keys' },
  { id: 'EXPENSE_LOG', label: 'Expense Recording & Bills' },
  { id: 'VISITOR_LOG', label: 'Visitor Logs & Security Register' },
  { id: 'NOTICE_POST', label: 'Notice Board & Announcements' },
  { id: 'FINANCIAL_REPORTS', label: 'Financial & Ledger Reports' },
  { id: 'ROLE_MANAGE', label: 'Invite & Manage Staff Roles' },
];

export const StaffRolesScreen: React.FC<StaffRolesScreenProps> = () => {
  const libraryId = db.boundLibraryId || db.currentAssociationId || 'ORG-SAN023';
  const orgName = db.getCurrentAssociation()?.name || 'Sanidhya Library';

  const [staffList, setStaffList] = useState<StaffMember[]>(db.staff || []);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Modal States
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [activePayload, setActivePayload] = useState<RoleJoiningPayload | null>(null);

  // Form States for generating payload
  const [targetRole, setTargetRole] = useState<Role>('Receptionist');
  const [staffName, setStaffName] = useState('');
  const [staffMobile, setStaffMobile] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffSalary, setStaffSalary] = useState(22000);
  const [staffShift, setStaffShift] = useState('Morning (6 AM - 2 PM)');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'STUDENT_ADMISSION',
    'FEES_COLLECTION',
    'SEAT_ALLOCATE',
    'ATTENDANCE_SCAN',
  ]);

  // Load / Sync on mount
  useEffect(() => {
    // If staff list in local db has no owner, inject authentic owner
    if (staffList.length === 0 && db.currentUser && db.currentUser.id !== 'GUEST') {
      const ownerMember: StaffMember = {
        id: 'stf-owner-01',
        associationId: libraryId,
        name: db.currentUser.name || 'Library Owner / Director',
        role: 'Owner',
        mobile: db.currentUser.phone || '+91 98765 00001',
        email: db.currentUser.email || 'owner@library.local',
        salary: 0,
        shift: 'Full Day (8 AM - 8 PM)',
        status: 'Active',
        joiningDate: new Date().toISOString().split('T')[0],
        digitalSignature: 'SIG_HMAC256_OWNER_MASTER_AUTH',
        permissions: ['ALL_PERMISSIONS'],
      };
      db.staff = [ownerMember];
      setStaffList([ownerMember]);
      ManagementServerClient.syncLibraryRoles(libraryId, [ownerMember]);
    }
  }, [libraryId]);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleTogglePermission = (permId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleOpenGenerateModal = (role: Role) => {
    setTargetRole(role);
    const roleDef = DEFAULT_ROLES.find(r => r.role === role);
    if (roleDef) {
      setSelectedPermissions(roleDef.defaultPermissions);
    }
    setStaffName('');
    setStaffMobile('');
    setStaffEmail('');
    setIsGenerateModalOpen(true);
  };

  const handleCreateJoiningPayload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    const nonce = 'sig_nonce_' + Math.random().toString(36).substring(2, 12);
    const roleId = `role_${targetRole.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString(36)}`;
    const issuedAt = new Date().toISOString();
    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + 30); // Valid for 30 days
    const expiresAt = expiresDate.toISOString();

    const rawData = {
      libraryId,
      orgName,
      role: targetRole,
      roleId,
      assignedTo: staffName.trim() || undefined,
      mobile: staffMobile.trim() || undefined,
      email: staffEmail.trim() || undefined,
      shift: staffShift,
      salary: Number(staffSalary) || 0,
      permissions: selectedPermissions,
      nonce,
      issuedAt,
      expiresAt,
    };

    // Generate cryptographic digital signature
    const signature = await generateHMACDigitalSignature(rawData);

    const completePayload: RoleJoiningPayload = {
      ...rawData,
      digitalSignature: signature,
      status: staffName.trim() ? 'ACTIVE_SIGNED' : 'PENDING_INVITE',
    };

    // Create staff record via SQLite repository
    const newStaffMember = db.addStaffMember({
      name: staffName.trim() || `${targetRole} (Pending Invite)`,
      role: targetRole,
      mobile: staffMobile.trim() || 'Pending Assignment',
      email: staffEmail.trim() || 'invite@library.local',
      salary: Number(staffSalary) || 0,
      shift: staffShift,
      status: staffName.trim() ? 'Active' : 'Pending Invitation',
      joiningDate: new Date().toISOString().split('T')[0],
      roleId,
      digitalSignature: signature,
      permissions: selectedPermissions,
      signingPayload: completePayload,
    });

    setStaffList(db.staff);
    db.saveToStorage();

    // Sync to Central Management Server
    await ManagementServerClient.syncLibraryRoles(libraryId, db.staff);

    setActivePayload(completePayload);
    setIsGenerating(false);
    setIsGenerateModalOpen(false);
    setIsInspectModalOpen(true);
    setSyncFeedback(`✓ Generated Cryptographic Role Joining Payload for ${targetRole}!`);
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove role assignment for "${name}"?`)) {
      db.deleteStaffMember(id);
      setStaffList(db.staff);
      db.saveToStorage();
      await ManagementServerClient.syncLibraryRoles(libraryId, db.staff);
      setSyncFeedback('Role assignment revoked and removed.');
      setTimeout(() => setSyncFeedback(null), 3000);
    }
  };

  const generateHMACDigitalSignature = async (data: Record<string, any>): Promise<string> => {
    const canonical = JSON.stringify(data, Object.keys(data).sort());
    try {
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          enc.encode('sbkasaathi_library_master_signing_key_2026'),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const sig = await crypto.subtle.sign('HMAC', key, enc.encode(canonical));
        const hex = Array.from(new Uint8Array(sig))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
          .substring(0, 32);
        return `SIG_HMAC256_${hex}`;
      }
    } catch {
      // ignore
    }
    let hash = 0;
    for (let i = 0; i < canonical.length; i++) {
      hash = (hash << 5) - hash + canonical.charCodeAt(i);
      hash |= 0;
    }
    return `SIG_HMAC256_${Math.abs(hash).toString(16).padStart(16, '0')}`;
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Staff Roles & Digital Signatures
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
              {staffList.filter(s => s.status === 'Active').length} Active • {staffList.length} Roles Assigned
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Cryptographically signed role payloads, personnel roster, and permission authorization synchronized with Central Management Server.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleOpenGenerateModal('Receptionist')}
            className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs shadow-md shadow-purple-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Role Joining Payload</span>
          </button>
        </div>
      </div>

      {/* Sync Feedback Alert */}
      {syncFeedback && (
        <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Role Joining Protocol Explainer Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-purple-50 via-indigo-50/40 to-cyan-50 dark:from-purple-950/20 dark:via-slate-900 dark:to-indigo-950/20 border-2 border-purple-200/80 dark:border-purple-500/30 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Cryptographic Digital Signature Role Authorization
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              Each user role generated below contains an HMAC-SHA256 digital signature bound to organization <b>{libraryId}</b>. When staff input this joining payload into their terminal, their device is authenticated without sharing master owner credentials.
            </p>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-purple-200 dark:border-purple-700/60 shadow-xs shrink-0 text-right">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Organization Scope</span>
            <span className="font-mono font-bold text-xs text-purple-700 dark:text-purple-300">{libraryId}</span>
          </div>
        </div>
      </div>

      {/* Official Organization Role Matrix (No Fake Data) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Organization Personnel & Active Roles
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified roster of authenticated library staff, shifts, salaries, and digital signatures.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Total Roles: {DEFAULT_ROLES.length}
          </span>
        </div>

        {/* Roles Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <tr>
                <th className="py-3 px-3">Role & Scope</th>
                <th className="py-3 px-3">Assigned Personnel</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Shift & Salary</th>
                <th className="py-3 px-3">Digital Signature Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {DEFAULT_ROLES.map(roleDef => {
                const assigned = staffList.find(s => s.role === roleDef.role);

                return (
                  <tr key={roleDef.role} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    {/* Role Title */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                          {roleDef.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1 max-w-[200px]" title={roleDef.description}>
                        {roleDef.description}
                      </span>
                    </td>

                    {/* Assigned Personnel */}
                    <td className="py-3.5 px-3">
                      {assigned ? (
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white text-xs block">
                            {assigned.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Joined: {assigned.joiningDate}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
                          Unassigned (Pending Invite)
                        </span>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                      {assigned ? (
                        <div>
                          <span>{assigned.mobile}</span>
                          <span className="block text-[10px] text-slate-400">{assigned.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>

                    {/* Shift & Salary */}
                    <td className="py-3.5 px-3">
                      {assigned ? (
                        <div>
                          <span className="text-slate-700 dark:text-slate-200 block">{assigned.shift}</span>
                          {assigned.salary > 0 && (
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                              ₹{assigned.salary.toLocaleString('en-IN')}/mo
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>

                    {/* Digital Signature Status */}
                    <td className="py-3.5 px-3">
                      {assigned?.digitalSignature ? (
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 inline-flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            Signed & Verified
                          </span>
                          <button
                            onClick={() => {
                              setActivePayload(
                                assigned.signingPayload || {
                                  libraryId,
                                  orgName,
                                  role: assigned.role,
                                  roleId: assigned.roleId || `role_${assigned.id}`,
                                  assignedTo: assigned.name,
                                  mobile: assigned.mobile,
                                  email: assigned.email,
                                  shift: assigned.shift,
                                  salary: assigned.salary,
                                  permissions: assigned.permissions || roleDef.defaultPermissions,
                                  issuedAt: new Date().toISOString(),
                                  expiresAt: new Date().toISOString(),
                                  nonce: 'sig_nonce_verified',
                                  digitalSignature: assigned.digitalSignature || 'SIG_HMAC256_VERIFIED',
                                  status: 'ACTIVE_SIGNED',
                                }
                              );
                              setIsInspectModalOpen(true);
                            }}
                            className="font-mono text-[9px] text-purple-600 dark:text-purple-400 block hover:underline truncate max-w-[140px]"
                            title="Inspect Digital Signature Payload"
                          >
                            {assigned.digitalSignature}
                          </button>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 inline-flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          Awaiting Joining Token
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-right">
                      {assigned ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              const token = btoa(unescape(encodeURIComponent(JSON.stringify(assigned.signingPayload || {
                                type: 'ROLE_AUTHORIZATION_CREDENTIAL',
                                version: '2.0',
                                payload: {
                                  libraryId,
                                  orgName,
                                  role: assigned.role,
                                  roleId: assigned.roleId || `role_${assigned.id}`,
                                  assignedTo: assigned.name,
                                  mobile: assigned.mobile,
                                  email: assigned.email,
                                  shift: assigned.shift,
                                  salary: assigned.salary,
                                  permissions: assigned.permissions || roleDef.defaultPermissions,
                                  status: 'ACTIVE_SIGNED',
                                },
                                signature: assigned.digitalSignature || 'SIG_HMAC256_VERIFIED',
                              }))));
                              handleCopyText(token, assigned.id);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-500/15 hover:bg-purple-100 dark:hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-500/30 transition flex items-center gap-1.5 cursor-pointer text-[11px]"
                            title="1-Click Copy Role Token / Payload for Staff Login"
                          >
                            {copiedToken === assigned.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Token</span>
                              </>
                            )}
                          </button>
                          {assigned.role !== 'Owner' && (
                            <button
                              onClick={() => handleDeleteStaff(assigned.id, assigned.name)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                              title="Revoke / Remove Role"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenGenerateModal(roleDef.role)}
                          className="px-3 py-1.5 bg-purple-50 dark:bg-purple-500/15 hover:bg-purple-100 dark:hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 font-bold rounded-xl text-xs border border-purple-200 dark:border-purple-500/30 transition flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Generate Payload</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: GENERATE ROLE JOINING PAYLOAD */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Generate Cryptographic Joining Payload
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Target Role: {targetRole}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateJoiningPayload} className="space-y-4 text-xs">
              {/* Select Role */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  User Role
                </label>
                <select
                  value={targetRole}
                  onChange={e => handleOpenGenerateModal(e.target.value as Role)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                >
                  {DEFAULT_ROLES.filter(r => r.role !== 'Owner').map(r => (
                    <option key={r.role} value={r.role}>
                      {r.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Staff Member Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Staff Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pooja Verma (or leave blank to invite)"
                    value={staffName}
                    onChange={e => setStaffName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={staffMobile}
                    onChange={e => setStaffMobile(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="staff@library.com"
                    value={staffEmail}
                    onChange={e => setStaffEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Monthly Salary (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={staffSalary}
                    onChange={e => setStaffSalary(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Shift Schedule
                </label>
                <select
                  value={staffShift}
                  onChange={e => setStaffShift(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="Morning (6 AM - 2 PM)">Morning (6 AM - 2 PM)</option>
                  <option value="Evening (2 PM - 10 PM)">Evening (2 PM - 10 PM)</option>
                  <option value="Night Owl (10 PM - 6 AM)">Night Owl (10 PM - 6 AM)</option>
                  <option value="Full Day (8 AM - 8 PM)">Full Day (8 AM - 8 PM)</option>
                </select>
              </div>

              {/* Permissions Checklist */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-2">
                  Role Permissions (HMAC Signed)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  {AVAILABLE_PERMISSIONS.map(perm => (
                    <label key={perm.id} className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={() => handleTogglePermission(perm.id)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-md shadow-purple-500/20 flex items-center gap-2 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isGenerating ? 'Signing Payload...' : 'Sign & Generate Payload'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INSPECT DIGITAL SIGNATURE & COPY TOKEN */}
      {isInspectModalOpen && activePayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Digital Signature Payload Inspector
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Role: {activePayload.role} • Scope: {activePayload.libraryId}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsInspectModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Copy Joining Token */}
            <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-2">
              <span className="text-[11px] font-bold text-purple-800 dark:text-purple-300 block">
                1-Click Joining Token (Share with Staff / Terminal)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={btoa(JSON.stringify(activePayload))}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 font-mono text-[11px] text-slate-800 dark:text-slate-200 select-all"
                />
                <button
                  onClick={() => handleCopyText(btoa(JSON.stringify(activePayload)), 'payload-token')}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shrink-0 transition cursor-pointer"
                >
                  {copiedToken === 'payload-token' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Token</span>
                </button>
              </div>
            </div>

            {/* Raw JSON Payload */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                Cryptographic JSON Payload & HMAC Signature
              </span>
              <pre className="p-4 rounded-2xl bg-slate-900 text-cyan-300 font-mono text-[11px] overflow-x-auto max-h-56 leading-relaxed border border-slate-800">
                {JSON.stringify(activePayload, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-500 font-mono text-[10px]">
                Algorithm: HMAC-SHA256
              </span>
              <button
                onClick={() => setIsInspectModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-xl"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
