import React, { useState } from 'react';
import { useAuth, PREMIER_REGISTERED_USERS } from '../context/AuthContext';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  KeyRound,
  HardDrive,
  Info,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, resetPasswordRequest } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotFeedback, setForgotFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Quick helper accounts drawer
  const [showDirectoryHelp, setShowDirectoryHelp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await login(username, password, rememberMe);
      if (!result.success) {
        setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network communication error during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotInput.trim()) return;

    setIsResetting(true);
    setForgotFeedback(null);
    const res = await resetPasswordRequest(forgotInput);
    setIsResetting(false);

    if (res.success) {
      setForgotFeedback({ type: 'success', text: res.message });
    } else {
      setForgotFeedback({ type: 'error', text: res.message });
    }
  };

  const fillQuickAccount = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F8F5EE] text-[#303B38] font-sans relative selection:bg-[#A8DCCB] selection:text-[#303B38]">
      {/* Background Soft Pastel Ambient Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#A8DCCB]/30 blur-3xl" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 rounded-full bg-[#F4A58F]/25 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 w-96 h-96 rounded-full bg-[#BFDCCB]/35 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Main Card */}
        <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-3xl p-7 md:p-8 shadow-xl shadow-[#303B38]/5 space-y-6">
          
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#A8DCCB] to-[#BFDCCB] text-[#303B38] shadow-sm border border-[#96cebc] mx-auto mb-1">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-black tracking-widest text-[#7F8983] uppercase block">
                PREMIER AUTO PARTS LLC
              </span>
              <h1 className="text-xl md:text-2xl font-black text-[#303B38] tracking-tight">
                PREMIER IT ASSET TRACKER
              </h1>
              <p className="text-xs text-[#7F8983] mt-1">
                Branch 1-22 Centralized Inventory & Hardware Management
              </p>
            </div>
          </div>

          {/* Security Alert Badge */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#D8EEE4]/60 border border-[#A8DCCB] text-xs text-[#303B38]">
            <ShieldCheck className="w-4 h-4 text-[#303B38] shrink-0" />
            <span className="text-[11px]">
              <strong>Supabase Protected:</strong> Role-based branch partitions & full D:\ SSD backup authorization.
            </span>
          </div>

          {/* Error Message banner */}
          {errorMessage && (
            <div className="p-3 bg-[#FDECE7] border border-[#F4A58F] rounded-xl text-xs text-[#303B38] flex items-start gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-[#F4A58F] shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Username / Email */}
            <div className="space-y-1.5">
              <label className="block font-bold text-[#303B38] text-xs">
                Username or Corporate Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7F8983]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or user@premierautoparts.ae"
                  className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#303B38] placeholder-[#7F8983]/70 focus:outline-none focus:border-[#A8DCCB] focus:ring-2 focus:ring-[#A8DCCB]/30 font-medium transition shadow-2xs"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-[#303B38] text-xs">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-[#7F8983] hover:text-[#303B38] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7F8983]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your security password..."
                  className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#303B38] placeholder-[#7F8983]/70 focus:outline-none focus:border-[#A8DCCB] focus:ring-2 focus:ring-[#A8DCCB]/30 font-medium transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#7F8983] hover:text-[#303B38] cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#A8DCCB] border-[#E9E5DA] focus:ring-[#A8DCCB] cursor-pointer"
                />
                <span className="text-xs text-[#303B38] font-medium">Remember Me on this device</span>
              </label>

              <button
                type="button"
                onClick={() => setShowDirectoryHelp(!showDirectoryHelp)}
                className="text-[11px] text-[#7F8983] hover:text-[#303B38] flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Sign-In Help</span>
              </button>
            </div>

            {/* Connection & Auth Info */}
            {showDirectoryHelp && (
              <div className="bg-[#F8F5EE] border border-[#E9E5DA] rounded-2xl p-3 space-y-1.5 text-[11px] animate-in fade-in">
                <span className="font-bold text-[#303B38] uppercase tracking-wider block">
                  Centralized Supabase Authentication
                </span>
                <p className="text-[#7F8983] leading-relaxed">
                  Sign in using your registered corporate email or IT administrator username (e.g. <code className="text-[#303B38] font-mono">admin</code> or <code className="text-[#303B38] font-mono">ibrahimtirur6@gmail.com</code>). All 22 branches sync in real time to the central Supabase Cloud database.
                </p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] hover:opacity-95 text-[#303B38] font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer border border-[#91c9b6] disabled:opacity-50"
            >
              <span>{isLoading ? 'Authenticating Credentials...' : 'Sign In to Premier IT Asset Tracker'}</span>
              <ArrowRight className="w-4 h-4 text-[#303B38]" />
            </button>
          </form>

          {/* Footer note */}
          <div className="pt-2 border-t border-[#E9E5DA] text-center text-[11px] text-[#7F8983]">
            <span>Premier Auto Parts LLC • Secure Corporate IT Portal</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl shadow-2xl w-full max-w-md text-[#303B38] overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-[#F8F5EE] border-b border-[#E9E5DA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#303B38]" />
                <h3 className="font-bold text-sm text-[#303B38]">Password Reset Request</h3>
              </div>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotFeedback(null);
                }}
                className="text-[#7F8983] hover:text-[#303B38] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleForgotSubmit} className="p-6 space-y-4 text-xs">
              <p className="text-[#7F8983]">
                Enter your username or registered Premier email address. A password reset request will be dispatched to your email and logged in the security audit trail.
              </p>

              <div className="space-y-1">
                <label className="font-bold text-[#303B38]">Username or Email Address:</label>
                <input
                  type="text"
                  required
                  value={forgotInput}
                  onChange={(e) => setForgotInput(e.target.value)}
                  placeholder="e.g. admin or ibrahimtirur6@gmail.com"
                  className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-lg px-3 py-2 text-[#303B38] text-xs focus:outline-none focus:border-[#A8DCCB]"
                />
              </div>

              {forgotFeedback && (
                <div
                  className={`p-3 rounded-lg border text-xs ${
                    forgotFeedback.type === 'success'
                      ? 'bg-[#D8EEE4] border-[#A8DCCB] text-[#303B38]'
                      : 'bg-[#FDECE7] border-[#F4A58F] text-[#303B38]'
                  }`}
                >
                  {forgotFeedback.text}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#FFFDF7] border border-[#E9E5DA] hover:bg-[#E9E5DA]/50 text-[#7F8983] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] text-[#303B38] font-bold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isResetting ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
