import { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Users, UserCircle, TrendingUp, Building2, Edit2, X, Loader2, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export function AdminDashboard() {
  const { users, courses, attendance } = useData();
  const { user, token, updateCurrentUser } = useAuth();

  const students  = useMemo(() => users.filter(u => u.role === 'student'),  [users]);
  const lecturers = useMemo(() => users.filter(u => u.role === 'lecturer'), [users]);

  const stats = [
    { title: 'Total Students',     value: students.length,   icon: <Users className="w-6 h-6 text-white" />,      bg: 'bg-red-500'    },
    { title: 'Total Courses',      value: courses.length,    icon: <BookOpen className="w-6 h-6 text-white" />,   bg: 'bg-orange-500' },
    { title: 'Total Lecturers',    value: lecturers.length,  icon: <UserCircle className="w-6 h-6 text-white" />, bg: 'bg-amber-500'  },
    { title: 'Attendance Records', value: attendance.length, icon: <TrendingUp className="w-6 h-6 text-white" />, bg: 'bg-rose-500'   },
  ];

  const quickActions = [
    { to: '/students',    icon: <Users className="w-5 h-5" />,      label: 'Manage Students'                 },
    { to: '/courses',     icon: <BookOpen className="w-5 h-5" />,   label: 'Manage Courses'                  },
    { to: '/lecturers',   icon: <UserCircle className="w-5 h-5" />, label: 'Manage Lecturers'                },
    { to: '/reports',     icon: <TrendingUp className="w-5 h-5" />, label: 'View Reports'                    },
    { to: '/departments', icon: <Building2 className="w-5 h-5" />,  label: 'Manage Departments & Programmes' },
  ];

  // ── Edit profile modal ───────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });

  const openEdit = () => {
    setForm({
      name:            user?.name    ?? '',
      email:           user?.email   ?? '',
      phone:           user?.phone   ?? '',
      password:        '',
      confirmPassword: '',
    });
    setError('');
    setSaved(false);
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim())  { setError('Name is required.');  return; }
    if (!form.email.trim()) { setError('Email is required.'); return; }
    if (form.password && form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirmPassword)    { setError('Passwords do not match.'); return; }

    if (!user || !token) return;
    setSaving(true);
    setError('');

    try {
      const body: Record<string, string> = {
        name:  form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      };
      if (form.password) body.password = form.password;

      const res  = await fetch(`${API}/users/${user.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to update profile.'); return; }

      updateCurrentUser({ name: data.name, email: data.email, phone: data.phone });
      setSaved(true);
      setTimeout(() => setEditOpen(false), 800);
    } catch {
      setError('Cannot connect to server.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent";

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {user?.name} · {user?.staffId ?? 'No staff ID'} · {user?.email}
          </p>
        </div>
        <button
          onClick={openEdit}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors hover:opacity-90 text-white shrink-0"
          style={{ backgroundColor: 'var(--theme-primary)' }}
        >
          <Edit2 size={14} /> Edit Profile
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map(stat => (
          <div key={stat.title} className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={`${stat.bg} p-3 rounded-lg shadow-sm`}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent courses */}
        <div className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Courses</h2>
          </div>
          <div className="p-5 space-y-3">
            {courses.slice(0, 5).map(course => {
              const lecturer      = lecturers.find(l => l.id === course.lecturerId);
              const enrolledCount = students.filter(s => (s.enrolledCourses ?? []).includes(course.id)).length;
              return (
                <div key={course.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 border border-gray-100 dark:border-slate-700/50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm">{course.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{course.code}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                      {lecturer?.name ?? 'Unassigned'} · {enrolledCount} student{enrolledCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full border"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)',
                      borderColor:     'color-mix(in srgb, var(--theme-primary) 25%, transparent)',
                      color:           'var(--theme-primary)',
                    }}>
                    Year {course.year ?? '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="p-5 space-y-2">
            {quickActions.map(({ to, icon, label }) => (
              <Link key={to} to={to}>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors text-sm font-medium">
                  {icon} {label}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">Edit Profile</h2>
              <button onClick={() => setEditOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-2 rounded-lg">
                  {error}
                </p>
              )}

              {[
                { label: 'Full Name *', key: 'name',  placeholder: 'Your name',  type: 'text'  },
                { label: 'Email *',     key: 'email', placeholder: 'your@email', type: 'email' },
                { label: 'Phone',       key: 'phone', placeholder: '+266 5000 0000', type: 'text' },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">{label}</label>
                  <input
                    type={type}
                    value={(form as any)[key]}
                    onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className={inputCls}
                  />
                </div>
              ))}

              <div className="pt-1 border-t border-gray-100 dark:border-slate-700">
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">Leave password blank to keep current password</p>
                {[
                  { label: 'New Password',     key: 'password',        placeholder: 'At least 6 characters' },
                  { label: 'Confirm Password', key: 'confirmPassword', placeholder: 'Repeat new password'   },
                ].map(({ label, key, placeholder }) => (
                  <div key={key} className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">{label}</label>
                    <input
                      type="password"
                      value={(form as any)[key]}
                      onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 pt-0 flex gap-3">
              <button onClick={() => setEditOpen(false)}
                className="flex-1 border border-gray-200 dark:border-slate-700 rounded-lg py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || saved}
                className="flex-1 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-70 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: saved ? '#10b981' : 'var(--theme-primary)' }}>
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                : saved  ? <><Check size={14} /> Saved!</>
                :          'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}