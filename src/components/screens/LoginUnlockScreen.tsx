import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  ArrowRight,
  LogOut,
  Sparkles,
  AlertCircle,
  KeyRound,
  UserCheck,
} from 'lucide-react';
import { db } from '../../db/localDatabase';
import { appCrypto } from '../../utils/appCrypto';
import { ManagementServerClient } from '../../utils/managementServerClient';

interface LoginUnlockScreenProps {
  onUnlock: () => void;
  onUnbind: () => void;
}

export const LoginUnlockScreen: React.FC<LoginUnlockScreenProps> = ({ onUnlock, onUnbind }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const libraryName = db.getCurrentAssociation()?.name || db.boundCredentialEnvelope?.payload?.owner_name ? `${db.boundCredentialEnvelope.payload.owner_name}'s Library` : (db.boundLibraryId || 'Authorized Library');
  const roleName = db.boundRole || db.currentUser?.role || 'Super Admin';
  const userName = db.currentUser?.name || db.boundCredentialEnvelope?.payload?.owner_name || 'Authorized User';
  const userEmail = db.currentUser?.email || db.boundCredentialEnvelope?.payload?.owner_email || 'owner@library.local';

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('Please enter your security password.');
      return;
    }

    setErrorMsg('');
    setIsVerifying(true);

    try {
      let salt = db.ownerSecretSalt;
      let hash = db.ownerSecretHash;

      // If not stored locally in memory, check localStorage or Management Server
      if (!salt || !hash) {
        if (db.boundLibraryId) {
          const remoteSecurity = await ManagementServerClient.getOrganizationSecurityState(db.boundLibraryId);
          if (remoteSecurity.passwordSalt && remoteSecurity.passwordHash) {
            salt = remoteSecurity.passwordSalt;
            hash = remoteSecurity.passwordHash;
            db.ownerSecretSalt = salt;
            db.ownerSecretHash = hash;
            db.persistInstallationMeta().catch(() => {});
          }
        }
      }

      // If still no salt/hash, allow first-time password setup or direct fallback
      if (!salt || !hash) {
        // Automatically accept and set password
        const newSec = await appCrypto.hashPassword(password.trim());
        db.ownerSecretSalt = newSec.salt;
        db.ownerSecretHash = newSec.hash;
        await db.persistInstallationMeta();
        if (db.boundLibraryId) {
          await ManagementServerClient.saveOrganizationSecurityState(db.boundLibraryId, newSec.salt, newSec.hash);
        }
        setIsVerifying(false);
        onUnlock();
        return;
      }

      const isValid = await appCrypto.verifyPassword(password.trim(), salt, hash);
      if (!isValid) {
        setErrorMsg('Incorrect security password. Please enter the password you set during initial signature verification.');
        setIsVerifying(false);
        return;
      }

      setIsVerifying(false);
      onUnlock();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error.');
      setIsVerifying(false);
    }
  };

  const handleResetSignature = async () => {
    if (window.confirm('Are you sure you want to unbind this device and switch to a different digital signature?')) {
      await db.resetToUnbound();
      onUnbind();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#070d1a] relative overflow-y-auto overflow-x-hidden font-sans p-4 sm:p-6 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Ambient Cyber Mesh Background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Branding & Status */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3.5 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/25 border border-blue-400/30">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {libraryName}
          </h1>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Digital Signature Verified • Device Locked</span>
          </div>
        </div>

        {/* Unlock Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-5">
          {/* User Profile Pill */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                {userName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="font-bold text-white text-xs block leading-tight">{userName}</span>
                <span className="text-[10px] text-slate-400 block">{userEmail || 'Local Desk Operator'}</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold font-mono">
              {roleName}
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center justify-between">
                <span>Security Password / Master PIN</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="Enter your security password..."
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-blue-500 transition shadow-inner font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? (
                <span>Verifying Cryptographic Security...</span>
              ) : (
                <>
                  <span>Unlock Desktop Session</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Device ID: <code className="text-cyan-400 font-mono">{db.deviceId}</code></span>
            <button
              type="button"
              onClick={handleResetSignature}
              className="text-slate-400 hover:text-rose-400 hover:underline transition flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Switch / Re-Verify Signature</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
