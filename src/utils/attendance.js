export const STATUS_OPTIONS = [
  "ON_TIME",
  "LATE",
  "PENDING",
  "ABSENT",
  "SKIPPED",
  "EXCUSED",
  "UNKNOWN",
];

// Statuses that count as present for attendance calculation
export const PRESENT_STATUSES = ["ON_TIME", "LATE", "EXCUSED"];

// Statuses that count towards attendance calculation
// Doesn't include PENDING and UNKNOWN
export const COUNTED_STATUSES = [
  "ON_TIME",
  "LATE",
  "ABSENT",
  "SKIPPED",
  "EXCUSED",
];

// Helper for "today" key
function getTodayKey() {
  //return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const d = new Date();          // LOCAL TIME
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Parses timestamp in "YYYY-MM-DD HH:MM" (or "... HH:MM:SS") and returns total minutes
// Null is for no timestamp, while -1 indicates an invalid format
export function getMinuteFromTimestamp(timestamp) {
  if (!timestamp) {
    return null;
  }

  const parts = timestamp.split(" ");

  if (parts.length < 2) {
    return -1;
  }

  const [hour, minute, seconds] = parts[1].split(":").map(Number);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return -1;
  }

  if (seconds) {
    if (Number.isNaN(seconds)) {
      return -1;
    }
  }

  if (seconds) {
    return hour * 60 + minute + seconds / 60;
  }

  return hour * 60 + minute;
}

// Parses timestring in "HH:MM" and returns total minutes
// Returns null if no string; -1 if invalid
export function getMinuteFromTimestring(timeString) {
  if (!timeString) {
    return null;
  }

  const [hour, minute] = timeString.split(":").map(Number);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return -1;
  }

  return hour * 60 + minute;
}

/**
 * Calculates the session duration in minutes.
 *
 * preview = false (student view):
 *   - If today's attendance record exists and has durationSeconds, use that.
 *   - Otherwise fall back to live lastArrival/lastLeave.
 *
 * preview = true (professor / live preview):
 *   - Ignore saved duration for today, always use live lastArrival/lastLeave.
 */
export function getSessionDurationMinutes(student, preview = false) {
  if (!student) return null;

  const todayKey = getTodayKey();
  const records = Array.isArray(student.attendanceRecords)
    ? student.attendanceRecords
    : [];
  const todayRecord = records.find((r) => r.date === todayKey);

  // When NOT previewing, try to use finalized snapshot first
  if (!preview && todayRecord) {
    if (typeof todayRecord.durationSeconds === "number") {
      return todayRecord.durationSeconds / 60;
    }

    // Fallback: compute from today's record timestamps if present
    if (todayRecord.lastArrival && todayRecord.lastLeave) {
      const arr = getMinuteFromTimestamp(todayRecord.lastArrival);
      const lv = getMinuteFromTimestamp(todayRecord.lastLeave);

      if (arr === -1 || lv === -1) return -1;
      if (arr == null || lv == null) return null;
      if (lv < arr) return -1;

      return lv - arr;
    }
  }

  // if (typeof student.totalSeconds === "number") {
  //   return student.totalSeconds / 60;
  // }
  // Live values (used for preview, or if there's no finalized record)
  const arrival = getMinuteFromTimestamp(student.lastArrival);
  const leave = getMinuteFromTimestamp(student.lastLeave);

  if (arrival === -1 || leave === -1) {
    return -1;
  }

  if (arrival == null || leave == null) {
    return null;
  }

  if (leave < arrival) {
    return -1;
  }

  return leave - arrival;
}

/**
 * Human-readable HH:MM:SS duration.
 * Respects preview vs finalized using getSessionDurationMinutes(student, preview).
 */
export function formatSessionDuration(student, preview = false) {
  const durationMinutes = getSessionDurationMinutes(student, preview);

  if (durationMinutes === null || durationMinutes === -1) return "N/A";

  const totalSeconds = Math.floor(durationMinutes * 60);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}

