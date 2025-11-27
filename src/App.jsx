import { useState } from "react";
import Login from "./pages/Login.jsx";
import ProfessorDashboard from "./pages/ProfessorDashboard.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";

function App() {
  const [session, setSession] = useState({ role: null, user: null });

  if (!session.role) {
    return <Login onLogin={setSession} />;
  }

  if (session.role === "professor") {
    return <ProfessorDashboard />;
  }

  if (session.role === "student") {
    return (
      <StudentDashboard
        student={session.user}
      />
    );
  }

  return <Login onLogin={setSession} />;
}

export default App;
