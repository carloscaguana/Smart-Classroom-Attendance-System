import { useEffect, useState } from "react";
import { db } from "../utils/firebase";
import { collection, getDocs, query, where, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";

import AddCourse from "../components/AddCourse.jsx";
import DashboardLayout from "../layout/DashboardLayout.jsx";

export default function ProfessorCourseSelector({ profId, onSelectCourse, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const q = query(
          collection(db, "courses"),
          where("prof_id", "==", profId)
        );
        const snap = await getDocs(q);

        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setCourses(data);
      } catch (e) {
        console.error("Error fetching courses:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [profId]);

  function handleCourseCreated(newCourse) {
    setCourses((prev) => [...prev, newCourse]);
    setShowAddForm(false);

    // Immediately opens a new course created. Disabled since I want to test without it
    // onSelectCourse(newCourse);
  }

  async function handleDeleteCourse(course) {
    const ok = window.confirm(
      `Delete course "${course.course_id || course.course_name}"? This cannot be undone.`
    );

    if (!ok) return;

    try {
      // Gets all students in under the course
      const studentsSnap = await getDocs(
        collection(db, "courses", course.id, "students")
      );

       // Deletes each student under this course, and removes the course
       // from the students course arary (on global leve)
      const studentCleanupPromises = studentsSnap.docs.map(async (studentDoc) => {
        const uid = studentDoc.id;

        // Deletes student under this course
        await deleteDoc(studentDoc.ref);

        // Updates global student doc
        const globalRef = doc(db, "students", uid);
        const globalSnap = await getDoc(globalRef);

        if (globalSnap.exists()) { 
          const data = globalSnap.data();
          const currentCourses = Array.isArray(data.courses) ? data.courses : [];

          const newCourses = currentCourses.filter((cid) => cid !== course.id);

          // Removes the global student if it has no more courses
          if (newCourses.length === 0) {
            await deleteDoc(globalRef);
          } else {
            // Removes the course from the global student course array
            await setDoc(
              globalRef,
              { courses: newCourses},
              { merge: true}
            );
          }
        }
      });

      await Promise.all(studentCleanupPromises);

      // Remove from Firestore
      await deleteDoc(doc(db, "courses", course.id));

      // Remove from local state so UI updates immediately
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
    } catch (e) {
      console.error("Error deleting course:", e);
      alert("Failed to delete course. Check console for details.");
    }
  }

  return (
    <DashboardLayout title="Select a Course" onLogout={onLogout}>
      <div className="space-y-4">
        <p className="text-xs text-slate-400">
          Choose a course to open its dashboard, or create a new one.
        </p>

        {loading && (
          <p className="text-sm text-slate-300">Loading courses...</p>
        )}

        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Existing courses */}
            {courses.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => onSelectCourse(course)}
                className="relative group text-left w-full rounded-2xl border border-slate-800
                          bg-slate-900/70 p-4 
                          hover:border-emerald-500 hover:bg-slate-900
                          hover:shadow-lg hover:shadow-emerald-500/50
                          hover:-translate-y-1 hover:scale-101
                          transition-all duration-400"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // avoids card trigger
                    handleDeleteCourse(course);
                  }}
                  className="absolute top-3 right-2 text-[10px] px-2 py-0.5 rounded-full
                            border border-red-500/50 text-red-300
                            hover:bg-red-500/10 hover:border-red-400
                            hover:shadow-lg hover:shadow-red-500/50
                            hover:-translate-y-1 hover:scale-101
                            transition-all duration-400"
                >
                  Delete
                </button>

                <div className="text-xs font-semibold text-slate-300 mb-1">
                  {course.course_id || "(No ID)"}
                </div>

                <div className="text-sm font-medium text-slate-100">
                  {course.course_name || "Untitled course"}
                </div>

                <div className="mt-2 text-[11px] text-slate-400">
                  {course.start_time && course.end_time
                    ? `Time: ${course.start_time} - ${course.end_time}` : "Time: not configured"}
                </div>

                <div className="mt-1 text-[11px] text-slate-500">
                  Grace: {course.grace_minutes ?? 0} min
                </div>

                <div className="mt-1 text-[11px] text-slate-500">
                  Min present: {course.min_minutes_present ?? 0} min
                </div>
              </button>
            ))}

            {/* Add-course card */}
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700
                         bg-slate-900/40 p-4 hover:border-emerald-400 hover:bg-slate-900/80 transition-colors"
            >
              <div className="text-3xl mb-1">+</div>
              <div className="text-sm font-medium text-slate-100">
                Add a new course
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Set course times and attendance rules.
              </div>
            </button>
          </div>
        )}

        {/* New course form below the grid */}
        {showAddForm && (
          <AddCourse
            profId={profId}
            onCreated={handleCourseCreated}
            onCancel={() => setShowAddForm(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