/**
 * Effective *status* for display.
 *
 * preview = true  (professor / live):
 *   - Use overrideStatus if present, otherwise computeFn(student).
 *
 * preview = false (student view / finalized):
 *   - If today's record exists, trust its overrideStatus / status.
 *   - Otherwise, use live overrideStatus or computeFn(student).
 */
export function getEffectiveStatus(student, computeFn, preview = false) {
  if (!student) return "UNKNOWN";

  if (preview) {
    if (student.overrideStatus) {
      return student.overrideStatus;
    }
    return computeFn(student);
  }

  const records = Array.isArray(student.attendanceRecords)
    ? student.attendanceRecords
    : [];

  const todayKey = getTodayKey();
  const todayRecord = records.find((r) => r.date === todayKey);

  if (todayRecord) {
    return (
      todayRecord.overrideStatus ||
      todayRecord.status ||
      "UNKNOWN"
    );
  }

  if (student.overrideStatus) {
    return student.overrideStatus;
  }

  return computeFn(student);
}

/**
 * Attendance summary for a single student.
 *
 * preview = false (student):
 *   - Past days come from attendanceRecords.
 *   - Today uses finalized record if exists; otherwise uses currentStatus.
 *
 * preview = true (professor / live):
 *   - Past days still from attendanceRecords.
 *   - Today ALWAYS uses currentStatus (ignores today's stored record),
 *     so overrides & live changes show up as a "what if" preview.
 */
export function getAttendanceSummary(student, currentStatus, preview = false) {
  const records = Array.isArray(student.attendanceRecords)
    ? student.attendanceRecords
    : [];

  const todayKey = getTodayKey();

  // Past finalized sessions (excluding today)
  const pastCounted = records.filter(
    (r) => r.date !== todayKey && COUNTED_STATUSES.includes(r.status)
  );

  let total = pastCounted.length;
  let attended = pastCounted.filter((r) =>
    PRESENT_STATUSES.includes(r.status)
  ).length;

  const todayRecord = records.find((r) => r.date === todayKey);

  let todayStatus = null;

  if (!preview) {
    // STUDENT VIEW:
    if (todayRecord) {
      todayStatus =
        todayRecord.overrideStatus ||
        todayRecord.status ||
        null;
    } else {
      todayStatus = currentStatus || null;
    }
  } else {
    // PROFESSOR PREVIEW:
    todayStatus = currentStatus || null;
  }

  if (
    todayStatus &&
    todayStatus !== "PENDING" &&
    todayStatus !== "UNKNOWN" &&
    COUNTED_STATUSES.includes(todayStatus)
  ) {
    total += 1;
    if (PRESENT_STATUSES.includes(todayStatus)) {
      attended += 1;
    }
  }

  if (total === 0) {
    return { attended: 0, total: 0, percent: 0 };
  }

  const percent = (attended / total) * 100;
  return { attended, total, percent };
}

/**
 * Class summary.
 *
 * preview is forwarded down:
 *   - false: student-style view (trust finalized today if it exists).
 *   - true: preview-style (today from live status).
 */
export function getClassAttendanceSummary(
  students,
  computeStatus,
  preview = false
) {
  let totalSessions = 0;
  let totalAttended = 0;

  students.forEach((s) => {
    const effectiveStatus = getEffectiveStatus(s, computeStatus, preview);
    const { attended, total } = getAttendanceSummary(
      s,
      effectiveStatus,
      preview
    );
    totalSessions += total;
    totalAttended += attended;
  });

  const percent =
    totalSessions === 0 ? 0 : (totalAttended / totalSessions) * 100;

  return { totalSessions, totalAttended, percent };
}

// Color for percentage (used in details panel, class overview)
export function getAttendanceColorClass(percent) {
  if (percent >= 90) return "text-emerald-300";
  if (percent >= 70) return "text-amber-300";
  if (percent >= 40) return "text-orange-300";
  return "text-red-300";
}

// image/icon based on student percentage
export function getAttendanceEmoji(percent) {
  if (percent >= 90) return "🟢"; // S-tier
  if (percent >= 70) return "🟡"; // decent
  if (percent >= 40) return "🟠"; // bad
  return "🔴";                    // very bad
}
