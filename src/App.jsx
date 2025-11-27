import { useState } from "react";
import Login from "./pages/Login.jsx";
import ProfessorDashboard from "./pages/ProfessorDashboard.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";

function App() {
  const [session, setSession] = useState({ role: null, user: null });

  function handleLogout() {
    setSession({ role: null, user: null });
  }

  if (!session.role) {
    return <Login onLogin={setSession} />;
  }

  if (session.role === "professor") {
    return <ProfessorDashboard onLogout={handleLogout} />;
  }

  if (session.role === "student") {
    return (
      <StudentDashboard
        student={session.user}
        onLogout={handleLogout}
      />
    );
  }

  return <Login onLogin={setSession} />;
}

export default App;
