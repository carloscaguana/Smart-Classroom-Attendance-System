import { useState } from "react";
import StudentCourseSelector from "./StudentCourseSelector.jsx";
import StudentDashboard from "./StudentDashboard.jsx";

export default function StudentApp({ student, onLogout }) {
  const [activeCourse, setActiveCourse] = useState(null);

  // No course chosen yet -> show selector
  if (!activeCourse) {
    return (
      <StudentCourseSelector
        student={student}
        onSelectCourse={(course) => setActiveCourse(course)}
        onLogout={onLogout}
      />
    );
  }

  // Once a course is chosen, show the dashboard for that course
  return (
    <StudentDashboard
      student={student}
      courseDocId={activeCourse.id}
      courseMeta={activeCourse}
      onLogout={onLogout}
    />
  );
}
