import { useState } from "react";
import ProfessorCourseSelector from "./ProfessorCourseSelector.jsx";
import ProfessorDashboard from "./ProfessorDashboard.jsx";

export default function ProfessorApp({ profId, onLogout }) {
  const [activeCourse, setActiveCourse] = useState(null);

  // If for some reason profId is missing, fail loudly
  if (!profId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-sm text-slate-400">
          No professor ID found. Make sure Login sets a profId in session.user.
        </div>
      </div>
    );
  }

  // No course selected yet so show the selector + big plus card
  if (!activeCourse) {
    return (
      <ProfessorCourseSelector
        profId={profId}
        onSelectCourse={(course) => setActiveCourse(course)}
        onLogout={onLogout}
      />
    );
  }

  // Course selected so show the dashboard for that course
  return (
    <ProfessorDashboard
      courseDocId={activeCourse.id}
      courseMeta={activeCourse}
      onLogout={onLogout}
      onBackToCourses={() => setActiveCourse(null)}
    />
  );
}
