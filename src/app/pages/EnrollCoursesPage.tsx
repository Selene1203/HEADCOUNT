import { useState, useMemo } from "react";
import { BookOpen, Search, Lock, User, Globe, Calendar, Info } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";

export default function EnrollCoursesPage() {
  const { user: authUser } = useAuth();
  const { users, courses, programmes, activeSemester } = useData();
  const [search, setSearch] = useState("");

  const user = users.find(u => u.id === authUser?.id) ?? authUser;
  if (!user) return null;

  const enrolled = user.enrolledCourses ?? [];

  const studentProgramme = useMemo(() =>
    programmes.find(p => p.id === user.programmeId),
    [programmes, user.programmeId]
  );

  const studentDeptIds = useMemo(() => {
    const ids = new Set<string>();
    if (user.departmentId) ids.add(user.departmentId);
    studentProgramme?.departmentIds?.forEach(id => ids.add(id));
    return ids;
  }, [user.departmentId, studentProgramme]);

  // Logic updated to reflect cross-year/multi-dept flags
  const availableCourses = useMemo(() => {
    return courses.filter(c => {
      if ((c.semester ?? "A") !== activeSemester) return false;
      if (enrolled.includes(c.id)) return true;

      // 1. Updated Year Check
      const yearOk = c.isOpenYear || !c.year || c.year === user.yearOfStudy;

      // 2. Updated Department Check
      const deptOk =
        c.isMultiDept || 
        !c.departmentId || 
        studentDeptIds.has(c.departmentId);

      return yearOk && deptOk;
    });
  }, [courses, enrolled, activeSemester, user.yearOfStudy, studentDeptIds]);

  const enrolledCourses  = availableCourses.filter(c => enrolled.includes(c.id));
  const availableToEnroll = availableCourses.filter(c => !enrolled.includes(c.id));

  const filterCourse = (c: typeof courses[0]) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase());

  const filteredEnrolled  = enrolledCourses.filter(filterCourse);
  const filteredAvailable = availableToEnroll.filter(filterCourse);

  const lecturerName = (lecturerId?: string) =>
    lecturerId ? (users.find(u => u.id === lecturerId)?.name ?? null) : null;

  // UI Helpers for visual indicators
  const isCrossYear = (c: typeof courses[0]) =>
    c.isOpenYear && c.year !== undefined && c.year !== user.yearOfStudy;

  const isCrossDept = (c: typeof courses[0]) =>
    c.isMultiDept && c.departmentId && !studentDeptIds.has(c.departmentId);

  const CourseCard = ({ course, isEnrolled }: { course: typeof courses[0]; isEnrolled: boolean }) => {
    const lecturer  = lecturerName(course.lecturerId);
    const crossYear = isCrossYear(course);
    const crossDept = isCrossDept(course);
    // New check for capacity in the UI
    const isFull = course.maxEnrollment && (course.enrolledCount >= course.maxEnrollment);

    return (
      <div className={`bg-white dark:bg-gray-900 rounded-xl border-2 p-4 transition-all ${
        isEnrolled
          ? "border-blue-300 dark:border-blue-700 shadow-sm"
          : "border-gray-200 dark:border-gray-700 hover:border-blue-200"
      }`}>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
            {course.code}
          </span>
          
          {/* Status Badges */}
          {isEnrolled ? (
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded font-medium">
              Registered
            </span>
          ) : isFull ? (
            <span className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded font-medium">
              Full
            </span>
          ) : null}

          {/* New Dynamic Badges for Cross-Context Courses */}
          {crossYear && (
            <span className="text-[10px] bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded flex items-center gap-1 font-bold border border-amber-100 dark:border-amber-900/30">
              <Calendar size={10} /> YEAR {course.year} ELECTIVE
            </span>
          )}
          {crossDept && (
            <span className="text-[10px] bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded flex items-center gap-1 font-bold border border-purple-100 dark:border-purple-900/30">
              <Globe size={10} /> CROSS-DEPT
            </span>
          )}
        </div>

        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{course.name}</h3>
        
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-gray-500 dark:text-gray-400">
           <div className="flex items-center gap-1">
             <User size={12} className="text-gray-400" />
             <span className="truncate">{lecturer ?? "TBA"}</span>
           </div>
           <div className="flex items-center gap-1 justify-end">
             <Info size={12} className="text-gray-400" />
             <span>{course.credits} Credits</span>
           </div>
        </div>

        {/* Capacity Bar (Optional UI touch) */}
        {course.maxEnrollment && !isEnrolled && (
          <div className="mt-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full ${isFull ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min((course.enrolledCount / course.maxEnrollment) * 100, 100)}%` }}
            ></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Enrolment</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Showing available courses for <span className="text-blue-600 font-medium">{user.department}</span> Year {user.yearOfStudy}
          </p>
        </div>
        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20">
          Semester {activeSemester} Active
        </div>
      </header>

      {/* Search Input */}
      <div className="relative group">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by course name or code..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" 
        />
      </div>

      {/* Course Sections */}
      <div className="space-y-8">
        {filteredEnrolled.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
              <div className="h-1 w-1 bg-blue-500 rounded-full" /> My Registered Courses
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEnrolled.map(course => <CourseCard key={course.id} course={course} isEnrolled />)}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
            <div className="h-1 w-1 bg-gray-400 rounded-full" /> Available for Enrolment
          </h2>
          {filteredAvailable.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAvailable.map(course => <CourseCard key={course.id} course={course} isEnrolled={false} />)}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 py-12 text-center">
              <BookOpen size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No additional courses available to join.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
