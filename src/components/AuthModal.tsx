import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, ShieldCheck } from 'lucide-react';
import { useAuth as useAuthContext } from '../context/AuthContext';
import { ADMIN_EMAIL } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const [isSignIn, setIsSignIn] = useState(initialMode === 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, loginAsDemoAdmin } = useAuthContext();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignIn) {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFillAdminDemo = () => {
    loginAsDemoAdmin();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-[#E5E5E5]">
        {/* Header */}
        <div className="bg-[#D71920] p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
          <div className="text-2xl font-black tracking-tight">MR. BOOKS</div>
          <p className="text-white/90 text-xs mt-1">
            {isSignIn ? 'Sign in to track orders, wishlist, and fast checkout' : 'Create an account for one-click orders'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 bg-white">
          {error && (
            <div className="mb-4 p-3 bg-[#FFF1F2] border border-[#D71920]/30 text-[#D71920] rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isSignIn && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5F6368] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777777]" size={16} />
                  <input 
                    type="text" 
                    required 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717] text-xs focus:bg-white focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5F6368] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777777]" size={16} />
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717] text-xs focus:bg-white focus:outline-none focus:border-[#D71920]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5F6368] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777777]" size={16} />
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717] text-xs focus:bg-white focus:outline-none focus:border-[#D71920]"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl shadow-lg shadow-[#D71920]/25 transition-all text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Processing...' : (isSignIn ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* Quick Demo Admin Fill */}
          <div className="mt-4 pt-4 border-t border-[#EEEEEE] text-center">
            <button 
              onClick={handleFillAdminDemo}
              className="inline-flex items-center gap-1.5 text-xs text-[#5F6368] hover:text-[#D71920] font-medium py-1.5 px-3 bg-[#F7F7F8] hover:bg-[#FFF1F2] rounded-lg border border-[#E5E5E5] transition-colors cursor-pointer"
            >
              <ShieldCheck size={14} className="text-[#D71920]" />
              Fill Admin Credentials (mr.booksbd700@gmail.com)
            </button>
          </div>

          {/* Toggle mode */}
          <div className="mt-4 text-center text-xs text-[#5F6368]">
            {isSignIn ? "Don't have an account yet? " : "Already registered? "}
            <button 
              onClick={() => setIsSignIn(!isSignIn)} 
              className="text-[#D71920] font-bold hover:underline cursor-pointer"
            >
              {isSignIn ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
