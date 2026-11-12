import { LiveChatMessage, LiveChatSession } from '../types';

export interface PreChatFormInput {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  firstMessage: string;
}

export interface PreChatValidationResult {
  valid: boolean;
  errors: {
    name?: string;
    phone?: string;
    email?: string;
    message?: string;
  };
  cleaned: PreChatFormInput;
}

export function validatePreChatForm(input: PreChatFormInput): PreChatValidationResult {
  const customerName = (input.customerName || '').trim();
  const customerPhone = (input.customerPhone || '').trim();
  const customerEmail = (input.customerEmail || '').trim();
  const firstMessage = (input.firstMessage || '').trim();

  const errors: PreChatValidationResult['errors'] = {};

  if (customerName.length < 2) {
    errors.name = 'আপনার পুরো নাম লিখুন (কমপক্ষে ২ অক্ষর)।';
  }

  const digits = customerPhone.replace(/[^0-9]/g, '');
  if (digits.length < 10 || digits.length > 15) {
    errors.phone = 'সঠিক মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(customerEmail)) {
    errors.email = 'সঠিক ইমেইল অ্যাড্রেস লিখুন (যেমন: name@example.com)।';
  }

  if (firstMessage.length < 1) {
    errors.message = 'দয়া করে আপনার মেসেজটি লিখুন।';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    cleaned: {
      customerName,
      customerPhone,
      customerEmail,
      firstMessage,
    },
  };
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
      // Brand new chat session arrived while admin is watching
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
// Web Audio API Synthesized Ringtones & Notification Chimes (Zero External Files)
// =========================================================================

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx) {
    try {
      sharedAudioCtx = new Ctx();
    } catch {
      return null;
    }
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function unlockChatAudioContext(): void {
  getAudioContext();
}

function playToneSequence(
  notes: Array<{ freq: number; start: number; duration: number; gain: number; type?: OscillatorType }>
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

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
    // Audio playback blocked or unavailable in headless/restricted environment
  }
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
    // Gentle repeat ring
    { freq: 987.77, start: 0.68, duration: 0.12, gain: 0.15, type: 'sine' },
    { freq: 1318.51, start: 0.8, duration: 0.3, gain: 0.18, type: 'sine' },
  ]);
}
