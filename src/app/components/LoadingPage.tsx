export function LoadingPage() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-slate-950 z-50 transition-colors duration-300">
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(0.9); opacity: 0.6; }
          50%  { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-6px); opacity: 1; }
        }
        .loading-icon  { animation: pulse-ring 2s ease-in-out infinite; }
        .loading-title { animation: fade-up 0.6s ease forwards; animation-delay: 0.2s; opacity: 0; }
        .loading-dots  { animation: fade-up 0.6s ease forwards; animation-delay: 0.5s; opacity: 0; }
        .dot {
          display: inline-block; width: 6px; height: 6px; border-radius: 50%;
          margin: 0 3px; background-color: #4f46e5;
          animation: dot-bounce 1.4s ease-in-out infinite;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      {/* Icon */}
      <div className="loading-icon mb-6">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg bg-indigo-600">
          <svg
            viewBox="0 0 24 24" fill="none"
            className="w-11 h-11 text-white"
            stroke="currentColor" strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3.33 2 8.67 2 12 0v-5" />
          </svg>
        </div>
      </div>

      {/* Wordmark */}
      <div className="loading-title text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white" style={{ letterSpacing: '-0.02em' }}>
          HEADCOUNT
        </h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1 tracking-widest uppercase">
          NUL Attendance Management System
        </p>
      </div>

      {/* Dots */}
      <div className="loading-dots mt-8">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </div>
  );
}