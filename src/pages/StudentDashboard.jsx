import { useState } from "react";
import StudentCard from "../components/StudentCard.jsx";

import { 
          getMinuteFromTimestring, getMinuteFromTimestamp, getSessionDurationMinutes,
          getEffectiveStatus, getAttendanceSummary,
} from "../utils/attendance.js";

import DashboardLayout from "../layout/DashboardLayout.jsx";
import StudentDetailsPanel from "../components/StudentDetailsPanel.jsx";
import StudentAttendanceOverview from "../components/StudentAttendanceOverview.jsx";
import StudentCourseConfigPanel from "../components/StudentCourseConfigPanel.jsx";

export default function StudentDashboard({ student, onLogout } ) {
    if (!student) {
        return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
            <p className="text-sm text-slate-400">
            No student data. Please log in again.
            </p>
        </div>
        );
    }
  const [courseName] = useState("CS410");
  const [startTime] = useState("09:00");
  const [endTime] = useState("10:15");
  const [graceMinutes] = useState(10);

  const [minMinutesPresent] = useState(30);

  // const [students, setStudents] = useState(MOCK_STUDENTS);
  const [selectedStudent, setSelectedStudent] = useState(null);
  //const details = selectedStudent || student;

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
  
  const effectiveStatus = getEffectiveStatus(student, computeStatus);
  const attendanceSummary = getAttendanceSummary(student, effectiveStatus);

  return (
    // How to comment: {/* Comment: https://stackoverflow.com/questions/30766441/how-to-use-comments-in-react */}
    // Entire page
    <DashboardLayout title="Student Dashboard" onLogout={onLogout}>
        <StudentAttendanceOverview
          student={student}
          computeStatus={computeStatus}
        />
        {/* Course configuration area */}
        <section className="grid md:grid-cols-[2fr,3fr] gap-4">
          <StudentCourseConfigPanel
            courseName={courseName}
            startTime={startTime}
            endTime={endTime}
            graceMinutes={graceMinutes}
            minMinutesPresent={minMinutesPresent}
          />

          {/* Selected student details */}
          <StudentDetailsPanel
            selectedStudent={selectedStudent}
            computeStatus={computeStatus}
            onOverrideStatusChange={() => {}}
            showOverrideControls={false}
          />
        </section>

        {/* Student cards grid */}
        <section>
          <h2 className="text-sm font-semibold mb-2">
            Quick Overview
          </h2>
          {/* Grid system: https://tailwindcss.com/docs/grid-template-columns */}
          {/* Default shows 1 card per row. Medium screens shows 2 cards per row, while
              large screens shows 3 cards per row. */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <StudentCard
                student={{ ...student, status: effectiveStatus }}
                attendanceSummary={attendanceSummary}
                onClick={() => {
                // optional: toggle details
                if (selectedStudent) {
                    setSelectedStudent(null);
                } else {
                    setSelectedStudent(student);
                }
                }}
            />
            </div>
        </section>
    </DashboardLayout>
  );
}
