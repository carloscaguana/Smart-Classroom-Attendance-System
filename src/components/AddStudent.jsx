import { useState } from "react";
import { db } from "../utils/firebase";
import { doc, setDoc, arrayUnion } from "firebase/firestore";

export default function AddStudent({ courseDocId, onCreated, onCancel }) {
  const [uid, setUid] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    const trimmedUid = uid.trim();
    const trimmedName = name.trim();

    if (!trimmedUid || !trimmedName) {
      setErrorMsg("UID and name are required.");
      return;
    }

    const uidUpper = trimmedUid.toUpperCase();

    try {
      setSaving(true);

      const payload = {
        uid: uidUpper,
        name: trimmedName,
        lastArrival: null,
        lastLeave: null,
        totalSeconds: 0,
        attendanceRecords: [],
        status: "UNKNOWN",
        overrideStatus: null,
      };

      // doc id = UID string
      const studentRef = doc(db, "courses", courseDocId, "students", uidUpper);
      await setDoc(studentRef, payload, { merge: true });

      const globalStudentRef = doc(db, "students", uidUpper);
      await setDoc(globalStudentRef, 
        {
          uid: uidUpper,
          name: trimmedName,
          courses: arrayUnion(courseDocId),
        },
        { merge: true }
      );

      const fullStudent = { id: uidUpper, ...payload };

      if (onCreated) onCreated(fullStudent);
      if (onCancel) onCancel();

      setUid("");
      setName("");
    } catch (e) {
      console.error("[AddStudentToCourse] Error adding student:", e);
      setErrorMsg("Failed to add student.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3 mt-4"
    >
      <h3 className="text-sm font-semibold">Add student to this course</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Card UID (from NFC)
          </label>
          <input
            type="text"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder="e.g. 04:A3:BC:91"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-emerald-500
                       hover:border-emerald-400 hover:bg-slate-900/80 transition-colors ease-in-out"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Student name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alice Johnson"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-emerald-500
                       hover:border-emerald-400 hover:bg-slate-900/80 transition-colors ease-in-out"
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
                     hover:bg-emerald-600/30 hover:border-emerald-400 transition-colors ease-in-out disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Adding..." : "Add student"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200
                       hover:border-slate-500 hover:bg-slate-900/80 transition-colors ease-in-out cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>

      <p className="text-[11px] text-slate-500 mt-1">
        Later, when this UID taps the ESP32 reader, their{" "}
        <span className="font-mono">lastArrival</span>,{" "}
        <span className="font-mono">lastLeave</span>, and{" "}
        <span className="font-mono">totalSeconds</span> fields will be updated automatically.
      </p>
    </form>
  );
}
