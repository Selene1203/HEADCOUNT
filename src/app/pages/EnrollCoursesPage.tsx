import { useState, useMemo } from "react";
import { BookOpen, Search, Lock, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";

export default function EnrollCoursesPage() {
  const { user: authUser } = useAuth();
  const { users, courses } = useData();
  const [search, setSearch] = useState("");

  const user = users.find(u => u.id === authUser?.id) ?? authUser;
  if (!user) return null;

  const enrolled = user.enrolledCourses ?? [];

  const enrolledCourses = useMemo(() =>
    courses.filter(c => enrolled.includes(c.id)),
    [courses, enrolled]
  );

  const filtered = enrolledCourses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const lecturerName = (lecturerId?: string) =>
    lecturerId ? (users.find(u => u.id === lecturerId)?.name ?? null) : null;

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Courses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {user.department} · Year {user.yearOfStudy} · Enrolled in{" "}
            <strong>{enrolled.length}</strong> course{enrolled.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg text-xs font-medium">
          <Lock size={12} /> Managed by admin
        </div>
      </div>

      {enrolled.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No courses enrolled yet.</p>
          <p className="text-xs mt-1">Contact your administrator to get enrolled in courses.</p>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search your courses…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map(course => {
              const lecturer = lecturerName(course.lecturerId);
              return (
                <div key={course.id} className="bg-white dark:bg-gray-900 rounded-xl border-2 border-blue-300 dark:border-blue-700 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">{course.code}</span>
                    <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">Year {course.year}</span>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-medium">Enrolled</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{course.name}</p>
                  {course.description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{course.description}</p>}
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <User size={11} />
                      {lecturer
                        ? <span className="text-indigo-600 dark:text-indigo-400 font-medium">{lecturer}</span>
                        : <span className="italic">No lecturer assigned</span>
                      }
                    </div>
                    {course.credits && <span className="text-xs text-gray-400 dark:text-gray-500">{course.credits} credits</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && search && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <BookOpen size={36} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No courses match your search.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}