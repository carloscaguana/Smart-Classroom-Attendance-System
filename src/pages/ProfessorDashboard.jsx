import { useState } from "react";
import StudentCard from "../components/StudentCard.jsx";
import { formatTotalDuration } from '../utils/time.jsx';
import { MOCK_STUDENTS } from "../data/mockStudents.js";

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

  const [hour, minute, seconds] = parts[1].split(":").map(Number);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return -1;
  }

  if (seconds) {
    if (Number.isNaN(seconds)) {
      return -1;
    }
  }

  if (seconds) {
      return (hour * 60) + minute + (seconds / 60);
  }

  return (hour * 60) + minute;
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

  const totalSeconds = Math.floor(durationMinutes * 60);

  // const hours = Math.floor(durationMinutes / 60);
  // const minutes = durationMinutes % 60;
  // const seconds = durationMinutes * 60;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours}h ${minutes}m ${seconds}s`;
}

function getEffectiveStatus(student, computeFn) {
  if (student.overrideStatus) {
    return student.overrideStatus;
  }

  return computeFn(student);
}

// For a single student
function getAttendanceSummary(student, currentStatus) {
  const records = student.attendanceRecords || [];

  // Filters out unknown statuses
  const counted = records.filter((r) =>
    COUNTED_STATUSES.includes(r.status)
  );

  // const total = counted.length;
  //const [total, setTotal] = useState(counted.length);
  let total = counted.length;

  let attended = counted.filter((r) =>
      PRESENT_STATUSES.includes(r.status)
    ).length;

  if (currentStatus && currentStatus !== "PENDING" && currentStatus !== "UNKNOWN") {
    if (COUNTED_STATUSES.includes(currentStatus)) {
      //setTotal(total + 1);
      total += 1;
    }

    if (PRESENT_STATUSES.includes(currentStatus)) {
      attended += 1;
    }
  }

  // If attendance record is empty, then can't calculate past attendance
  if (total === 0) {
    return { attended: 0, total: 0, percent: 0 };
  }

  // Filter only present statuses and gets its length (attended count)
  // const attended = counted.filter((r) =>
  //   PRESENT_STATUSES.includes(r.status)
  // ).length;

  // const [attended, setAttended] = useState(
  //   counted.filter((r) =>
  //     PRESENT_STATUSES.includes(r.status)
  //   ).length
  // );

  // Calculates percentage (unrounded)
  const percent = ((attended / total) * 100);

  return { attended, total, percent };
}

// For the whole class
function getClassAttendanceSummary(students, computeStatus) {
  let totalSessions = 0;
  let totalAttended = 0;

  // For each student, counts their attended and total sessions
  // and adds them to totalSessions and totalAttended
  // (to calculate class average)
  students.forEach((s) => {
    const effectiveStatus = getEffectiveStatus(s, computeStatus);
    const { attended, total } = getAttendanceSummary(s, effectiveStatus);
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

export default function ProfessorDashboard({ onLogout }) {
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
    const nowMinutes = now.getHours() * 60 + now.getMinutes() + (now.getSeconds() / 60);

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
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-sm text-slate-300">
              Smart Classroom Attendance System
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200
                        hover:border-emerald-400 hover:text-emerald-300 hover:bg-slate-900/80
                        transition-colors"
            >
              Logout
            </button>
          </div>
      </header>

      {/* Main content area */}
      <main className="px-6 py-4 space-y-6">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 mb-2">
          {(() => {
            const { totalSessions, totalAttended, percent } = getClassAttendanceSummary(students, computeStatus);
            const color = getAttendanceColorClass(percent);
            const emoji = getAttendanceEmoji(percent);

            return (
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold mb-1">
                    Class Attendance Overview
                  </h2>
                  <p className={`text-sm font-medium ${color}`}>
                    Average Attendance: {percent.toFixed(2)}%{" "}
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
              Course Configuration
            </h2>
            {/* Setting course name */}
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Course Name
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
                    Start Time
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
                    End Time
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
                    Grace Minutes For Arrival And Leave
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
                      Minimum Minutes Present To Mark As Attended
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
                <div>
                  <span className="text-slate-400 text-xs">Override Status</span>
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500
                                hover:border-emerald-500 hover:bg-slate-900 transition-colors"
                    value={selectedStudent.overrideStatus || ""}
                    onChange={(e) =>
                      setOverrideStatus(selectedStudent.id, e.target.value)
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
            Students In This Class
          </h2>
          {/* Grid system: https://tailwindcss.com/docs/grid-template-columns */}
          {/* Default shows 1 card per row. Medium screens shows 2 cards per row, while
              large screens shows 3 cards per row. */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {students.map((s) => {
              const effectiveStatus = getEffectiveStatus(s, computeStatus);
              const attendanceSummary = getAttendanceSummary(s, effectiveStatus);
              return (
                <StudentCard
                  key={s.id}
                  student={{ ...s, status: effectiveStatus }}
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
