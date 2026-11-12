import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  CheckCheck,
  Phone,
  Mail,
  User,
  ShieldCheck,
  Headphones,
  Volume2,
  VolumeX,
  RotateCcw,
  FileText,
} from 'lucide-react';
import {
  validatePreChatForm,
  detectNewIncomingMessages,
  unlockChatAudioContext,
  playOutgoingChatChime,
  playCustomerIncomingChime,
} from '../utils/chatSoundAndValidation';
import { LiveChatMessage } from '../types';

const QUICK_CHAT_TOPICS = [
  'অর্ডার স্ট্যাটাস জানতে চাই',
  'বইটি কি স্টকে আছে?',
  'ডেলিভারি চার্জ ও সময় কত?',
  'এক্সচেঞ্জ / রিটার্ন পলিসি',
];

export function LiveChatWidget() {
  const {
    settings,
    customerChatSession,
    isLiveChatOpen,
    setIsLiveChatOpen,
    sendCustomerChatMessage,
    markLiveChatReadByCustomer,
    startNewCustomerChat,
  } = useStore();

  const [customerName, setCustomerName] = useState<string>(
    customerChatSession?.customerName || ''
  );
  const [customerPhone, setCustomerPhone] = useState<string>(
    customerChatSession?.customerPhone || ''
  );
  const [customerEmail, setCustomerEmail] = useState<string>(
    customerChatSession?.customerEmail || ''
  );
  const [firstMessageNote, setFirstMessageNote] = useState<string>('');
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    message?: string;
  }>({});

  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return window.localStorage.getItem('mrb_chat_sound_muted_customer') === '1';
      } catch {
        return false;
      }
    }
    return false;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesRef = useRef<LiveChatMessage[] | null>(null);
  const hydratedSessionIdRef = useRef<string | null>(null);

  // Sync saved customer details when Firestore session loads
  useEffect(() => {
    if (customerChatSession?.customerName && !customerName) {
      setCustomerName(customerChatSession.customerName);
    }
    if (customerChatSession?.customerPhone && !customerPhone) {
      setCustomerPhone(customerChatSession.customerPhone);
    }
    if (customerChatSession?.customerEmail && !customerEmail) {
      setCustomerEmail(customerChatSession.customerEmail);
    }
  }, [customerChatSession?.id, customerChatSession?.customerName, customerChatSession?.customerPhone, customerChatSession?.customerEmail]);

  // Play notification chime on customer device whenever a NEW Admin reply arrives
  useEffect(() => {
    const currentMsgs = customerChatSession?.messages || [];
    const currentId = customerChatSession?.id || null;

    if (!customerChatSession) {
      prevMessagesRef.current = null;
      hydratedSessionIdRef.current = null;
      return;
    }

    // Skip chime on initial session hydration / page load
    if (hydratedSessionIdRef.current !== currentId || prevMessagesRef.current === null) {
      prevMessagesRef.current = currentMsgs;
      hydratedSessionIdRef.current = currentId;
      return;
    }

    const newAdminReplies = detectNewIncomingMessages(prevMessagesRef.current, currentMsgs, 'admin');
    prevMessagesRef.current = currentMsgs;

    if (newAdminReplies.length > 0 && settings.enableLiveChatSound !== false && !isMuted) {
      playCustomerIncomingChime();
    }
  }, [customerChatSession?.id, customerChatSession?.messages, settings.enableLiveChatSound, isMuted]);

  // Mark Admin replies read & scroll to bottom when chat drawer is open
  useEffect(() => {
    if (isLiveChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      if ((customerChatSession?.unreadByCustomer || 0) > 0) {
        void markLiveChatReadByCustomer();
      }
    }
  }, [isLiveChatOpen, customerChatSession?.messages?.length, customerChatSession?.unreadByCustomer]);

  // Unlock Web Audio on first click anywhere so incoming Admin replies chime reliably
  useEffect(() => {
    const unlock = () => unlockChatAudioContext();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  if (settings.enableLiveChat === false) {
    return null;
  }

  const messages = customerChatSession?.messages || [];
  const hasStartedChat = messages.some((m) => m.sender === 'customer' || m.sender === 'admin');
  const unreadCount = customerChatSession?.unreadByCustomer || 0;
  const soundEnabled = settings.enableLiveChatSound !== false && !isMuted;

  const toggleMute = () => {
    unlockChatAudioContext();
    setIsMuted((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem('mrb_chat_sound_muted_customer', next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handlePreChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    unlockChatAudioContext();
    const check = validatePreChatForm({
      customerName,
      customerPhone,
      customerEmail,
      firstMessage: firstMessageNote,
    });

    if (!check.valid) {
      setFormErrors(check.errors);
      return;
    }

    setFormErrors({});
    setSending(true);
    try {
      if (soundEnabled) playOutgoingChatChime();
      await sendCustomerChatMessage({
        customerName: check.cleaned.customerName,
        customerPhone: check.cleaned.customerPhone,
        customerEmail: check.cleaned.customerEmail,
        text: check.cleaned.firstMessage,
      });
      setFirstMessageNote('');
    } finally {
      setSending(false);
    }
  };

  const handleSendFollowup = async (textOverride?: string) => {
    unlockChatAudioContext();
    const text = (textOverride ?? messageInput).trim();
    if (!text || sending) return;
    if (!textOverride) setMessageInput('');
    setSending(true);
    try {
      if (soundEnabled) playOutgoingChatChime();
      await sendCustomerChatMessage({
        customerName: customerName.trim() || customerChatSession?.customerName || 'Reader',
        customerPhone: customerPhone.trim() || customerChatSession?.customerPhone || '',
        customerEmail: customerEmail.trim() || customerChatSession?.customerEmail || '',
        text,
      });
    } finally {
      setSending(false);
    }
  };

  const handleStartFreshChat = () => {
    startNewCustomerChat();
    setFirstMessageNote('');
    setFormErrors({});
  };

  return (
    <>
      {/* Sticky Floating Live Chat Trigger Button */}
      {!isLiveChatOpen && (
        <button
          type="button"
          data-testid="live-chat-trigger"
          onClick={() => {
            unlockChatAudioContext();
            setIsLiveChatOpen(true);
          }}
          aria-label="Open Live Chat Support"
          className="fixed bottom-18 right-3.5 md:bottom-6 md:right-6 z-40 group flex items-center gap-2 pl-3 pr-3.5 py-2.5 rounded-full bg-gradient-to-r from-[#D71920] to-[#B01218] hover:from-[#B9151B] hover:to-[#940F14] text-white shadow-xl shadow-[#D71920]/30 border border-white/20 transition-all cursor-pointer active:scale-95"
        >
          <span className="relative flex items-center justify-center">
            <MessageCircle size={19} className="group-hover:scale-110 transition-transform" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#D71920] animate-pulse" />
          </span>
          <span className="text-xs font-black tracking-tight">Live Chat</span>
          {unreadCount > 0 && (
            <span
              data-testid="live-chat-unread-badge"
              className="min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[#D71920] text-[10px] font-black flex items-center justify-center animate-bounce"
            >
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Interactive Phone-Optimized Live Chat Drawer */}
      {isLiveChatOpen && (
        <div
          data-testid="live-chat-drawer"
          className="fixed inset-x-2 bottom-2 sm:inset-auto sm:bottom-6 sm:right-6 z-[70] w-auto sm:w-[390px] bg-white dark:bg-[#101623] rounded-3xl border border-neutral-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-200 max-h-[88dvh] sm:max-h-[82vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#D71920] to-[#9E0F14] text-white px-4 py-3.5 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                <Headphones size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-sm truncate">
                    {settings.liveChatTitle || 'MR. BOOKS Live Support'}
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                </div>
                <p className="text-[10.5px] text-white/85 font-medium truncate">
                  {hasStartedChat
                    ? 'সরাসরি রিয়েল-টাইম কাস্টমার সাপোর্ট চালু আছে'
                    : 'তথ্য দিয়ে সরাসরি চ্যাট শুরু করুন'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {settings.enableLiveChatSound !== false && (
                <button
                  type="button"
                  onClick={toggleMute}
                  data-testid="customer-chat-sound-toggle"
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
                  title={soundEnabled ? 'Mute notification sound' : 'Unmute notification sound'}
                  aria-label={soundEnabled ? 'Mute notification sound' : 'Unmute notification sound'}
                >
                  {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                </button>
              )}

              {hasStartedChat && (
                <button
                  type="button"
                  onClick={handleStartFreshChat}
                  data-testid="customer-new-chat-btn"
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
                  title="নতুন চ্যাট শুরু করুন"
                  aria-label="Start new chat"
                >
                  <RotateCcw size={14} />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsLiveChatOpen(false)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
                aria-label="Close Live Chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {!hasStartedChat ? (
            /* STEP 1: Pre-Chat Customer Info & Message Note Form (Mobile Optimized) */
            <form
              onSubmit={handlePreChatSubmit}
              data-testid="live-chat-prechat-form"
              className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3 bg-neutral-50/60 dark:bg-[#0D1320]"
            >
              <div className="rounded-2xl bg-white dark:bg-slate-800/80 border border-neutral-200/80 dark:border-slate-700 p-3 text-xs leading-relaxed text-neutral-700 dark:text-slate-200 shadow-2xs">
                <span className="text-[10px] font-black text-[#D71920] flex items-center gap-1 mb-0.5">
                  <Sparkles size={11} /> MR. BOOKS Support
                </span>
                <p>
                  {settings.liveChatWelcomeMessage ||
                    'আসসালামু আলাইকুম! MR. BOOKS-এ স্বাগতম। চ্যাট শুরু করতে নিচের আপনার নাম, ফোন নম্বর, ইমেইল এবং আপনার মেসেজটি লিখুন।'}
                </p>
              </div>

              <div className="space-y-2.5">
                {/* 1. Name */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <User size={12} className="text-[#D71920]" /> আপনার নাম <span className="text-[#D71920]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="prechat-name-input"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (formErrors.name) setFormErrors((p) => ({ ...p, name: undefined }));
                    }}
                    placeholder="যেমন: ফজলে রাব্বি / Abdullah"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[15px] sm:text-xs font-medium text-neutral-900 dark:text-white focus:outline-none focus:border-[#D71920]"
                  />
                  {formErrors.name && (
                    <p className="text-[11px] font-semibold text-red-600 mt-0.5">{formErrors.name}</p>
                  )}
                </div>

                {/* 2. Phone */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Phone size={12} className="text-[#D71920]" /> মোবাইল নম্বর <span className="text-[#D71920]">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    required
                    data-testid="prechat-phone-input"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      if (formErrors.phone) setFormErrors((p) => ({ ...p, phone: undefined }));
                    }}
                    placeholder="017XXXXXXXX"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[15px] sm:text-xs font-medium text-neutral-900 dark:text-white focus:outline-none focus:border-[#D71920]"
                  />
                  {formErrors.phone && (
                    <p className="text-[11px] font-semibold text-red-600 mt-0.5">{formErrors.phone}</p>
                  )}
                </div>

                {/* 3. Email */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Mail size={12} className="text-[#D71920]" /> ইমেইল অ্যাড্রেস <span className="text-[#D71920]">*</span>
                  </label>
                  <input
                    type="email"
                    inputMode="email"
                    required
                    data-testid="prechat-email-input"
                    value={customerEmail}
                    onChange={(e) => {
                      setCustomerEmail(e.target.value);
                      if (formErrors.email) setFormErrors((p) => ({ ...p, email: undefined }));
                    }}
                    placeholder="example@gmail.com"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[15px] sm:text-xs font-medium text-neutral-900 dark:text-white focus:outline-none focus:border-[#D71920]"
                  />
                  {formErrors.email && (
                    <p className="text-[11px] font-semibold text-red-600 mt-0.5">{formErrors.email}</p>
                  )}
                </div>

                {/* 4. Note: Write Your Message */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <FileText size={12} className="text-[#D71920]" /> নোট: আপনার মেসেজটি লিখুন <span className="text-[#D71920]">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    data-testid="prechat-message-input"
                    value={firstMessageNote}
                    onChange={(e) => {
                      setFirstMessageNote(e.target.value);
                      if (formErrors.message) setFormErrors((p) => ({ ...p, message: undefined }));
                    }}
                    placeholder="আপনার মেসেজটি লিখুন... (যেমন: অর্ডার নম্বর বা বইয়ের নাম)"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[15px] sm:text-xs font-medium text-neutral-900 dark:text-white focus:outline-none focus:border-[#D71920] resize-none"
                  />
                  {formErrors.message && (
                    <p className="text-[11px] font-semibold text-red-600 mt-0.5">{formErrors.message}</p>
                  )}

                  {/* Quick Fill Note Suggestions */}
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {QUICK_CHAT_TOPICS.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => {
                          setFirstMessageNote(topic);
                          if (formErrors.message) setFormErrors((p) => ({ ...p, message: undefined }));
                        }}
                        className="px-2 py-1 rounded-lg bg-[#FFF1F2] dark:bg-[#D71920]/15 text-[#D71920] border border-[#D71920]/25 text-[10.5px] font-bold hover:bg-[#D71920] hover:text-white transition-colors cursor-pointer"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={sending}
                data-testid="prechat-submit-btn"
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-[#D71920] hover:bg-[#B9151B] disabled:opacity-50 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#D71920]/25 transition-all cursor-pointer active:scale-[0.98]"
              >
                <Send size={15} />
                <span>{sending ? 'পাঠানো হচ্ছে...' : 'মেসেজ পাঠান ও চ্যাট শুরু করুন'}</span>
              </button>
            </form>
          ) : (
            /* STEP 2: Full Active Real-Time Chat Box (Unlocked after Submitting Pre-Chat Info) */
            <>
              {/* Verified Customer Compact Summary Strip */}
              <div className="px-3.5 py-2 bg-neutral-50 dark:bg-slate-900/80 border-b border-neutral-100 dark:border-slate-800 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-neutral-600 dark:text-slate-300 shrink-0">
                <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1 truncate max-w-[140px]">
                  <User size={11} className="text-[#D71920] shrink-0" />
                  {customerChatSession?.customerName || customerName}
                </span>
                {(customerChatSession?.customerPhone || customerPhone) && (
                  <span className="flex items-center gap-1">
                    <Phone size={10} className="text-[#D71920]" />
                    {customerChatSession?.customerPhone || customerPhone}
                  </span>
                )}
                {(customerChatSession?.customerEmail || customerEmail) && (
                  <span className="flex items-center gap-1 truncate max-w-[160px]">
                    <Mail size={10} className="text-[#D71920] shrink-0" />
                    {customerChatSession?.customerEmail || customerEmail}
                  </span>
                )}
              </div>

              {/* Scrollable Messages Feed */}
              <div
                data-testid="live-chat-messages-feed"
                className="flex-1 overflow-y-auto overscroll-contain p-3.5 space-y-2.5 min-h-[240px] sm:min-h-[280px] max-h-[52dvh] sm:max-h-[360px] bg-white dark:bg-[#0D1320]"
              >
                {/* Welcome Bubble */}
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-slate-100 px-3.5 py-2.5 text-xs leading-relaxed border border-neutral-200/70 dark:border-slate-700">
                    <span className="text-[10px] font-black text-[#D71920] flex items-center gap-1 mb-0.5">
                      <Sparkles size={10} /> MR. BOOKS Support
                    </span>
                    <p>
                      {settings.liveChatWelcomeMessage ||
                        'আসসালামু আলাইকুম! MR. BOOKS-এ স্বাগতম। বইয়ের অর্ডার, ডেলিভারি বা কুপন সম্পর্কে যেকোনো প্রশ্ন করতে পারেন।'}
                    </p>
                  </div>
                </div>

                {messages
                  .filter((m) => m.sender !== 'system')
                  .map((msg) => {
                    const isCustomer = msg.sender === 'customer';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-2xs ${
                            isCustomer
                              ? 'rounded-tr-sm bg-[#D71920] text-white'
                              : 'rounded-tl-sm bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {!isCustomer && (
                            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 block mb-0.5">
                              {msg.senderName || 'MR. BOOKS Support'}
                            </span>
                          )}
                          <p className="whitespace-pre-line">{msg.text}</p>
                          <div
                            className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${
                              isCustomer ? 'text-white/75' : 'text-emerald-700/70 dark:text-emerald-300/70'
                            }`}
                          >
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isCustomer && <CheckCheck size={10} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                <div ref={messagesEndRef} />
              </div>

              {/* Sticky Bottom Message Composer */}
              <div className="p-3 border-t border-neutral-100 dark:border-slate-800 bg-neutral-50/90 dark:bg-slate-900/90 space-y-2 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSendFollowup();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    data-testid="live-chat-input"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="আপনার মেসেজ লিখুন..."
                    className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[15px] sm:text-xs font-medium text-neutral-900 dark:text-white focus:outline-none focus:border-[#D71920]"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || sending}
                    data-testid="live-chat-send-btn"
                    className="w-10 h-10 rounded-xl bg-[#D71920] hover:bg-[#B9151B] disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer active:scale-95"
                    aria-label="Send chat message"
                  >
                    <Send size={16} />
                  </button>
                </form>

                <div className="flex items-center justify-between text-[10px] text-neutral-500 dark:text-slate-400 px-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={11} className="text-emerald-600" />
                    Real-time synced with Support
                  </span>
                  {settings.phone && (
                    <a
                      href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                      className="font-bold text-[#D71920] hover:underline flex items-center gap-1"
                    >
                      <Phone size={10} /> Call Support
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
