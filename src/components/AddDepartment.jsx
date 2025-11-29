// compoonent to add dept to DB

import { useState } from "react";
import { db } from "../utils/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function AddDepartment() {
    const [deptId, setDeptId] = useState("");
    const [deptName, setDeptName] = useState("");

    async function addDepartment() {
        try {
            await addDoc(collection(db, "departments"), {
                dept_id: deptId,
                dept_name: deptName,
                createdAt: Date.now(),
            });
            alert("department added!");

            setDeptId("");
            setDeptName("");
        } catch (e) {
            console.error("error adding department:", e);
        }
    }

    return (
        <div>
            <h2>Add Department</h2>
            <input
                value={deptId}
                onChange={(e) => setDeptId(e.target.value)}
                placeholder="department ID"
            />
            <input
                value={deptName}
                onChange={(e) => setDeptName(e.taget.value)}
                placeholder="Department Name"
            />
            <button onClick={addDepartment}>Add</button>
        </div>
    );
}