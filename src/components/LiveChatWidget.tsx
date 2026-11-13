import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  MessageCircle,
  X,
  Send,
  CheckCheck,
  Phone,
  Volume2,
  VolumeX,
  RotateCcw,
  ChevronLeft,
} from 'lucide-react';
import {
  validatePreChatForm,
  resolveLiveChatAutoHideMs,
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
];

export function LiveChatWidget() {
  const {
    settings,
    isLoading,
    customerChatSession,
    isLiveChatOpen,
    setIsLiveChatOpen,
    sendCustomerChatMessage,
    markLiveChatReadByCustomer,
    startNewCustomerChat,
  } = useStore();

  const [customerName, setCustomerName] = useState<string>(() => {
    if (customerChatSession?.customerName && customerChatSession.customerName !== 'Guest Reader') {
      return customerChatSession.customerName;
    }
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('mrb_livechat_profile');
        if (raw) {
          const parsed = JSON.parse(raw) as { customerName?: string };
          if (parsed.customerName && parsed.customerName !== 'Guest Reader') {
            return parsed.customerName;
          }
        }
      } catch {
        // ignore
      }
    }
    return '';
  });

  const [customerPhone, setCustomerPhone] = useState<string>(() => {
    if (customerChatSession?.customerPhone) return customerChatSession.customerPhone;
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('mrb_livechat_profile');
        if (raw) {
          const parsed = JSON.parse(raw) as { customerPhone?: string };
          if (parsed.customerPhone) return parsed.customerPhone;
        }
      } catch {
        // ignore
      }
    }
    return '';
  });

  const [customerEmail, setCustomerEmail] = useState<string>(() => {
    if (customerChatSession?.customerEmail) return customerChatSession.customerEmail;
    return '';
  });

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

  // Side slide-out & 3-5s auto-hide state for floating trigger
  const [isSlideVisible, setIsSlideVisible] = useState<boolean>(false);
  const [isLauncherExpanded, setIsLauncherExpanded] = useState<boolean>(true);
  const [isLauncherHovered, setIsLauncherHovered] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesRef = useRef<LiveChatMessage[] | null>(null);
  const hydratedSessionIdRef = useRef<string | null>(null);
  const prevUnreadRef = useRef<number>(customerChatSession?.unreadByCustomer || 0);
  const wasChatOpenRef = useRef<boolean>(isLiveChatOpen);

  const unreadCount = customerChatSession?.unreadByCustomer || 0;
  const autoHideMs = resolveLiveChatAutoHideMs(settings.liveChatAutoHideSeconds);
  const requireContactInfo = Boolean(settings.liveChatRequireContactInfo);
  const showEmailField = Boolean(settings.liveChatShowEmailField);

  // Trigger smooth side slide-in once store finishes initial hydration
  useEffect(() => {
    if (isLoading) return;
    const raf = window.requestAnimationFrame(() => {
      setIsSlideVisible(true);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [isLoading]);

  // Re-expand when drawer closes so user sees slide-out before auto-hiding again
  useEffect(() => {
    if (wasChatOpenRef.current && !isLiveChatOpen) {
      setIsLauncherExpanded(true);
    }
    wasChatOpenRef.current = isLiveChatOpen;
  }, [isLiveChatOpen]);

  // Auto-reveal launcher briefly whenever a new Admin reply increases unread count
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current && !isLiveChatOpen) {
      setIsLauncherExpanded(true);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount, isLiveChatOpen]);

  // Auto-hide countdown (default 4s, Admin configurable 3-5s or Off)
  useEffect(() => {
    if (isLoading || !isSlideVisible || isLiveChatOpen || !isLauncherExpanded || isLauncherHovered || autoHideMs === 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      setIsLauncherExpanded(false);
    }, autoHideMs);

    return () => window.clearTimeout(timer);
  }, [isLoading, isSlideVisible, isLiveChatOpen, isLauncherExpanded, isLauncherHovered, autoHideMs]);

  // Sync saved customer details when Firestore session loads
  useEffect(() => {
    if (
      customerChatSession?.customerName &&
      customerChatSession.customerName !== 'Guest Reader' &&
      !customerName
    ) {
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

  // Unlock Web Audio across touch, pointer, and keyboard gestures
  useEffect(() => {
    const unlock = () => unlockChatAudioContext();
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  if (settings.enableLiveChat === false) {
    return null;
  }

  const messages = customerChatSession?.messages || [];
  const hasStartedChat = messages.some((m) => m.sender === 'customer' || m.sender === 'admin');
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
    const check = validatePreChatForm(
      {
        customerName,
        customerPhone,
        customerEmail: showEmailField ? customerEmail : '',
        firstMessage: firstMessageNote,
      },
      {
        requireContactInfo,
        requireEmail: false,
        defaultGuestName: 'Guest Reader',
      }
    );

    if (!check.valid) {
      setFormErrors(check.errors);
      return;
    }

    setFormErrors({});
    setSending(true);
    try {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(
            'mrb_livechat_profile',
            JSON.stringify({
              customerName: check.cleaned.customerName,
              customerPhone: check.cleaned.customerPhone,
            })
          );
        } catch {
          // ignore
        }
      }
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
        customerName: customerName.trim() || customerChatSession?.customerName || 'Guest Reader',
        customerPhone: customerPhone.trim() || customerChatSession?.customerPhone || '',
        customerEmail: showEmailField ? (customerEmail.trim() || customerChatSession?.customerEmail || '') : '',
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
      {/* Side Slide-Out Trigger + Auto-Hide Docked Tick Arrow */}
      {!isLiveChatOpen && (
        <div
          data-testid="live-chat-dock"
          onMouseEnter={() => setIsLauncherHovered(true)}
          onMouseLeave={() => setIsLauncherHovered(false)}
          className="fixed bottom-20 right-0 md:bottom-6 z-40 pointer-events-none flex items-center"
        >
          {/* Expanded Side Slide-Out Launcher Button */}
          <div
            className={`mr-3 md:mr-5 transition-all duration-300 ease-out ${
              isSlideVisible && isLauncherExpanded
                ? 'translate-x-0 opacity-100 pointer-events-auto'
                : 'translate-x-[120%] opacity-0 pointer-events-none'
            }`}
          >
            <button
              type="button"
              data-testid="live-chat-trigger"
              onClick={() => {
                unlockChatAudioContext();
                setIsLiveChatOpen(true);
              }}
              aria-label="Open Live Chat Support"
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#D71920] hover:bg-[#B9151B] text-white shadow-lg shadow-black/15 border border-white/15 transition-colors cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <MessageCircle size={16} strokeWidth={2.2} />
              <span className="text-xs font-semibold tracking-tight">
                {unreadCount > 0 ? 'নতুন রিপ্লাই' : 'Live Chat'}
              </span>
              {unreadCount > 0 && (
                <span
                  data-testid="live-chat-unread-badge"
                  className="min-w-[17px] h-[17px] px-1 rounded-full bg-white text-[#D71920] text-[10px] font-bold flex items-center justify-center tabular-nums"
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Docked Tick Arrow Handle (Visible when Launcher Auto-Hides) */}
          <button
            type="button"
            data-testid="live-chat-reveal-arrow"
            aria-label="Show Live Chat"
            title="Live Chat"
            onClick={() => {
              unlockChatAudioContext();
              setIsLauncherExpanded(true);
            }}
            className={`absolute right-0 top-1/2 -translate-y-1/2 h-10 w-7 rounded-l-lg bg-white dark:bg-slate-900 border border-r-0 border-neutral-200 dark:border-slate-700 shadow-md flex items-center justify-center text-[#D71920] hover:bg-neutral-50 dark:hover:bg-slate-800 transition-all duration-300 ease-out cursor-pointer ${
              !isLauncherExpanded
                ? 'translate-x-0 opacity-100 pointer-events-auto'
                : 'translate-x-full opacity-0 pointer-events-none'
            }`}
          >
            <ChevronLeft size={16} strokeWidth={2.3} />
            {unreadCount > 0 && (
              <span
                data-testid="live-chat-arrow-unread-dot"
                className="absolute -top-1 left-0.5 w-2.5 h-2.5 rounded-full bg-[#D71920] border border-white dark:border-slate-900"
              />
            )}
          </button>
        </div>
      )}

      {/* Minimal, Compact Live Chat Drawer */}
      {isLiveChatOpen && (
        <div
          data-testid="live-chat-drawer"
          className="fixed bottom-[68px] right-3 sm:bottom-5 sm:right-5 z-[70] w-[calc(100vw-24px)] max-w-[330px] sm:w-[330px] bg-white dark:bg-[#111827] rounded-2xl border border-neutral-200 dark:border-slate-700/90 shadow-xl overflow-hidden flex flex-col max-h-[68dvh] sm:max-h-[460px]"
        >
          {/* Compact Minimal Header */}
          <div className="bg-[#D71920] text-white px-3.5 py-2.5 flex items-center justify-between gap-2 shrink-0">
            <div className="min-w-0">
              <h3 className="font-semibold text-[13px] tracking-tight truncate">
                {settings.liveChatTitle || 'MR. BOOKS Support'}
              </h3>
              <p className="text-[11px] text-white/85 truncate">
                {hasStartedChat
                  ? 'সরাসরি চ্যাট চলছে'
                  : 'সহজেই আপনার মেসেজটি পাঠান'}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {settings.enableLiveChatSound !== false && (
                <button
                  type="button"
                  onClick={toggleMute}
                  data-testid="customer-chat-sound-toggle"
                  className="w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
                  title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
                  aria-label={soundEnabled ? 'Mute notification sound' : 'Unmute notification sound'}
                >
                  {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </button>
              )}

              {hasStartedChat && (
                <button
                  type="button"
                  onClick={handleStartFreshChat}
                  data-testid="customer-new-chat-btn"
                  className="w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
                  title="নতুন চ্যাট"
                  aria-label="Start new chat"
                >
                  <RotateCcw size={13} />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsLiveChatOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
                aria-label="Close Live Chat"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {!hasStartedChat ? (
            /* STEP 1: Minimal Pre-Chat Form (No Email, Optional Name & Phone, Instant Messaging) */
            <form
              onSubmit={handlePreChatSubmit}
              noValidate
              data-testid="live-chat-prechat-form"
              className="flex-1 overflow-y-auto overscroll-contain bg-white dark:bg-[#0D1320]"
            >
              {/* Quiet hairline welcome intro */}
              <div className="px-3.5 py-2.5 border-b border-neutral-100 dark:border-slate-800 text-[11.5px] leading-relaxed text-neutral-600 dark:text-slate-300">
                {settings.liveChatWelcomeMessage ||
                  'আসসালামু আলাইকুম! বই, অর্ডার বা ডেলিভারি নিয়ে যেকোনো প্রশ্ন এখানে লিখুন।'}
              </div>

              <div className="p-3.5 space-y-2.5">
                {/* Optional Name & Phone (Compact 2-Column Row) */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="livechat-name"
                      className="block text-[11px] font-medium text-neutral-600 dark:text-slate-400 mb-1"
                    >
                      নাম {requireContactInfo ? <span className="text-[#D71920]">*</span> : '(ঐচ্ছিক)'}
                    </label>
                    <input
                      id="livechat-name"
                      type="text"
                      required={requireContactInfo}
                      data-testid="prechat-name-input"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (formErrors.name) setFormErrors((p) => ({ ...p, name: undefined }));
                      }}
                      placeholder="আপনার নাম"
                      className="w-full h-9 px-2.5 rounded-lg border border-neutral-200 dark:border-slate-700 bg-neutral-50/70 dark:bg-slate-800/80 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-[#D71920] focus:bg-white dark:focus:bg-slate-800 transition-colors"
                    />
                    {formErrors.name && (
                      <p className="text-[10.5px] text-red-600 mt-0.5">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="livechat-phone"
                      className="block text-[11px] font-medium text-neutral-600 dark:text-slate-400 mb-1"
                    >
                      ফোন {requireContactInfo ? <span className="text-[#D71920]">*</span> : '(ঐচ্ছিক)'}
                    </label>
                    <input
                      id="livechat-phone"
                      type="tel"
                      inputMode="tel"
                      required={requireContactInfo}
                      data-testid="prechat-phone-input"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (formErrors.phone) setFormErrors((p) => ({ ...p, phone: undefined }));
                      }}
                      placeholder="017XXXXXXXX"
                      className="w-full h-9 px-2.5 rounded-lg border border-neutral-200 dark:border-slate-700 bg-neutral-50/70 dark:bg-slate-800/80 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-[#D71920] focus:bg-white dark:focus:bg-slate-800 transition-colors"
                    />
                    {formErrors.phone && (
                      <p className="text-[10.5px] text-red-600 mt-0.5">{formErrors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Optional Email only if Admin explicitly enables liveChatShowEmailField */}
                {showEmailField && (
                  <div>
                    <label
                      htmlFor="livechat-email"
                      className="block text-[11px] font-medium text-neutral-600 dark:text-slate-400 mb-1"
                    >
                      ইমেইল (ঐচ্ছিক)
                    </label>
                    <input
                      id="livechat-email"
                      type="email"
                      inputMode="email"
                      data-testid="prechat-email-input"
                      value={customerEmail}
                      onChange={(e) => {
                        setCustomerEmail(e.target.value);
                        if (formErrors.email) setFormErrors((p) => ({ ...p, email: undefined }));
                      }}
                      placeholder="name@example.com"
                      className="w-full h-9 px-2.5 rounded-lg border border-neutral-200 dark:border-slate-700 bg-neutral-50/70 dark:bg-slate-800/80 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-[#D71920] focus:bg-white dark:focus:bg-slate-800 transition-colors"
                    />
                    {formErrors.email && (
                      <p className="text-[10.5px] text-red-600 mt-0.5">{formErrors.email}</p>
                    )}
                  </div>
                )}

                {/* Focused Compact Message Input */}
                <div>
                  <label
                    htmlFor="livechat-first-message"
                    className="block text-[11px] font-medium text-neutral-700 dark:text-slate-300 mb-1"
                  >
                    মেসেজ
                  </label>
                  <textarea
                    id="livechat-first-message"
                    rows={2}
                    required
                    data-testid="prechat-message-input"
                    value={firstMessageNote}
                    onChange={(e) => {
                      setFirstMessageNote(e.target.value);
                      if (formErrors.message) setFormErrors((p) => ({ ...p, message: undefined }));
                    }}
                    placeholder="আপনার প্রশ্ন বা বইয়ের নাম লিখুন..."
                    className="w-full px-2.5 py-2 rounded-lg border border-neutral-200 dark:border-slate-700 bg-neutral-50/70 dark:bg-slate-800/80 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-[#D71920] focus:bg-white dark:focus:bg-slate-800 resize-none transition-colors"
                  />
                  {formErrors.message && (
                    <p className="text-[10.5px] text-red-600 mt-0.5">{formErrors.message}</p>
                  )}

                  {/* Minimal Quick Fill Suggestions */}
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {QUICK_CHAT_TOPICS.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => {
                          setFirstMessageNote(topic);
                          if (formErrors.message) setFormErrors((p) => ({ ...p, message: undefined }));
                        }}
                        className="px-2 py-1 rounded-md border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/60 text-neutral-600 dark:text-slate-300 text-[10.5px] font-medium hover:border-[#D71920] hover:text-[#D71920] transition-colors cursor-pointer"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  data-testid="prechat-submit-btn"
                  className="w-full h-9 px-3 rounded-lg bg-[#D71920] hover:bg-[#B9151B] disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send size={13} />
                  <span>{sending ? 'পাঠানো হচ্ছে...' : 'মেসেজ পাঠান'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: Compact Active Real-Time Chat */
            <>
              {(customerChatSession?.customerName || customerName || customerChatSession?.customerPhone || customerPhone) && (
                <div className="px-3.5 py-1.5 bg-neutral-50 dark:bg-slate-900/70 border-b border-neutral-100 dark:border-slate-800 flex items-center gap-1.5 text-[11px] text-neutral-600 dark:text-slate-300 shrink-0 truncate">
                  <span className="font-medium text-neutral-800 dark:text-slate-100 truncate">
                    {customerChatSession?.customerName || customerName || 'Guest Reader'}
                  </span>
                  {(customerChatSession?.customerPhone || customerPhone) && (
                    <>
                      <span aria-hidden="true" className="text-neutral-300 dark:text-slate-600">·</span>
                      <span className="tabular-nums truncate">
                        {customerChatSession?.customerPhone || customerPhone}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Scrollable Messages Feed */}
              <div
                data-testid="live-chat-messages-feed"
                className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-2 min-h-[180px] max-h-[260px] bg-white dark:bg-[#0D1320]"
              >
                <div className="flex justify-start">
                  <div className="max-w-[86%] rounded-xl rounded-tl-xs bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-slate-200 px-3 py-2 text-xs leading-relaxed border border-neutral-200/70 dark:border-slate-700">
                    <span className="text-[10px] font-semibold text-[#D71920] block mb-0.5">
                      MR. BOOKS Support
                    </span>
                    <p>
                      {settings.liveChatWelcomeMessage ||
                        'আসসালামু আলাইকুম! বই, অর্ডার বা ডেলিভারি নিয়ে যেকোনো প্রশ্ন এখানে লিখুন।'}
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
                          className={`max-w-[84%] rounded-xl px-3 py-1.5 text-xs leading-relaxed ${
                            isCustomer
                              ? 'rounded-tr-xs bg-[#D71920] text-white'
                              : 'rounded-tl-xs bg-neutral-100 dark:bg-slate-800 text-neutral-900 dark:text-slate-100 border border-neutral-200/80 dark:border-slate-700'
                          }`}
                        >
                          {!isCustomer && (
                            <span className="text-[10px] font-semibold text-[#D71920] dark:text-rose-400 block mb-0.5">
                              {msg.senderName || 'Support'}
                            </span>
                          )}
                          <p className="whitespace-pre-line">{msg.text}</p>
                          <div
                            className={`text-[9px] mt-0.5 flex items-center justify-end gap-1 tabular-nums ${
                              isCustomer ? 'text-white/75' : 'text-neutral-400 dark:text-slate-400'
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

              {/* Compact Bottom Composer */}
              <div className="p-2.5 border-t border-neutral-100 dark:border-slate-800 bg-neutral-50/70 dark:bg-slate-900/90 space-y-1.5 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSendFollowup();
                  }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    data-testid="live-chat-input"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="মেসেজ লিখুন..."
                    className="flex-1 h-9 px-3 rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-[#D71920]"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || sending}
                    data-testid="live-chat-send-btn"
                    className="w-9 h-9 rounded-lg bg-[#D71920] hover:bg-[#B9151B] disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    aria-label="Send chat message"
                  >
                    <Send size={14} />
                  </button>
                </form>

                {settings.phone && (
                  <div className="flex items-center justify-end px-0.5">
                    <a
                      href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                      className="text-[10.5px] font-medium text-neutral-500 hover:text-[#D71920] dark:text-slate-400 inline-flex items-center gap-1"
                    >
                      <Phone size={10} /> সরাসরি কল: {settings.phone}
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
