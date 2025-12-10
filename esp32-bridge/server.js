import express from "express";
import admin from "firebase-admin";

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountJson) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT env var");
}

const serviceAccount = JSON.parse(serviceAccountJson);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
app.use(express.json());

app.post("/api/attendance", async (req, res) => {
  try {
    const {
      uid,
      event,
      timestamp,
      totalSeconds,
      courseDocId,
    } = req.body;

    if (!uid || !event || !timestamp || !courseDocId) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const studentRef = db.doc(`courses/${courseDocId}/students/${uid}`);
    const snap = await studentRef.get();

    // If this UID is not registered under this course, ignore it
    if (!snap.exists) {
      console.log(
        `Unknown UID ${uid} for course ${courseDocId} - ignoring event.`
      );
      return res.status(404).json({ error: "Student not found in this course" });
    }

    const data = snap.data() || {};
    const update = {};

    if (event === "arrival") {
      const prevArrival = data.lastArrival || null;
      const prevLeave = data.lastLeave || null;

      // If the card scans for arrival but already has an arrival and
      // leave, update its arrival but reset its leave and totalSeconds
      if (prevArrival && prevLeave) {
        update.lastLeave = null;
        update.totalSeconds = 0;
      }

      update.lastArrival = timestamp;
    } else if (event === "exit") { // Updates a students exit time
      update.lastLeave = timestamp;
      
      if (typeof totalSeconds === "number") {
        update.totalSeconds = totalSeconds;
      }
    } else {
      return res.status(400).json({ error: "Invalid event type" });
    }

    await studentRef.set(update, { merge: true });

    return res.status(204).send();
  } catch (err) {
    console.error("Error in /api/attendance:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 8080;

// Server is running and waiting for an request by the ESP32
app.listen(PORT, () => {
    console.log(`Bridge listening on port ${PORT}`);
});
