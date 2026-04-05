import { useState } from 'react';
import { CheckCircle, Shield, Users, BookOpen, ClipboardList, QrCode, BarChart3,  ChevronDown, ChevronUp } from 'lucide-react';

// ── Data ─────────────────────────────────────────────────────────────────────

const FLOW = [
  {
    id: 1,
    label: 'Login',
    icon: <Shield className="w-5 h-5" />,
    description: 'User enters email and password. Admins must additionally verify with a secret code before a session is established.',
    roles: null,
  },
  {
    id: 2,
    label: 'Role Resolution',
    icon: <Users className="w-5 h-5" />,
    description: 'The system identifies the user\'s role and redirects them to their role-specific dashboard with appropriate permissions.',
    roles: [
      { name: 'Admin', color: 'red',   items: ['Manage students & lecturers', 'Manage courses & departments', 'Manage programmes', 'View activity logs', 'Export reports'] },
      { name: 'Lecturer', color: 'green', items: ['View assigned courses', 'Begin & manage classes', 'Open attendance window', 'Manually mark students', 'View attendance reports'] },
      { name: 'Student', color: 'indigo', items: ['View enrolled courses', 'Submit attendance code', 'Track own attendance', 'View attendance percentage'] },
    ],
  },
  {
    id: 3,
    label: 'Course Management',
    icon: <BookOpen className="w-5 h-5" />,
    description: 'Admin assigns courses to lecturers (max 4 per lecturer, max 2 per year level) and enrolls students based on their programme and year.',
    roles: null,
  },
  {
    id: 4,
    label: 'Class Session',
    icon: <ClipboardList className="w-5 h-5" />,
    description: 'Lecturer begins a timed class session (50 min or 1h 50min). When ready, they open the attendance window which generates a 6-character code.',
    roles: null,
  },
  {
    id: 5,
    label: 'Attendance Marking',
    icon: <QrCode className="w-5 h-5" />,
    description: 'Students submit the code within 15 minutes to be marked Present. After 15 minutes, the late window opens until class ends — late submissions are marked Late and count as 50%.',
    roles: null,
  },
  {
    id: 6,
    label: 'Reports & Export',
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'Admins and lecturers can view per-student attendance summaries with Present / Late / Absent breakdowns. Students below 75% are flagged. Data can be exported as CSV.',
    roles: null,
  },
];

const FEATURES = [
  { label: 'Role-based access control (Admin / Lecturer / Student)' },
  { label: 'Two-factor admin login with secret code verification' },
  { label: 'Timed class sessions with configurable duration' },
  { label: 'Code-based attendance with Present / Late distinction' },
  { label: 'Manual attendance override by lecturer' },
  { label: 'Programme-based student enrollment (multi-departmental)' },
  { label: 'Per-role colour theming with light / dark mode' },
  { label: 'Activity audit log for all admin actions' },
  { label: 'Attendance percentage tracking (late = 50%)' },
  { label: 'CSV export with date range and course filters' },
];

const DB_TABLES = [
  { name: 'User',              fields: 'id, name, email, password, role, studentId, staffId, departmentId, programmeId, yearOfStudy' },
  { name: 'Course',            fields: 'id, name, code, description, year, credits, maxEnrollment, departmentId' },
  { name: 'Department',        fields: 'id, name' },
  { name: 'Programme',         fields: 'id, name  →  ProgrammeDepartment (many-to-many)' },
  { name: 'StudentCourse',     fields: 'studentId, courseId, enrolledAt' },
  { name: 'LecturerCourse',    fields: 'lecturerId, courseId, assignedAt' },
  { name: 'AttendanceRecord',  fields: 'id, courseId, studentId, markedById, date, status (present/late/absent)' },
  { name: 'AttendanceSession', fields: 'id, courseId, code, phase, classDuration, expiresAt' },
  { name: 'ActivityLog',       fields: 'id, category, action, detail, severity, performedBy, timestamp' },
];

const ROLE_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  red:    { bg: 'bg-red-50 dark:bg-red-500/10',     border: 'border-red-200 dark:border-red-500/20',     text: 'text-red-700 dark:text-red-400',     dot: 'bg-red-500'    },
  green:  { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-500/10',  border: 'border-indigo-200 dark:border-indigo-500/20',  text: 'text-indigo-700 dark:text-indigo-400',  dot: 'bg-indigo-500'  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function FlowchartPage() {
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggle = (id: number) => setExpanded(prev => prev === id ? null : id);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">System Flow</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          How HEADCOUNT works — from login to report generation.
        </p>
      </div>

      {/* Flow steps */}
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-6 top-8 bottom-8 w-px bg-gray-200 dark:bg-slate-700 hidden md:block" />

        <div className="space-y-3">
          {FLOW.map((step, idx) => {
            const isOpen = expanded === step.id;
            return (
              <div key={step.id} className="relative">
                <button
                  type="button"
                  onClick={() => toggle(step.id)}
                  className="w-full text-left"
                >
                  <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    isOpen
                      ? 'bg-white dark:bg-slate-800/80 border-gray-300 dark:border-slate-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800/40 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}>
                    {/* Step number + icon */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm"
                        style={{ backgroundColor: 'var(--theme-primary)' }}>
                        {step.icon}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-400 dark:text-slate-500">0{step.id}</span>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{step.label}</h3>
                      </div>
                      {!isOpen && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">{step.description}</p>
                      )}
                    </div>

                    <div className="shrink-0 text-gray-400 dark:text-slate-500">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="mt-1 ml-0 md:ml-16 bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{step.description}</p>

                    {step.roles && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        {step.roles.map(role => {
                          const c = ROLE_COLORS[role.color];
                          return (
                            <div key={role.name} className={`rounded-lg border p-3 ${c.bg} ${c.border}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                                <p className={`text-xs font-semibold uppercase tracking-wide ${c.text}`}>{role.name}</p>
                              </div>
                              <ul className="space-y-1">
                                {role.items.map(item => (
                                  <li key={item} className={`text-xs ${c.text} flex items-start gap-1.5`}>
                                    <span className="mt-0.5 shrink-0">·</span>{item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Arrow between steps */}
                {idx < FLOW.length - 1 && !isOpen && (
                  <div className="flex justify-center md:justify-start md:pl-[22px] my-1">
                    <div className="w-px h-3 bg-gray-200 dark:bg-slate-700" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Complete */}
        <div className="flex items-center gap-2 mt-4 pl-0 md:pl-16 text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">Attendance recorded & available in reports</span>
        </div>
      </div>

      {/* Features + DB */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Key Features */}
        <div className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Key Features</h2>
          </div>
          <ul className="p-5 space-y-2.5">
            {FEATURES.map(f => (
              <li key={f.label} className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-slate-300">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Database Structure */}
        <div className="bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Database Structure</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Prisma + MySQL</p>
          </div>
          <div className="p-5 space-y-2">
            {DB_TABLES.map(table => (
              <div key={table.name}
                className="p-3 bg-slate-50 dark:bg-slate-700/30 border border-gray-100 dark:border-slate-700/50 rounded-lg">
                <p className="text-xs font-semibold text-gray-900 dark:text-white font-mono mb-0.5">{table.name}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{table.fields}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}