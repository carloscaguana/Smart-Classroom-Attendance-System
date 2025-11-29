// component used to add courses to DB

import { useState } from "react";
import { db } from "../utils/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function AddCourse() {
    const [courseId, setCourseId] = useState("");
    const [courseName, setCourseName] = useState("");
    const [credits, setCredits] = useState("");
    const [profId, setProfId] = useState("");

    async function addCourse() {
        try {
            await addDoc(collection(db, "courses"), {
                course_id: courseId,
                course_name: courseName,
                credits: Number(credits),
                prof_id: profId,
                createdAt: Date.now(),
            });
            alert("Course added!");

            setCourseId("");
            setCourseName("");
            setCredits("");
            setProfId("");
        } catch (e) {
            console.error("Error adding course:", e);
        }
    }
    
    return (
        <div>
            <h2>Add Course</h2>
            <input
                value={courseId}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Course ID"
            />
            <input
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Course Name"
            />
            <input
                value={profId}
                onChange={(e) => setProfId(e.target.value)}
                placeholder="Professor ID"
            />
            <button onClick={addCourse}>Add</button>
        </div>
    );
}