import { useState } from "react";
import Login from "./pages/Login.jsx";
import ProfessorApp from "./pages/ProfessorApp.jsx";
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
    const profId = session.user?.profId;

    return <ProfessorApp profId={profId} onLogout={handleLogout} />;
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
