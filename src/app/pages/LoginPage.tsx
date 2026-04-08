import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { type User } from '../contexts/DataContext';
import { Button } from '../components/ui/button';
import { PasswordInput } from '../components/ui/password-input';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { GraduationCap, Loader2, ShieldCheck } from 'lucide-react';

const API          = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
const ADMIN_SECRET = 'NUL-ADMIN-2026'; // ← change this to your secret

export function LoginPage() {
  const [step, setStep]           = useState<'credentials' | 'admin_code'>('credentials');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  // Temporarily hold the API response while admin enters the secret code.
  // We do NOT call login() until the code is verified — so no session is
  // established and the admin cannot navigate away to bypass the check.
  const [pendingUser,  setPendingUser]  = useState<User | null>(null);
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  // login() is the manual finaliser from AuthContext — sets user + token
  const { login } = useAuth();
  const navigate  = useNavigate();

  // ── Step 1: hit the API directly, don't touch AuthContext yet ──
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res  = await fetch(`${API}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Invalid credentials. Please try again.');
        return;
      }

      const user: User    = data.user;
      const token: string = data.token;

      if (user.role === 'admin') {
        // Park the credentials — do NOT login yet
        setPendingUser(user);
        setPendingToken(token);
        setStep('admin_code');
      } else {
        // Non-admin: complete login immediately
        login(user, token);
        if (user.role === 'lecturer') navigate('/lecturer-dashboard');
        else                          navigate('/student-dashboard');
      }
    } catch {
      setError('Cannot connect to server. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify secret, then and only then complete login ──
  const handleAdminCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!pendingUser || !pendingToken) {
      setError('Session expired. Please log in again.');
      handleBack();
      return;
    }

    if (adminCode.trim() !== ADMIN_SECRET) {
      setError('Invalid admin code. Access denied.');
      setAdminCode('');
      return;
    }

    // Only now do we establish the session
    login(pendingUser, pendingToken);
    navigate('/admin-dashboard');
  };

  const handleBack = () => {
    setStep('credentials');
    setError('');
    setAdminCode('');
    setPendingUser(null);
    setPendingToken(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center space-y-4 border-b border-gray-100 dark:border-slate-800">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
            step === 'admin_code' ? 'bg-red-600' : 'bg-indigo-600'}`}>
            {step === 'admin_code'
              ? <ShieldCheck className="w-9 h-9 text-white" />
              : <GraduationCap className="w-9 h-9 text-white" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {step === 'admin_code' ? 'Admin Verification' : 'HEADCOUNT'}
            </h1>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {step === 'credentials' ? (
            <form onSubmit={handleCredentials} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-gray-700 dark:text-slate-300 text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@nul.ls"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-gray-700 dark:text-slate-300 text-sm">Password</Label>
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white border-0 py-2.5"
                disabled={loading}
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin mr-2" />Signing in...</>
                  : 'Sign In'}
              </Button>

              <div className="text-center space-y-2 pt-1">
                <Link to="/forgot-password" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline block">
                  Forgot Password?
                </Link>
                <Link to="/register" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline block">
                  Don't have an account? Register
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdminCode} className="space-y-4">
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-sm text-amber-800 dark:text-amber-400">
                Admin credentials verified. Enter the secret admin code to complete login.
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adminCode" className="text-gray-700 dark:text-slate-300 text-sm">
                  Admin Secret Code
                </Label>
                <PasswordInput
                  id="adminCode"
                  placeholder="Enter secret code"
                  value={adminCode}
                  onChange={e => setAdminCode(e.target.value)}
                  required
                  autoFocus
                  className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-500 text-white border-0"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Verify &amp; Enter
              </Button>

              <button
                type="button"
                onClick={handleBack}
                className="w-full text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
              >
                ← Back to login
              </button>
            </form>
          )}

          {/* Demo credentials */}
          {step === 'credentials' && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/50 rounded-lg space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                Demo credentials
              </p>
              <div className="text-xs space-y-1 text-gray-600 dark:text-slate-300">
                <p><strong className="text-gray-800 dark:text-slate-100">NO MALICIOUS ACTIVITIES WILL BE TOLERATED</p>
                <p><strong className="text-gray-800 dark:text-slate-100">PLEASE!</p>
                <p><strong className="text-gray-800 dark:text-slate-100">OWEE! ONLY REGISTER AS A STUDENT</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
