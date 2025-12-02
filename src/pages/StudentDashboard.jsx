import { useState, useEffect } from "react";
import StudentCard from "../components/StudentCard.jsx";
import { db } from "../utils/firebase";
import { doc, getDoc } from "firebase/firestore";

import {
  getMinuteFromTimestring,
  getMinuteFromTimestamp,
  getSessionDurationMinutes,
  getEffectiveStatus,
  getAttendanceSummary,
} from "../utils/attendance.js";

import DashboardLayout from "../layout/DashboardLayout.jsx";
import StudentDetailsPanel from "../components/StudentDetailsPanel.jsx";
import StudentAttendanceOverview from "../components/StudentAttendanceOverview.jsx";
import StudentCourseConfigPanel from "../components/StudentCourseConfigPanel.jsx";

export default function StudentDashboard({
  student,
  courseDocId,
  courseMeta,
  onLogout,
}) {
  if (!student) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-400">
          No student data. Please log in again.
        </p>
      </div>
    );
  }

  if (!courseDocId || !courseMeta) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-400">
          Missing course selection. Please go back and pick a course.
        </p>
      </div>
    );
  }

  const uid = student.uid || student.id;

  // course config as read-only values coming from Firestore
  const courseName =
    courseMeta.course_name || courseMeta.course_id || "Course";
  const startTime = courseMeta.start_time || "09:00";
  const endTime = courseMeta.end_time || "10:15";
  const graceMinutes =
    typeof courseMeta.grace_minutes === "number"
      ? courseMeta.grace_minutes
      : 10;
  const minMinutesPresent =
    typeof courseMeta.min_minutes_present === "number"
      ? courseMeta.min_minutes_present
      : 30;

  // per-course student doc (courses/{courseDocId}/students/{uid})
  const [courseStudent, setCourseStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Firestore fetch
  useEffect(() => {
    async function fetchStudentForCourse() {
      if (!courseDocId || !uid) return;

      try {
        setLoading(true);
        setLoadError("");

        const ref = doc(db, "courses", courseDocId, "students", uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          const full = { id: snap.id, ...data };
          setCourseStudent(full);
          setSelectedStudent(full);
        } else {
          // not registered to this course
          setCourseStudent(null);
          setSelectedStudent(null);
          setLoadError(
            "You are not registered for this course in the system."
          );
        }
      } catch (e) {
        console.error("[StudentDashboard] Error loading student:", e);
        setLoadError("Failed to load your attendance data.");
      } finally {
        setLoading(false);
      }
    }

    fetchStudentForCourse();
  }, [courseDocId, uid]);

  function computeAutomaticStatus(s) {
    if (!s) return "UNKNOWN";

    const startMinutes = getMinuteFromTimestring(startTime);
    const endMinutes = getMinuteFromTimestring(endTime);

    if (startMinutes === null || endMinutes === null) {
      return "UNKNOWN";
    }

    const now = new Date();
    const nowMinutes =
      now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

    const arrivalInMinutes = getMinuteFromTimestamp(s.lastArrival);
    const leaveInMinutes = getMinuteFromTimestamp(s.lastLeave);
    const durationMinutes = getSessionDurationMinutes(s);

    const latestOnTime = startMinutes + graceMinutes;
    const latestLeaveTime = endMinutes + graceMinutes;

    if (durationMinutes === -1) {
      return "UNKNOWN";
    }

    if (arrivalInMinutes === null) {
      if (nowMinutes > latestLeaveTime) {
        return "ABSENT";
      }
      return "PENDING";
    }

    if (durationMinutes !== null) {
      if (durationMinutes < minMinutesPresent) {
        return "SKIPPED";
      }

      if (
        arrivalInMinutes <= latestOnTime &&
        leaveInMinutes <= latestLeaveTime
      ) {
        return "ON_TIME";
      } else {
        return "LATE";
      }
    }

    if (nowMinutes > latestLeaveTime) {
      return "SKIPPED";
    } else {
      if (arrivalInMinutes <= latestOnTime) {
        return "ON_TIME";
      } else {
        return "LATE";
      }
    }
  }

  // respects overrideStatus / saved status snapshot
  function computeStatus(s) {
    if (!s) return "UNKNOWN";
    if (s.overrideStatus) return s.overrideStatus;
    if (s.status) return s.status;
    return computeAutomaticStatus(s);
  }

  // if Firestore doc missing, still show *something* using global student info
  const displayStudent =
    courseStudent || {
      id: uid,
      uid,
      name: student.name || "Unknown student",
      lastArrival: null,
      lastLeave: null,
      totalSeconds: 0,
      attendanceRecords: [],
      status: null,
      overrideStatus: null,
    };

  const effectiveStatus = getEffectiveStatus(displayStudent, computeStatus);
  const attendanceSummary = getAttendanceSummary(
    displayStudent,
    effectiveStatus
  );

  if (loading) {
    return (
      <DashboardLayout title="Student Dashboard" onLogout={onLogout}>
        <div className="text-sm text-slate-300">Loading your data…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Dashboard" onLogout={onLogout}>
      {loadError && (
        <p className="text-xs text-red-400 mb-3">{loadError}</p>
      )}

      {/* Top overview */}
      <StudentAttendanceOverview
        student={displayStudent}
        computeStatus={computeStatus}
      />

      {/* Middle: course info + details */}
      <section className="grid md:grid-cols-[2fr,3fr] gap-4">
        <StudentCourseConfigPanel
          courseName={courseName}
          startTime={startTime}
          endTime={endTime}
          graceMinutes={graceMinutes}
          minMinutesPresent={minMinutesPresent}
        />

        <StudentDetailsPanel
          selectedStudent={selectedStudent || displayStudent}
          computeStatus={computeStatus}
          onOverrideStatusChange={() => {}}
          showOverrideControls={false}
        />
      </section>

      {/* Bottom: card view */}
      <section>
        <h2 className="text-sm font-semibold mb-2">Quick Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <StudentCard
            student={{ ...displayStudent, status: effectiveStatus }}
            attendanceSummary={attendanceSummary}
            onClick={() =>
              setSelectedStudent((prev) =>
                prev && prev.id === displayStudent.id ? null : displayStudent
              )
            }
          />
        </div>
      </section>
    </DashboardLayout>
  );
}
