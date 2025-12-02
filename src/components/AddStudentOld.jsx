//Component used to add a student to DB

import { useState } from "react";
import { db } from "../utils/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function AddStudent(){
    // attributes for Student table
    const [studentId, setStudentId] = useState("");
    const [studentName, setStudentName] = useState("");
    const [major, setMajor] = useState("");

    // function that adds to document all student attributes
    async function addStudent() {
        try{
            await addDoc(collection(db, "Students"),{
                sid: studentId,
                name: studentName, 
                major: major,
                createdAt: Date.now()
            });
            alert("Student added!");

            // reset form
            setStudentId("");
            setStudentName("");
            setMajor("");

        } catch (e){
            console.error("Error adding student:", e);
        }
    }

    return (
    <div>
      <h2>Add Student</h2>
      <input
        value={studentId}
        onChange={e => setStudentId(e.target.value)}
        placeholder="Student ID"
      />
      <input
        value={studentName}
        onChange={e => setStudentName(e.target.value)}
        placeholder="Student Name"
      />
      <input
        value={major}
        onChange={e => setMajor(e.target.value)}
        placeholder="Major"
      />

      <button onClick={addStudent}>Add</button>
    </div>
  );
}