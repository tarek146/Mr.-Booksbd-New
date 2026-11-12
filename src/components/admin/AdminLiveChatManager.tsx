import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CustomerChatSegment, LiveChatSession, Order } from '../../types';
import {
  MessageCircle,
  Send,
  CheckCircle2,
  Trash2,
  Phone,
  Mail,
  Clock,
  Volume2,
  VolumeX,
  BellRing,
  Search,
  X,
  ShoppingBag,
  StickyNote,
  Copy,
  Check,
  ArrowLeft,
  Sparkles,
  Filter,
  Tag,
} from 'lucide-react';
import {
  playOutgoingChatChime,
  playAdminIncomingRingtone,
  unlockChatAudioContext,
  CUSTOMER_SEGMENT_META,
  DEFAULT_LIVE_CHAT_QUICK_REPLIES,
  filterAndOrganizeChatSessions,
  InboxStatusFilter,
  InboxBuyerFilter,
} from '../../utils/chatSoundAndValidation';

interface AdminLiveChatManagerProps {
  sessions: LiveChatSession[];
  orders?: Order[];
  quickReplies?: string[];
  onReply: (chatId: string, text: string) => Promise<void>;
  onUpdateStatus: (chatId: string, status: 'open' | 'resolved') => Promise<void>;
  onUpdateMeta: (
    chatId: string,
    data: { customerSegment?: CustomerChatSegment; adminNote?: string }
  ) => Promise<void>;
  onMarkRead: (chatId: string) => Promise<void>;
  onDeleteSession: (chatId: string) => Promise<void>;
  soundEnabled: boolean;
  isSoundMuted: boolean;
  onToggleSoundMute: () => void;
  setToast: (t: { show: boolean; type: 'success' | 'error'; message: string }) => void;
}

const SEGMENT_KEYS: CustomerChatSegment[] = [
  'vip',
  'order_issue',
  'payment_return',
  'follow_up',
  'general',
];

