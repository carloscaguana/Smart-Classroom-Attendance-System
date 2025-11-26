import { formatTotalDuration } from '../utils/time.jsx';

const statusColorMap = {
  ON_TIME: "emerald",
  LATE: "red",
  PENDING: "amber",
  ABSENT: "fuchsia",
  SKIPPED: "pink",
  EXCUSED: "blue",
  UNKNOWN: "slate"
};

export default function StudentCard({ student, attendanceSummary, onClick }) {
  // uid - Unique identifier based on the students' NFC card
  // Visits - Number of times a student clocks in and out during class
  // totalSeconds - Total time (in seconds) a student has spent in class
  // lastArrival - Timestamp of the student's last arrival
  // lastLeave - Timestamp of the student's last leave
  // Note: lastArrival and lastLeave does not show previous arrival and leave times.
  //       That's why visits exists, which shows if a student has been in class multiple times.
  // Status - ON_TIME, LATE, ABSENT, PENDING, SKIPPED, EXCUSED.
  //          If class has started and the student has not arrived, status is PENDING.
  //          If a student has arrived within the allowed time, status is ON_TIME.
  //          HOWEVER, if the class ends and the student has not left, status changes to ABSENT.
  //
  //          If a student arrives after the allowed time, status is LATE.
  //
  //          If a student arrived on time, but leaves early, the status is SKIPPED.
  //
  //          The professor can manually set a student's status to EXCUSED.
  //
  //          Unknown is for unknown errors/occurences for students informations. Professor
  //          should review the students' information and can excuse them or change their status
  //          as needed.
  const {
    name,
    uid,
    totalSeconds,
    visitCount,
    lastArrival,
    lastLeave,
    status,
    overrideStatus,
  } = student;
// TODO: Maybe add array to store all arrival/leave times?

  // Turns a students totalSeconds into a HH:MM:SS format
  // Returns the total time a student spent in a class
  // function formatDuration(totalSeconds = 0) {
  //   const hour = Math.floor(totalSeconds / 3600);
  //   const minutes = Math.floor((totalSeconds % 3600) / 60);
  //   const seconds = totalSeconds % 60;
  //   return `${hour}h ${minutes}m ${seconds}s`;
  // }

  const color = statusColorMap[status] || "slate";
  const { attended = 0, total = 0, percent = 0 } = attendanceSummary || {};
  
  return (
    <button
      onClick={onClick}
      /* Border Radius: https://tailwindcss.com/docs/border-radius */
      /* Width Percentage: https://tailwindcss.com/docs/width#using-a-percentage */
      /* Text Alignment: https://tailwindcss.com/docs/text-align#left-aligning-text */
      /* Margin: https://tailwindcss.com/docs/margin#adding-space-between-children */
      /* Color: bg = background, hover = on mouse hover, transition-colors = smooth color change */
      /* bg-slate-900/70 = slate color with 70% opacity */
      /* bg-slate-900 = solid slate color with 100% opacity */
      className="w-full text-left rounded-2xl border border-slate-800 bg-slate-900/70 p-4 
                  hover:border-emerald-500 hover:bg-slate-900
                  hover:shadow-lg hover:shadow-emerald-500/50
                  hover:-translate-y-1 hover:scale-101
                  transition-all duration-400"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-semibold text-slate-100">
            {name || "Unknown Student"}
          </div>
          <div className="text-xs text-slate-400">{uid}</div>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full border border-${color}-500/60 text-${color}-300`}
        >
          {status || "PENDING"}
        </span>
      </div>

      {/* Flex Container: https://tailwindcss.com/docs/flex */}
      {/* Justify: https://tailwindcss.com/docs/justify-content */}
      <div className="text-xs text-slate-400 space-y-1">
        <div className="flex justify-between">
          <span>Total time:</span>
          <span className="text-slate-100">
            {formatTotalDuration(totalSeconds || 0)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Visits:</span>
          <span className="text-slate-100">{visitCount ?? 0}</span>
        </div>
        <div className="flex justify-between">
          <span>Last arrival:</span>
          <span className="text-slate-100 text-right ml-2">
            {lastArrival || "N/A"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Last leave:</span>
          <span className="text-slate-100 text-right ml-2">
            {lastLeave || "N/A"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Attendance:</span>
          <span className="text-slate-100">
            {total > 0 ? `${percent}% (${attended}/${total})` : "N/A"}
          </span>
        </div>
      </div>
    </button>
  );
}
