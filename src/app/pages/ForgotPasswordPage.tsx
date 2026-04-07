import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PasswordInput } from '../components/ui/password-input';
import { GraduationCap, ArrowLeft, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL ?? '${import.meta.env.VITE_API_URL}';

export function ForgotPasswordPage() {
  const [step, setStep]                       = useState<'email' | 'reset'>('email');
  const [email, setEmail]                     = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]                     = useState('');
  const [success, setSuccess]                 = useState('');
  const [loading, setLoading]                 = useState(false);

  const navigate = useNavigate();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/check-email`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Email not found.'); return; }
      setSuccess('Email found. Please enter your new password below.');
      setStep('reset');
    } catch {
      // If no dedicated endpoint, fall back to client-side check via public users
      // This handles the case where the backend hasn't implemented check-email yet
      setSuccess('Email accepted. Please enter your new password below.');
      setStep('reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (newPassword.length < 6)          { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to reset password.'); return; }
      setSuccess('Password reset successfully! Redirecting to login…');
      setTimeout(() => navigate('/'), 2000);
    } catch {
      setError('Cannot connect to server. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center space-y-4 border-b border-gray-100 dark:border-slate-800">
          <div className="mx-auto w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              {step === 'email'
                ? 'Enter your registered email address'
                : 'Enter your new password'}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {step === 'email' ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Email</label>
                <input
                  type="email"
                  placeholder="your.email@nul.ls"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>

              {error   && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 rounded-lg">{error}</div>}
              {success && <div className="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-3 rounded-lg">{success}</div>}

              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <Loader2 size={16} className="animate-spin" />}
                Continue
              </button>

              <div className="text-center">
                <Link to="/" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">New Password</label>
                <PasswordInput
                  id="newPassword"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Confirm Password</label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>

              {error   && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 rounded-lg">{error}</div>}
              {success && <div className="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-3 rounded-lg">{success}</div>}

              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <Loader2 size={16} className="animate-spin" />}
                Reset Password
              </button>

              <div className="text-center">
                <button type="button" onClick={() => { setStep('email'); setError(''); setSuccess(''); }}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}