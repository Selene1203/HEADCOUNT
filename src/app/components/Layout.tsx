import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ThemeSettings } from './ThemeSettings';
import {
  LayoutDashboard, BookOpen, Users, ClipboardList, FileText,
  LogOut, UserCircle, GraduationCap, GitBranch, Building2,
  ScrollText,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

interface LayoutProps {
  children: React.ReactNode;
}

type UserRole = 'admin' | 'student' | 'lecturer';

const lecturerNav: NavItem[] = [
  { path: '/lecturer-dashboard', label: 'Dashboard',        icon: <LayoutDashboard className="w-5 h-5" /> },
  { path: '/my-courses',         label: 'My Courses',       icon: <BookOpen className="w-5 h-5" /> },
  { path: '/take-attendance',    label: 'Class Attendance', icon: <ClipboardList className="w-5 h-5" /> },
  { path: '/reports',            label: 'Reports',          icon: <FileText className="w-5 h-5" /> },
];

const adminNav: NavItem[] = [
  { path: '/admin-dashboard', label: 'Dashboard',                icon: <LayoutDashboard className="w-5 h-5" /> },
  { path: '/students',        label: 'Students',                 icon: <Users className="w-5 h-5" /> },
  { path: '/courses',         label: 'Courses',                  icon: <BookOpen className="w-5 h-5" /> },
  { path: '/lecturers',       label: 'Lecturers',                icon: <UserCircle className="w-5 h-5" /> },
  { path: '/departments',     label: 'Departments & Programmes', icon: <Building2 className="w-5 h-5" /> },
  { path: '/reports',         label: 'Reports',                  icon: <FileText className="w-5 h-5" /> },
  { path: '/logs',            label: 'Activity Logs',            icon: <ScrollText className="w-5 h-5" /> },
  { path: '/flowchart',       label: 'System Flow',              icon: <GitBranch className="w-5 h-5" /> },
];

const studentNav: NavItem[] = [
  { path: '/student-dashboard', label: 'Dashboard',       icon: <LayoutDashboard className="w-5 h-5" /> },
  { path: '/enroll-courses',    label: 'My Courses',      icon: <BookOpen className="w-5 h-5" /> },
  { path: '/mark-attendance',   label: 'Mark Attendance', icon: <ClipboardList className="w-5 h-5" /> },
  { path: '/reports',           label: 'My Attendance',   icon: <FileText className="w-5 h-5" /> },
];

const NAV_MAP: Record<UserRole, NavItem[]> = {
  admin:    adminNav,
  student:  studentNav,
  lecturer: lecturerNav,
};

export function Layout({ children }: LayoutProps): React.JSX.Element {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = (): void => {
    logout();
    navigate('/');
  };

  const role     = (user?.role as UserRole) ?? 'lecturer';
  const navItems = NAV_MAP[role] ?? lecturerNav;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col flex-shrink-0">

        {/* Brand */}
        <div className="p-5 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white tracking-tight">HEADCOUNT</h1>
              <p className="text-xs text-gray-400 dark:text-slate-500">NUL Attendance Management System</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, transparent)',
                borderColor:     'color-mix(in srgb, var(--theme-primary) 25%, transparent)',
              }}
            >
              <UserCircle className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name ?? 'Unknown User'}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">{user?.role ?? 'Guest'}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
          {navItems.map((item: NavItem) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                }`}
                style={isActive ? { backgroundColor: 'var(--theme-primary)' } : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-slate-800 space-y-1.5">
          <ThemeSettings />
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>

      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-white">
        {children}
      </main>

    </div>
  );
}