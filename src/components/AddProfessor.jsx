import { useState } from "react";
import { db } from "../utils/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function AddProfessor() {
  const [profId, setProfId] = useState("");
  const [profName, setProfName] = useState("");
  const [deptId, setDeptId] = useState("");

  async function addProfessor() {
    console.log("AddProfessor clicked");

    try {
      await addDoc(collection(db, "professors"), {
        prof_id: profId,
        prof_name: profName,
        dept_id: deptId,
        createdAt: Date.now(),
      });

      // 
      alert("Professor added!");

      // clear inputs
      setProfId("");
      setProfName("");
      setDeptId("");
    } catch (e) {
      console.error("Error adding professor:", e);
      alert("Error adding professor. Check console.");
    }
  }

  return (
    <div>
      <h3>Add Professor</h3>
      <input
        value={profId}
        onChange={(e) => setProfId(e.target.value)}
        placeholder="Professor ID"
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
