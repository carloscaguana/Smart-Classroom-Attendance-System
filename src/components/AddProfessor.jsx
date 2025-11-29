// Component used to add a professor to DB

import { useState } from "react";
import { db } from "../utils/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function AddProfessor() {
    // attributes for proff table
    const [profId, setProfId] = useState("");
    const [profName, setProfName] = useState("");
    const [deptId, setDeptId] = useState("");

    //function to add proff's attributes to doc
    async function addProfessor () {
        try {
            await addDoc(collection(db, "professors"), {
                prof_id: profId,
                prof_name: profName,
                dept_id: deptId,
                createdAt: Date.now(),
            });
            alert("Professor added!");

            //reset from
            setProfId("");
            setProfName("");
            setDeptId("");
        } catch (e) {
            console.error("Error adding professor:", e);
        }
    }
    return (
        <div>
            <h2>Add Professor</h2>
            <input
                value={profId}
                onChange={(e) => setProfId(e.target.value)}
                placeholder="Department ID"
            />
            <input
                value={profName}
                onChange={(e) => setProfName(e.target.value)}
                placeholder="Professor Name"
            />
            <input 
                value={deptId}
                onChange={(e) => setDeptId(e.target.value)}
                placeholder="Department ID"
            />
            <button onClick={addProfessor}>Add</button>
        </div>
    );
}