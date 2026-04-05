import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useClassSession, fmtTime } from '../contexts/ClassSessionContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { PlayCircle, ClipboardList, StopCircle, Clock, Users, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export function BeginClassPage() {
  const { token } = useAuth();
  const { courses, users } = useData();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const courseId = searchParams.get('course') ?? '';

  const {
    session, phase, classSecondsLeft,
    beginClass, endClass, fetchActiveSession,
  } = useClassSession();

  const [starting, setStarting] = useState(false);

  const course = courses.find(c => c.id === courseId);
  const studentCount = users.filter(
    u => u.role === 'student' && (u.enrolledCourses ?? []).includes(courseId)
  ).length;

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // Re-hydrate if lecturer refreshes mid-session
  useEffect(() => {
    if (courseId && token) fetchActiveSession(courseId, token);
  }, [courseId, token]);

  const handleBeginClass = async () => {
    console.log('debug:', { token, courseId });
    if (!token || !courseId) return;
    setStarting(true);
    try {
      await beginClass(courseId, token);
      toast.success('Class started! 50-minute timer is running.');
    } catch (err) {
      console.error('beginClass error:', err);
      toast.error('Failed to start class. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  const handleEndClass = async () => {
    if (!token) return;
    if (!confirm('Are you sure you want to end this class?')) return;
    await endClass(token);
    toast.success('Class ended.');
    navigate('/lecturer-dashboard');
  };

  // Determine ring colour by time left
  const ringColor =
    phase === 'ended'      ? 'stroke-gray-300' :
    classSecondsLeft < 600 ? 'stroke-red-500'  :
    classSecondsLeft < 1800 ? 'stroke-yellow-400' :
                              'stroke-indigo-500';

  const RADIUS    = 90;
  const CIRCUM    = 2 * Math.PI * RADIUS;
  const progress  = phase === 'idle' ? 0 : classSecondsLeft / (50 * 60);
  const dashOffset = CIRCUM * (1 - progress);

  const isActive = phase !== 'idle' && phase !== 'ended';

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-gray-400 mb-1">{todayFormatted}</p>
        <h1 className="text-3xl font-bold text-gray-900">
          {course ? course.name : 'Class Session'}
        </h1>
        {course && (
          <p className="text-gray-500 mt-1 flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{course.code}</span>
            <span className="flex items-center gap-1"><Users className="w-4 h-4" />{studentCount} students enrolled</span>
          </p>
        )}
      </div>

      {/* Timer Ring */}
      <Card className="mb-6">
        <CardContent className="p-8 flex flex-col items-center gap-6">
          {/* SVG ring */}
          <div className="relative w-52 h-52">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              {/* Track */}
              <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth="12" />
              {/* Progress */}
              <circle
                cx="100" cy="100" r={RADIUS}
                fill="none"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={CIRCUM}
                strokeDashoffset={dashOffset}
                className={`transition-all duration-1000 ${ringColor}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Clock className="w-5 h-5 text-gray-400 mb-1" />
              <span className="text-4xl font-bold font-mono text-gray-800">
                {phase === 'idle' ? '50:00' : fmtTime(classSecondsLeft)}
              </span>
              <span className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
                {phase === 'idle'    ? 'class duration' :
                 phase === 'ended'   ? 'class ended'    :
                                       'remaining'}
              </span>
            </div>
          </div>

          {/* Phase badge */}
          {phase !== 'idle' && (
            <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
              phase === 'ended'         ? 'bg-gray-100 text-gray-500' :
              phase === 'class_started' ? 'bg-indigo-100 text-indigo-700' :
              phase === 'attendance'    ? 'bg-green-100 text-green-700' :
                                          'bg-yellow-100 text-yellow-700'
            }`}>
              {phase === 'class_started' ? '🟢 Class in progress' :
               phase === 'attendance'    ? '📋 Attendance window open' :
               phase === 'late'          ? '⏰ Late window' :
                                           '✅ Class ended'}
            </span>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3 w-full max-w-xs">

            {/* DEBUG: always visible */}
            <p className="text-xs text-gray-400 text-center">
              phase: <b>{phase}</b> | courseId: <b>{courseId || '(empty)'}</b> | token: <b>{token ? '✓' : '✗'}</b>
            </p>

            {phase === 'idle' && (
              <Button
                onClick={() => { alert(`phase:${phase} courseId:${courseId} token:${!!token}`); handleBeginClass(); }}
                disabled={starting || !courseId}
                className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-base"
              >
                <PlayCircle className="w-5 h-5" />
                {starting ? 'Starting…' : 'Begin Class'}
              </Button>
            )}

            {isActive && (
              <>
                <Button
                  onClick={() => navigate(`/take-attendance?course=${courseId}`)}
                  className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white py-5 text-base"
                >
                  <ClipboardList className="w-5 h-5" />
                  Take Attendance
                </Button>
                <Button
                  onClick={handleEndClass}
                  variant="outline"
                  className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 py-4"
                >
                  <StopCircle className="w-4 h-4" />
                  End Class Early
                </Button>
              </>
            )}

            {phase === 'ended' && (
              <Button
                onClick={() => navigate('/lecturer-dashboard')}
                variant="outline"
                className="w-full"
              >
                Back to Dashboard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info cards */}
      {isActive && session && (
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Session started</p>
              <p className="font-medium">
                {new Date(session.classStartedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Class ends at</p>
              <p className="font-medium">
                {new Date(session.classStartedAt + 50 * 60 * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}