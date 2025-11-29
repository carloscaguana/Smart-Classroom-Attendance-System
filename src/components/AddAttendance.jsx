// React component used to add a student's attendance record to the DB

import { useState } from "react";
import { db } from "../utils/firebase"
import { collection, addDoc } from "firebase/firestore";

export default function AddAttendance(){
    // attributes for Attendance table
    const [studentId, setStudentId] = useState("");
    const [sectionId, setSectionId] = useState("");
    const [status, setStatus] = useState("");
    const [attendDate, setAttendDate] = useState("");
    const [totalSeconds, setTotalSeconds] = useState("");

    // function: add attendance record
    async function addAttendance() {
        try {
            await addDoc(collection (db, "Attendance"), {
                student_id: studentId,
                section_id: sectionId,
                status: status,
                date: attendDate,
                seconds: totalSeconds,
                createdAt: Date.now()
            });

            alert("Attendance record added!");

            // reset form
            setStudentId("");
            setSectionId("");
            setStatus("");
            setAttendDate("");
            setTotalSeconds("");


        } catch (e){
            console.error("Error adding record:", e);
        }    
    }

    return (
        <div>
            <h2>Add Attendance Record</h2>
            <input
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                placeholder="Student ID"
            />
            <input
                value={sectionId}
                onChange={e => setSectionId(e.target.value)}
                placeholder="Section ID"
            />
            <input
                value={status}
                onChange={e => setSectionId(e.target.value)}
                placeholder="Status"
            />
            <input
                value={attendDate}
                onChange={e => setAttendDate(e.target.value)}
                placeholder="Attendance Date"
            />
            <input
                value={totalSeconds}
                onChange={e => setTotalSeconds(e.target.value)}
                placeholder="Total Seconds"
            />

            <button onClick={addAttendance}>Add Attendance Record</button>
        </div>
    );
}