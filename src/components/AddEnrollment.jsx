import { useEffect, useState } from "react";
import { db } from "../utils/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function AddEnrollment() {
    const [studentId, setStudent] = useState("");
    const [sectionId, setSectionId] = useState("");

    async function addEnrollment() {
        try {
            await addDoc(collection(db, "enrollments"), {
                student_id: studentId,
                section_id: sectionId,
                createdAt: Date.now(),
            });
            alert("Enrollment added!");

            setStudentId("");
            setSectionId("");
        } catch (e) {
            console.error("Error adding enrollemnt:", e);
        }
    }

    return (
        <div>
            <h2>Add Enrollment</h2>
            <input
                value={studentId}
                onChange={(e) => setStudentId(e.taget.value)}
                placeholder="Student ID"
            />
            <input
                value={sectionId}
                onChange={(e) => setSectionId(e.taget.value)}
                placeholder="Section ID"
            />
            <button onClick={addEnrollment}>Add</button>
        </div>
    );
}