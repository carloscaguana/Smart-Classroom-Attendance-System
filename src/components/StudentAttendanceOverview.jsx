// components/StudentAttendanceOverview.jsx
import {
  getEffectiveStatus,
  getAttendanceSummary,
  getAttendanceColorClass,
  getAttendanceEmoji,
} from "../utils/attendance";

export default function StudentAttendanceOverview({ student, computeStatus }) {
  const effectiveStatus = getEffectiveStatus(student, computeStatus);
  const { attended, total, percent } = getAttendanceSummary(
    student,
    effectiveStatus
  );
  const color = getAttendanceColorClass(percent);
  const emoji = getAttendanceEmoji(percent);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 mb-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold mb-1">
            Your attendance overview
          </h2>
          <p className={`text-sm font-medium ${color}`}>
            Average attendance: {percent.toFixed(2)}%{" "}
            {total > 0
              ? `(${attended}/${total} sessions)`
              : "No attendance data yet"}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Based on counted statuses: ON_TIME, LATE, ABSENT, SKIPPED, EXCUSED.
            Present = ON_TIME, LATE, or EXCUSED. PENDING / UNKNOWN are not
            counted.
          </p>
        </div>
        <div className="text-3xl">{emoji}</div>
      </div>
    </section>
  );
}
