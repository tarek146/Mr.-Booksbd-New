import { CustomerChatSegment, LiveChatMessage, LiveChatSession, Order } from '../types';

export interface PreChatFormInput {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  firstMessage: string;
}

export interface PreChatValidationOptions {
  requireContactInfo?: boolean;
  requireEmail?: boolean;
  defaultGuestName?: string;
}

export interface PreChatValidationResult {
  valid: boolean;
  errors: {
    name?: string;
    phone?: string;
    email?: string;
    message?: string;
  };
  cleaned: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    firstMessage: string;
  };
}

export function validatePreChatForm(
  input: PreChatFormInput,
  options: PreChatValidationOptions = {}
): PreChatValidationResult {
  const {
    requireContactInfo = false,
    requireEmail = false,
    defaultGuestName = 'Guest Reader',
  } = options;

  const rawName = (input.customerName || '').trim();
  const customerPhone = (input.customerPhone || '').trim();
  const customerEmail = (input.customerEmail || '').trim();
  const firstMessage = (input.firstMessage || '').trim();

  const errors: PreChatValidationResult['errors'] = {};

  if (requireContactInfo) {
    if (rawName.length < 2) {
      errors.name = 'আপনার নাম লিখুন (কমপক্ষে ২ অক্ষর)।';
    }
    const digits = customerPhone.replace(/[^0-9]/g, '');
    if (digits.length < 10 || digits.length > 15) {
      errors.phone = 'সঠিক মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।';
    }
  } else if (customerPhone.length > 0) {
    const digits = customerPhone.replace(/[^0-9]/g, '');
    if (digits.length < 6 || digits.length > 15) {
      errors.phone = 'সঠিক মোবাইল নম্বর দিন অথবা ঘরটি খালি রাখুন।';
    }
  }

  if (requireEmail || customerEmail.length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(customerEmail)) {
      errors.email = 'সঠিক ইমেইল দিন অথবা ঘরটি খালি রাখুন।';
    }
  }

  if (firstMessage.length < 1) {
    errors.message = 'দয়া করে আপনার মেসেজটি লিখুন।';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    cleaned: {
      customerName: rawName || defaultGuestName,
      customerPhone,
      customerEmail,
      firstMessage,
    },
  };
}

/**
 * Resolves the auto-hide delay (in milliseconds) for the floating Live Chat launcher button.
 * - Default: 4000ms (4 seconds)
 * - 0 disables auto-hide (stays expanded)
 * - Non-zero values clamp between 2000ms and 30000ms
 */
export function resolveLiveChatAutoHideMs(seconds?: number): number {
  if (seconds === 0) return 0;
  const num = Number(seconds);
  if (!Number.isFinite(num) || num < 0) return 4000;
  const clampedSeconds = Math.min(30, Math.max(2, num));
  return clampedSeconds * 1000;
}

export function mergeLiveChatMessages(
  existing: LiveChatMessage[] = [],
  incoming: LiveChatMessage | LiveChatMessage[],
  maxMessages = 100
): LiveChatMessage[] {
  const incomingList = Array.isArray(incoming) ? incoming : [incoming];
  const byId = new Map<string, LiveChatMessage>();

  for (const msg of existing) {
    if (msg && msg.id) {
      byId.set(msg.id, msg);
    }
  }
  for (const msg of incomingList) {
    if (msg && msg.id) {
      byId.set(msg.id, msg);
    }
  }

  return Array.from(byId.values())
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    .slice(-maxMessages);
}

export function detectNewIncomingMessages(
  prevMessages: LiveChatMessage[],
  nextMessages: LiveChatMessage[],
  targetSender: 'customer' | 'admin'
): LiveChatMessage[] {
  const prevIds = new Set(prevMessages.map(m => m.id));
  return nextMessages.filter(m => m.sender === targetSender && !prevIds.has(m.id));
}

export function detectAdminNewCustomerActivity(
  prevSessions: LiveChatSession[],
  nextSessions: LiveChatSession[]
): {
  hasNewCustomerMessage: boolean;
  latestSession?: LiveChatSession;
  latestText?: string;
} {
  const prevMap = new Map<string, LiveChatSession>();
  for (const s of prevSessions) {
    prevMap.set(s.id, s);
  }

  for (const next of nextSessions) {
    const prev = prevMap.get(next.id);
    const nextCustomerMsgs = (next.messages || []).filter(m => m.sender === 'customer');
    if (nextCustomerMsgs.length === 0) continue;

    if (!prev) {
      if ((next.unreadByAdmin || 0) > 0) {
        const lastMsg = nextCustomerMsgs[nextCustomerMsgs.length - 1];
        return {
          hasNewCustomerMessage: true,
          latestSession: next,
          latestText: lastMsg?.text || next.lastMessageText,
        };
      }
      continue;
    }

    const prevIds = new Set((prev.messages || []).map(m => m.id));
    const newlyArrived = nextCustomerMsgs.find(m => !prevIds.has(m.id));
    if (newlyArrived) {
      return {
        hasNewCustomerMessage: true,
        latestSession: next,
        latestText: newlyArrived.text,
      };
    }
  }

  return { hasNewCustomerMessage: false };
}

