export default function StudentCourseConfigPanel({
  courseName,
  startTime,
  endTime,
  graceMinutes,
  minMinutesPresent,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <h2 className="text-sm font-semibold mb-3">
            Course Information
        </h2>
        {/* Setting course name */}
        <div className="space-y-3 text-sm">
            <div>
            <label className="block text-xs text-slate-400 mb-1">
                Course Name
            </label>
            <input
                type="text"
                value={courseName}
                //onChange={(e) => setCourseName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm"
                placeholder="e.g. CS101 - Intro to CS"
                disabled
            />
            </div>

            {/* Setting start time */}
            <div className="grid grid-cols-3 gap-3">
            <div>
                <label className="block text-xs text-slate-400 mb-1">
                Start Time
                </label>
                <input
                type="time"
                value={startTime}
                //onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm"
                disabled
                />
            </div>
            {/* Setting end time */}
            <div>
                <label className="block text-xs text-slate-400 mb-1">
                End Time
                </label>
                <input
                type="time"
                value={endTime}
                //onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm"
                disabled
                />
            </div>
            {/* Setting grace period */}
            <div>
                <label className="block text-xs text-slate-400 mb-1">
                Grace Minutes For Arrival And Leave
                </label>
                <input
                type="number"
                value={graceMinutes}
                // onChange={(e) =>
                //   setGraceMinutes(Number(e.target.value))
                // }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm"
                disabled
                />
            </div>
            {/* Setting minimum minutes present */}
            </div>
                <div>
                <label className="block text-xs text-slate-400 mb-1">
                    Minimum Minutes Present To Mark As Attended
                </label>
                <input
                    type="number"
                    value={minMinutesPresent}
                    //onChange={(e) => setMinMinutesPresent(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm"
                    disabled
                />
            </div>
            <p className="text-xs text-slate-400 mt-1">
            These values calculates who is considered{" "}
            <span className="text-emerald-300">ON_TIME</span>,
            {" "} <span className="text-red-300">LATE</span>,
            {" "} <span className="text-amber-300">PENDING</span>,
            {" "} <span className="text-fuchsia-300">ABSENT</span>, and
            {" "} <span className="text-pink-300">SKIPPED</span>,
            based on your
            arrival and leave time.
            </p>
        </div>
    </div>
  );
}
