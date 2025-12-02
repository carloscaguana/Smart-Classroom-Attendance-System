import { useState } from "react";
import { db } from "../utils/firebase.js";
import { collection, addDoc } from "firebase/firestore";

export default function AddCourse({ profId, onCreated, onCancel }) {
  const [courseId, setCourseId] = useState("");         // e.g. "CS410"
  const [courseName, setCourseName] = useState("");     // full name
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:15");
  const [graceMinutes, setGraceMinutes] = useState(10);
  const [minMinutesPresent, setMinMinutesPresent] = useState(30);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    console.log("[AddCourse] submit clicked");

    if (!courseId || !courseName || !startTime || !endTime || !graceMinutes || !minMinutesPresent) {
        setErrorMsg("All fields are required.");
        console.log("[AddCourse] validation failed");
        return;
    }

    try {
        setSaving(true);

        // Debugging
        console.log("[AddCourse] starting addDoc…");

        const payload = {
        course_id: courseId,
        course_name: courseName,
        start_time: startTime,
        end_time: endTime,
        grace_minutes: Number(graceMinutes) || 0,
        min_minutes_present: Number(minMinutesPresent) || 0,
        prof_id: profId,
        createdAt: Date.now(),
        };

        // Debugging
        console.log("[AddCourse] payload:", payload);

        const docRef = await addDoc(collection(db, "courses"), payload);

        // Course has successfully been added to the database
        console.log("[AddCourse] addDoc success, id:", docRef.id);

        const fullCourse = { id: docRef.id, ...payload };

        // Notify parent so it can update its list
        if (onCreated) {
            onCreated(fullCourse);
        }

        // Also close the form from inside just to be safe
        if (onCancel) {
            onCancel();
        }

        // reset local fields (in case this form is ever reused)
        setCourseId("");
        setCourseName("");
        setStartTime("09:00");
        setEndTime("10:15");
        setGraceMinutes(10);
        setMinMinutesPresent(30);
    } catch (e) {
        console.error("[AddCourse] Error adding course:", e);
        setErrorMsg("Failed to create course.");
    } finally {
        console.log("[AddCourse] finished (finally)");
        setSaving(false);
    }
}



  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3"
    >
      <h2 className="text-sm font-semibold mb-1">Create Course</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Course ID (e.g. CS410)
          </label>
          <input
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Course Name
          </label>
          <input
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. Smart Classroom Attendance"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Start Time
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            End Time
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Grace Minutes
          </label>
          <input
            type="number"
            value={graceMinutes}
            onChange={(e) => setGraceMinutes(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Min Minutes Present
          </label>
          <input
            type="number"
            value={minMinutesPresent}
            onChange={(e) => setMinMinutesPresent(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {errorMsg && (
        <p className="text-xs text-red-400 mt-1">{errorMsg}</p>
      )}

      <div className="flex gap-2 mt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg border border-emerald-500 bg-emerald-600/20 px-3 py-1.5 text-xs font-medium text-emerald-200
                     hover:bg-emerald-600/30 hover:border-emerald-400 transition-colors disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create Course"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200
                       hover:border-slate-500 hover:bg-slate-900/80 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
