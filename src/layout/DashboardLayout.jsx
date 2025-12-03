export default function DashboardLayout({ title, onLogout, onBack, children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <h1 className="text-lg font-semibold">{title}</h1>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-sm text-slate-300">
            Smart Classroom Attendance System
          </div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200
                         hover:border-emerald-400 hover:text-emerald-300 hover:bg-slate-900/80
                         transition-colors"
            >
              Back To Courses
            </button>
          )}

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200
                         hover:border-red-400 hover:text-red-300 hover:bg-slate-900/80
                         transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </header>

      <main className="px-6 py-4 space-y-6">{children}</main>
    </div>
  );
}
