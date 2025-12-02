import { useState } from "react";
import { db } from "../utils/firebase";
import { doc, getDoc } from "firebase/firestore";

import { MOCK_STUDENTS } from "../data/mockStudents.js";

export default function Login({ onLogin }) {
  const [role, setRole] = useState("student");
  const [uid, setUid] = useState("");
  const [profId, setProfId] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (role === "professor") {
      const profTrimmed = profId.trim();

      if (!profTrimmed) {
        setError("Please enter your professor ID");
        return;
      }

      onLogin({ role: "professor", user: { profId: profTrimmed }, });
      return;
    }

    // student: lookup by uid
    const trimmed = uid.trim();
    if (!trimmed) {
      setError("Please enter your card UID.");
      return;
    }

    // const student = MOCK_STUDENTS.find(
    //   (s) => s.uid.toLowerCase() === trimmed.toLowerCase()
    // );

    const uidUpper = trimmed.toUpperCase();

    // if (!student) {
    //   setError("No student found with that UID.");
    //   return;
    // }

    try {
      const ref = doc(db, "students", uidUpper);
      const snap = await getDoc(ref);

      if (!snap.exists()) { 
        setError("No student found with that UID.");
        return;
      }

      const data = snap.data();

      const student = {
        id: uidUpper,
        ...data,
      };

        onLogin({ role: "student", user: student });
    } catch (err) {
      console.error("[Login] Error fetching student: ", err);
      setError("Failed to look up student. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4"
      >
        <h1 className="text-lg font-semibold text-slate-100">
          Smart Classroom Login
        </h1>

        <div className="space-y-2 text-sm">
          <label className="block text-xs text-slate-400 mb-1">
            I am a...
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`flex-1 px-3 py-1.5 rounded-lg border text-xs ${
                role === "student"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                  : "border-slate-700 bg-slate-950 text-slate-300"
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole("professor")}
              className={`flex-1 px-3 py-1.5 rounded-lg border text-xs ${
                role === "professor"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                  : "border-slate-700 bg-slate-950 text-slate-300"
              }`}
            >
              Professor
            </button>
          </div>
        </div>

        {role === "student" && (
          <div className="space-y-1 text-sm">
            <label className="block text-xs text-slate-400">
              Card UID (from NFC)
            </label>
            <input
              type="text"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="e.g. 04:A3:BC:91"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-500">
              UID from NFC card will be used for authentication.
            </p>
          </div>
        )}

        {role === "professor" && (
          <div className="space-y-1 text-sm">
            <label className="block text-xs text-slate-400">
              Professor ID (you get to create one)
            </label>
            <input
              type="text"
              value={profId}
              onChange={(e) => setProfId(e.target.value)}
              placeholder="e.g. Fletcher01"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-500">
              Professor ID is used to create and save courses which only that professor sees.
            </p>
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          className="w-full mt-1 rounded-lg bg-emerald-500 text-slate-950 text-sm font-medium py-1.5 hover:bg-emerald-400 transition-colors"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
