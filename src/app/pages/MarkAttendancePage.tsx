import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useClassSession } from '../contexts/ClassSessionContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, Clock, XCircle, BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function MarkAttendancePage() {
  const { user, token } = useAuth();
  const { courses, attendance } = useData();
  const { submitCode } = useClassSession();

  const [code, setCode]             = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState<'present' | 'late' | 'invalid' | 'closed' | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const todayRecords = attendance.filter(
    a => a.studentId === user?.id && a.date === today
  );

  const enrolledCourses = courses.filter(c =>
    (user?.enrolledCourses ?? []).includes(c.id)
  );

  const handleSubmit = async () => {
    if (!code.trim() || !user || !token) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await submitCode(code.trim(), user.id, token);
      setResult(res);
      if (res === 'present')     { toast.success('Attendance marked as Present!'); }
      else if (res === 'late')   { toast.warning('Attendance marked as Late.'); }
      else if (res === 'closed') { toast.error('Attendance window is closed.'); }
      else                       { toast.error('Invalid code. Please try again.'); }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
      setCode('');
    }
  };

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mark Attendance</h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">{todayFormatted}</p>
      </div>

      {/* Code entry */}
      <div className="bg-white dark:bg-slate-800/60 rounded-xl p-6 flex flex-col gap-4 border-2"
          style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 35%, transparent)' }}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-primary) 25%, transparent)' }}>
            <BookOpen className="w-7 h-7"
              style={{ color: 'var(--theme-primary)' }} />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">Enter Attendance Code</h2>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
            Ask your lecturer for the 6-character code to mark your attendance.
          </p>
        </div>

        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="e.g. A1B2C3"
          maxLength={6}
          className="w-full text-center text-3xl font-bold font-mono tracking-widest uppercase border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-slate-600 rounded-xl py-4 px-6 focus:outline-none focus:border-[var(--theme-primary)] transition-colors"
        />

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || code.trim().length < 6}
          className="w-full text-white py-5 text-base gap-2 border-0 disabled:opacity-40 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--theme-primary)' }}
        >
          {submitting
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <CheckCircle className="w-5 h-5" />}
          {submitting ? 'Submitting…' : 'Submit Code'}
        </Button>

        {result && (
          <div className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium border ${
            result === 'present'
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
              : result === 'late'
              ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
              : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'
          }`}>
            {result === 'present' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {result === 'late'    && <Clock className="w-5 h-5 flex-shrink-0" />}
            {(result === 'invalid' || result === 'closed') && <XCircle className="w-5 h-5 flex-shrink-0" />}
            <span>
              {result === 'present' ? 'You have been marked Present.'
               : result === 'late'    ? 'You have been marked Late.'
               : result === 'closed'  ? 'The attendance window is closed.'
               :                       'Invalid code. Check with your lecturer.'}
            </span>
          </div>
        )}
      </div>

      {/* Today's attendance status */}
      {enrolledCourses.length > 0 && (
        <div className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl p-5">
          <h3 className="font-semibold text-gray-700 dark:text-slate-300 mb-3 text-xs uppercase tracking-widest">
            Today's Status
          </h3>
          <div className="space-y-2">
            {enrolledCourses.map(course => {
              const record = todayRecords.find(r => r.courseId === course.id);
              const status = record?.status;
              return (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-gray-100 dark:border-slate-700/50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-100">{course.name}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{course.code}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize border ${
                    status === 'present'
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : status === 'late'
                      ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                      : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600/30'
                  }`}>
                    {status ?? 'not marked'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}