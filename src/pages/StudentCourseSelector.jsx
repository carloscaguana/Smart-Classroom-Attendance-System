import { useEffect, useState } from "react";
import { db } from "../utils/firebase";
import { doc, getDoc } from "firebase/firestore";

import DashboardLayout from "../layout/DashboardLayout.jsx";

export default function StudentCourseSelector({ student, onSelectCourse, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      if (!student) {
        setLoading(false);
        return;
      }

      const courseIds = Array.isArray(student.courses) ? student.courses : [];

      if (courseIds.length === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }

      try {
        // Fetch each course doc by id from the student's global courses array
        const snaps = await Promise.all(
          courseIds.map((id) => getDoc(doc(db, "courses", id)))
        );

        const data = snaps
          .map((snap, index) =>
            snap.exists()
              ? { id: courseIds[index], ...snap.data() }
              : null
          )
          .filter(Boolean);

        setCourses(data);
      } catch (e) {
        console.error("[StudentCourseSelector] Error fetching courses for student:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [student]);

  return (
    <DashboardLayout title="Your Courses" onLogout={onLogout}>
      <div className="space-y-4">
        <p className="text-xs text-slate-400">
          Select a course to view your attendance and details.
        </p>

        {loading && (
          <p className="text-sm text-slate-300">Loading your courses...</p>
        )}

        {!loading && courses.length === 0 && (
          <p className="text-sm text-slate-400">
            You are not enrolled in any courses yet. Ask your professor to add
            your card UID to a course.
          </p>
        )}

        {!loading && courses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => onSelectCourse(course)}
                className="group text-left w-full rounded-2xl border border-slate-800
                           bg-slate-900/70 p-4 
                           hover:border-emerald-500 hover:bg-slate-900
                           hover:shadow-lg hover:shadow-emerald-500/50
                           hover:-translate-y-1 hover:scale-101
                           transition-all duration-400"
              >
                <div className="text-xs font-semibold text-slate-300 mb-1">
                  {course.course_id || "(No ID)"}
                </div>

                <div className="text-sm font-medium text-slate-100">
                  {course.course_name || "Untitled course"}
                </div>

                <div className="mt-2 text-[11px] text-slate-400">
                  {course.start_time && course.end_time
                    ? `Time: ${course.start_time} – ${course.end_time}`
                    : "Time: not configured"}
                </div>

                <div className="mt-1 text-[11px] text-slate-500">
                  Grace: {course.grace_minutes ?? 0} min
                </div>

                <div className="mt-1 text-[11px] text-slate-500">
                  Min present: {course.min_minutes_present ?? 0} min
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
