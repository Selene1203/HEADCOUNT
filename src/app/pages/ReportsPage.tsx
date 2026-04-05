import { useState, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useLog } from '../contexts/LogContext';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { Download, BookOpen, TrendingUp, Eye, X, Printer } from 'lucide-react';
import { format } from 'date-fns';

// ─────────────────────────────────────────────────────────────
// NUL coat of arms — embedded as base64 so it works in print
// ─────────────────────────────────────────────────────────────
const NUL_LOGO = 'data:image/png;base64,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';

// ─────────────────────────────────────────────────────────────
// Formal Report Template
// ─────────────────────────────────────────────────────────────
function ReportTemplate({
  rows,
  visibleCourses,
  filterCourse,
  startDate,
  endDate,
  generatedBy,
  role,
  allAttendance,
}: {
  rows: { student: any; course: any; stats: any }[];
  visibleCourses: any[];
  filterCourse: string;
  startDate: string;
  endDate: string;
  generatedBy: string;
  role: string;
  allAttendance: { courseId: string; date: string; status: string }[];
}) {
  const courseName = filterCourse !== 'all'
    ? visibleCourses.find(c => c.id === filterCourse)?.name ?? 'All Courses'
    : 'All Courses';

  const dateRange = startDate && endDate
    ? `${format(new Date(startDate), 'd MMMM yyyy')} – ${format(new Date(endDate), 'd MMMM yyyy')}`
    : startDate ? `From ${format(new Date(startDate), 'd MMMM yyyy')}`
    : endDate   ? `Up to ${format(new Date(endDate), 'd MMMM yyyy')}`
    : 'All Dates';

  // ── Session count: unique class dates per course (not per student) ──
  // A "session" is one class on one date for one course.
  // Filter to only the courses visible in this report, and apply date filters.
  const visibleCourseIds = new Set(
    filterCourse !== 'all'
      ? [filterCourse]
      : visibleCourses.map((c: any) => c.id)
  );
  const totalSessions = new Set(
    allAttendance
      .filter(a => {
        if (!visibleCourseIds.has(a.courseId)) return false;
        if (startDate && a.date < startDate) return false;
        if (endDate   && a.date > endDate)   return false;
        return true;
      })
      .map(a => `${a.courseId}::${a.date}`)
  ).size;

  const totalPresent = rows.reduce((s, r) => s + r.stats.present, 0);
  const totalAbsent  = rows.reduce((s, r) => s + r.stats.absent,  0);
  const totalLate    = rows.reduce((s, r) => s + r.stats.late,    0);
  const totalRecords = rows.reduce((s, r) => s + r.stats.total,   0);
  const overallPct   = totalRecords > 0
    ? (((totalPresent + totalLate * 0.5) / totalRecords) * 100).toFixed(1)
    : '0.0';
  const uniqueStudents = new Set(rows.map(r => r.student.id)).size;

  const reportNo = `RPT-${format(new Date(), 'yyyyMMdd-HHmm')}`;

  // Inline styles — all self-contained so print window looks identical
  const s = {
    page: {
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      color: '#111',
      lineHeight: '1.5',
      fontSize: '11px',
      maxWidth: '800px',
      margin: '0 auto',
    } as React.CSSProperties,

    // ── Header band ──
    headerBand: {
      background: '#0f172a',
      color: '#fff',
      padding: '20px 28px 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    } as React.CSSProperties,
    uniName: {
      fontSize: '15px',
      fontWeight: '700',
      letterSpacing: '0.5px',
      margin: '0 0 3px',
      color: '#fff',
    } as React.CSSProperties,
    uniSub: {
      fontSize: '10px',
      color: '#94a3b8',
      margin: 0,
      letterSpacing: '1.5px',
      textTransform: 'uppercase' as const,
    },
    headerRight: {
      textAlign: 'right' as const,
      fontSize: '10px',
      color: '#94a3b8',
      lineHeight: '1.6',
    },

    // ── Title section ──
    titleSection: {
      padding: '18px 28px 14px',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    } as React.CSSProperties,
    reportTitle: {
      fontSize: '18px',
      fontWeight: '700',
      margin: '0 0 4px',
      color: '#0f172a',
      letterSpacing: '-0.3px',
    } as React.CSSProperties,
    reportSubtitle: {
      fontSize: '11px',
      color: '#64748b',
      margin: 0,
    },
    reportNo: {
      fontSize: '10px',
      color: '#94a3b8',
      textAlign: 'right' as const,
    },

    // ── Meta grid ──
    metaGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '0',
      borderBottom: '1px solid #e2e8f0',
      margin: '0',
    } as React.CSSProperties,
    metaCell: {
      padding: '10px 28px',
      borderRight: '1px solid #e2e8f0',
    } as React.CSSProperties,
    metaLabel: {
      fontSize: '9px',
      color: '#94a3b8',
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
      margin: '0 0 2px',
      fontWeight: '600',
    },
    metaValue: {
      fontSize: '12px',
      color: '#0f172a',
      fontWeight: '600',
      margin: 0,
    },

    // ── Stat cards ──
    statsRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '0',
      borderBottom: '2px solid #0f172a',
      background: '#f8fafc',
    } as React.CSSProperties,
    statCell: {
      padding: '14px 20px',
      textAlign: 'center' as const,
      borderRight: '1px solid #e2e8f0',
    } as React.CSSProperties,
    statValue: {
      fontSize: '22px',
      fontWeight: '700',
      margin: '0 0 2px',
      color: '#0f172a',
    } as React.CSSProperties,
    statLabel: {
      fontSize: '9px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.8px',
      color: '#64748b',
      margin: 0,
    },

    // ── Section heading ──
    sectionHead: {
      fontSize: '9px',
      fontWeight: '700',
      textTransform: 'uppercase' as const,
      letterSpacing: '1.2px',
      color: '#64748b',
      padding: '12px 28px 6px',
      margin: 0,
    },

    // ── Table ──
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      fontSize: '10.5px',
    } as React.CSSProperties,
    th: {
      background: '#0f172a',
      color: '#e2e8f0',
      padding: '8px 12px',
      textAlign: 'left' as const,
      fontWeight: '600',
      fontSize: '9.5px',
      letterSpacing: '0.4px',
      textTransform: 'uppercase' as const,
    } as React.CSSProperties,
    thCenter: {
      background: '#0f172a',
      color: '#e2e8f0',
      padding: '8px 12px',
      textAlign: 'center' as const,
      fontWeight: '600',
      fontSize: '9.5px',
      letterSpacing: '0.4px',
      textTransform: 'uppercase' as const,
    } as React.CSSProperties,
    tdCenter: {
      padding: '8px 12px',
      textAlign: 'center' as const,
      borderBottom: '1px solid #f1f5f9',
    } as React.CSSProperties,
    td: {
      padding: '8px 12px',
      borderBottom: '1px solid #f1f5f9',
    } as React.CSSProperties,

    // ── Footer ──
    footer: {
      marginTop: '32px',
      padding: '12px 28px 0',
      borderTop: '2px solid #0f172a',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    } as React.CSSProperties,
    sigBlock: {
      fontSize: '10px',
      color: '#374151',
      width: '220px',
    } as React.CSSProperties,
    sigLine: {
      borderTop: '1px solid #374151',
      marginBottom: '4px',
      marginTop: '32px',
    },
    sigLabel: { margin: '0 0 2px', fontWeight: '600' },
    sigSub: { margin: 0, color: '#94a3b8', fontSize: '9px' },
    footerNote: {
      fontSize: '9px',
      color: '#94a3b8',
      textAlign: 'right' as const,
    },
  };

  const statusStyle = (pct: number): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '3px',
    fontSize: '9.5px',
    fontWeight: '600',
    background: pct >= 75 ? '#dcfce7' : pct >= 50 ? '#fef9c3' : '#fee2e2',
    color:      pct >= 75 ? '#166534' : pct >= 50 ? '#854d0e' : '#991b1b',
  });

  const pctStyle = (pct: number): React.CSSProperties => ({
    fontWeight: '700',
    color: pct >= 75 ? '#16a34a' : pct >= 50 ? '#ca8a04' : '#dc2626',
  });

  return (
    <div style={s.page}>

      {/* ── Header band ── */}
      <div style={s.headerBand}>
        {/* Logo + university name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img
            src={NUL_LOGO}
            alt="NUL Coat of Arms"
            style={{ width: '64px', height: '64px', objectFit: 'contain', background: '#fff', borderRadius: '6px', padding: '3px' }}
          />
          <div>
            <p style={s.uniName}>NATIONAL UNIVERSITY OF LESOTHO</p>
            <p style={{ ...s.uniSub, marginTop: '3px' }}>HEADCOUNT · Attendance Management System</p>
            <p style={{ fontSize: '9px', color: '#64748b', margin: '4px 0 0', letterSpacing: '0.5px' }}>
              Roma, Maseru 180, Lesotho &nbsp;·&nbsp; www.nul.ls
            </p>
          </div>
        </div>
        {/* Right side meta */}
        <div style={{ ...s.headerRight, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '3px' }}>
          <div style={{ fontSize: '9px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>Official Report</div>
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
            {format(new Date(), 'd MMM yyyy, HH:mm')}
          </div>
        </div>
      </div>

      {/* ── Title ── */}
      <div style={s.titleSection}>
        <div>
          <p style={s.reportTitle}>Student Attendance Report</p>
        </div>
        <div style={s.reportNo}>
        <div style={{ marginTop: 2, textTransform: 'capitalize' }}>By: {generatedBy} </div>
        </div>
      </div>

      {/* ── Meta row ── */}
      <div style={s.metaGrid}>
        {[
          { label: 'Course',          value: courseName },
          { label: 'Date Range',      value: dateRange },
          { label: 'Total Students',  value: uniqueStudents },
          { label: 'Total Sessions',   value: totalSessions },
          { label: 'Prepared By',     value: role.charAt(0).toUpperCase() + role.slice(1) },
          { label: 'Classification',  value: 'Confidential' },
        ].map((m, i) => (
          <div key={i} style={{ ...s.metaCell, borderRight: i % 3 === 2 ? 'none' : '1px solid #e2e8f0', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
            <p style={s.metaLabel}>{m.label}</p>
            <p style={s.metaValue}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* ── Summary stats ── */}
      <div >
        {[
          { label: 'Overall Rate',   value: `${overallPct}%`,   color: '#2563eb' },
        ].map((stat, i) => (
          <div key={i} style={{ ...s.statCell, borderRight: i === 4 ? 'none' : '1px solid #e2e8f0' }}>
            <p style={{ ...s.statValue, color: stat.color }}>{stat.value}</p>
            <p style={s.statLabel}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Detail table ── */}
      <p style={s.sectionHead}>Detailed Attendance Records</p>
      <div style={{ padding: '0 0 0 0' }}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Student ID</th>
              <th style={s.th}>Full Name</th>
              <th style={s.th}>Course</th>
              <th style={s.thCenter}>Sessions</th>
              <th style={s.thCenter}>Present</th>
              <th style={s.thCenter}>Absent</th>
              <th style={s.thCenter}>Late</th>
              <th style={s.thCenter}>Rate</th>
              <th style={s.thCenter}>Standing</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ ...s.td, textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                  No records found for the selected filters.
                </td>
              </tr>
            ) : rows.map(({ student, course, stats }, i) => {
              const pct    = parseFloat(stats.percentage);
              const status = pct >= 75 ? 'Satisfactory' : pct >= 50 ? 'At Risk' : 'Unsatisfactory';
              const rowBg  = i % 2 === 0 ? '#fff' : '#f8fafc';
              return (
                <tr key={`${student.id}-${course?.id}-${i}`} style={{ background: rowBg }}>
                  <td style={s.td}>{student.studentId ?? student.id}</td>
                  <td style={{ ...s.td, fontWeight: '600' }}>{student.name}</td>
                  <td style={s.td}>{course?.name ?? '—'}</td>
                  <td style={s.tdCenter}>{stats.total}</td>
                  <td style={{ ...s.tdCenter, color: '#16a34a', fontWeight: '600' }}>{stats.present}</td>
                  <td style={{ ...s.tdCenter, color: '#dc2626', fontWeight: '600' }}>{stats.absent}</td>
                  <td style={{ ...s.tdCenter, color: '#ca8a04', fontWeight: '600' }}>{stats.late}</td>
                  <td style={{ ...s.tdCenter, ...pctStyle(pct) }}>{stats.percentage}%</td>
                  <td style={s.tdCenter}><span style={statusStyle(pct)}>{status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Notes ── */}
      <div style={{ padding: '10px 28px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', marginTop: 0 }}>
        <p style={{ fontSize: '9px', color: '#94a3b8', margin: 0 }}>
          <strong style={{ color: '#64748b' }}>Note:</strong> Late attendance is weighted at 50% towards the overall attendance rate.
          A minimum attendance rate of 75% is required. Students falling below this threshold are flagged as "At Risk" or "Unsatisfactory".
          This report is generated automatically by HEADCOUNT and is valid without a physical signature when accessed digitally.
        </p>
      </div>

      {/* ── Footer / Signatures ── */}
      <div style={s.footer}>
        <div style={s.sigBlock}>
          <div style={s.sigLine} />
          <p style={s.sigLabel}>{generatedBy}</p>
          <p style={s.sigSub}>Report prepared by · {role.charAt(0).toUpperCase() + role.slice(1)}</p>
        </div>
        <div style={s.sigBlock}>
          <div style={s.sigLine} />
          <p style={s.sigLabel}>Authorised Signature</p>
          <p style={s.sigSub}>Head of Department / Registrar</p>
        </div>
        <div style={s.footerNote}>
          <div>National University of Lesotho</div>
          <div>Attendance Management System</div>
          <div style={{ marginTop: 4 }}>Report No: {reportNo}</div>
          <div>Page 1 of 1</div>
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main ReportsPage — unchanged from your version
// ─────────────────────────────────────────────────────────────
export function ReportsPage() {
  const { user }                       = useAuth();
  const { courses, users, attendance } = useData();
  const { log }                        = useLog();

  const [filterCourse,  setFilterCourse]  = useState<string>('all');
  const [filterStudent, setFilterStudent] = useState<string>('all');
  const [startDate,     setStartDate]     = useState<string>('');
  const [endDate,       setEndDate]       = useState<string>('');
  const [previewing,    setPreviewing]    = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const isLecturer = user?.role === 'lecturer';
  const isStudent  = user?.role === 'student';

  const visibleCourses = useMemo(() => {
    if (isLecturer) return courses.filter(c => (user.assignedCourses ?? []).includes(c.id));
    return courses;
  }, [courses, user, isLecturer]);

  const visibleStudents = useMemo(() => {
    const all = users.filter(u => u.role === 'student');
    if (isStudent)  return all.filter(s => s.id === user.id);
    if (isLecturer) {
      const ids = new Set(visibleCourses.map(c => c.id));
      return all.filter(s => (s.enrolledCourses ?? []).some(id => ids.has(id)));
    }
    return all;
  }, [users, user, isLecturer, isStudent, visibleCourses]);

  const courseStudents = useMemo(() =>
    filterCourse !== 'all'
      ? visibleStudents.filter(s => (s.enrolledCourses ?? []).includes(filterCourse))
      : visibleStudents,
    [visibleStudents, filterCourse]
  );

  const studentsToShow = useMemo(() => {
    if (isStudent) return visibleStudents;
    if (filterStudent !== 'all') return courseStudents.filter(s => s.id === filterStudent);
    return courseStudents;
  }, [isStudent, visibleStudents, filterStudent, courseStudents]);

  const getStudentStats = (studentId: string, courseId: string) => {
    const records = attendance.filter(a => {
      if (a.studentId !== studentId) return false;
      if (courseId !== 'all' && a.courseId !== courseId) return false;
      if (startDate && a.date < startDate) return false;
      if (endDate   && a.date > endDate)   return false;
      return true;
    });
    const total      = records.length;
    const present    = records.filter(r => r.status === 'present').length;
    const absent     = records.filter(r => r.status === 'absent').length;
    const late       = records.filter(r => r.status === 'late').length;
    const percentage = total > 0
      ? (((present + late * 0.5) / total) * 100).toFixed(1)
      : '0';
    return { total, present, absent, late, percentage };
  };

  const rows = useMemo(() =>
    studentsToShow.flatMap(student => {
      const enrolled = filterCourse !== 'all'
        ? [filterCourse]
        : (student.enrolledCourses ?? []).filter(id => visibleCourses.some(c => c.id === id));
      return enrolled.map(courseId => ({
        student,
        course: courses.find(c => c.id === courseId),
        stats:  getStudentStats(student.id, courseId),
      }));
    }),
    [studentsToShow, filterCourse, visibleCourses, attendance, startDate, endDate]
  );

  const courseSummaries = useMemo(() => {
    if (!isLecturer) return [];
    return visibleCourses.map(course => {
      const enrolled = visibleStudents.filter(s => (s.enrolledCourses ?? []).includes(course.id));
      const records  = attendance.filter(a => a.courseId === course.id);
      const present  = records.filter(r => r.status === 'present').length;
      const late     = records.filter(r => r.status === 'late').length;
      const total    = records.length;
      const avgPct   = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 0;
      return { course, enrolled: enrolled.length, total, present, late, avgPct };
    });
  }, [isLecturer, visibleCourses, visibleStudents, attendance]);

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win     = window.open('', '_blank', 'width=960,height=700');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>Attendance Report — NUL HEADCOUNT</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #fff; }
      @media print {
        @page { margin: 12mm 14mm; size: A4 landscape; }
      }
    </style>
  </head>
  <body>${content}<script>window.onload=()=>{window.print();window.close();}<\/script></body>
</html>`);
    win.document.close();
    log('data_export', 'Report printed/downloaded', `PDF report by ${user?.name}`, 'info');
  };

  const handleExportCSV = () => {
    const csv = [
      ['Student ID', 'Name', 'Course', 'Total', 'Present', 'Absent', 'Late', 'Attendance %'].join(','),
      ...rows.map(({ student, course, stats }) =>
        [student.studentId ?? student.id, student.name, course?.name ?? 'N/A',
         stats.total, stats.present, stats.absent, stats.late, `${stats.percentage}%`].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `attendance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    log('data_export', 'CSV exported', `CSV by ${user?.name}`, 'info');
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl mb-2 dark:text-white">Attendance Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">View, preview and export attendance data.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="gap-2 dark:border-gray-700 dark:text-gray-300"
            onClick={() => setPreviewing(true)}>
            <Eye className="w-4 h-4" /> Preview Report
          </Button>
          <Button type="button" onClick={handlePrint} className="gap-2" style={{ backgroundColor: 'var(--theme-primary)' }}>
            <Printer className="w-4 h-4" /> Print / PDF
          </Button>
          <Button type="button" variant="outline" onClick={handleExportCSV} className="gap-2 dark:border-gray-700 dark:text-gray-300">
            <Download className="w-4 h-4" /> CSV
          </Button>
        </div>
      </div>

      {/* Lecturer course summaries */}
      {isLecturer && courseSummaries.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> Course Summaries
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {courseSummaries.map(({ course, enrolled, total, present, late, avgPct }) => (
              <Card key={course.id}
                className="hover:shadow-md transition-shadow cursor-pointer dark:bg-gray-900 dark:border-gray-800"
                onClick={() => { setFilterCourse(course.id); setFilterStudent('all'); }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">{course.name}</p>
                      <p className="text-xs text-gray-400">{course.code}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ml-2 ${
                      avgPct >= 75 ? 'bg-green-100 text-green-700' :
                      avgPct >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>{avgPct}% avg</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mb-2">
                    <div className={`h-1.5 rounded-full ${avgPct >= 75 ? 'bg-green-500' : avgPct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${avgPct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{enrolled} students</span>
                    <span>{present}P · {late}L · {total} records</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      {!isStudent && (
        <Card className="mb-6 dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="dark:text-gray-300">Course</Label>
                <Select value={filterCourse} onValueChange={v => { setFilterCourse(v); setFilterStudent('all'); }}>
                  <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {visibleCourses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="dark:text-gray-300">Student</Label>
                <Select value={filterStudent} onValueChange={setFilterStudent}>
                  <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    {courseStudents.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="dark:text-gray-300">Start Date</Label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-gray-300">End Date</Label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data table */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader><CardTitle className="dark:text-white">Attendance Summary</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Course</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Present</TableHead>
                <TableHead className="text-center">Absent</TableHead>
                <TableHead className="text-center">Late</TableHead>
                <TableHead className="text-center">Attendance %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                    No attendance records found.
                  </TableCell>
                </TableRow>
              ) : rows.map(({ student, course, stats }, i) => {
                const pct = parseFloat(stats.percentage);
                return (
                  <TableRow key={`${student.id}-${course?.id ?? i}`}>
                    <TableCell className="font-medium dark:text-gray-300">{student.studentId ?? student.id}</TableCell>
                    <TableCell className="dark:text-gray-300">{student.name}</TableCell>
                    <TableCell className="dark:text-gray-300">{course?.name ?? 'N/A'}</TableCell>
                    <TableCell className="text-center dark:text-gray-300">{stats.total}</TableCell>
                    <TableCell className="text-center text-green-600">{stats.present}</TableCell>
                    <TableCell className="text-center text-red-600">{stats.absent}</TableCell>
                    <TableCell className="text-center text-yellow-600">{stats.late}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        pct >= 75  ? 'bg-green-100 text-green-700'   :
                        pct >= 50  ? 'bg-yellow-100 text-yellow-700' :
                                     'bg-red-100 text-red-700'
                      }`}>{stats.percentage}%</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Hidden print target */}
      <div ref={printRef} style={{ display: 'none' }}>
        <ReportTemplate
          rows={rows}
          visibleCourses={visibleCourses}
          filterCourse={filterCourse}
          startDate={startDate}
          endDate={endDate}
          generatedBy={user?.name ?? 'Unknown'}
          role={user?.role ?? ''}
          allAttendance={attendance}
        />
      </div>

      {/* Preview modal */}
      {previewing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-auto py-8 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Report Preview</h2>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={handlePrint} className="gap-2"
                  style={{ backgroundColor: 'var(--theme-primary)' }}>
                  <Printer className="w-4 h-4" /> Print / Save PDF
                </Button>
                <button type="button" onClick={() => setPreviewing(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-8 overflow-auto max-h-[80vh] bg-gray-100">
              {/* Paper shadow effect in preview */}
              <div style={{ background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', borderRadius: 4, padding: '32px' }}>
                <ReportTemplate
                  rows={rows}
                  visibleCourses={visibleCourses}
                  filterCourse={filterCourse}
                  startDate={startDate}
                  endDate={endDate}
                  generatedBy={user?.name ?? 'Unknown'}
                  role={user?.role ?? ''}
                  allAttendance={attendance}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}