function getInitials(name: string): string {
  const parts = (name || 'Customer').trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AdminLiveChatManager({
  sessions,
  orders = [],
  quickReplies,
  onReply,
  onUpdateStatus,
  onUpdateMeta,
  onMarkRead,
  onDeleteSession,
  soundEnabled,
  isSoundMuted,
  onToggleSoundMute,
  setToast,
}: AdminLiveChatManagerProps) {
  const [selectedId, setSelectedId] = useState<string>(sessions[0]?.id || '');
  const [mobileShowThread, setMobileShowThread] = useState<boolean>(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  // Customer separation & search filters
  const [statusFilter, setStatusFilter] = useState<InboxStatusFilter>('all');
  const [segmentFilter, setSegmentFilter] = useState<'all' | CustomerChatSegment>('all');
  const [buyerFilter, setBuyerFilter] = useState<InboxBuyerFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Customer note & utilities state
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const effectiveQuickReplies = useMemo(() => {
    const cleaned = (quickReplies || []).map(q => q.trim()).filter(Boolean);
    return cleaned.length > 0 ? cleaned : DEFAULT_LIVE_CHAT_QUICK_REPLIES;
  }, [quickReplies]);

  // Pre-compute overall stats and organized filtered list
  const allOrganized = useMemo(
    () => filterAndOrganizeChatSessions(sessions, orders, {}),
    [sessions, orders]
  );

  const filteredOrganized = useMemo(
    () =>
      filterAndOrganizeChatSessions(sessions, orders, {
        statusFilter,
        segmentFilter,
        buyerFilter,
        searchQuery,
      }),
    [sessions, orders, statusFilter, segmentFilter, buyerFilter, searchQuery]
  );

  const statusCounts = useMemo(() => {
    const unread = sessions.filter(s => (s.unreadByAdmin || 0) > 0).length;
    const open = sessions.filter(s => s.status === 'open').length;
    const resolved = sessions.filter(s => s.status === 'resolved').length;
    const returning = allOrganized.filter(item => item.orderMatch.isReturningBuyer).length;
    return {
      total: sessions.length,
      unread,
      open,
      resolved,
      returning,
      newVisitors: Math.max(0, sessions.length - returning),
    };
  }, [sessions, allOrganized]);

  const segmentCounts = useMemo(() => {
    const counts: Record<CustomerChatSegment, number> = {
      general: 0,
      vip: 0,
      order_issue: 0,
      payment_return: 0,
      follow_up: 0,
    };
    for (const item of allOrganized) {
      counts[item.segment] = (counts[item.segment] || 0) + 1;
    }
    return counts;
  }, [allOrganized]);

  // Keep selectedId synchronized when threads appear, update, or get filtered
  useEffect(() => {
    if (filteredOrganized.length === 0) return;
    if (!selectedId || !filteredOrganized.some(item => item.session.id === selectedId)) {
      setSelectedId(filteredOrganized[0].session.id);
    }
  }, [filteredOrganized, selectedId]);

  const activeOrganized =
    filteredOrganized.find(item => item.session.id === selectedId) ||
    allOrganized.find(item => item.session.id === selectedId) ||
    filteredOrganized[0] ||
    null;

  const activeSession = activeOrganized?.session || null;

  // Sync admin note draft when switching conversations
  useEffect(() => {
    setIsEditingNote(false);
    setConfirmDeleteId(null);
    setNoteDraft(activeSession?.adminNote || '');
  }, [activeSession?.id]);

  // Auto mark customer messages read when admin views an unread thread
  useEffect(() => {
    if (activeSession && (activeSession.unreadByAdmin || 0) > 0) {
      void onMarkRead(activeSession.id);
    }
  }, [activeSession?.id, activeSession?.unreadByAdmin]);

  // Smooth auto-scroll when messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages?.length, activeSession?.id]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    unlockChatAudioContext();
    const text = replyText.trim();
    if (!activeSession || !text || sending) return;
    setReplyText('');
    setSending(true);
    try {
      if (soundEnabled && !isSoundMuted) {
        playOutgoingChatChime();
      }
      await onReply(activeSession.id, text);
    } catch {
      setReplyText(text);
      setToast({
        show: true,
        type: 'error',
        message: 'রিপ্লাই পাঠাতে সমস্যা হয়েছে। Firebase Rules বা সংযোগ পরীক্ষা করুন।',
      });
    } finally {
      setSending(false);
    }
  };

  const handleSegmentChange = async (segment: CustomerChatSegment) => {
    if (!activeSession) return;
    try {
      await onUpdateMeta(activeSession.id, { customerSegment: segment });
      setToast({
        show: true,
        type: 'success',
        message: `${activeSession.customerName}-কে "${CUSTOMER_SEGMENT_META[segment].shortLabel}" গ্রুপে আলাদা করা হয়েছে।`,
      });
    } catch {
      setToast({
        show: true,
        type: 'error',
        message: 'কাস্টমার ক্যাটাগরি আপডেট করা যায়নি।',
      });
    }
  };

  const handleSaveAdminNote = async () => {
    if (!activeSession) return;
    setSavingNote(true);
    try {
      await onUpdateMeta(activeSession.id, { adminNote: noteDraft.trim() });
      setIsEditingNote(false);
      setToast({
        show: true,
        type: 'success',
        message: 'কাস্টমার নোট Firebase-এ সংরক্ষিত হয়েছে।',
      });
    } catch {
      setToast({
        show: true,
        type: 'error',
        message: 'নোট সেভ করা যায়নি।',
      });
    } finally {
      setSavingNote(false);
    }
  };

  const handleCopyPhone = (phone: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(phone).catch(() => {});
    }
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 1600);
  };

  const handleConfirmDelete = async (chatId: string) => {
    try {
      await onDeleteSession(chatId);
      setConfirmDeleteId(null);
      setMobileShowThread(false);
      setToast({
        show: true,
        type: 'success',
        message: 'চ্যাট থ্রেডটি মুছে ফেলা হয়েছে।',
      });
    } catch {
      setToast({
        show: true,
        type: 'error',
        message: 'চ্যাট থ্রেড মুছে ফেলা যায়নি।',
      });
    }
  };

  const unreadTotal = sessions.reduce((sum, s) => sum + (s.unreadByAdmin || 0), 0);

  return (
    <div className="space-y-4">
      {/* Top Command Header & KPI Filter Pills */}
      <div className="bg-white rounded-3xl border border-neutral-200/90 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FFF1F2] to-rose-100 text-[#D71920] border border-[#D71920]/20 flex items-center justify-center shrink-0">
              <MessageCircle size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-neutral-900">
                  Customer Live Chat Inbox
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
                {unreadTotal > 0 && (
                  <span
                    data-testid="admin-unread-total-badge"
                    className="px-2 py-0.5 rounded-full bg-[#D71920] text-white text-[11px] font-black"
                  >
                    {unreadTotal} Unread
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                কাস্টমার আলাদা করে দেখুন (VIP / অর্ডার / রিটার্ন / নতুন ক্রেতা), রিয়েল-টাইম মেসেজ ও রিংটোন অ্যালার্ট পান।
              </p>
            </div>
          </div>

          {/* Sound Controls */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => {
                unlockChatAudioContext();
                onToggleSoundMute();
              }}
              data-testid="admin-chat-sound-toggle"
              className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-colors ${
                soundEnabled && !isSoundMuted
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200'
              }`}
            >
              {soundEnabled && !isSoundMuted ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span>{soundEnabled && !isSoundMuted ? 'Ringtone On' : 'Muted'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                unlockChatAudioContext();
                playAdminIncomingRingtone();
              }}
              data-testid="admin-test-ringtone-btn"
              className="px-3 py-2 rounded-xl text-xs font-bold border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 flex items-center gap-1.5 cursor-pointer"
              title="টেস্ট রিংটোন বাজিয়ে শুনুন"
            >
              <BellRing size={13} className="text-[#D71920]" />
              <span>Test Ringtone</span>
            </button>
          </div>
        </div>

        {/* Status Quick-Tabs + Buyer Separation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-neutral-100">
          <div className="flex items-center gap-1.5 flex-wrap" role="tablist" aria-label="Chat Status Filter">
            {(
              [
                { id: 'all', label: 'সব চ্যাট', count: statusCounts.total },
                { id: 'unread', label: 'অপঠিত', count: statusCounts.unread },
                { id: 'open', label: 'চলমান', count: statusCounts.open },
                { id: 'resolved', label: 'সমাধানকৃত', count: statusCounts.resolved },
              ] as const
            ).map(tab => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`inbox-status-tab-${tab.id}`}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    active
                      ? 'bg-[#D71920] text-white border-[#D71920] shadow-xs'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      active
                        ? 'bg-white/20 text-white'
                        : tab.id === 'unread' && tab.count > 0
                        ? 'bg-[#D71920] text-white'
                        : 'bg-neutral-200/80 text-neutral-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Buyer Separation Toggle */}
          <div className="flex items-center gap-1.5 bg-neutral-100/90 p-1 rounded-xl border border-neutral-200/70">
            {(
              [
                { id: 'all', label: 'All Visitors' },
                { id: 'returning', label: `আগের ক্রেতা (${statusCounts.returning})` },
                { id: 'new', label: `নতুন (${statusCounts.newVisitors})` },
              ] as const
            ).map(b => (
              <button
                key={b.id}
                type="button"
                data-testid={`inbox-buyer-filter-${b.id}`}
                onClick={() => setBuyerFilter(b.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  buyerFilter === b.id
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200 p-12 text-center space-y-2.5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-400">
            <MessageCircle size={28} />
          </div>
          <h3 className="font-bold text-base text-neutral-800">এখনো কোনো লাইভ চ্যাট মেসেজ আসেনি</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            কাস্টমার ওয়েবসাইটের ডান-নিচের &quot;Live Chat&quot; বাটনে ক্লিক করে নাম, ফোন, ইমেইল ও মেসেজ পাঠালে এখানে রিয়েল-টাইম রিংটোনসহ স্বয়ংক্রিয়ভাবে চলে আসবে।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Left: Organized & Filterable Customer Conversations (4 cols) */}
          <div
            className={`lg:col-span-4 bg-white rounded-3xl border border-neutral-200/90 overflow-hidden shadow-xs flex flex-col h-[640px] ${
              mobileShowThread ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Search & Segment Pills */}
            <div className="p-3 border-b border-neutral-100 bg-neutral-50/70 space-y-2.5 shrink-0">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  data-testid="admin-chat-search-input"
                  placeholder="নাম, ফোন, ইমেইল বা মেসেজ খুঁজুন..."
                  className="w-full pl-8 pr-8 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-800 focus:outline-none focus:border-[#D71920]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Segment Separation Pills */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] font-bold text-neutral-400 flex items-center gap-0.5 mr-0.5">
                  <Filter size={10} /> গ্রুপ:
                </span>
                <button
                  type="button"
                  onClick={() => setSegmentFilter('all')}
                  data-testid="inbox-segment-filter-all"
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    segmentFilter === 'all'
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  সব ({sessions.length})
                </button>
                {SEGMENT_KEYS.map(seg => {
                  const meta = CUSTOMER_SEGMENT_META[seg];
                  const active = segmentFilter === seg;
                  return (
                    <button
                      key={seg}
                      type="button"
                      data-testid={`inbox-segment-filter-${seg}`}
                      onClick={() => setSegmentFilter(seg)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#D71920] text-white border-[#D71920]'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      {meta.shortLabel} ({segmentCounts[seg]})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversation List Header Count */}
            <div className="px-3.5 py-2 border-b border-neutral-100 flex items-center justify-between text-[10.5px] font-black uppercase tracking-wider text-neutral-500 bg-white shrink-0">
              <span>কাস্টমার তালিকা ({filteredOrganized.length})</span>
              {(statusFilter !== 'all' || segmentFilter !== 'all' || buyerFilter !== 'all' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('all');
                    setSegmentFilter('all');
                    setBuyerFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-[#D71920] hover:underline font-bold normal-case cursor-pointer"
                >
                  ফিল্টার রিসেট
                </button>
              )}
            </div>

            {/* Thread List */}
            <div className="divide-y divide-neutral-100 overflow-y-auto flex-1">
              {filteredOrganized.length === 0 ? (
                <div className="p-8 text-center space-y-2 text-neutral-500">
                  <Search size={24} className="mx-auto text-neutral-300" />
                  <p className="text-xs font-bold text-neutral-700">এই ফিল্টারে কোনো কাস্টমার পাওয়া যায়নি</p>
                  <p className="text-[11px]">ফিল্টার বা সার্চ পরিবর্তন করে দেখুন।</p>
                </div>
              ) : (
                filteredOrganized.map(({ session, segment, orderMatch, latestText, latestSender }) => {
                  const isSelected = activeSession?.id === session.id;
                  const segMeta = CUSTOMER_SEGMENT_META[segment];
                  const hasUnread = (session.unreadByAdmin || 0) > 0;

                  return (
                    <button
                      key={session.id}
                      type="button"
                      data-testid={`inbox-thread-${session.id}`}
                      onClick={() => {
                        setSelectedId(session.id);
                        setMobileShowThread(true);
                      }}
                      className={`w-full text-left p-3.5 transition-colors cursor-pointer flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-[#FFF1F2]/85 border-l-4 border-[#D71920]'
                          : hasUnread
                          ? 'bg-amber-50/40 hover:bg-amber-50/70'
                          : 'hover:bg-neutral-50'
                      }`}
                    >
                      {/* Avatar Initials */}
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 ${
                          hasUnread
                            ? 'bg-[#D71920] text-white shadow-xs'
                            : isSelected
                            ? 'bg-neutral-900 text-white'
                            : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                        }`}
                      >
                        {getInitials(session.customerName)}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        {/* Name + Time + Unread */}
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-bold text-xs text-neutral-900 truncate">
                            {session.customerName}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {hasUnread && (
                              <span className="px-1.5 py-0.5 rounded-full bg-[#D71920] text-white text-[9px] font-black">
                                {session.unreadByAdmin}
                              </span>
                            )}
                            <span className="text-[9.5px] font-medium text-neutral-400">
                              {new Date(session.lastMessageAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Phone & Email */}
                        {(session.customerPhone || session.customerEmail) && (
                          <div className="text-[10px] text-neutral-500 flex items-center gap-1.5 truncate">
                            {session.customerPhone && (
                              <span className="font-semibold text-neutral-600">{session.customerPhone}</span>
                            )}
                            {session.customerEmail && (
                              <span className="truncate">• {session.customerEmail}</span>
                            )}
                          </div>
                        )}

                        {/* Customer Separation Pills */}
                        <div className="flex items-center gap-1 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${segMeta.badgeClass}`}
                          >
                            {segMeta.shortLabel}
                          </span>
                          {orderMatch.isReturningBuyer ? (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {orderMatch.orderCount} Order{orderMatch.orderCount > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-neutral-100 text-neutral-500 border border-neutral-200">
                              New
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                              session.status === 'resolved'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {session.status}
                          </span>
                        </div>

                        {/* Actual Latest Message Snippet */}
                        {latestText && (
                          <p
                            className={`text-[11px] truncate ${
                              hasUnread ? 'font-bold text-neutral-900' : 'text-neutral-600'
                            }`}
                          >
                            {latestSender === 'admin' ? 'You: ' : ''}
                            {latestText}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Active Customer Conversation & Profile Details (8 cols) */}
          <div
            className={`lg:col-span-8 bg-white rounded-3xl border border-neutral-200/90 shadow-xs flex flex-col h-[640px] overflow-hidden ${
              mobileShowThread ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {activeSession && activeOrganized ? (
              <>
                {/* Customer Profile & Separation Header */}
                <div className="p-3.5 sm:p-4 border-b border-neutral-100 bg-neutral-50/80 space-y-2.5 shrink-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => setMobileShowThread(false)}
                        className="lg:hidden p-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 shrink-0 cursor-pointer"
                        aria-label="Back to customer list"
                      >
                        <ArrowLeft size={14} />
                      </button>

                      <div className="w-10 h-10 rounded-2xl bg-[#D71920] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {getInitials(activeSession.customerName)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-sm sm:text-base text-neutral-900 truncate">
                            {activeSession.customerName}
                          </h3>

                          {activeOrganized.orderMatch.isReturningBuyer && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              <ShoppingBag size={10} />
                              {activeOrganized.orderMatch.orderCount} Orders • ৳
                              {activeOrganized.orderMatch.totalSpent.toLocaleString()}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {activeSession.customerPhone && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-700 bg-white px-2 py-0.5 rounded-lg border border-neutral-200">
                              <Phone size={10} className="text-[#D71920]" />
                              <a
                                href={`tel:${activeSession.customerPhone.replace(/\s+/g, '')}`}
                                className="hover:underline"
                              >
                                {activeSession.customerPhone}
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopyPhone(activeSession.customerPhone || '')}
                                className="ml-0.5 text-neutral-400 hover:text-[#D71920] cursor-pointer"
                                title="নম্বর কপি করুন"
                                aria-label="Copy phone number"
                              >
                                {copiedPhone ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                              </button>
                            </span>
                          )}

                          {activeSession.customerEmail && (
                            <a
                              href={`mailto:${activeSession.customerEmail}`}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-700 bg-white px-2 py-0.5 rounded-lg border border-neutral-200 hover:border-[#D71920]"
                            >
                              <Mail size={10} className="text-[#D71920]" /> {activeSession.customerEmail}
                            </a>
                          )}

                          <span className="text-[10.5px] text-neutral-500 flex items-center gap-1">
                            <Clock size={10} /> {new Date(activeSession.lastMessageAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Group Selector + Status + Guarded Delete */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="inline-flex items-center gap-1 bg-white border border-neutral-200 rounded-xl px-2 py-1.5 text-[11px] font-bold text-neutral-700">
                        <Tag size={11} className="text-[#D71920]" />
                        <select
                          value={activeOrganized.segment}
                          data-testid="active-customer-segment-select"
                          onChange={e =>
                            void handleSegmentChange(e.target.value as CustomerChatSegment)
                          }
                          className="bg-transparent focus:outline-none cursor-pointer font-bold text-neutral-800"
                          aria-label="Customer Segment Label"
                        >
                          {SEGMENT_KEYS.map(seg => (
                            <option key={seg} value={seg}>
                              {CUSTOMER_SEGMENT_META[seg].shortLabel}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          void onUpdateStatus(
                            activeSession.id,
                            activeSession.status === 'resolved' ? 'open' : 'resolved'
                          )
                        }
                        data-testid="active-chat-status-btn"
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer border transition-colors ${
                          activeSession.status === 'resolved'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                        }`}
                      >
                        <CheckCircle2 size={13} />
                        <span>{activeSession.status === 'resolved' ? 'Re-open' : 'Mark Resolved'}</span>
                      </button>

                      {confirmDeleteId === activeSession.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => void handleConfirmDelete(activeSession.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-red-600 text-white text-[11px] font-bold cursor-pointer hover:bg-red-700"
                          >
                            নিশ্চিত মুছুন
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1.5 rounded-xl border border-neutral-200 bg-white text-[11px] font-bold text-neutral-600 cursor-pointer"
                          >
                            বাতিল
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(activeSession.id)}
                          className="p-2 rounded-xl border border-neutral-200 bg-white text-neutral-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Delete chat thread"
                          aria-label="Delete chat thread"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Order Intelligence + Private Admin Note Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200/70 text-[11px]">
                    <div className="flex items-center gap-2 text-neutral-600 flex-wrap">
                      {activeOrganized.orderMatch.latestOrder ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-800 font-semibold">
                          <ShoppingBag size={11} className="text-emerald-600" />
                          সর্বশেষ অর্ডার: <strong>#{activeOrganized.orderMatch.latestOrder.id}</strong> (
                          {activeOrganized.orderMatch.latestOrder.orderStatus} • ৳
                          {activeOrganized.orderMatch.latestOrder.total})
                        </span>
                      ) : (
                        <span className="text-neutral-500">
                          প্রথমবারের কাস্টমার / অর্ডার লিঙ্ক করা নেই
                        </span>
                      )}

                      {activeSession.adminNote && !isEditingNote && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-medium">
                          <StickyNote size={11} className="text-amber-600 shrink-0" />
                          নোট: {activeSession.adminNote}
                        </span>
                      )}
                    </div>

                    {!isEditingNote ? (
                      <button
                        type="button"
                        data-testid="edit-customer-note-btn"
                        onClick={() => setIsEditingNote(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-neutral-200 hover:border-[#D71920] text-neutral-700 font-bold cursor-pointer"
                      >
                        <StickyNote size={11} className="text-[#D71920]" />
                        <span>{activeSession.adminNote ? 'নোট এডিট করুন' : 'প্রাইভেট নোট যোগ করুন'}</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <input
                          type="text"
                          value={noteDraft}
                          onChange={e => setNoteDraft(e.target.value)}
                          placeholder="কাস্টমার সম্পর্কে প্রাইভেট নোট লিখুন..."
                          className="flex-1 sm:w-64 px-2.5 py-1 rounded-lg border border-neutral-300 bg-white text-[11px] focus:outline-none focus:border-[#D71920]"
                        />
                        <button
                          type="button"
                          disabled={savingNote}
                          onClick={() => void handleSaveAdminNote()}
                          className="px-2.5 py-1 rounded-lg bg-[#D71920] text-white font-bold text-[11px] cursor-pointer disabled:opacity-50"
                        >
                          {savingNote ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingNote(false);
                            setNoteDraft(activeSession.adminNote || '');
                          }}
                          className="px-2 py-1 rounded-lg border border-neutral-200 bg-white text-neutral-600 font-bold text-[11px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scrollable Messages Transcript */}
                <div
                  data-testid="admin-chat-transcript"
                  className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]"
                >
                  {activeSession.messages.map(msg => {
                    const isAdmin = msg.sender === 'admin';
                    const isSystem = msg.sender === 'system';

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center">
                          <div className="max-w-[85%] px-3.5 py-2 rounded-2xl bg-neutral-100 border border-neutral-200/80 text-[11px] text-neutral-600 text-center">
                            <span className="font-black text-[#D71920] mr-1">{msg.senderName}:</span>
                            {msg.text}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                            isAdmin
                              ? 'bg-[#D71920] text-white rounded-br-sm'
                              : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-sm'
                          }`}
                        >
                          <span
                            className={`block text-[10px] font-black mb-0.5 ${
                              isAdmin ? 'text-white/80' : 'text-[#D71920]'
                            }`}
                          >
                            {msg.senderName}
                          </span>
                          <p className="whitespace-pre-line">{msg.text}</p>
                        </div>
                        <span className="text-[9.5px] text-neutral-400 mt-0.5 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Canned Replies + Reply Form */}
                <div className="border-t border-neutral-100 bg-white shrink-0">
                  {effectiveQuickReplies.length > 0 && (
                    <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5 overflow-x-auto">
                      <span className="text-[10px] font-bold text-neutral-400 flex items-center gap-1 shrink-0">
                        <Sparkles size={10} className="text-[#D71920]" /> দ্রুত উত্তর:
                      </span>
                      {effectiveQuickReplies.map((tmpl, idx) => (
                        <button
                          key={`${idx}-${tmpl.slice(0, 12)}`}
                          type="button"
                          onClick={() => setReplyText(tmpl)}
                          className="shrink-0 max-w-[210px] truncate px-2.5 py-1 rounded-lg bg-[#FFF1F2] hover:bg-[#D71920] text-[#D71920] hover:text-white border border-[#D71920]/20 text-[10.5px] font-bold transition-colors cursor-pointer"
                          title={tmpl}
                        >
                          {tmpl}
                        </button>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleSendReply} className="p-3 flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder={`${activeSession.customerName}-কে উত্তর লিখুন...`}
                      data-testid="admin-chat-reply-input"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs bg-neutral-50 focus:bg-white focus:outline-none focus:border-[#D71920]"
                    />
                    <button
                      type="submit"
                      disabled={sending || !replyText.trim()}
                      data-testid="admin-chat-reply-submit"
                      className="px-4 py-2.5 bg-[#D71920] hover:bg-[#b8141a] disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Send size={14} /> <span>Send Reply</span>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-neutral-400 space-y-2">
                <MessageCircle size={32} className="text-neutral-300" />
                <p className="text-xs font-bold text-neutral-600">বাম পাশ থেকে একটি কাস্টমার চ্যাট সিলেক্ট করুন</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
