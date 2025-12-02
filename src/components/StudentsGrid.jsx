import StudentCard from "./StudentCard.jsx";
import { getEffectiveStatus, getAttendanceSummary } from "../utils/attendance";

export default function StudentsGrid({
  students,
  selectedStudent,
  computeStatus,
  onSelectStudent,
  setShowAddStudentForm,
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold mb-2">
        Students In This Class
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {students.map((s) => {
          const effectiveStatus = getEffectiveStatus(s, computeStatus);
          const attendanceSummary = getAttendanceSummary(s, effectiveStatus);
          const isSelected = selectedStudent && selectedStudent.id === s.id;

          return (
            <StudentCard
              key={s.id}
              student={{ ...s, status: effectiveStatus }}
              attendanceSummary={attendanceSummary}
              onClick={() =>
                onSelectStudent(isSelected ? null : s)
              }
            />
          );
        })}

        <button
          type="button"
          onClick={() => setShowAddStudentForm(true)}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700
                      bg-slate-900/40 p-4 hover:border-emerald-400 hover:bg-slate-900/80 transition-colors"
        >
          <div className="text-3xl mb-1">+</div>
          <div className="text-sm font-medium text-slate-100">
            Add a student
          </div>
        </button>
      </div>
    </section>
  );
}
