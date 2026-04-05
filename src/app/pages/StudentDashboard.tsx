import { useMemo } from 'react';
import { BookOpen, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

export default function StudentDashboard() {
  const { user: authUser } = useAuth();
  const { users, courses, getAttendanceSummary, loading } = useData();

  const user = users.find(u => u.id === authUser?.id) ?? authUser;

  const summary = useMemo(
    () => (user ? getAttendanceSummary(user.id) : []),
    [user, getAttendanceSummary]
  );

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Loader2 size={32} className="animate-spin mx-auto mb-2" style={{ color: 'var(--theme-primary)' }} />
        <p className="text-gray-400 dark:text-gray-500 text-sm">Loading your dashboard...</p>
      </div>
    </div>
  );

  if (!user) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-400 text-sm">Unable to load user data. Please log in again.</p>
    </div>
  );

  const totalClasses  = summary.reduce((s, r) => s + r.total,   0);
  const totalPresent  = summary.reduce((s, r) => s + r.present, 0);
  const totalLate     = summary.reduce((s, r) => s + r.late,    0);
  const totalAbsent   = summary.reduce((s, r) => s + r.absent,  0);
  const overallPct    = totalClasses > 0
    ? Math.round(((totalPresent + totalLate * 0.5) / totalClasses) * 100)
    : 0;
  const totalAttended = Math.round(totalPresent + totalLate * 0.5);

  const enrolledCourseDetails = courses.filter(c =>
    (user.enrolledCourses ?? []).includes(c.id)
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {user.studentId   && <span className="mr-3">ID: {user.studentId}</span>}
          {user.programme   && <span className="mr-3">{user.programme}</span>}
          {user.yearOfStudy && <span>Year {user.yearOfStudy}</span>}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen size={20} />}    label="Enrolled Courses" value={enrolledCourseDetails.length} color="primary" />
        <StatCard icon={<CheckCircle size={20} />} label="Classes Attended" value={totalAttended}                color="green" />
        <StatCard icon={<XCircle size={20} />}     label="Classes Missed"   value={totalAbsent}                 color="red" />
        <StatCard icon={<TrendingUp size={20} />}  label="Attendance Rate"  value={`${overallPct}%`}            color="purple" />
      </div>

      {/* Enrolled courses */}
      {enrolledCourseDetails.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-800 dark:text-white">My Enrolled Courses</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {enrolledCourseDetails.map(course => (
              <div key={course.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{course.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{course.code} · {course.credits} credits</p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'var(--theme-primary)20',
                    color: 'var(--theme-primary)',
                  }}
                >
                  Year {course.year}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance summary */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-800 dark:text-white">My Attendance Summary</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Late attendance counts as 50% · Minimum required: 75%
          </p>
        </div>
        {summary.length === 0 ? (
          <div className="py-12 text-center text-gray-400 dark:text-gray-600">
            <BookOpen size={36} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No attendance records yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {summary.map(row => {
              const color = row.percentage >= 75 ? 'green' : row.percentage >= 50 ? 'yellow' : 'red';
              return (
                <div key={row.courseId} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 dark:text-white truncate">{row.courseName}</p>
                      <div className="flex gap-4 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle size={11} /> {row.present} present
                        </span>
                        <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
                          <XCircle size={11} /> {row.absent} absent
                        </span>
                        <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                          <Clock size={11} /> {row.late} late (×0.5)
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-lg font-bold ${
                        color === 'green'  ? 'text-green-600 dark:text-green-400'  :
                        color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                                             'text-red-600 dark:text-red-400'
                      }`}>
                        {row.percentage}%
                      </span>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{row.total} total</p>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        color === 'green'  ? 'bg-green-500'  :
                        color === 'yellow' ? 'bg-yellow-400' :
                                             'bg-red-500'
                      }`}
                      style={{ width: `${row.percentage}%` }}
                    />
                  </div>
                  {row.percentage < 75 && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertCircle size={11} /> Below 75% — attendance improvement required
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'primary' | 'green' | 'red' | 'purple';
}) {
  if (color === 'primary') {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
          style={{ backgroundColor: 'var(--theme-primary)20', color: 'var(--theme-primary)' }}
        >
          {icon}
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      </div>
    );
  }

  const colorMap = {
    green:  'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400',
    red:    'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}