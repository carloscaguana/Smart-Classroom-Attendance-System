export const MOCK_STUDENTS = [
  // ON_TIME (with leave time)
  {
    id: "s1",
    name: "Saturo Gojo",
    uid: "04:A3:BC:91",
    totalSeconds: 5400,
    visitCount: 3,
    lastArrival: "2025-11-25 09:05",
    lastLeave: "2025-11-25 10:10",
    status: "PENDING",
    overrideStatus: null,
    attendanceRecords: [
      { date: "2025-11-11", status: "ON_TIME" },
      { date: "2025-11-13", status: "ON_TIME" },
      { date: "2025-11-18", status: "LATE" },
      { date: "2025-11-20", status: "ON_TIME" },
      { date: "2025-11-25", status: "ON_TIME" },
    ],
  },

  // LATE
  {
    id: "s2",
    name: "Ryomen Sukuna",
    uid: "0A:FF:11:22",
    totalSeconds: 7200,
    visitCount: 4,
    lastArrival: "2025-11-25 09:15",
    lastLeave: "2025-11-25 10:20",
    status: "PENDING",
    overrideStatus: null,
    attendanceRecords: [
      { date: "2025-11-11", status: "LATE" },
      { date: "2025-11-13", status: "LATE" },
      { date: "2025-11-18", status: "ON_TIME" },
      { date: "2025-11-20", status: "SKIPPED" },
      { date: "2025-11-25", status: "LATE" },
    ],
  },

  // ABSENT
  {
    id: "s3",
    name: "Denji",
    uid: "06:B4:35:42",
    totalSeconds: 0,
    visitCount: 0,
    lastArrival: "",
    lastLeave: "",
    status: "PENDING",
    overrideStatus: null,
    attendanceRecords: [
      { date: "2025-11-11", status: "ABSENT" },
      { date: "2025-11-13", status: "ABSENT" },
      { date: "2025-11-18", status: "ABSENT" },
      { date: "2025-11-20", status: "SKIPPED" },
      { date: "2025-11-25", status: "ABSENT" },
    ],
  },

  // SKIPPED
  {
    id: "s4",
    name: "Power",
    uid: "08:B4:36:43",
    totalSeconds: 1000,
    visitCount: 1,
    lastArrival: "2025-11-25 09:02",
    lastLeave: "2025-11-25 09:30",
    status: "PENDING",
    overrideStatus: null,
    attendanceRecords: [
      { date: "2025-11-11", status: "LATE" },
      { date: "2025-11-13", status: "LATE" },
      { date: "2025-11-18", status: "ON_TIME" },
      { date: "2025-11-20", status: "SKIPPED" },
      { date: "2025-11-25", status: "EXCUSED" },
    ],
  },

  // Forgot to clock out but class ended
  {
    id: "s5",
    name: "Reze",
    uid: "09:B5:37:44",
    totalSeconds: 2700,
    visitCount: 4,
    lastArrival: "2025-11-25 09:00",
    lastLeave: "",
    status: "PENDING",
    overrideStatus: null,
    attendanceRecords: [
      { date: "2025-11-11", status: "EXCUSED" },
      { date: "2025-11-13", status: "LATE" },
      { date: "2025-11-18", status: "ON_TIME" },
      { date: "2025-11-20", status: "SKIPPED" },
      { date: "2025-11-25", status: "LATE" },
    ],
  },

  // Error on arrival time format
   {
    id: "s6",
    name: "Megumi Fushigoro",
    uid: "01:H5:A3:32",
    totalSeconds: 2800,
    visitCount: 6,
    lastArrival: "2025-11-25",
    lastLeave: "",
    status: "PENDING",
    overrideStatus: null,
    attendanceRecords: [
      { date: "2025-11-11", status: "LATE" },
      { date: "2025-11-13", status: "EXCUSED" },
      { date: "2025-11-18", status: "ON_TIME" },
      { date: "2025-11-20", status: "SKIPPED" },
      { date: "2025-11-25", status: "LATE" },
    ],
  },

  // Error on leave time format
   {
    id: "s7",
    name: "Jogo",
    uid: "010:A5:Q7:14",
    totalSeconds: 1500,
    visitCount: 7,
    lastArrival: "2025-11-25 09:00",
    lastLeave: "10:20",
    status: "PENDING",
    overrideStatus: null,
    attendanceRecords: [
      { date: "2025-11-11", status: "LATE" },
      { date: "2025-11-13", status: "ON_TIME" },
      { date: "2025-11-18", status: "ON_TIME" },
      { date: "2025-11-20", status: "SKIPPED" },
      { date: "2025-11-25", status: "LATE" },
    ],
  },

  // Arrives late, but has not clocked out yet
   {
    id: "s8",
    name: "Toji",
    uid: "026:C7:E4:67",
    totalSeconds: 1200,
    visitCount: 8,
    lastArrival: "2025-11-25 09:20",
    lastLeave: "",
    status: "PENDING",
    overrideStatus: null,
    attendanceRecords: [
      { date: "2025-11-11", status: "ABSENT" },
      { date: "2025-11-13", status: "SKIPPED" },
      { date: "2025-11-18", status: "EXCUSED" },
      { date: "2025-11-20", status: "SKIPPED" },
      { date: "2025-11-25", status: "ON_TIME" },
    ],
  },
];