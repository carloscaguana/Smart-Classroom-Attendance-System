import { useState } from "react";

import { MOCK_STUDENTS } from "../data/mockStudents.js";
import {
          getMinuteFromTimestring, getMinuteFromTimestamp, getSessionDurationMinutes,
} from "../utils/attendance.js";

import DashboardLayout from "../layout/DashboardLayout.jsx";
import ClassAttendanceOverview from "../components/ClassAttendanceOverview.jsx";
import CourseConfigPanel from "../components/CourseConfigPanel.jsx";
import StudentDetailsPanel from "../components/StudentDetailsPanel.jsx";
import StudentsGrid from "../components/StudentsGrid.jsx";

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
    <DashboardLayout title="Professor Dashboard" onLogout={onLogout}>
        <ClassAttendanceOverview 
            students = {students}
            computeStatus = {computeStatus} 
        />

        {/* Course configuration area */}
        <section className="grid md:grid-cols-[2fr,3fr] gap-4">
          <CourseConfigPanel
            courseName={courseName}
            startTime={startTime}
            endTime={endTime}
            graceMinutes={graceMinutes}
            minMinutesPresent={minMinutesPresent}
            onCourseNameChange={setCourseName}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
            onGraceMinutesChange={setGraceMinutes}
            onMinMinutesPresentChange={setMinMinutesPresent}
          />

          <StudentDetailsPanel
            selectedStudent={selectedStudent}
            computeStatus={computeStatus}
            onOverrideStatusChange={setOverrideStatus}
          />
        </section>

        {/* Student cards grid */}
        <StudentsGrid
          students={students}
          selectedStudent={selectedStudent}
          computeStatus={computeStatus}
          onSelectStudent={setSelectedStudent}
        />
    </DashboardLayout>
  );
}
