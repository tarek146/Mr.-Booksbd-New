import React, { useState, useMemo } from 'react';
import { 
  Key, 
  Users, 
  ShieldCheck, 
  Lock, 
  Plus, 
  Search, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Mail, 
  Phone, 
  FileText,
  Sliders,
  Shield,
  UserCheck,
  UserX
} from 'lucide-react';
import { AdminStaffMember, AdminStaffRole } from '../../types';

interface AdminStaffManagementProps {
  staffMembers: AdminStaffMember[];
  onAddStaff: (data: Omit<AdminStaffMember, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  onUpdateStaff: (id: string, data: Partial<AdminStaffMember>) => Promise<void>;
  onDeleteStaff: (id: string) => Promise<void>;
  currentStaffRole: string | null;
  currentUserEmail: string | null;
  setToast: (toast: { show: boolean; type: 'success' | 'error'; message: string }) => void;
}

export const MODULE_PERMISSIONS = [
  { id: 'overview', label: 'Dashboard Analytics', desc: 'দৈনিক ও মাসিক বিক্রি, অর্ডার গ্রাফ ও অ্যানালিটিক্স' },
  { id: 'orders', label: 'Customer Orders', desc: 'কাস্টমার অর্ডার প্রসেসিং ও ডেলিভারি স্ট্যাটাস' },
  { id: 'verifications', label: 'Payment Verifications', desc: 'বিকাশ/নগদ TrxID পেমেন্ট যাচাই ও অনুমোদন' },
  { id: 'payment-methods', label: 'Payment Methods', desc: 'বিকাশ, নগদ, বাংলা কিউআর ও ব্যাংক একাউন্ট কনফিগ' },
  { id: 'products', label: 'Books & Inventory', desc: 'বই ও স্টেশনারি যুক্ত, এডিট ও স্টক ম্যানেজমেন্ট' },
  { id: 'categories', label: 'Categories', desc: 'ক্যাটাগরি তৈরি ও হোমপেজে সাজানো' },
  { id: 'banners', label: 'Hero Banners', desc: 'হোমপেজের স্লাইডার ও ব্যানার ম্যানেজমেন্ট' },
  { id: 'authors', label: 'Writers & Authors', desc: 'লেখক প্রোফাইল ও বায়োগ্রাফি ম্যানেজমেন্ট' },
  { id: 'reels', label: 'Book Video Reels', desc: 'বইয়ের ভিডিও রিলস ও শর্টস আপলোড' },
  { id: 'reviews', label: 'Reviews & Reactions', desc: 'পাঠকদের রিভিউ মডারেশন ও রেটিং' },
  { id: 'subscribers', label: 'VIP Subscribers', desc: 'সাবস্ক্রাইবার ইমেইল ও ফোন তালিকা' },
  { id: 'special-offer', label: 'Special Offer Deals', desc: 'ফ্ল্যাশ সেল ও স্পেশাল অফার কনফিগারেশন' },
  { id: 'settings', label: 'Store Settings', desc: 'দোকানের নাম, ডেলিভারি চার্জ ও জেনারেল সেটিংস' },
  { id: 'staff', label: 'Staff & Roles Access', desc: 'ম্যানেজার ও এমপ্লয়ী একাউন্ট তৈরি ও পাসওয়ার্ড ম্যানেজমেন্ট' }
];

export const MANAGER_PRESET_PERMISSIONS = [
  'overview', 'orders', 'verifications', 'payment-methods', 'products', 
  'categories', 'banners', 'authors', 'reels', 'reviews', 'subscribers', 'special-offer'
];

export const EMPLOYEE_PRESET_PERMISSIONS = [
  'overview', 'orders', 'verifications', 'reviews'
];

export const ALL_PERMISSIONS = MODULE_PERMISSIONS.map(m => m.id);

function generateSecureRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$';
  let pass = '';
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export function AdminStaffManagement({
  staffMembers,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  currentStaffRole,
  currentUserEmail,
  setToast
}: AdminStaffManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'manager' | 'employee' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<AdminStaffMember | null>(null);
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState<AdminStaffMember | null>(null);

  // Add Form state
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [roleInput, setRoleInput] = useState<AdminStaffRole>('manager');
  const [permissionsInput, setPermissionsInput] = useState<string[]>(MANAGER_PRESET_PERMISSIONS);
  const [statusInput, setStatusInput] = useState<'active' | 'disabled'>('active');
  const [phoneInput, setPhoneInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<AdminStaffRole>('manager');
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<'active' | 'disabled'>('active');
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Visible passwords map
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const togglePasswordReveal = (id: string) => {
    setRevealedPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyPasswordToClipboard = (password: string, id: string) => {
    navigator.clipboard.writeText(password);
    setCopiedId(id);
    setToast({ show: true, type: 'success', message: 'পাসওয়ার্ড সফলভাবে কপি হয়েছে!' });
    setTimeout(() => setCopiedId(prev => prev === id ? null : prev), 2000);
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffMembers.filter(member => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        member.name.toLowerCase().includes(q) || 
        member.email.toLowerCase().includes(q) || 
        (member.phone && member.phone.includes(q)) ||
        member.role.toLowerCase().includes(q);

      const matchesRole = roleFilter === 'all' || member.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staffMembers, searchQuery, roleFilter, statusFilter]);

  // Counts
  const managersCount = staffMembers.filter(s => s.role === 'manager').length;
  const employeesCount = staffMembers.filter(s => s.role === 'employee').length;
  const activeCount = staffMembers.filter(s => s.status === 'active').length;

  const handleOpenAddModal = () => {
    setNameInput('');
    setEmailInput('');
    setPasswordInput(generateSecureRandomPassword());
    setRoleInput('manager');
    setPermissionsInput(MANAGER_PRESET_PERMISSIONS);
    setStatusInput('active');
    setPhoneInput('');
    setNotesInput('');
    setFormError('');
    setShowAddModal(true);
  };

  const handleRoleChangeForAdd = (newRole: AdminStaffRole) => {
    setRoleInput(newRole);
    if (newRole === 'manager') {
      setPermissionsInput(MANAGER_PRESET_PERMISSIONS);
    } else if (newRole === 'employee') {
      setPermissionsInput(EMPLOYEE_PRESET_PERMISSIONS);
    } else if (newRole === 'admin') {
      setPermissionsInput(ALL_PERMISSIONS);
    }
  };

  const togglePermissionForAdd = (permId: string) => {
    setPermissionsInput(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleSaveNewStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanName = nameInput.trim();
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanName) {
      setFormError('অনুগ্রহ করে স্টাফের পুরো নাম প্রদান করুন।');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormError('অনুগ্রহ করে একটি সঠিক ইমেইল এড্রেস প্রদান করুন।');
      return;
    }
    if (!cleanPass || cleanPass.length < 4) {
      setFormError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }

    // Check duplicate email
    const exists = staffMembers.some(s => s.email.toLowerCase() === cleanEmail);
    if (exists) {
      setFormError('এই ইমেইলটি দিয়ে ইতোমধ্যে একটি স্টাফ অ্যাকাউন্ট তৈরি রয়েছে। অন্য ইমেইল ব্যবহার করুন।');
      return;
    }

    setSubmitting(true);
    try {
      await onAddStaff({
        name: cleanName,
        email: cleanEmail,
        password: cleanPass,
        role: roleInput,
        permissions: permissionsInput,
        status: statusInput,
        phone: phoneInput.trim() || undefined,
        notes: notesInput.trim() || undefined,
      });

      setToast({ show: true, type: 'success', message: `${cleanName}-কে ${roleInput.toUpperCase()} হিসেবে সফলভাবে যুক্ত করা হয়েছে!` });
      setShowAddModal(false);
    } catch (err: any) {
      setFormError('Error saving to Firebase: ' + (err.message || 'Failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (staff: AdminStaffMember) => {
    setEditingStaff(staff);
    setEditName(staff.name);
    setEditEmail(staff.email);
    setEditPassword(staff.password);
    setEditRole(staff.role);
    setEditPermissions(Array.isArray(staff.permissions) ? staff.permissions : []);
    setEditStatus(staff.status || 'active');
    setEditPhone(staff.phone || '');
    setEditNotes(staff.notes || '');
    setEditError('');
    setShowEditModal(true);
  };

  const togglePermissionForEdit = (permId: string) => {
    setEditPermissions(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleSaveEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setEditError('');

    const cleanName = editName.trim();
    const cleanEmail = editEmail.trim().toLowerCase();
    const cleanPass = editPassword.trim();

    if (!cleanName) {
      setEditError('অনুগ্রহ করে নাম প্রদান করুন।');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setEditError('সঠিক ইমেইল এড্রেস প্রদান করুন।');
      return;
    }
    if (!cleanPass) {
      setEditError('পাসওয়ার্ড খালি রাখা যাবে না।');
      return;
    }

    setEditSubmitting(true);
    try {
      await onUpdateStaff(editingStaff.id, {
        name: cleanName,
        email: cleanEmail,
        password: cleanPass,
        role: editRole,
        permissions: editPermissions,
        status: editStatus,
        phone: editPhone.trim() || undefined,
        notes: editNotes.trim() || undefined,
      });

      setToast({ show: true, type: 'success', message: `${cleanName}-এর তথ্য ও পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে!` });
      setShowEditModal(false);
      setEditingStaff(null);
    } catch (err: any) {
      setEditError('Firebase Update Error: ' + (err.message || 'Failed'));
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleToggleStatus = async (staff: AdminStaffMember) => {
    const newStatus = staff.status === 'active' ? 'disabled' : 'active';
    try {
      await onUpdateStaff(staff.id, { status: newStatus });
      setToast({ 
        show: true, 
        type: 'success', 
        message: `${staff.name}-এর স্ট্যাটাস ${newStatus === 'active' ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Disabled)'} করা হয়েছে।` 
      });
    } catch (err: any) {
      setToast({ show: true, type: 'error', message: 'Failed to update status: ' + err.message });
    }
  };

  const handleDeleteStaffConfirm = async () => {
    if (!deleteConfirmStaff) return;
    try {
      await onDeleteStaff(deleteConfirmStaff.id);
      setToast({ show: true, type: 'success', message: `${deleteConfirmStaff.name}-এর এক্সেস সফলভাবে মুছে ফেলা হয়েছে!` });
      setDeleteConfirmStaff(null);
    } catch (err: any) {
      setToast({ show: true, type: 'error', message: 'Failed to delete staff: ' + err.message });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HEADER BANNER CARD */}
      <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D71920] to-[#B9151B] text-white flex items-center justify-center shadow-md shadow-[#D71920]/25 shrink-0">
            <Key size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-black text-neutral-900 tracking-tight">
                Staff & Roles Access Management
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Firestore Live Protected</span>
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              ম্যানেজার (Manager), এমপ্লয়ী (Employee) ও কাস্টম রোলকে ইমেইল ও পাসওয়ার্ড দিয়ে অ্যাডমিন এক্সেস দিন এবং পাসওয়ার্ড পরিবর্তন করুন।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenAddModal}
            data-testid="add-new-staff-btn"
            className="px-4 py-2.5 bg-[#D71920] hover:bg-[#B9151B] active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md shadow-[#D71920]/25 cursor-pointer transition-all shrink-0"
          >
            <Plus size={15} />
            <span>নতুন স্টাফ যুক্ত করুন (Add Staff)</span>
          </button>
        </div>
      </div>

      {/* 2. FOUR SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Staff Accounts */}
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-neutral-500 tracking-wider block">Total Staff Accounts</span>
              <div className="text-2xl font-black text-neutral-900 mt-1">{staffMembers.length}</div>
              <div className="text-xs font-bold text-emerald-600 mt-1">{activeCount} Active Accounts</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
              <Users size={20} />
            </div>
          </div>
        </div>

        {/* Active Managers */}
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-neutral-500 tracking-wider block">Managers (ম্যানেজার)</span>
              <div className="text-2xl font-black text-purple-700 mt-1">{managersCount}</div>
              <div className="text-xs font-bold text-purple-600 mt-1">Full Operations Access</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
              <ShieldCheck size={20} />
            </div>
          </div>
        </div>

        {/* Active Employees */}
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-neutral-500 tracking-wider block">Employees (এমপ্লয়ী)</span>
              <div className="text-2xl font-black text-amber-700 mt-1">{employeesCount}</div>
              <div className="text-xs font-bold text-amber-600 mt-1">Order Processing Staff</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <UserCheck size={20} />
            </div>
          </div>
        </div>

        {/* Security & Access Protection */}
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-neutral-500 tracking-wider block">Access Control Engine</span>
              <div className="text-lg font-black text-emerald-700 mt-1">Cloud Firestore</div>
              <div className="text-xs font-bold text-neutral-500 mt-1">Role-Based Permissions</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Lock size={20} />
            </div>
          </div>
        </div>

      </div>

      {/* 3. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white border border-[#E5E5E5] rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="স্টাফের নাম, ইমেইল বা ফোন দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#E5E5E5] bg-[#F7F7F8] text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: `সকল স্টাফ (${staffMembers.length})` },
              { id: 'manager', label: `ম্যানেজার (${managersCount})` },
              { id: 'employee', label: `এমপ্লয়ী (${employeesCount})` },
              { id: 'admin', label: 'অ্যাডমিন' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === tab.id
                    ? 'bg-[#D71920] text-white shadow-xs'
                    : 'bg-[#F7F7F8] text-neutral-700 hover:bg-neutral-200 border border-[#E5E5E5]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. STAFF LIST TABLE & CARDS */}
      <div className="bg-white border border-[#E5E5E5] rounded-3xl shadow-xs overflow-hidden">
        {filteredStaff.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users size={32} />
            </div>
            <div>
              <h3 className="text-base font-black text-neutral-900">কোনো স্টাফ অ্যাকাউন্ট পাওয়া যায়নি</h3>
              <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
                {searchQuery || roleFilter !== 'all' 
                  ? 'আপনার ফিল্টারের সাথে মিল রেখে কোনো রেকর্ড পাওয়া যায়নি।'
                  : 'আপনি এখনো কোনো ম্যানেজার বা এমপ্লয়ী একাউন্ট তৈরি করেননি। উপরের বাটন থেকে প্রথম স্টাফ একাউন্ট তৈরি করুন।'}
              </p>
            </div>
            {(!searchQuery && roleFilter === 'all') && (
              <button
                onClick={handleOpenAddModal}
                className="px-5 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-2 shadow-sm"
              >
                <Plus size={15} />
                <span>প্রথম স্টাফ অ্যাকাউন্ট তৈরি করুন</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[#E5E5E5] text-[11px] font-black uppercase text-neutral-500 tracking-wider">
                  <th className="py-3.5 px-4">Staff Member (স্টাফ)</th>
                  <th className="py-3.5 px-4">Role (ভূমিকা)</th>
                  <th className="py-3.5 px-4">Password (পাসওয়ার্ড)</th>
                  <th className="py-3.5 px-4">Allowed Modules (এক্সেস)</th>
                  <th className="py-3.5 px-4">Status (স্ট্যাটাস)</th>
                  <th className="py-3.5 px-4 text-right">Actions (পদক্ষেপ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEEEE]">
                {filteredStaff.map(staff => {
                  const isRevealed = Boolean(revealedPasswords[staff.id]);
                  const isCopied = copiedId === staff.id;
                  const isManager = staff.role === 'manager';
                  const isEmployee = staff.role === 'employee';
                  const isAdminRole = staff.role === 'admin';

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Member Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 shadow-2xs ${
                            isManager ? 'bg-purple-100 text-purple-700' :
                            isEmployee ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {(staff.name[0] || 'S').toUpperCase()}
                          </div>
                          <div>
                            <div className="font-black text-sm text-neutral-900 flex items-center gap-1.5">
                              <span>{staff.name}</span>
                              {staff.email === currentUserEmail && (
                                <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-neutral-500 flex items-center gap-1 mt-0.5">
                              <Mail size={11} className="text-neutral-400" />
                              <span>{staff.email}</span>
                            </div>
                            {staff.phone && (
                              <div className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                                <Phone size={10} />
                                <span>{staff.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border shadow-2xs ${
                          isManager ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          isEmployee ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          <Shield size={12} />
                          <span>{staff.role}</span>
                        </span>
                      </td>

                      {/* Password Management */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-xs font-bold bg-[#F7F7F8] border border-[#E5E5E5] px-2.5 py-1 rounded-lg text-neutral-800 tracking-wider">
                            {isRevealed ? staff.password : '••••••••'}
                          </div>
                          <button
                            type="button"
                            onClick={() => togglePasswordReveal(staff.id)}
                            title={isRevealed ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                            className="p-1.5 text-neutral-400 hover:text-neutral-800 bg-[#F7F7F8] hover:bg-neutral-200 rounded-lg cursor-pointer transition-colors"
                          >
                            {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyPasswordToClipboard(staff.password, staff.id)}
                            title="পাসওয়ার্ড কপি করুন"
                            className="p-1.5 text-neutral-400 hover:text-neutral-800 bg-[#F7F7F8] hover:bg-neutral-200 rounded-lg cursor-pointer transition-colors"
                          >
                            {isCopied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </td>

                      {/* Permissions Chips */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {Array.isArray(staff.permissions) && staff.permissions.length > 0 ? (
                            staff.permissions.slice(0, 4).map(perm => (
                              <span key={perm} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                                {perm}
                              </span>
                            ))
                          ) : (
                            <span className="text-neutral-400 text-[11px] italic">No permissions</span>
                          )}
                          {staff.permissions && staff.permissions.length > 4 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-neutral-200 text-neutral-700 text-[10px] font-bold">
                              +{staff.permissions.length - 4} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(staff)}
                          title="ক্লিক করে স্ট্যাটাস পরিবর্তন করুন"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                            staff.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${staff.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`}></span>
                          <span>{staff.status === 'active' ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(staff)}
                            data-testid={`edit-staff-btn-${staff.id}`}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Edit3 size={13} />
                            <span>Edit / পাসওয়ার্ড</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmStaff(staff)}
                            data-testid={`delete-staff-btn-${staff.id}`}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-[#D71920] rounded-xl cursor-pointer transition-colors"
                            title="অ্যাকাউন্ট রিমুভ করুন"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. ADD NEW STAFF MODAL */}
      {showAddModal && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
          onClick={e => e.target === e.currentTarget && setShowAddModal(false)}
        >
          <div className="w-full max-w-xl bg-white rounded-3xl border border-neutral-200 p-6 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto admin-modal-card">
            
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D71920] text-white flex items-center justify-center shadow-xs">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-900">Add New Staff Member</h3>
                  <p className="text-xs text-neutral-500">নতুন ম্যানেজার বা এমপ্লয়ী একাউন্ট তৈরি করুন</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-neutral-600 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewStaff} className="space-y-4 text-xs">
              
              {/* Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    Full Name (স্টাফের পুরো নাম) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kamal Hossain"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white font-bold text-neutral-900 focus:outline-none focus:border-[#D71920]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    Login Email (লগইন ইমেইল) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="manager@mrbooks.com"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </div>

              {/* Password & Generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-neutral-800">
                    Login Password (লগইন পাসওয়ার্ড) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setPasswordInput(generateSecureRandomPassword())}
                    className="text-[11px] font-bold text-[#D71920] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={11} />
                    <span>Generate Strong Password</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Secret password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#D71920]"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  স্টাফ এই পাসওয়ার্ড ব্যবহার করে অ্যাডমিন পোর্টালে লগইন করতে পারবেন। আপনি পরবর্তীতে যেকোনো সময় পরিবর্তন করতে পারবেন।
                </p>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block font-bold text-neutral-800 mb-1.5">
                  Assigned Role (নির্ধারিত ভূমিকা) *
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'manager', label: 'Manager (ম্যানেজার)', desc: 'Full store operations' },
                    { id: 'employee', label: 'Employee (এমপ্লয়ী)', desc: 'Order & review staff' },
                    { id: 'admin', label: 'Admin (অ্যাডমিন)', desc: 'Full system control' }
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleRoleChangeForAdd(r.id as any)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        roleInput === r.id
                          ? 'border-[#D71920] bg-red-50/60 shadow-2xs'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <div className="font-black text-xs text-neutral-900">{r.label}</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions Checkbox Grid */}
              <div className="space-y-2 pt-1 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-800">
                    Accessible Tabs & Permissions (কোন কোন পেজের এক্সেস থাকবে):
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPermissionsInput(ALL_PERMISSIONS)}
                      className="text-[#D71920] hover:underline cursor-pointer font-bold"
                    >
                      Select All
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setPermissionsInput([])}
                      className="text-neutral-500 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#F8F9FA] p-3 rounded-2xl border border-neutral-200 max-h-48 overflow-y-auto">
                  {MODULE_PERMISSIONS.map(perm => {
                    const isChecked = permissionsInput.includes(perm.id);
                    return (
                      <label 
                        key={perm.id} 
                        className={`flex items-start gap-2.5 p-2 rounded-xl border transition-colors cursor-pointer ${
                          isChecked ? 'bg-white border-[#D71920]/40 shadow-2xs' : 'border-transparent hover:bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermissionForAdd(perm.id)}
                          className="mt-0.5 accent-[#D71920] cursor-pointer rounded"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-neutral-900 leading-tight">{perm.label}</div>
                          <div className="text-[10px] text-neutral-500 leading-tight truncate">{perm.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Phone & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    Phone Number (ঐচ্ছিক)
                  </label>
                  <input
                    type="tel"
                    placeholder="017XXXXXXXX"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    Account Status
                  </label>
                  <select
                    value={statusInput}
                    onChange={e => setStatusInput(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white font-bold text-neutral-900"
                  >
                    <option value="active">Active (সক্রিয় - লগইন করতে পারবে)</option>
                    <option value="disabled">Disabled (নিষ্ক্রিয় - এক্সেস বন্ধ থাকবে)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-100 cursor-pointer"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#D71920] hover:bg-[#B9151B] text-white font-black cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? 'সংরক্ষণ হচ্ছে...' : 'Create Staff Access'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 6. EDIT STAFF & CHANGE PASSWORD MODAL */}
      {showEditModal && editingStaff && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
          onClick={e => e.target === e.currentTarget && setShowEditModal(false)}
        >
          <div className="w-full max-w-xl bg-white rounded-3xl border border-neutral-200 p-6 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto admin-modal-card">
            
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D71920] text-white flex items-center justify-center shadow-xs">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-900">Edit Staff & Change Password</h3>
                  <p className="text-xs text-neutral-500">পাসওয়ার্ড পরিবর্তন ও রোল এক্সেস আপডেট করুন</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-neutral-600 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-red-600" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditStaff} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    Staff Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white font-bold text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    Login Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white font-mono font-bold text-neutral-900"
                  />
                </div>
              </div>

              {/* Password Change Field */}
              <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-black text-amber-950">
                    Change Password (পাসওয়ার্ড পরিবর্তন করুন) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditPassword(generateSecureRandomPassword())}
                    className="text-[11px] font-bold text-[#D71920] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={11} />
                    <span>Generate New Password</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="New password"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#D71920]"
                />
                <p className="text-[10.5px] text-amber-900 font-medium">
                  নতুন পাসওয়ার্ড লিখে সেভ করলেই স্টাফ মেম্বার নতুন পাসওয়ার্ড দিয়ে তৎক্ষণাৎ লগইন করতে পারবেন।
                </p>
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    Role (ভূমিকা)
                  </label>
                  <select
                    value={editRole}
                    onChange={e => {
                      const r = e.target.value as AdminStaffRole;
                      setEditRole(r);
                      if (r === 'manager') setEditPermissions(MANAGER_PRESET_PERMISSIONS);
                      if (r === 'employee') setEditPermissions(EMPLOYEE_PRESET_PERMISSIONS);
                      if (r === 'admin') setEditPermissions(ALL_PERMISSIONS);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white font-bold text-neutral-900"
                  >
                    <option value="manager">Manager (ম্যানেজার)</option>
                    <option value="employee">Employee (এমপ্লয়ী)</option>
                    <option value="admin">Admin (অ্যাডমিন)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    Status (স্ট্যাটাস)
                  </label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white font-bold text-neutral-900"
                  >
                    <option value="active">Active (সক্রিয়)</option>
                    <option value="disabled">Disabled (নিষ্ক্রিয়)</option>
                  </select>
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-2 pt-1 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-800">
                    Accessible Modules (অনুমোদিত পেজসমূহ):
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setEditPermissions(ALL_PERMISSIONS)}
                      className="text-[#D71920] hover:underline cursor-pointer font-bold"
                    >
                      Select All
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setEditPermissions([])}
                      className="text-neutral-500 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#F8F9FA] p-3 rounded-2xl border border-neutral-200 max-h-48 overflow-y-auto">
                  {MODULE_PERMISSIONS.map(perm => {
                    const isChecked = editPermissions.includes(perm.id);
                    return (
                      <label 
                        key={perm.id} 
                        className={`flex items-start gap-2.5 p-2 rounded-xl border transition-colors cursor-pointer ${
                          isChecked ? 'bg-white border-[#D71920]/40 shadow-2xs' : 'border-transparent hover:bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermissionForEdit(perm.id)}
                          className="mt-0.5 accent-[#D71920] cursor-pointer rounded"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-neutral-900 leading-tight">{perm.label}</div>
                          <div className="text-[10px] text-neutral-500 leading-tight truncate">{perm.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-100 cursor-pointer"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#D71920] hover:bg-[#B9151B] text-white font-black cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {editSubmitting ? 'আপডেট হচ্ছে...' : 'Save & Update Password'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 7. DELETE STAFF CONFIRMATION MODAL */}
      {deleteConfirmStaff && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={e => e.target === e.currentTarget && setDeleteConfirmStaff(null)}
        >
          <div className="w-full max-w-md bg-white rounded-3xl border border-neutral-200 p-6 shadow-2xl space-y-4 admin-modal-card">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#D71920] flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-neutral-900">
                স্টাফ অ্যাকাউন্ট রিমুভ নিশ্চিতকরণ
              </h3>
              <p className="text-xs text-neutral-500">
                আপনি কি নিশ্চিতভাবে <strong className="text-neutral-900">{deleteConfirmStaff.name}</strong> ({deleteConfirmStaff.email})-এর এক্সেস মুছে ফেলতে চান? মুছে ফেললে তিনি আর অ্যাডমিন পোর্টালে লগইন করতে পারবেন না।
              </p>
            </div>
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmStaff(null)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-100 cursor-pointer text-xs"
              >
                না, রাখুন
              </button>
              <button
                type="button"
                onClick={handleDeleteStaffConfirm}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black cursor-pointer shadow-sm text-xs"
              >
                হ্যাঁ, এক্সেস রিমুভ করুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
