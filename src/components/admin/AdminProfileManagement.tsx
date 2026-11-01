import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Key, 
  Camera, 
  Save, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Copy, 
  RefreshCw, 
  Send, 
  Server, 
  LogOut, 
  Briefcase, 
  FileText, 
  Check, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { AdminProfile, AdminStaffMember, StoreSettings } from '../../types';
import { compressImageFile, isValidImageUrl, sanitizeImageUrl } from '../../utils/imageCompressor';
import { auth } from '../../firebase';
import { sendPasswordResetEmail, updatePassword } from 'firebase/auth';

interface AdminProfileManagementProps {
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  currentStaff: AdminStaffMember | null;
  staffRole: string | null;
  currentUser: any;
  onUpdateStaff?: (id: string, data: Partial<AdminStaffMember>) => Promise<void>;
  onLogout: () => Promise<void>;
  totalOrdersCount: number;
  totalProductsCount: number;
  totalStaffCount: number;
  setToast: (toast: { show: boolean; type: 'success' | 'error'; message: string }) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300',
];

export function AdminProfileManagement({
  settings,
  updateSettings,
  currentStaff,
  staffRole,
  currentUser,
  onUpdateStaff,
  onLogout,
  totalOrdersCount,
  totalProductsCount,
  totalStaffCount,
  setToast,
}: AdminProfileManagementProps) {
  const isStaffSession = Boolean(currentStaff);

  // Form states for profile
  const [name, setName] = useState(
    isStaffSession 
      ? currentStaff?.name || '' 
      : settings.adminProfile?.name || 'MR. BOOKS Admin'
  );
  const [email, setEmail] = useState(
    isStaffSession 
      ? currentStaff?.email || '' 
      : settings.adminProfile?.email || currentUser?.email || 'mr.booksbd700@gmail.com'
  );
  const [phone, setPhone] = useState(
    isStaffSession 
      ? currentStaff?.phone || '' 
      : settings.adminProfile?.phone || settings.phone || '+880 1712-345678'
  );
  const [whatsapp, setWhatsapp] = useState(
    settings.adminProfile?.whatsapp || settings.phone || '+880 1712-345678'
  );
  const [designation, setDesignation] = useState(
    isStaffSession 
      ? `Staff ${currentStaff?.role?.toUpperCase() || 'Member'}` 
      : settings.adminProfile?.designation || 'Store Owner & Managing Director'
  );
  const [bio, setBio] = useState(
    settings.adminProfile?.bio || 'Primary administrator for MR. BOOKS e-commerce platform.'
  );
  const [avatarUrl, setAvatarUrl] = useState(
    settings.adminProfile?.avatarUrl || AVATAR_PRESETS[0]
  );
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Security / Password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // Handle Photo Upload
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setAvatarUploading(true);
      const compressed = await compressImageFile(file, 400, 400, 0.85);
      setAvatarUrl(compressed);
      setToast({
        show: true,
        type: 'success',
        message: 'প্রোফাইল ছবি সফলভাবে আপলোড হয়েছে! সেভ করতে "Save Changes" বাটনে চাপুন।',
      });
    } catch (err: any) {
      setToast({
        show: true,
        type: 'error',
        message: err.message || 'ছবি আপলোড করা সম্ভব হয়নি।',
      });
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  // Handle Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setToast({ show: true, type: 'error', message: 'অনুগ্রহ করে অ্যাডমিনের নাম লিখুন।' });
      return;
    }

    try {
      setSavingProfile(true);

      if (isStaffSession && currentStaff && onUpdateStaff) {
        // Staff member profile update
        await onUpdateStaff(currentStaff.id, {
          name: name.trim(),
          phone: phone.trim(),
          updatedAt: Date.now(),
        });
        setToast({
          show: true,
          type: 'success',
          message: 'আপনার স্টাফ প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে!',
        });
      } else {
        // Store Owner / Primary Administrator Profile update
        const updatedProfile: AdminProfile = {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim(),
          designation: designation.trim(),
          bio: bio.trim(),
          avatarUrl: sanitizeImageUrl(avatarUrl),
          roleTitle: 'Super Administrator',
          updatedAt: Date.now(),
        };

        await updateSettings({
          adminProfile: updatedProfile,
        });

        setToast({
          show: true,
          type: 'success',
          message: 'অ্যাডমিন প্রোফাইল সফলভাবে Firebase Firestore-এ সেভ হয়েছে!',
        });
      }
    } catch (err: any) {
      setToast({
        show: true,
        type: 'error',
        message: err.message || 'প্রোফাইল সেভ করার সময় ত্রুটি হয়েছে।',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // Password Generator Helper
  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let res = '';
    for (let i = 0; i < 12; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(res);
    setConfirmPassword(res);
    setShowPassword(true);
    setToast({
      show: true,
      type: 'success',
      message: 'শক্তিশালী পাসওয়ার্ড তৈরি হয়েছে! কপি করে সেভ করুন।',
    });
  };

  const copyPasswordToClipboard = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
    setToast({ show: true, type: 'success', message: 'পাসওয়ার্ড ক্লিপবোর্ডে কপি হয়েছে!' });
  };

  // Handle Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setToast({ show: true, type: 'error', message: 'নতুন পাসওয়ার্ড লিখুন।' });
      return;
    }
    if (newPassword.length < 6) {
      setToast({ show: true, type: 'error', message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({ show: true, type: 'error', message: 'পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।' });
      return;
    }

    try {
      setUpdatingPassword(true);

      if (isStaffSession && currentStaff && onUpdateStaff) {
        // Staff password update directly in Firestore
        await onUpdateStaff(currentStaff.id, {
          password: newPassword,
          updatedAt: Date.now(),
        });
        setToast({
          show: true,
          type: 'success',
          message: 'স্টাফ পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!',
        });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        // Owner Firebase Auth password update
        if (auth.currentUser) {
          await updatePassword(auth.currentUser, newPassword);
          setToast({
            show: true,
            type: 'success',
            message: 'অ্যাডমিন পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!',
          });
          setNewPassword('');
          setConfirmPassword('');
        } else {
          // Send reset email fallback
          await handleSendResetEmail();
        }
      }
    } catch (err: any) {
      console.error('Password change error:', err);
      if (err.code === 'auth/requires-recent-login') {
        setToast({
          show: true,
          type: 'error',
          message: 'নিরাপত্তার স্বার্থে সরাসরি পাসওয়ার্ড পরিবর্তন করতে পুনরায় লগইন প্রয়োজন। নিচে "Send Password Reset Link" ব্যবহার করতে পারেন।',
        });
      } else {
        setToast({
          show: true,
          type: 'error',
          message: err.message || 'পাসওয়ার্ড পরিবর্তন করা সম্ভব হয়নি।',
        });
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Handle Send Password Reset Link Email
  const handleSendResetEmail = async () => {
    const targetEmail = currentUser?.email || email || 'mr.booksbd700@gmail.com';
    try {
      setSendingReset(true);
      await sendPasswordResetEmail(auth, targetEmail);
      setResetEmailSent(true);
      setToast({
        show: true,
        type: 'success',
        message: `পাসওয়ার্ড রিসেট লিংক ${targetEmail} ইমেইলে পাঠানো হয়েছে! আপনার ইনবক্স চেক করুন।`,
      });
    } catch (err: any) {
      setToast({
        show: true,
        type: 'error',
        message: err.message || 'রিসেট ইমেইল পাঠানো যায়নি।',
      });
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Profile Header Hero Banner */}
      <div className="bg-white border border-[#E5E5E5] rounded-3xl overflow-hidden shadow-xs">
        {/* Cover Graphic Banner */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-[#0A0E17] via-[#1A202C] to-[#2D3748] relative p-6 flex items-end">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Firestore Live
            </span>
            <span className="px-3 py-1 rounded-full bg-black/40 text-slate-300 border border-slate-700/60 text-xs font-mono backdrop-blur-xs">
              mr-book-new
            </span>
          </div>
        </div>

        {/* Profile Card Header Info */}
        <div className="p-6 sm:p-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
            {/* Avatar with Edit Badge */}
            <div className="relative group self-start">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center">
                {avatarUrl && isValidImageUrl(avatarUrl) ? (
                  <img 
                    src={avatarUrl} 
                    alt={name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full bg-[#D71920] text-white flex items-center justify-center text-4xl font-black">
                    {name ? name[0].toUpperCase() : 'A'}
                  </div>
                )}
              </div>

              {/* Upload trigger overlay */}
              <label 
                title="Change Avatar"
                className="absolute bottom-1 right-1 p-2 bg-[#D71920] hover:bg-[#B9151B] text-white rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105 flex items-center justify-center border-2 border-white"
              >
                <Camera size={16} />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarFileChange} 
                  className="hidden" 
                  disabled={avatarUploading}
                />
              </label>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-[#D71920] border border-red-200 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <LogOut size={14} />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Name & Role Details */}
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black text-neutral-900">{name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                isStaffSession 
                  ? 'bg-purple-50 text-purple-700 border-purple-200' 
                  : 'bg-red-50 text-[#D71920] border-red-200'
              }`}>
                {isStaffSession ? `Staff (${currentStaff?.role?.toUpperCase()})` : 'Super Administrator'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium">
              {designation} • {email}
            </p>
          </div>

          {/* Metric Summary Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-[#E5E5E5]">
            <div className="p-3 rounded-2xl bg-[#F8F9FA] border border-[#E5E5E5]">
              <span className="text-[11px] font-bold text-neutral-500 block">Total Orders</span>
              <span className="text-lg font-black text-neutral-900">{totalOrdersCount}</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#F8F9FA] border border-[#E5E5E5]">
              <span className="text-[11px] font-bold text-neutral-500 block">Catalog Books</span>
              <span className="text-lg font-black text-neutral-900">{totalProductsCount}</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#F8F9FA] border border-[#E5E5E5]">
              <span className="text-[11px] font-bold text-neutral-500 block">Staff Members</span>
              <span className="text-lg font-black text-neutral-900">{totalStaffCount}</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-700 block">Session Status</span>
              <span className="text-xs font-black text-emerald-800 flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Active Authenticated
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Profile Grid: Information & Security */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Profile & Contact Information Form */}
        <div className="lg:col-span-7 bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-[#D71920] flex items-center justify-center border border-red-200">
                <User size={18} />
              </div>
              <div>
                <h2 className="font-black text-base text-neutral-900">Admin Information</h2>
                <p className="text-xs text-neutral-500">ব্যক্তিগত ও যোগাযোগ তথ্য আপডেট করুন</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Firebase Synced</span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            
            {/* Display Name */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Full Display Name (পূর্ণ নাম) *
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-3.5 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Abdullah Al Mamun"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D1D5DB] rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920]"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Email Address (ইমেইল ঠিকানা) *
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-3.5 text-neutral-400" />
                <input
                  type="email"
                  required
                  disabled={isStaffSession}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g., admin@mrbooksbd.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white disabled:bg-neutral-50 border border-[#D1D5DB] rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920]"
                />
              </div>
              {isStaffSession && (
                <p className="text-[10px] text-neutral-500 mt-1">
                  স্টাফ ইমেইল পরিবর্তন করতে মূল অ্যাডমিনের সাহায্য প্রয়োজন।
                </p>
              )}
            </div>

            {/* Phone & WhatsApp Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Phone Number (মোবাইল নম্বর)
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-3.5 text-neutral-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+880 1712-345678"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D1D5DB] rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  WhatsApp Support (হোয়াটসঅ্যাপ)
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-3.5 text-emerald-600" />
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="+880 1712-345678"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D1D5DB] rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920]"
                  />
                </div>
              </div>
            </div>

            {/* Designation / Role Title */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Designation / Title (পদবী)
              </label>
              <div className="relative">
                <Briefcase size={15} className="absolute left-3.5 top-3.5 text-neutral-400" />
                <input
                  type="text"
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  placeholder="e.g., Managing Director & Store Owner"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D1D5DB] rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920]"
                />
              </div>
            </div>

            {/* Bio / Description */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Admin Bio & Notes (সংক্ষিপ্ত পরিচিতি)
              </label>
              <div className="relative">
                <FileText size={15} className="absolute left-3.5 top-3.5 text-neutral-400" />
                <textarea
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="অ্যাডমিনের দায়িত্ব বা স্টোরের ভূমিকা..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D1D5DB] rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920]"
                />
              </div>
            </div>

            {/* Curated Avatar Preset Picker */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-2">
                Choose Profile Avatar (অথবা পছন্দের অবতার সিলেক্ট করুন)
              </label>
              <div className="flex items-center gap-3 flex-wrap">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(preset)}
                    className={`w-11 h-11 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${
                      avatarUrl === preset ? 'border-[#D71920] ring-2 ring-[#D71920]/30 scale-105' : 'border-[#E5E5E5] hover:border-neutral-400'
                    }`}
                  >
                    <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-3 border-t border-[#E5E5E5] flex justify-end">
              <button
                type="submit"
                disabled={savingProfile || avatarUploading}
                className="px-6 py-2.5 bg-[#D71920] hover:bg-[#B9151B] disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer flex items-center gap-2"
              >
                {savingProfile ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving to Firebase...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Security, Password & System Credentials */}
        <div className="lg:col-span-5 space-y-6">

          {/* Password Change Box */}
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5E5E5]">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="font-black text-sm text-neutral-900">Security & Password</h3>
                <p className="text-[11px] text-neutral-500">অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন করুন</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-neutral-700">
                    New Password (নতুন পাসওয়ার্ড) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-neutral-500 hover:text-neutral-800 flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <div className="relative">
                  <Key size={15} className="absolute left-3.5 top-3.5 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#D1D5DB] rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920]"
                  />
                  {newPassword && (
                    <button
                      type="button"
                      onClick={copyPasswordToClipboard}
                      className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                      title="Copy Password"
                    >
                      {copiedPass ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Confirm Password (পাসওয়ার্ড নিশ্চিত করুন) *
                </label>
                <div className="relative">
                  <Key size={15} className="absolute left-3.5 top-3.5 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড পুনরায় লিখুন"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D1D5DB] rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={generateSecurePassword}
                  className="flex-1 py-2 px-3 bg-[#F8F9FA] hover:bg-neutral-100 text-neutral-700 border border-[#E5E5E5] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Sparkles size={13} className="text-amber-500" />
                  <span>Generate Password</span>
                </button>

                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="flex-1 py-2 px-3 bg-[#D71920] hover:bg-[#B9151B] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  {updatingPassword ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  <span>Update Password</span>
                </button>
              </div>
            </form>

            {/* Email Reset Link Option */}
            {!isStaffSession && (
              <div className="pt-4 border-t border-[#E5E5E5] space-y-2.5">
                <span className="text-[11px] font-bold text-neutral-500 block">Or Send Reset Link to Email:</span>
                <button
                  type="button"
                  disabled={sendingReset || resetEmailSent}
                  onClick={handleSendResetEmail}
                  className="w-full py-2.5 px-3 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border border-[#D1D5DB] rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {sendingReset ? (
                    <div className="w-3.5 h-3.5 border-2 border-neutral-700 border-t-transparent rounded-full animate-spin"></div>
                  ) : resetEmailSent ? (
                    <Check size={14} className="text-emerald-600" />
                  ) : (
                    <Send size={14} className="text-neutral-500" />
                  )}
                  <span>{resetEmailSent ? 'Reset Email Sent!' : 'Send Password Reset Email'}</span>
                </button>
                <p className="text-[10px] text-neutral-400">
                  ইমেইল রিসেট লিংকে ক্লিক করে নতুন পাসওয়ার্ড সরাসরি সেট করতে পারবেন।
                </p>
              </div>
            )}
          </div>

          {/* System & Firebase Connection Status */}
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 shadow-xs space-y-3.5">
            <h4 className="font-black text-xs uppercase tracking-wider text-neutral-400">System & Security</h4>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5E5]">
                <span className="text-neutral-500">Firebase Project:</span>
                <span className="font-mono font-bold text-neutral-900">mr-book-new</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5E5]">
                <span className="text-neutral-500">Database Engine:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Cloud Firestore
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5E5]">
                <span className="text-neutral-500">Account Privilege:</span>
                <span className="font-bold text-[#D71920]">
                  {isStaffSession ? `Staff (${currentStaff?.role})` : 'Root Super Admin'}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
