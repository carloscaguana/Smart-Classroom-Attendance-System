import { useState } from "react";
import StudentCard from "../components/StudentCard.jsx";
import { formatTotalDuration } from '../utils/time.jsx';

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
  },
];

export default function ProfessorDashboard() {
  const [courseName, setCourseName] = useState("CS410");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:15");
  const [graceMinutes, setGraceMinutes] = useState(10);

  const [minMinutesPresent, setMinMinutesPresent] = useState(30);

  const [students] = useState(MOCK_STUDENTS);
  const [selectedStudent, setSelectedStudent] = useState(null);

  function getDurationMinutes(student) {
    let durationMinutes = null;

    // Checks if a student has an leave time
    if (student.lastArrival && student.lastLeave) {
        // Format: YYYY-MM-DD HH:MM
        const arrivalParts = student.lastArrival.split(" ");
        const leaveParts = student.lastLeave.split(" ");

        // If the format is not messed up, I split HH:MM to hours and minutes
        if (arrivalParts.length >= 2 && leaveParts.length >= 2) {
            const [arrivalHour, arrivalMinute] = arrivalParts[1].split(":").map(Number);
            const [leaveHour, leaveMinute] = leaveParts[1].split(":").map(Number);

            // If the format is valid, I convert the total leave time to minutes
            // to store in durationMinutes
            if (!Number.isNaN(arrivalHour) && !Number.isNaN(arrivalMinute) 
                  && !Number.isNaN(leaveHour) && !Number.isNaN(leaveMinute)) {

                // Conversion
                const arrivalInMinutes = arrivalHour * 60 + arrivalMinute;
                const leaveInMinutes = leaveHour * 60 + leaveMinute;

                // As you can see, that's why I converted the total arrival and leave time
                // to minutes, to easily get the durationMinutes
                durationMinutes = leaveInMinutes - arrivalInMinutes;

                return durationMinutes;
            }
        }
    }

    return durationMinutes;
  }

  function formatDuration(student) {
    const durationMinutes = getDurationMinutes(student);

    if (durationMinutes === null) return "N/A";

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    return `${hours}h ${minutes}m`;
  }

  function computeStatus(student) {
    // Professor hasn't selected course time
    if (!startTime || !endTime) return "UNKNOWN";

    // Course start and end times in minutes
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Current real time
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // Class ended and student never arrived yields ABSENT
    if (!student.lastArrival && nowMinutes > endMinutes) {
        return "ABSENT";
    }

    // Student hasn't arrived but class hasn't ended yields PENDING
    if (!student.lastArrival) {
        return "PENDING";
    }

    // Format: YYYY-MM-DD HH:MM
    // Time is in 24-hour format
    const arrivalParts = student.lastArrival.split(" ");

    // arrivalParts contains two parts
    // arrivalParts[0] contains the date
    // arrivalParts[1] contains the time
    // So, if arrivalParts length is less than 2, one is missing and the format
    // got messed up. Thus, UNKNOWN status is returned
    if (arrivalParts.length < 2) return "UNKNOWN";

    // arrivalParts[1] is in HH:MM format
    // So, I split it by ":" to get hours and minutes
    const [arrivalHour, arrivalMinute] = arrivalParts[1].split(":").map(Number);

    // Edge case (invalid format)
    if (Number.isNaN(arrivalHour) || Number.isNaN(arrivalMinute)) return "UNKNOWN";

    // arrivalHour and arrivalMinute is for display.
    // For calculations, it's easier to convert everything to minutes and compare
    // that way
    // So, the total arrival time is stored in minutes here
    const arrivalInMinutes = arrivalHour * 60 + arrivalMinute;

    // Checks if a student has an leave time and parses it
    // Technically this part is messy because durationMinutes is only checking the last
    // arrival and leave time to check how long a student stayed for in one session.
    // But what if their totalSeconds is more than that session?
    let durationMinutes = null;

    // Checks if a student has an leave time
    if (student.lastLeave) {
        // Format: YYYY-MM-DD HH:MM
        const leaveParts = student.lastLeave.split(" ");

        // If the format is not messed up, I split HH:MM to hours and minutes
        if (leaveParts.length >= 2) {
            const [leaveHour, leaveMinute] = leaveParts[1].split(":").map(Number);

            // If the format is valid, I convert the total leave time to minutes
            // to store in durationMinutes
            if (!Number.isNaN(leaveHour) && !Number.isNaN(leaveMinute)) {

                // Conversion
                const leaveInMinutes = leaveHour * 60 + leaveMinute;

                // As you can see, that's why I converted the total arrival and leave time
                // to minutes, to easily get the durationMinutes
                durationMinutes = leaveInMinutes - arrivalInMinutes;
            } else {
                // Returns UNKNOWN if leave time format is invalid
                return "UNKNOWN";
            }
        } else {
            // Returns UNKNOWN if the leave time format is invalid
            return "UNKNOWN";
        }
    }

    // Returns ABSENT if the student did not stay in class long enough
    // Another reason I converted total arrival and leave time to minutes, to
    // eventually calculate durationMinutes easily and compare to minMinutesPresent
    if (durationMinutes !== null && durationMinutes < minMinutesPresent) {
        return "SKIPPED";
    }

    // Checks if the student arrived within the grace period
    const latestOnTime = startMinutes + graceMinutes;

    // If durationMinutes is not null, that means the student has clocked out
    // So, I can check if they were ON_TIME or LATE based on their arrival time
    if (durationMinutes !== null) {
        if (arrivalInMinutes <= latestOnTime) {
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

    // Also, yes, I know, I can definitely refactor this. But I'm on a time crunch right now
    if (nowMinutes > endMinutes) {
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
                    Grace (mins)
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
                    {formatDuration(selectedStudent || "N/A")}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Status</span>
                  <div className="text-xs">
                    {computeStatus(selectedStudent)}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">
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
            {students.map((s) => (
              <StudentCard
                key={s.id}
                student={{ ...s, status: computeStatus(s) }}
                onClick={() => {
                  if (selectedStudent && selectedStudent.id === s.id) {
                    setSelectedStudent(null);
                  } else {
                    setSelectedStudent(s);
                  }
                }}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
