import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  CheckCheck,
  Phone,
  ShieldCheck,
  Headphones,
} from 'lucide-react';

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
  } = useStore();

  const [customerName, setCustomerName] = useState<string>(
    customerChatSession?.customerName || ''
  );
  const [customerPhone, setCustomerPhone] = useState<string>(
    customerChatSession?.customerPhone || ''
  );
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (customerChatSession?.customerName && !customerName) {
      setCustomerName(customerChatSession.customerName);
    }
    if (customerChatSession?.customerPhone && !customerPhone) {
      setCustomerPhone(customerChatSession.customerPhone);
    }
  }, [customerChatSession]);

  useEffect(() => {
    if (isLiveChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isLiveChatOpen, customerChatSession?.messages?.length]);

  if (settings.enableLiveChat === false) {
    return null;
  }

  const messages = customerChatSession?.messages || [];
  const unreadCount = customerChatSession?.unreadByCustomer || 0;

  const handleSend = async (textOverride?: string) => {
    const text = (textOverride ?? messageInput).trim();
    if (!text || sending) return;
    if (!textOverride) setMessageInput('');
    setSending(true);
    try {
      await sendCustomerChatMessage({
        customerName: customerName.trim() || 'Reader',
        customerPhone: customerPhone.trim(),
        text,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Sticky Floating Live Chat Trigger Button */}
      {!isLiveChatOpen && (
        <button
          type="button"
          data-testid="live-chat-trigger"
          onClick={() => setIsLiveChatOpen(true)}
          aria-label="Open Live Chat Support"
          className="fixed bottom-18 right-3.5 md:bottom-6 md:right-6 z-40 group flex items-center gap-2 pl-3 pr-3.5 py-2.5 rounded-full bg-gradient-to-r from-[#D71920] to-[#B01218] hover:from-[#B9151B] hover:to-[#940F14] text-white shadow-xl shadow-[#D71920]/30 border border-white/20 transition-all cursor-pointer active:scale-95"
        >
          <span className="relative flex items-center justify-center">
            <MessageCircle size={19} className="group-hover:scale-110 transition-transform" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#D71920] animate-pulse" />
          </span>
          <span className="text-xs font-black tracking-tight">Live Chat</span>
          {unreadCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[#D71920] text-[10px] font-black flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Interactive Live Chat Drawer */}
      {isLiveChatOpen && (
        <div
          data-testid="live-chat-drawer"
          className="fixed bottom-16 right-2 sm:right-5 md:bottom-6 md:right-6 z-[60] w-[calc(100vw-1rem)] max-w-[370px] bg-white dark:bg-[#101623] rounded-3xl border border-neutral-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-200"
          style={{ maxHeight: '78vh' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#D71920] to-[#9E0F14] text-white p-4 flex items-center justify-between gap-3">
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
                  সরাসরি কাস্টমার কেয়ার ও অর্ডার সাপোর্ট
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLiveChatOpen(false)}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
              aria-label="Close Live Chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Customer Info Quick Strip */}
          <div className="px-3.5 py-2.5 bg-neutral-50 dark:bg-slate-900/70 border-b border-neutral-100 dark:border-slate-800 grid grid-cols-2 gap-2">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="আপনার নাম..."
              className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-neutral-900 dark:text-white focus:outline-none focus:border-[#D71920]"
            />
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="মোবাইল নম্বর (ঐচ্ছিক)"
              className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-neutral-900 dark:text-white focus:outline-none focus:border-[#D71920]"
            />
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 min-h-[220px] max-h-[340px] bg-white dark:bg-[#0D1320]">
            {/* Always show welcome bubble */}
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

            {messages.filter((m) => m.sender !== 'system').map((msg) => {
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
                        : 'rounded-tl-sm bg-emerald-50 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    {!isCustomer && (
                      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 block mb-0.5">
                        {msg.senderName || 'Support Team'}
                      </span>
                    )}
                    <p>{msg.text}</p>
                    <div
                      className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${
                        isCustomer ? 'text-white/75' : 'text-neutral-400'
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

            {/* Quick Help Chips when no user messages sent yet */}
            {messages.filter((m) => m.sender === 'customer').length === 0 && (
              <div className="pt-2 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Quick Questions (এক ক্লিকে জিজ্ঞাসা করুন)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_CHAT_TOPICS.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => void handleSend(topic)}
                      className="px-2.5 py-1 rounded-xl bg-[#FFF1F2] dark:bg-[#D71920]/15 text-[#D71920] border border-[#D71920]/25 text-[10.5px] font-bold hover:bg-[#D71920] hover:text-white transition-colors cursor-pointer"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Direct Hotline + Send Message Bar */}
          <div className="p-3 border-t border-neutral-100 dark:border-slate-800 bg-neutral-50/90 dark:bg-slate-900/90 space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                data-testid="live-chat-input"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="আপনার মেসেজ লিখুন..."
                className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-neutral-900 dark:text-white focus:outline-none focus:border-[#D71920]"
              />
              <button
                type="submit"
                disabled={!messageInput.trim() || sending}
                data-testid="live-chat-send-btn"
                className="w-9 h-9 rounded-xl bg-[#D71920] hover:bg-[#B9151B] disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer active:scale-95"
                aria-label="Send chat message"
              >
                <Send size={15} />
              </button>
            </form>

            <div className="flex items-center justify-between text-[10px] text-neutral-500 dark:text-slate-400 px-1">
              <span className="flex items-center gap-1">
                <ShieldCheck size={11} className="text-emerald-600" />
                Saved & synced in real time
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
        </div>
      )}
    </>
  );
}
