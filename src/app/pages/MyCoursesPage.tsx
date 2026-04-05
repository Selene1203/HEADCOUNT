import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useClassSession } from '../contexts/ClassSessionContext';
import { BookOpen, Users, PlayCircle, ClipboardList } from 'lucide-react';

export function MyCoursesPage() {
  const { user: authUser } = useAuth();
  const { users, courses } = useData();
  const { session, phase } = useClassSession();
  const navigate = useNavigate();

  const user = users.find(u => u.id === authUser?.id) ?? authUser;

  const myCourses = useMemo(
    () => courses.filter(c => (user?.assignedCourses ?? []).includes(c.id)),
    [courses, user]
  );

  const getStudentCount = (courseId: string) =>
    users.filter(u => u.role === 'student' && (u.enrolledCourses ?? []).includes(courseId)).length;

  const isActive       = phase !== 'idle' && phase !== 'ended';
  const attendanceOpen = isActive && (phase === 'attendance' || phase === 'late');
  const totalStudents  = myCourses.reduce((sum, c) => sum + getStudentCount(c.id), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Courses</h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
          {myCourses.length} course{myCourses.length !== 1 ? 's' : ''} assigned
        </p>
      </div>

      {/* Summary — plain divs instead of shadcn Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-3">
          <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-2 rounded-lg">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Assigned Courses</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{myCourses.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-2 rounded-lg">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Total Students</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{totalStudents}</p>
          </div>
        </div>
      </div>

      {myCourses.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 dark:text-slate-300 mb-1">No courses assigned</h3>
          <p className="text-sm text-gray-400 dark:text-slate-500">Contact an admin to get courses assigned to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myCourses.map(course => {
            const count              = getStudentCount(course.id);
            const isThisCourseActive = isActive && session?.courseId === course.id;

            return (
              <div key={course.id}
                className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl p-5 hover:border-gray-300 dark:hover:border-slate-600 transition-colors flex flex-col gap-3">

                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white leading-snug">{course.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{course.code}</p>
                  </div>
                  {isThisCourseActive && (
                    <span className="shrink-0 text-xs font-medium bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-1 rounded-full">
                      Live
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {course.year && (
                    <span className="text-xs bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600/40 px-2 py-0.5 rounded-full">
                      Year {course.year}
                    </span>
                  )}
                  {course.credits && (
                    <span className="text-xs bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600/40 px-2 py-0.5 rounded-full">
                      {course.credits} credits
                    </span>
                  )}
                  {course.department && (
                    <span className="text-xs bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600/40 px-2 py-0.5 rounded-full">
                      {course.department}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                  <Users className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
                  <span>{count} student{count !== 1 ? 's' : ''} enrolled</span>
                </div>

                {course.description && (
                  <p className="text-xs text-gray-400 dark:text-slate-500 line-clamp-2">{course.description}</p>
                )}

                <div className="pt-1">
                  {isThisCourseActive ? (
                    <button type="button"
                      onClick={() => navigate(`/take-attendance?course=${course.id}`)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors">
                      <ClipboardList className="w-4 h-4" />
                      {attendanceOpen ? 'Go to Attendance' : 'Go to Class'}
                    </button>
                  ) : (
                    <button type="button"
                      onClick={() => navigate(`/take-attendance?course=${course.id}`)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium text-white transition-colors"
                      style={{ backgroundColor: 'var(--theme-primary)' }}>
                      <PlayCircle className="w-4 h-4" />
                      Begin Class
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyCoursesPage;