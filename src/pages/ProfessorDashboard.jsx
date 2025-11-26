import { useState } from "react";
import StudentCard from "../components/StudentCard.jsx";
import { formatTotalDuration } from '../utils/time.jsx';

const STATUS_OPTIONS = [
  "ON_TIME",
  "LATE",
  "PENDING",
  "ABSENT",
  "SKIPPED",
  "EXCUSED",
  "UNKNOWN",
];

// Statuses that count as present for attendance calculation
const PRESENT_STATUSES = ["ON_TIME", "LATE", "EXCUSED"];

// Statuses that count towards attendance calculation
// Doesn't include PENDING and UNKNOWN
const COUNTED_STATUSES = ["ON_TIME", "LATE", "ABSENT", "SKIPPED", "EXCUSED"];

// Temporary mock data
const MOCK_STUDENTS = [
  // ON_TIME (with leave time)
  {
    id: "s1",
    name: "Saturo Gojo",
    uid: "04:A3:BC:91",
    totalSeconds: 5400,
    visitCount: 3,
    lastArrival: "2025-11-25 09:05",
    lastLeave: "2025-11-25 10:10",
    status: "PENDING",
    overrideStatus: null,
    attendanceRecords: [
      { date: "2025-11-11", status: "ON_TIME" },
      { date: "2025-11-13", status: "ON_TIME" },
      { date: "2025-11-18", status: "LATE" },
      { date: "2025-11-20", status: "ON_TIME" },
      { date: "2025-11-25", status: "ON_TIME" },
    ],
  },

  // LATE
  {
    id: "s2",
    name: "Ryomen Sukuna",
    uid: "0A:FF:11:22",
    totalSeconds: 7200,
    visitCount: 4,
    lastArrival: "2025-11-25 09:15",
    lastLeave: "2025-11-25 10:20",
    status: "PENDING",
    overrideStatus: null,
    attendanceRecords: [
      { date: "2025-11-11", status: "LATE" },
      { date: "2025-11-13", status: "LATE" },
      { date: "2025-11-18", status: "ON_TIME" },
      { date: "2025-11-20", status: "SKIPPED" },
      { date: "2025-11-25", status: "LATE" },
    ],
  },

  // ABSENT
  {
    id: "s3",
    name: "Denji",
    uid: "06:B4:35:42",
    totalSeconds: 0,
    visitCount: 0,
    lastArrival: "",
    lastLeave: "",
    status: "PENDING",
    overrideStatus: null,
    attendanceRecords: [
      { date: "2025-11-11", status: "ABSENT" },
      { date: "2025-11-13", status: "ABSENT" },
      { date: "2025-11-18", status: "ABSENT" },
      { date: "2025-11-20", status: "SKIPPED" },
      { date: "2025-11-25", status: "ABSENT" },
    ],
  },

  // SKIPPED
  {
    id: "s4",
    name: "Power",
    uid: "08:B4:36:43",
    totalSeconds: 1000,
    visitCount: 1,
    lastArrival: "2025-11-25 09:02",
    lastLeave: "2025-11-25 09:30",
    status: "PENDING",
    overrideStatus: null,
    attendanceRecords: [
      { date: "2025-11-11", status: "LATE" },
      { date: "2025-11-13", status: "LATE" },
      { date: "2025-11-18", status: "ON_TIME" },
      { date: "2025-11-20", status: "SKIPPED" },
      { date: "2025-11-25", status: "EXCUSED" },
    ],
  },

  // Forgot to clock out but class ended
  {
    id: "s5",
    name: "Reze",
    uid: "09:B5:37:44",
    totalSeconds: 2700,
    visitCount: 4,
    lastArrival: "2025-11-25 09:00",
    lastLeave: "",
    status: "PENDING",
    overrideStatus: null,
    attendanceRecords: [
      { date: "2025-11-11", status: "EXCUSED" },
      { date: "2025-11-13", status: "LATE" },
      { date: "2025-11-18", status: "ON_TIME" },
      { date: "2025-11-20", status: "SKIPPED" },
      { date: "2025-11-25", status: "LATE" },
    ],
  },

  // Error on arrival time format
   {
    id: "s6",
    name: "Megumi Fushigoro",
    uid: "01:H5:A3:32",
    totalSeconds: 2800,
    visitCount: 6,
    lastArrival: "2025-11-25",
    lastLeave: "",
    status: "PENDING",
    overrideStatus: null,
    attendanceRecords: [
      { date: "2025-11-11", status: "LATE" },
      { date: "2025-11-13", status: "EXCUSED" },
      { date: "2025-11-18", status: "ON_TIME" },
      { date: "2025-11-20", status: "SKIPPED" },
      { date: "2025-11-25", status: "LATE" },
    ],
  },

  // Error on leave time format
   {
    id: "s7",
    name: "Jogo",
    uid: "010:A5:Q7:14",
    totalSeconds: 1500,
    visitCount: 7,
    lastArrival: "2025-11-25 09:00",
    lastLeave: "10:20",
    status: "PENDING",
    overrideStatus: null,
    attendanceRecords: [
      { date: "2025-11-11", status: "LATE" },
      { date: "2025-11-13", status: "ON_TIME" },
      { date: "2025-11-18", status: "ON_TIME" },
      { date: "2025-11-20", status: "SKIPPED" },
      { date: "2025-11-25", status: "LATE" },
    ],
  },

  // Arrives late, but has not clocked out yet
   {
    id: "s8",
    name: "Toji",
    uid: "026:C7:E4:67",
    totalSeconds: 1200,
    visitCount: 8,
    lastArrival: "2025-11-25 09:20",
    lastLeave: "",
    status: "PENDING",
    overrideStatus: null,
    attendanceRecords: [
      { date: "2025-11-11", status: "ABSENT" },
      { date: "2025-11-13", status: "SKIPPED" },
      { date: "2025-11-18", status: "EXCUSED" },
      { date: "2025-11-20", status: "SKIPPED" },
      { date: "2025-11-25", status: "ON_TIME" },
    ],
  },
];

// Parses timestamp in "YYYY-MM-DD HH:MM" format and returns total minutes
// Time is in 24-hour format
// Null is for no timestamp, while -1 indicates an invalid format
function getMinuteFromTimestamp(timestamp) {
  if (!timestamp) {
    return null;
  }

  const parts = timestamp.split(" ");

  if (parts.length < 2) {
    return -1;
  }

  const [hour, minute] = parts[1].split(":").map(Number);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return -1;
  }

  return hour * 60 + minute;
}

// Parses timestring in "HH:MM" format and returns total minutes
// Time is in 24-hour format
// Returns null if there is no timestring, while -1 indicates an invalid format
function getMinuteFromTimestring(timeString) {
  if (!timeString) {
    return null;
  }

  const [hour, minute] = timeString.split(":").map(Number);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return -1;
  }

  return hour * 60 + minute;
}

// Calculates the session duration in minutes based on students' arrival and leave times
// Returns null if not possible
// Returns -1 if the arrival and/or leave time format is invalid
function getSessionDurationMinutes(student) {
  const arrival = getMinuteFromTimestamp(student.lastArrival);
  const leave = getMinuteFromTimestamp(student.lastLeave);

  if (arrival === -1 || leave === -1) {
    return -1;
  }

  if (arrival == null || leave == null) {
    return null;
  }

  if (leave < arrival) {
    return -1;
  }

  return leave - arrival;
}

// Formats session duration based on students' arrival and leave times
function formatSessionDuration(student) {
  const durationMinutes = getSessionDurationMinutes(student);

  if (durationMinutes === null || durationMinutes === -1) return "N/A";

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  return `${hours}h ${minutes}m`;
}

function getEffectiveStatus(student, computeFn) {
  if (student.overrideStatus) {
    return student.overrideStatus;
  }

  return computeFn(student);
}

// For a single student
function getAttendanceSummary(student) {
  const records = student.attendanceRecords || [];

  // Filters out unknown statuses
  const counted = records.filter((r) =>
    COUNTED_STATUSES.includes(r.status)
  );

  const total = counted.length;

  // If attendance record is empty, then can't calculate past attendance
  if (total === 0) {
    return { attended: 0, total: 0, percent: 0 };
  }

  // Filter only present statuses and gets its length (attended count)
  const attended = counted.filter((r) =>
    PRESENT_STATUSES.includes(r.status)
  ).length;

  // Calculates percentage (unrounded)
  const percent = ((attended / total) * 100);

  return { attended, total, percent };
}

// For the whole class
function getClassAttendanceSummary(students) {
  let totalSessions = 0;
  let totalAttended = 0;

  // For each student, counts their attended and total sessions
  // and adds them to totalSessions and totalAttended
  // (to calculate class average)
  students.forEach((s) => {
    const { attended, total } = getAttendanceSummary(s);
    totalSessions += total;
    totalAttended += attended;
  });

  // Calculates class average percentage (unrounded)
  const percent =
    totalSessions === 0
      ? 0
      : ((totalAttended / totalSessions) * 100);

  return { totalSessions, totalAttended, percent };
}

// Color for percentage (used in details panel, class overview)
function getAttendanceColorClass(percent) {
  if (percent >= 90) return "text-emerald-300";
  if (percent >= 70) return "text-amber-300";
  if (percent >= 40) return "text-orange-300";
  //if (percent > 0) return "text-red-300";
  return "text-red-300";
}

// image/icon based on student percentage
function getAttendanceEmoji(percent) {
  if (percent >= 90) return "🟢"; // S-tier
  if (percent >= 70) return "🟡"; // decent
  if (percent >= 40) return "🟠";   // bad
  return "🔴";                    // very bad
}

export default function ProfessorDashboard() {
  const [courseName, setCourseName] = useState("CS410");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:15");
  const [graceMinutes, setGraceMinutes] = useState(10);

  const [minMinutesPresent, setMinMinutesPresent] = useState(30);

  const [students, setStudents] = useState(MOCK_STUDENTS);
  const [selectedStudent, setSelectedStudent] = useState(null);

  function setOverrideStatus(studentId, newStatus) {
    setStudents((prev) => 
      prev.map((s) => 
      s.id === studentId
          ? { ...s, overrideStatus: newStatus || null}
          : s
      )
    );

    setSelectedStudent((prev) =>
      prev && prev.id === studentId
          ? { ...prev, overrideStatus: newStatus || null}
          : prev
    );
  }

  function computeStatus(student) {
    // Course start and end times in minutes
    const startMinutes = getMinuteFromTimestring(startTime);
    const endMinutes = getMinuteFromTimestring(endTime);

    // Professor hasn't selected course time
    if (startMinutes === null || endMinutes === null) {
      return "UNKNOWN";
    }

    // Current real time
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const arrivalInMinutes = getMinuteFromTimestamp(student.lastArrival);
    const leaveInMinutes = getMinuteFromTimestamp(student.lastLeave);
    const durationMinutes = getSessionDurationMinutes(student);

    // Checks if the student arrived within the grace period
    const latestOnTime = startMinutes + graceMinutes;

    // Checks if the student left within the grace period
    const latestLeaveTime = endMinutes + graceMinutes;

    // Returns UNKNOWN if arrival/leave time format is invalid
    // if (arrivalInMinutes === -1 || leaveInMinutes === -1) {
    //   return "UNKNOWN";
    // }

    if (durationMinutes === -1) {
      return "UNKNOWN";
    }
    // null means student hasn't arrived
    // If the current time is past class end time, that means
    // the student never showed up for the entire session and is marked ABSENT
    // Otherwise, the student has not arrived yet, but has time to arrive, so 
    // they are marked PENDING
    if (arrivalInMinutes === null) {
      // Current time is past class end time
      if (nowMinutes > latestLeaveTime) {
        return "ABSENT";
      }

      // Student has not arrived yet, but class is ongoing
      return "PENDING";
    }

    
    // If durationMinutes is not null, that means there is an arrival and leave time
    if (durationMinutes !== null) {
        // Student arrived but left early, so they are marked as SKIPPED
        if (durationMinutes < minMinutesPresent) {
            return "SKIPPED";
        }

        // Student arrived and left, so check if they were ON_TIME or LATE
        if (arrivalInMinutes <= latestOnTime && leaveInMinutes <= latestLeaveTime) {
            return "ON_TIME";
        } else {
            return "LATE";
        }
    }

    

    // HOWEVER, if durationMinutes is null, that means the student has not clocked out
    // yet. So, if the current time is past the class end time, the student is SKIPPED
    // (because they have not clocked out yet and class has ended)
    // Otherwise, I can still check if they are ON_TIME or LATE based on their arrival time
    // (they did not clock out but class hasn't ended yet)
    if (nowMinutes > latestLeaveTime) {
      return "SKIPPED";
    } else {
        if (arrivalInMinutes <= latestOnTime) {
            return "ON_TIME";
        } else {
            return "LATE";
        }
    }

    // Default to PENDING
    // (Maybe I should default to ABSENT?)
    return "PENDING";
  }
  
  return (
    // How to comment: {/* Comment: https://stackoverflow.com/questions/30766441/how-to-use-comments-in-react */}
    // Entire page
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <h1 className="text-lg font-semibold">Professor Dashboard</h1>
        <div className="text-sm text-slate-300">
          Smart Classroom Attendance System • <span className="font-medium">Professor</span>
        </div>
      </header>

      {/* Main content area */}
      <main className="px-6 py-4 space-y-6">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 mb-2">
          {(() => {
            const { totalSessions, totalAttended, percent } = getClassAttendanceSummary(students);
            const color = getAttendanceColorClass(percent);
            const emoji = getAttendanceEmoji(percent);

            return (
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold mb-1">
                    Class attendance overview
                  </h2>
                  <p className={`text-sm font-medium ${color}`}>
                    Average attendance: {percent}%{" "}
                    {totalSessions > 0 &&
                      `(${totalAttended}/${totalSessions} total session-marks)`}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Based on counted statuses: ON_TIME, LATE, ABSENT, SKIPPED, EXCUSED.
                  </p>
                </div>
                <div className="text-3xl">
                  {emoji}
                </div>
              </div>
            );
          })()}
        </section>
        {/* Course configuration area */}
        <section className="grid md:grid-cols-[2fr,3fr] gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <h2 className="text-sm font-semibold mb-3">
              Course configuration
            </h2>
            {/* Setting course name */}
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Course name
                </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. CS101 - Intro to CS"
                />
              </div>

              {/* Setting start time */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Start time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {/* Setting end time */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    End time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {/* Setting grace period */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Grace mins for arrival and leave
                  </label>
                  <input
                    type="number"
                    value={graceMinutes}
                    onChange={(e) =>
                      setGraceMinutes(Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {/* Setting minimum minutes present */}
                </div>
                  <div>
                  <label className="block text-xs text-slate-400 mb-1">
                      Minimum minutes present to mark as attended
                  </label>
                  <input
                      type="number"
                      value={minMinutesPresent}
                      onChange={(e) => setMinMinutesPresent(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              <p className="text-xs text-slate-400 mt-1">
                Changing these values will recalculate who is considered{" "}
                <span className="text-emerald-300">ON_TIME</span>,
                {" "} <span className="text-red-300">LATE</span>,
                {" "} <span className="text-amber-300">PENDING</span>,
                {" "} <span className="text-fuchsia-300">ABSENT</span>, and
                {" "} <span className="text-pink-300">SKIPPED</span>,
                based on their
                arrival time.
              </p>
            </div>
          </div>

          {/* Selected student details */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <h2 className="text-sm font-semibold mb-3">
              {selectedStudent ? "Student details" : "Select a student"}
            </h2>

            {selectedStudent ? (
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
                  <span className="text-slate-400 text-xs">Total time</span>
                  <div className="text-xs text-slate-300">
                    {formatTotalDuration(selectedStudent.totalSeconds || 0)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">
                    Arrival time
                  </span>
                  <div className="text-xs">
                    {selectedStudent.lastArrival || "N/A"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">
                    Leave time
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
                <div>
                  <span className="text-slate-400 text-xs">Override status</span>
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500
                                hover:border-emerald-500 hover:bg-slate-900 transition-colors"
                    value={selectedStudent.overrideStatus || ""}
                    onChange={(e) =>
                      setOverrideStatus(selectedStudent.id, e.target.value)
                    }
                  >
                    <option value="">Use automatic</option>
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

                <div>
                  <span className="text-slate-400 text-xs">Attendance</span>
                  {(() => {
                    const { attended, total, percent } = getAttendanceSummary(selectedStudent);
                    const color = getAttendanceColorClass(percent);
                    const emoji = getAttendanceEmoji(percent);

                    return (
                      <div className="mt-1 flex items-center justify-between">
                        <div>
                          <div className={`text-sm font-semibold ${color}`}>
                            {total > 0
                              ? `${percent}% attendance (${attended}/${total} sessions)`
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
            ) : (
              <p className="text-xs text-slate-400">
                Click on a student card to see more details here.
              </p>
            )}
          </div>
        </section>

        {/* Student cards grid */}
        <section>
          <h2 className="text-sm font-semibold mb-2">
            Students in this class
          </h2>
          {/* Grid system: https://tailwindcss.com/docs/grid-template-columns */}
          {/* Default shows 1 card per row. Medium screens shows 2 cards per row, while
              large screens shows 3 cards per row. */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {students.map((s) => {
              const attendanceSummary = getAttendanceSummary(s);
              return (
                <StudentCard
                  key={s.id}
                  student={{ ...s, status: getEffectiveStatus(s, computeStatus) }}
                  attendanceSummary={attendanceSummary}
                  onClick={() => {
                    if (selectedStudent && selectedStudent.id === s.id) {
                      setSelectedStudent(null);
                    } else {
                      setSelectedStudent(s);
                    }
                  }}
                />
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
