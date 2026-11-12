import React, { useState, useEffect, useRef } from 'react';
import { LiveChatSession } from '../../types';
import {
  MessageCircle,
  Send,
  CheckCircle2,
  Trash2,
  User,
  Phone,
  Clock,
  Tag,
} from 'lucide-react';

interface AdminLiveChatManagerProps {
  sessions: LiveChatSession[];
  onReply: (chatId: string, text: string) => Promise<void>;
  onUpdateStatus: (chatId: string, status: 'open' | 'resolved') => Promise<void>;
  onMarkRead: (chatId: string) => Promise<void>;
  onDeleteSession: (chatId: string) => Promise<void>;
  setToast: (t: { show: boolean; type: 'success' | 'error'; message: string }) => void;
}

export function AdminLiveChatManager({
  sessions,
  onReply,
  onUpdateStatus,
  onMarkRead,
  onDeleteSession,
  setToast,
}: AdminLiveChatManagerProps) {
  const [selectedId, setSelectedId] = useState<string>(sessions[0]?.id || '');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedId && sessions.length > 0) {
      setSelectedId(sessions[0].id);
    } else if (selectedId && !sessions.some(s => s.id === selectedId) && sessions.length > 0) {
      setSelectedId(sessions[0].id);
    }
  }, [sessions, selectedId]);

  const activeSession = sessions.find(s => s.id === selectedId) || sessions[0] || null;

  useEffect(() => {
    if (activeSession && activeSession.unreadByAdmin && activeSession.unreadByAdmin > 0) {
      void onMarkRead(activeSession.id);
    }
  }, [activeSession?.id, activeSession?.unreadByAdmin]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages?.length]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !replyText.trim()) return;
    setSending(true);
    try {
      await onReply(activeSession.id, replyText.trim());
      setReplyText('');
    } catch {
      setToast({ show: true, type: 'error', message: 'রিপ্লাই পাঠাতে সমস্যা হয়েছে।' });
    } finally {
      setSending(false);
    }
  };

  const unreadTotal = sessions.reduce((sum, s) => sum + (s.unreadByAdmin || 0), 0);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-3xl border border-neutral-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/20 flex items-center justify-center shrink-0">
            <MessageCircle size={22} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-neutral-900 flex items-center gap-2">
              <span>Customer Live Chat Inbox</span>
              {unreadTotal > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#D71920] text-white text-[11px] font-black">
                  {unreadTotal} Unread
                </span>
              )}
            </h2>
            <p className="text-xs text-neutral-500">
              স্টোরফ্রন্ট থেকে কাস্টমারদের পাঠানো লাইভ মেসেজ দেখুন ও রিয়েল-টাইম উত্তর দিন।
            </p>
          </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200 p-12 text-center space-y-2">
          <MessageCircle size={38} className="mx-auto text-neutral-300" />
          <h3 className="font-bold text-base text-neutral-800">এখনো কোনো লাইভ চ্যাট মেসেজ আসেনি</h3>
          <p className="text-xs text-neutral-500">
            কাস্টমার ওয়েবসাইটের ডান-নিচের &quot;Live Chat&quot; বাটনে ক্লিক করে মেসেজ পাঠালে এখানে রিয়েল-টাইম দেখা যাবে।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Left: Thread List (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-neutral-200/90 overflow-hidden shadow-xs flex flex-col max-h-[600px]">
            <div className="p-3.5 border-b border-neutral-100 font-black text-xs uppercase tracking-wider text-neutral-600 bg-neutral-50">
              Active Conversations ({sessions.length})
            </div>
            <div className="divide-y divide-neutral-100 overflow-y-auto flex-1">
              {sessions.map(session => {
                const isSelected = activeSession?.id === session.id;
                const lastMsg = session.messages[session.messages.length - 1];
                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => setSelectedId(session.id)}
                    className={`w-full text-left p-3.5 transition-colors cursor-pointer space-y-1 ${
                      isSelected ? 'bg-[#FFF1F2]/80 border-l-4 border-[#D71920]' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-neutral-900 truncate flex items-center gap-1.5">
                        <User size={12} className="text-[#D71920] shrink-0" />
                        {session.customerName}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {(session.unreadByAdmin || 0) > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#D71920] text-white text-[9px] font-black">
                            {session.unreadByAdmin}
                          </span>
                        )}
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            session.status === 'resolved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>
                    </div>
                    {session.topic && (
                      <div className="text-[10px] font-semibold text-neutral-500 flex items-center gap-1 truncate">
                        <Tag size={10} /> {session.topic}
                      </div>
                    )}
                    {lastMsg && (
                      <p className="text-[11px] text-neutral-600 truncate">
                        {lastMsg.sender === 'admin' ? 'You: ' : ''}
                        {lastMsg.text}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Active Conversation Window (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-neutral-200/90 shadow-xs flex flex-col h-[600px] overflow-hidden">
            {activeSession && (
              <>
                <div className="p-4 border-b border-neutral-100 bg-neutral-50/70 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-sm text-neutral-900 flex items-center gap-2">
                      <span>{activeSession.customerName}</span>
                      {activeSession.customerPhone && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-600 bg-white px-2 py-0.5 rounded-lg border border-neutral-200">
                          <Phone size={11} className="text-[#D71920]" /> {activeSession.customerPhone}
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-3 text-[11px] text-neutral-500 mt-0.5">
                      <span>Topic: <strong>{activeSession.topic || 'General Inquiry'}</strong></span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {new Date(activeSession.lastMessageAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateStatus(
                          activeSession.id,
                          activeSession.status === 'resolved' ? 'open' : 'resolved'
                        )
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer border ${
                        activeSession.status === 'resolved'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-600 text-white border-emerald-600'
                      }`}
                    >
                      <CheckCircle2 size={13} />
                      <span>{activeSession.status === 'resolved' ? 'Re-open Chat' : 'Mark Resolved'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSession(activeSession.id)}
                      className="p-2 rounded-xl border border-neutral-200 text-neutral-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Delete chat thread"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#F8FAFC]">
                  {activeSession.messages.map(msg => {
                    const isAdmin = msg.sender === 'admin';
                    return (
                      <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                            isAdmin
                              ? 'bg-[#D71920] text-white rounded-br-sm'
                              : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-sm'
                          }`}
                        >
                          <span className={`block text-[9.5px] font-black mb-0.5 ${isAdmin ? 'text-white/80' : 'text-[#D71920]'}`}>
                            {msg.senderName}
                          </span>
                          <p className="whitespace-pre-line">{msg.text}</p>
                        </div>
                        <span className="text-[9px] text-neutral-400 mt-0.5 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendReply} className="p-3 border-t border-neutral-100 bg-white flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Write a helpful reply to the customer..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs bg-neutral-50 focus:bg-white focus:outline-none focus:border-[#D71920]"
                  />
                  <button
                    type="submit"
                    disabled={sending || !replyText.trim()}
                    className="px-4 py-2.5 bg-[#D71920] hover:bg-[#b8141a] disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send size={14} /> <span>Send Reply</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
