import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useClassSession, fmtTime, type ClassDuration } from '../contexts/ClassSessionContext';
import {
  Clock, CheckCircle, Copy, ArrowLeft, Users, PlayCircle, StopCircle, BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

type ManualStatus = 'present' | 'late' | 'absent';

export function TakeAttendancePage() {
  const { token } = useAuth();
  const { users, courses, attendance, refreshAttendance } = useData();
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const courseId       = searchParams.get('course') ?? '';

  const {
    session, phase, classSecondsLeft, attendanceSecondsLeft,
    classDuration, setClassDuration,
    beginClass, openAttendance, endClass, fetchActiveSession, manualMark,
  } = useClassSession();

  const [starting,  setStarting]  = useState(false);
  const [opening,   setOpening]   = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const course = courses.find(c => c.id === courseId);

  const today          = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const studentCount = users.filter(
    u => u.role === 'student' && (u.enrolledCourses ?? []).includes(courseId)
  ).length;

  useEffect(() => {
    if (courseId && token) fetchActiveSession(courseId, token);
  }, [courseId, token]);

  const courseStudents = useMemo(
    () => users.filter(u => u.role === 'student' && (u.enrolledCourses ?? []).includes(courseId)),
    [users, courseId]
  );

  const todayRecords = useMemo(
    () => attendance.filter(a => a.courseId === courseId && a.date === today),
    [attendance, courseId, today]
  );

  const presentCount = todayRecords.filter(r => r.status === 'present').length;
  const lateCount    = todayRecords.filter(r => r.status === 'late').length;
  const absentCount  = courseStudents.length - presentCount - lateCount;

  const sessionIsForThisCourse = session?.courseId === courseId;
  const classActive = sessionIsForThisCourse &&
    (phase === 'class_started' || phase === 'attendance' || phase === 'late');
  const attendanceIsOpen = classActive && (phase === 'attendance' || phase === 'late');

  const handleBeginClass = async () => {
    if (!token || !courseId) return;
    setStarting(true);
    try {
      await beginClass(courseId, token);
      toast.success(`Class started! ${classDuration}-minute timer is running.`);
    } catch {
      toast.error('Failed to start class. Please try again.');
    } finally { setStarting(false); }
  };

  const handleOpenAttendance = async () => {
    if (!token) return;
    setOpening(true);
    try {
      await openAttendance(token);
      toast.success('Attendance window opened! 15-minute timer started.');
    } catch {
      toast.error('Failed to open attendance.');
    } finally { setOpening(false); }
  };

  const handleEndClass = async () => {
    if (!token) return;
    if (!confirm('Are you sure you want to end this class?')) return;
    await endClass(token);
    toast.success('Class ended.');
  };

  const handleManualMark = async (studentId: string, status: ManualStatus) => {
    if (!token) return;
    setMarkingId(studentId);
    try {
      await manualMark(studentId, status, token);
      await refreshAttendance();
      toast.success(`Marked as ${status}.`);
    } catch {
      toast.error('Failed to mark attendance.');
    } finally { setMarkingId(null); }
  };

  const copyCode = () => {
    if (session?.code) {
      navigator.clipboard.writeText(session.code);
      toast.success('Code copied to clipboard!');
    }
  };

  const RADIUS        = 60;
  const CIRCUM        = 2 * Math.PI * RADIUS;
  const attProgress   = attendanceSecondsLeft / (15 * 60);
  const attDashOffset = CIRCUM * (1 - attProgress);

  // Shared card style
  const cardCls = "bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl";

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <button type="button" onClick={() => navigate('/lecturer-dashboard')}
            className="flex items-center gap-1 text-sm text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Class Attendance</h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">{todayFormatted}</p>
          {course && (
            <p className="text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4" />
              {course.name} · {course.code} · {studentCount} students
            </p>
          )}
        </div>

        {classActive && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)', color: 'var(--theme-primary)' }}>
            <Clock className="w-4 h-4" />
            Class: {fmtTime(classSecondsLeft)}
          </div>
        )}
      </div>

      {/* Step 1: Begin Class */}
      {!classActive && (
        <div className={`${cardCls} border-2 mb-6 p-8 flex flex-col items-center gap-4 text-center`}
          style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, transparent)' }}>
            <PlayCircle className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {phase === 'ended' ? 'Class ended — start a new one?' : 'Begin the class to take attendance'}
            </h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
              Choose a duration and start a session for <strong>{course?.name ?? 'this course'}</strong>.
            </p>
          </div>

          {/* Duration picker */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-slate-400 font-medium">Class duration:</span>
            <div className="flex rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
              {([50, 110] as ClassDuration[]).map(d => (
                <button key={d} type="button" onClick={() => setClassDuration(d)}
                  className="px-4 py-2 text-sm font-medium transition-colors text-white"
                  style={classDuration === d
                    ? { backgroundColor: 'var(--theme-primary)' }
                    : { backgroundColor: 'transparent', color: 'inherit' }}
                  >
                  <span className={classDuration === d ? 'text-white' : 'text-gray-600 dark:text-slate-300'}>
                    {d === 50 ? '50 min' : '1h 50min'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={handleBeginClass} disabled={starting || !courseId}
            className="flex items-center gap-2 text-white px-8 py-3 rounded-lg text-base font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--theme-primary)' }}>
            <PlayCircle className="w-5 h-5" />
            {starting ? 'Starting…' : 'Begin Class'}
          </button>
        </div>
      )}

      {/* Step 2: Class running, attendance not opened */}
      {classActive && phase === 'class_started' && (
        <div className={`${cardCls} border-2 border-emerald-200 dark:border-emerald-500/30 mb-6 p-8 flex flex-col items-center gap-4 text-center`}>
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Class is running</h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
              Open the attendance window to generate a code and allow students to mark themselves present.
            </p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={handleOpenAttendance} disabled={opening}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg text-base font-medium disabled:opacity-50 transition-colors">
              <CheckCircle className="w-5 h-5" />
              {opening ? 'Opening…' : 'Open Attendance Window'}
            </button>
            <button type="button" onClick={handleEndClass}
              className="flex items-center gap-2 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 px-4 py-3 rounded-lg text-sm font-medium transition-colors">
              <StopCircle className="w-4 h-4" /> End Class Early
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Attendance window open */}
      {attendanceIsOpen && session && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Code display */}
          <div className={`${cardCls} border-2 p-6 flex flex-col items-center gap-3 ${
            phase === 'attendance'
              ? 'border-emerald-300 dark:border-emerald-500/30'
              : 'border-amber-300 dark:border-amber-500/30'
          }`}>
            <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-slate-500 font-medium">Attendance Code</p>
            <div className="text-6xl font-bold font-mono tracking-widest text-gray-800 dark:text-white select-all">
              {session.code}
            </div>
            <button type="button" onClick={copyCode}
              className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200 transition-colors">
              <Copy className="w-3.5 h-3.5" /> Copy code
            </button>
            <span className={`mt-1 px-3 py-1 rounded-full text-xs font-medium border ${
              phase === 'attendance'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
            }`}>
              {phase === 'attendance' ? '✅ Attendance open' : '⏰ Late window — class still running'}
            </span>
            <button type="button" onClick={handleEndClass}
              className="mt-2 w-full flex items-center justify-center gap-2 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 py-2 rounded-lg text-sm font-medium transition-colors">
              <StopCircle className="w-4 h-4" /> End Class Early
            </button>
          </div>

          {/* Timer */}
          <div className={`${cardCls} p-6 flex flex-col items-center gap-3`}>
            {phase === 'attendance' ? (
              <>
                <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-slate-500 font-medium">Attendance closes in</p>
                <div className="relative w-36 h-36">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="#e2e8f0" strokeWidth="10" className="dark:stroke-slate-700" />
                    <circle cx="70" cy="70" r={RADIUS} fill="none" strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={CIRCUM} strokeDashoffset={attDashOffset}
                      className={`transition-all duration-1000 ${
                        attendanceSecondsLeft < 120 ? 'stroke-red-500' :
                        attendanceSecondsLeft < 300 ? 'stroke-amber-400' : 'stroke-emerald-500'
                      }`} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold font-mono text-gray-800 dark:text-white">{fmtTime(attendanceSecondsLeft)}</span>
                    <span className="text-xs text-gray-400 dark:text-slate-500">left</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500 text-center">After this, students can still enter late until class ends</p>
              </>
            ) : (
              <>
                <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-slate-500 font-medium">Late window — class ends in</p>
                <div className="flex items-center justify-center w-36 h-36">
                  <div className="text-center">
                    <span className="text-3xl font-bold font-mono text-amber-600 dark:text-amber-400">{fmtTime(classSecondsLeft)}</span>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">remaining</p>
                  </div>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 text-center">Students entering now are marked <strong>Late</strong></p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Student list */}
      {classActive && (
        <div className={cardCls}>
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5" /> Student Status
            </h2>
            <div className="flex gap-4 text-sm">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{presentCount} present</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">{lateCount} late</span>
              <span className="text-red-500 dark:text-red-400 font-medium">{absentCount} absent</span>
            </div>
          </div>
          <div className="p-5">
            {courseStudents.length === 0 ? (
              <p className="text-center text-gray-400 dark:text-slate-500 py-8">No students enrolled.</p>
            ) : (
              <div className="space-y-2">
                {courseStudents.map(student => {
                  const record  = todayRecords.find(r => r.studentId === student.id);
                  const status  = record?.status ?? 'absent';
                  const loading = markingId === student.id;
                  return (
                    <div key={student.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-gray-100 dark:border-slate-700/50 gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-800 dark:text-white truncate">{student.name}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{student.studentId}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize border ${
                          status === 'present'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                            : status === 'late'
                            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                            : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'
                        }`}>
                          {status}
                        </span>
                        <div className="flex gap-1">
                          {(['present', 'late', 'absent'] as ManualStatus[]).map(s => (
                            <button key={s} type="button"
                              disabled={loading || status === s}
                              onClick={() => handleManualMark(student.id, s)}
                              title={`Mark as ${s}`}
                              className={`w-7 h-7 rounded text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed border ${
                                s === 'present'
                                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                                  : s === 'late'
                                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                                  : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20'
                              }`}>
                              {s === 'present' ? 'P' : s === 'late' ? 'L' : 'A'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}