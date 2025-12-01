import {
  STATUS_OPTIONS,
  formatSessionDuration,
  getEffectiveStatus,
  getAttendanceSummary,
  getAttendanceColorClass,
  getAttendanceEmoji,
} from "../utils/attendance";
import { formatTotalDuration } from "../utils/time"; // your existing util

export default function StudentDetailsPanel({
  selectedStudent,
  computeStatus,
  onOverrideStatusChange,
  showOverrideControls = true,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <h2 className="text-sm font-semibold mb-3">
        {selectedStudent ? "Student details" : "Select a student"}
      </h2>

      {!selectedStudent ? (
        <p className="text-xs text-slate-400">
          Click on a student card to see more details here.
        </p>
      ) : (
        <div className="text-sm text-slate-200 space-y-2">
          <div>
                  <span className="text-slate-400 text-xs">Name</span>
                  <div className="font-medium">{selectedStudent.name}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">UID</span>
                  <div className="text-xs text-slate-300">
                    {selectedStudent.uid}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Total Time</span>
                  <div className="text-xs text-slate-300">
                    {formatTotalDuration(selectedStudent.totalSeconds || 0)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">
                    Arrival Time
                  </span>
                  <div className="text-xs">
                    {selectedStudent.lastArrival || "N/A"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">
                    Leave Time
                  </span>
                  <div className="text-xs">
                    {selectedStudent.lastLeave || "N/A"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Duration</span>
                  <div className="text-xs text-slate-300">
                    {formatSessionDuration(selectedStudent)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Status</span>
                  <div className="text-xs">
                    {getEffectiveStatus(selectedStudent, computeStatus)}
                  </div>
                </div>
                {showOverrideControls && (
                    <div>
                    <span className="text-slate-400 text-xs">Override Status</span>
                    <select
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500
                                  hover:border-emerald-500 hover:bg-slate-900 transition-colors"
                      value={selectedStudent.overrideStatus || ""}
                      onChange={(e) =>
                        onOverrideStatusChange(selectedStudent.id, e.target.value)
                      }
                    >
                      <option value="">Use Automatic</option>
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-2">
                      Choosing a value here locks this student&apos;s status and
                      ignores automatic rules until you switch back to
                      <span className="italic"> Use automatic</span>.
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 text-xs">Attendance</span>
                  {(() => {
                    const effectiveStatus = getEffectiveStatus(selectedStudent, computeStatus);
                    const { attended, total, percent } = getAttendanceSummary(selectedStudent, effectiveStatus);
                    const color = getAttendanceColorClass(percent);
                    const emoji = getAttendanceEmoji(percent);

                    return (
                      <div className="mt-1 flex items-center justify-between">
                        <div>
                          <div className={`text-sm font-semibold ${color}`}>
                            {total > 0
                              ? `${percent.toFixed(2)}% attendance (${attended}/${total} sessions)`
                              : "No attendance data"}
                          </div>
                          {total > 0 && (
                            <div className="text-[10px] text-slate-500">
                              Present = ON_TIME, LATE, or EXCUSED
                            </div>
                          )}
                        </div>
                        <div className="text-2xl ml-3">
                          {emoji}
                          {/* Image alternative (I might implement this later)
                            <img
                              src={getAttendanceImageSrc(percent)}
                              alt="Attendance tier"
                              className="w-10 h-10"
                            />
                          */}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <p className="text-xs text-slate-400 mt-4">
                  TODO: per-session history, lateness for
                  each day, etc.
                </p>
        </div>
      )}
    </div>
  );
}
