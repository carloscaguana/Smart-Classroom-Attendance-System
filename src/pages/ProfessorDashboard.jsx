import { useEffect, useState } from "react";

import { db } from "../utils/firebase";
import { doc, getDoc, setDoc, getDocs, collection, deleteDoc, updateDoc } from "firebase/firestore";

import { MOCK_STUDENTS } from "../data/mockStudents.js";
import {
  getMinuteFromTimestring,
  getMinuteFromTimestamp,
  getSessionDurationMinutes,
} from "../utils/attendance.js";

import DashboardLayout from "../layout/DashboardLayout.jsx";
import ClassAttendanceOverview from "../components/ClassAttendanceOverview.jsx";
import CourseConfigPanel from "../components/CourseConfigPanel.jsx";
import StudentDetailsPanel from "../components/StudentDetailsPanel.jsx";
import StudentsGrid from "../components/StudentsGrid.jsx";
import AddStudent from "../components/AddStudent.jsx";

export default function ProfessorDashboard({ onLogout, courseDocId, courseMeta }) {
  // Course configuration state (initialized from courseMeta)
  const [courseName, setCourseName] = useState(
    courseMeta?.course_name || courseMeta?.course_id || "CS410"
  );
  const [startTime, setStartTime] = useState(
    courseMeta?.start_time || "09:00"
  );
  const [endTime, setEndTime] = useState(
    courseMeta?.end_time || "10:15"
  );
  const [graceMinutes, setGraceMinutes] = useState(
    typeof courseMeta?.grace_minutes === "number"
      ? courseMeta.grace_minutes
      : 10
  );
  const [minMinutesPresent, setMinMinutesPresent] = useState(
    typeof courseMeta?.min_minutes_present === "number"
      ? courseMeta.min_minutes_present
      : 30
  );

  // UI feedback for saving config
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Students (still local for now)
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);

  // Load course config from Firestore on mount
  useEffect(() => {
    async function loadConfig() {
      if (!courseDocId) return;

      try {
        const ref = doc(db, "courses", courseDocId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();

          // Only override if values exist, otherwise keep current defaults
          if (data.course_name) {
            setCourseName(data.course_name);
          }
          if (data.start_time) {
            setStartTime(data.start_time);
          }
          if (data.end_time) {
            setEndTime(data.end_time);
          }
          if (typeof data.grace_minutes === "number") {
            setGraceMinutes(data.grace_minutes);
          }
          if (typeof data.min_minutes_present === "number") {
            setMinMinutesPresent(data.min_minutes_present);
          }
        }
      } catch (e) {
        console.error("Error loading course config:", e);
        // Fail silently in UI for now; we still have local defaults
      }
    }

    loadConfig();
  }, [courseDocId]);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const snap = await getDocs(
          collection(db, "courses", courseDocId, "students")
        );
        const data = snap.docs.map((doc) => ({
          id: doc.id, // UID
          ...doc.data(),
        }));
        setStudents(data);
      } catch (e) {
        console.error("[ProfessorDashboard] Error fetching students:", e);
      }
    }

    if (courseDocId) {
      fetchStudents();
    }
  }, [courseDocId]);

  // Save course configuration back to Firestore
  async function handleSaveConfig() {
    if (!courseDocId) return;

    try {
      setSavingConfig(true);
      setSaveError("");

      const ref = doc(db, "courses", courseDocId);

      await setDoc(
        ref,
        {
          // keep course_id & prof_id stable, use what's in courseMeta
          course_id: courseMeta?.course_id || "",
          prof_id: courseMeta?.prof_id || "",
          course_name: courseName,
          start_time: startTime,
          end_time: endTime,
          grace_minutes: Number(graceMinutes) || 0,
          min_minutes_present: Number(minMinutesPresent) || 0,
        },
        { merge: true }
      );

      setLastSavedAt(new Date());
    } catch (e) {
      console.error("Error saving course config:", e);
      setSaveError("Failed to save course configuration.");
    } finally {
      setSavingConfig(false);
    }
  }

  // Override status for a student
  async function setOverrideStatus(studentId, newStatus) {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId 
          ? { ...s, overrideStatus: newStatus || null, status: newStatus || s.status } 
          : s
      )
    );

    setSelectedStudent((prev) =>
      prev && prev.id === studentId
        ? { ...prev, overrideStatus: newStatus || null, status: newStatus || prev.status }
        : prev
    );

    if (!courseDocId) return;

    try {
      const ref = doc(db, "courses", courseDocId, "students", studentId);

      await updateDoc(ref, {
        overrideStatus: newStatus || null,
        // store last known effective status snapshot as well
        status: newStatus || null,
      });
    } catch (e) {
      console.error("[ProfessorDashboard] Error saving overrideStatus:", e);
    }
  }

  // Compute status (unchanged, uses state config)
  function computeStatus(student) {
    const startMinutes = getMinuteFromTimestring(startTime);
    const endMinutes = getMinuteFromTimestring(endTime);

    if (startMinutes === null || endMinutes === null) {
      return "UNKNOWN";
    }

    const now = new Date();
    const nowMinutes =
      now.getHours() * 60 +
      now.getMinutes() +
      now.getSeconds() / 60;

    const arrivalInMinutes = getMinuteFromTimestamp(student.lastArrival);
    const leaveInMinutes = getMinuteFromTimestamp(student.lastLeave);
    const durationMinutes = getSessionDurationMinutes(student);

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

  function handleStudentCreated(newStudent) {
    // update local list immediately
    setStudents((prev) => [...prev, newStudent]);
    setShowAddStudentForm(false);
  }

  async function handleDeleteStudent(student) {
    if (!courseDocId) return;

    const confirmed = window.confirm(
      `Remove ${student.name || student.uid} from this course? This action cannot be undone!`
    );

    if (!confirmed) return;

    try {
      await deleteDoc(
        doc(db, "courses", courseDocId, "students", student.id)
      );

      // Delete student on global level
      const globalRef = doc(db, "students", student.id);
      const globalSnap = await getDoc(globalRef);

      if (globalSnap.exists()) {
        const data = globalSnap.data();
        const currentCourses = Array.isArray(data.courses) ? data.courses : [];

        const newCourses = currentCourses.filter((cid) => cid !== courseDocId);

        if (newCourses.length === 0) {
          await deleteDoc(globalRef);
        } else {
          await setDoc(
            globalRef,
            { courses: newCourses},
            { merge : true}
          );
        }
      }
      // update local state
      setStudents((prev) => prev.filter((s) => s.id !== student.id));

      if (selectedStudent && selectedStudent.id === student.id) {
        setSelectedStudent(null);
      }
    } catch (e) {
      console.error("[ProfessorDashboard] Error deleting student:", e);
    }
  }

  return (
    <DashboardLayout title="Professor Dashboard" onLogout={onLogout}>
      {/* Top: class overview */}
      <ClassAttendanceOverview
        students={students}
        computeStatus={computeStatus}
      />

      {/* Middle: course config + student details */}
      <section className="grid md:grid-cols-[2fr,3fr] gap-4">
        <div>
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

          {/* Save button + status */}
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="rounded-lg border border-emerald-500 bg-emerald-600/20 px-3 py-1.5 text-xs font-medium text-emerald-200
                         hover:bg-emerald-600/30 hover:border-emerald-400 transition-colors disabled:opacity-50"
            >
              {savingConfig ? "Saving..." : "Save course settings"}
            </button>
            {saveError && (
              <span className="text-xs text-red-400">{saveError}</span>
            )}
            {!saveError && lastSavedAt && (
              <span className="text-[11px] text-slate-500">
                Saved at{" "}
                {lastSavedAt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>

        <StudentDetailsPanel
          selectedStudent={selectedStudent}
          computeStatus={computeStatus}
          onOverrideStatusChange={setOverrideStatus}
          showOverrideControls={true}
          onDeleteStudent={handleDeleteStudent}
        />
      </section>

      {/* Bottom: student cards */}
      <StudentsGrid
        students={students}
        selectedStudent={selectedStudent}
        computeStatus={computeStatus}
        onSelectStudent={setSelectedStudent}
        setShowAddStudentForm={setShowAddStudentForm}
      />

      {showAddStudentForm && (
          <AddStudent
            courseDocId={courseDocId}
            onCreated={handleStudentCreated}
            onCancel={() => setShowAddStudentForm(false)}
          />
        )}
    </DashboardLayout>
  );
}