// =========================================================================
// Customer Segmentation, Buyer Matching & Inbox Organization Helpers
// =========================================================================

export const CUSTOMER_SEGMENT_META: Record<
  CustomerChatSegment,
  {
    label: string;
    shortLabel: string;
    badgeClass: string;
  }
> = {
  general: {
    label: 'General Inquiry / সাধারণ',
    shortLabel: 'সাধারণ',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  vip: {
    label: 'VIP Customer / ভিআইপি',
    shortLabel: 'VIP',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  order_issue: {
    label: 'Order & Delivery / অর্ডার',
    shortLabel: 'অর্ডার/ডেলিভারি',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  payment_return: {
    label: 'Payment & Return / পেমেন্ট',
    shortLabel: 'পেমেন্ট/রিটার্ন',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  follow_up: {
    label: 'Follow-Up / ফলো-আপ',
    shortLabel: 'ফলো-আপ',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
};

export const DEFAULT_LIVE_CHAT_QUICK_REPLIES: string[] = [
  'আসসালামু আলাইকুম! অনুগ্রহ করে আপনার অর্ডার নম্বরটি বলুন, আমি এখনই চেক করে জানাচ্ছি।',
  'আপনার অর্ডারটি কুরিয়ারে হ্যান্ডওভার করা হয়েছে। ইনশাআল্লাহ ১-২ দিনের মধ্যে পেয়ে যাবেন।',
  'বইটি বর্তমানে আমাদের স্টকে রয়েছে। সরাসরি অর্ডার করতে পারেন।',
  'ধন্যবাদ MR. BOOKS-এর সাথে থাকার জন্য! আর কোনো সহায়তা লাগলে জানাবেন।',
];

export function normalizePhoneLast10(phone?: string): string {
  const digits = (phone || '').replace(/[^0-9]/g, '');
  if (digits.length < 8) return '';
  return digits.slice(-10);
}

export interface CustomerOrderMatchSummary {
  orderCount: number;
  totalSpent: number;
  latestOrder: Order | null;
  isReturningBuyer: boolean;
}

export function matchCustomerOrders(
  orders: Order[],
  customerPhone?: string,
  customerEmail?: string
): CustomerOrderMatchSummary {
  const targetPhone = normalizePhoneLast10(customerPhone);
  const targetEmail = (customerEmail || '').trim().toLowerCase();

  if (!targetPhone && !targetEmail) {
    return { orderCount: 0, totalSpent: 0, latestOrder: null, isReturningBuyer: false };
  }

  const matched = orders.filter(order => {
    const orderPhone = normalizePhoneLast10(order.phone);
    const orderAltPhone = normalizePhoneLast10(order.optionalPhone);
    if (targetPhone && (orderPhone === targetPhone || orderAltPhone === targetPhone)) {
      return true;
    }
    const orderEmail = (order.email || '').trim().toLowerCase();
    if (targetEmail && orderEmail && orderEmail === targetEmail) {
      return true;
    }
    return false;
  });

  if (matched.length === 0) {
    return { orderCount: 0, totalSpent: 0, latestOrder: null, isReturningBuyer: false };
  }

  const sorted = [...matched].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const totalSpent = sorted.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  return {
    orderCount: sorted.length,
    totalSpent,
    latestOrder: sorted[0] || null,
    isReturningBuyer: true,
  };
}

export function getLatestChatMessageText(session: LiveChatSession): string {
  const msgs = session.messages || [];
  for (let i = msgs.length - 1; i >= 0; i--) {
    const msg = msgs[i];
    if (msg && msg.text && msg.text.trim()) {
      return msg.text.trim();
    }
  }
  return (session.lastMessageText || '').trim();
}

export function getLatestChatSender(session: LiveChatSession): 'customer' | 'admin' | 'system' | null {
  const msgs = session.messages || [];
  if (msgs.length === 0) return null;
  return msgs[msgs.length - 1]?.sender || null;
}

export type InboxStatusFilter = 'all' | 'unread' | 'open' | 'resolved';
export type InboxBuyerFilter = 'all' | 'returning' | 'new';

export interface OrganizedChatSession {
  session: LiveChatSession;
  segment: CustomerChatSegment;
  orderMatch: CustomerOrderMatchSummary;
  latestText: string;
  latestSender: 'customer' | 'admin' | 'system' | null;
}

export function filterAndOrganizeChatSessions(
  sessions: LiveChatSession[],
  orders: Order[],
  options: {
    statusFilter?: InboxStatusFilter;
    segmentFilter?: 'all' | CustomerChatSegment;
    buyerFilter?: InboxBuyerFilter;
    searchQuery?: string;
  } = {}
): OrganizedChatSession[] {
  const {
    statusFilter = 'all',
    segmentFilter = 'all',
    buyerFilter = 'all',
    searchQuery = '',
  } = options;

  const q = searchQuery.trim().toLowerCase();

  const enriched: OrganizedChatSession[] = sessions.map(session => {
    const orderMatch = matchCustomerOrders(orders, session.customerPhone, session.customerEmail);
    const segment: CustomerChatSegment =
      session.customerSegment ||
      (orderMatch.orderCount >= 2 ? 'vip' : 'general');

    return {
      session,
      segment,
      orderMatch,
      latestText: getLatestChatMessageText(session),
      latestSender: getLatestChatSender(session),
    };
  });

  const filtered = enriched.filter(item => {
    const { session, segment, orderMatch, latestText } = item;

    if (statusFilter === 'unread' && (session.unreadByAdmin || 0) <= 0) return false;
    if (statusFilter === 'open' && session.status !== 'open') return false;
    if (statusFilter === 'resolved' && session.status !== 'resolved') return false;

    if (segmentFilter !== 'all' && segment !== segmentFilter) return false;

    if (buyerFilter === 'returning' && !orderMatch.isReturningBuyer) return false;
    if (buyerFilter === 'new' && orderMatch.isReturningBuyer) return false;

    if (q) {
      const hay = [
        session.customerName,
        session.customerPhone,
        session.customerEmail,
        session.topic,
        session.adminNote,
        latestText,
        ...(session.messages || []).map(m => m.text),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }

    return true;
  });

  // Sort: unread customer inquiries at top, then most recent activity
  return filtered.sort((a, b) => {
    const aUnread = a.session.unreadByAdmin || 0;
    const bUnread = b.session.unreadByAdmin || 0;
    if (aUnread > 0 && bUnread === 0) return -1;
    if (bUnread > 0 && aUnread === 0) return 1;
    return (b.session.lastMessageAt || 0) - (a.session.lastMessageAt || 0);
  });
}

// =========================================================================
// Web Audio API Synthesized Ringtones & Notification Chimes (Zero External Files)
// =========================================================================

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx) {
    try {
      sharedAudioCtx = new Ctx();
    } catch {
      return null;
    }
  }
  return sharedAudioCtx;
}

export function unlockChatAudioContext(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

function scheduleTones(
  ctx: AudioContext,
  notes: Array<{ freq: number; start: number; duration: number; gain: number; type?: OscillatorType }>
): void {
  try {
    const now = ctx.currentTime;
    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = note.type || 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.start);

      gainNode.gain.setValueAtTime(0.0001, now + note.start);
      gainNode.gain.exponentialRampToValueAtTime(note.gain, now + note.start + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + note.start);
      osc.stop(now + note.start + note.duration + 0.02);
    }
  } catch {
    // Audio playback blocked or unavailable in restricted environment
  }
}

function playToneSequence(
  notes: Array<{ freq: number; start: number; duration: number; gain: number; type?: OscillatorType }>
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx
      .resume()
      .then(() => scheduleTones(ctx, notes))
      .catch(() => {});
    return;
  }

  scheduleTones(ctx, notes);
}

/** Soft confirmation chime when sending a message (both Customer and Admin) */
export function playOutgoingChatChime(): void {
  playToneSequence([
    { freq: 587.33, start: 0, duration: 0.08, gain: 0.09, type: 'sine' }, // D5
    { freq: 880, start: 0.06, duration: 0.12, gain: 0.11, type: 'sine' }, // A5
  ]);
}

/** Bright melodic notification chime when Customer receives a reply from Admin */
export function playCustomerIncomingChime(): void {
  playToneSequence([
    { freq: 783.99, start: 0, duration: 0.14, gain: 0.15, type: 'triangle' }, // G5
    { freq: 1046.5, start: 0.12, duration: 0.22, gain: 0.18, type: 'sine' }, // C6
    { freq: 1318.51, start: 0.26, duration: 0.32, gain: 0.14, type: 'sine' }, // E6
  ]);
}

/** Clear ringtone melody in Admin Panel when a new Customer message arrives */
export function playAdminIncomingRingtone(): void {
  playToneSequence([
    { freq: 659.25, start: 0, duration: 0.12, gain: 0.18, type: 'triangle' }, // E5
    { freq: 783.99, start: 0.11, duration: 0.12, gain: 0.18, type: 'triangle' }, // G5
    { freq: 987.77, start: 0.22, duration: 0.14, gain: 0.2, type: 'sine' }, // B5
    { freq: 1318.51, start: 0.34, duration: 0.26, gain: 0.22, type: 'sine' }, // E6
    { freq: 987.77, start: 0.68, duration: 0.12, gain: 0.15, type: 'sine' },
    { freq: 1318.51, start: 0.8, duration: 0.3, gain: 0.18, type: 'sine' },
  ]);
}

