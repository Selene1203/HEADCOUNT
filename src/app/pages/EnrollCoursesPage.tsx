import { useState, useMemo } from "react";
import { BookOpen, Search, Lock, User, Globe, Calendar } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";

export default function EnrollCoursesPage() {
  const { user: authUser } = useAuth();
  const { users, courses, programmes, activeSemester } = useData();
  const [search, setSearch] = useState("");

  const user = users.find(u => u.id === authUser?.id) ?? authUser;
  if (!user) return null;

  const enrolled = user.enrolledCourses ?? [];

  // Get all department IDs this student has access to via their programme
  const studentProgramme = useMemo(() =>
    programmes.find(p => p.id === user.programmeId),
    [programmes, user.programmeId]
  );

  // All dept IDs the student belongs to (own dept + programme depts if multi-dept programme)
  const studentDeptIds = useMemo(() => {
    const ids = new Set<string>();
    if (user.departmentId) ids.add(user.departmentId);
    studentProgramme?.departmentIds.forEach(id => ids.add(id));
    return ids;
  }, [user.departmentId, studentProgramme]);

  // Courses visible to this student in the active semester
  const availableCourses = useMemo(() => {
    return courses.filter(c => {
      // Must be in the active semester
      if ((c.semester ?? "A") !== activeSemester) return false;

      // Already enrolled — always show
      if (enrolled.includes(c.id)) return true;

      // Year check — skip if not open-year and year doesn't match
      const yearOk = c.isOpenYear || !c.year || c.year === user.yearOfStudy;

      // Department check
      const deptOk =
        c.isMultiDept ||                          // open to everyone
        !c.departmentId ||                        // no dept restriction
        studentDeptIds.has(c.departmentId);       // in student's dept(s)

      return yearOk && deptOk;
    });
  }, [courses, enrolled, activeSemester, user.yearOfStudy, studentDeptIds]);

  const enrolledCourses  = availableCourses.filter(c => enrolled.includes(c.id));
  const availableToEnroll = availableCourses.filter(c => !enrolled.includes(c.id));

  const filterCourse = (c: typeof courses[0]) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase());

  const filteredEnrolled  = enrolledCourses.filter(filterCourse);
  const filteredAvailable = availableToEnroll.filter(filterCourse);

  const lecturerName = (lecturerId?: string) =>
    lecturerId ? (users.find(u => u.id === lecturerId)?.name ?? null) : null;

  // Check if a course is cross-year for this student
  const isCrossYear = (c: typeof courses[0]) =>
    c.isOpenYear && c.year !== undefined && c.year !== user.yearOfStudy;

  // Check if a course is cross-dept for this student
  const isCrossDept = (c: typeof courses[0]) =>
    c.isMultiDept && c.departmentId && !studentDeptIds.has(c.departmentId);

  const CourseCard = ({ course, isEnrolled }: { course: typeof courses[0]; isEnrolled: boolean }) => {
    const lecturer  = lecturerName(course.lecturerId);
    const crossYear = isCrossYear(course);
    const crossDept = isCrossDept(course);

    return (
      <div className={`bg-white dark:bg-gray-900 rounded-xl border-2 p-4 transition-colors ${
        isEnrolled
          ? "border-blue-300 dark:border-blue-700"
          : "border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800"
      }`}>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
            {course.code}
          </span>
          <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
            Year {course.year}
          </span>
          <span className="text-xs bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded">
            Sem {course.semester ?? "A"}
          </span>
          {isEnrolled && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-medium">
              Enrolled
            </span>
          )}
          {/* Cross-year badge */}
          {crossYear && (
            <span className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
              <Calendar size={10} /> Year {course.year} course
            </span>
          )}
          {/* Cross-dept badge */}
          {crossDept && (
            <span className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
              <Globe size={10} /> {course.department}
            </span>
          )}
        </div>

        <p className="font-medium text-gray-900 dark:text-white text-sm">{course.name}</p>
        {course.description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">{course.description}</p>
        )}

        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <User size={11} />
            {lecturer
              ? <span className="text-indigo-600 dark:text-indigo-400 font-medium">{lecturer}</span>
              : <span className="italic">No lecturer assigned</span>
            }
          </div>
          {course.credits && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{course.credits} credits</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Courses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {user.department} · Year {user.yearOfStudy} · Semester {activeSemester} · Enrolled in{" "}
            <strong>{enrolled.length}</strong> course{enrolled.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* Active semester indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: 'var(--theme-primary)', color: 'white' }}>
            Semester {activeSemester}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg text-xs font-medium">
            <Lock size={12} /> Managed by admin
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search courses…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
      </div>

      {/* Enrolled courses */}
      {filteredEnrolled.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Enrolled ({filteredEnrolled.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredEnrolled.map(course => (
              <CourseCard key={course.id} course={course} isEnrolled />
            ))}
          </div>
        </div>
      )}

      {/* Available to enroll — only show if there are any */}
      {filteredAvailable.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Available this semester ({filteredAvailable.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredAvailable.map(course => (
              <CourseCard key={course.id} course={course} isEnrolled={false} />
            ))}
          </div>
        </div>
      )}

      {/* Empty states */}
      {enrolled.length === 0 && filteredAvailable.length === 0 && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No courses available for Semester {activeSemester}.</p>
          <p className="text-xs mt-1">Contact your administrator to get enrolled in courses.</p>
        </div>
      )}

      {(filteredEnrolled.length === 0 && filteredAvailable.length === 0 && search) && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <BookOpen size={36} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No courses match your search.</p>
        </div>
      )}
    </div>
  );
}
