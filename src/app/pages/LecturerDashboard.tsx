import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useClassSession } from '../contexts/ClassSessionContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BookOpen, Users, CheckCircle, Calendar, ArrowRight, ClipboardList } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

export function LecturerDashboard() {
  const { user: authUser } = useAuth();
  const { users, courses, attendance } = useData();
  const { session, phase } = useClassSession();
  const navigate = useNavigate();

  const user = users.find(u => u.id === authUser?.id) ?? authUser;

  const myCourses = useMemo(
    () => courses.filter(c => (user?.assignedCourses ?? []).includes(c.id)),
    [courses, user]
  );

  const myStudents = useMemo(() => {
    const ids = new Set(myCourses.map(c => c.id));
    return users.filter(
      u => u.role === 'student' && (u.enrolledCourses ?? []).some(id => ids.has(id))
    );
  }, [users, myCourses]);

  const today = new Date().toISOString().split('T')[0];

  const todayAttendance = useMemo(() => {
    const ids = new Set(myCourses.map(c => c.id));
    return attendance.filter(a => a.date === today && ids.has(a.courseId));
  }, [attendance, myCourses, today]);

  const stats = [
    { title: 'My Courses',      value: myCourses.length,                                           icon: <BookOpen className="w-6 h-6" />,     color: 'text-indigo-500 dark:text-indigo-400',  bg: 'bg-indigo-50 dark:bg-indigo-500/10'  },
    { title: 'Total Students',  value: myStudents.length,                                           icon: <Users className="w-6 h-6" />,        color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { title: "Today's Records", value: todayAttendance.length,                                      icon: <CheckCircle className="w-6 h-6" />,   color: 'text-blue-500 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-500/10'      },
    { title: 'Present Today',   value: todayAttendance.filter(a => a.status === 'present').length,  icon: <Calendar className="w-6 h-6" />,      color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10'  },
  ];

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const isActive       = phase !== 'idle' && phase !== 'ended';
  const activeCourse   = isActive ? myCourses.find(c => c.id === session?.courseId) : null;
  const attendanceOpen = isActive && (phase === 'attendance' || phase === 'late');

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Welcome back, {user?.name}!</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm">
          {todayFormatted}
          {user?.staffId && <span className="ml-3 text-gray-400 dark:text-slate-500">· {user.staffId}</span>}
        </p>
      </div>

      {/* Active class banner */}
      {isActive && activeCourse && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/15 rounded-full flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-emerald-800 dark:text-emerald-200 text-sm">
                Class in progress — {activeCourse.name}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {attendanceOpen
                  ? phase === 'attendance' ? '📋 Attendance window is open' : '⏰ Late window is open'
                  : '🟢 Class running — attendance not yet opened'}
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white gap-2 border-0"
            onClick={() => navigate(`/take-attendance?course=${activeCourse.id}`)}
          >
            <ArrowRight className="w-4 h-4" />
            {attendanceOpen ? 'Go to Attendance' : 'Go to Class'}
          </Button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map(stat => (
          <div key={stat.title} className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={`${stat.bg} ${stat.color} p-3 rounded-lg`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <div className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">My Courses</h2>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {myCourses.length === 0 ? (
                <p className="text-gray-500 dark:text-slate-400 text-center py-4 text-sm">No courses assigned yet.</p>
              ) : (
                myCourses.map(course => {
                  const count = users.filter(
                    u => u.role === 'student' && (u.enrolledCourses ?? []).includes(course.id)
                  ).length;

                  return (
                    <div key={course.id}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 border border-gray-100 dark:border-slate-700/50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm">{course.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{course.code}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                          Year {course.year ?? '—'} · {count} student{count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              <Link to="/my-courses">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors text-sm font-medium">
                  <BookOpen className="w-5 h-5" /> View My Courses
                </button>
              </Link>
              <Link to="/reports">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors text-sm font-medium">
                  <Calendar className="w-5 h-5" /> View Reports
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}