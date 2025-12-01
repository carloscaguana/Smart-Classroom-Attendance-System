import { useEffect, useState } from "react";
import { db } from "../utils/firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function ListProfessor() {
  const [professors, setProfessors] = useState([]);

  useEffect(() => {
    // Real-time listener
    const unsub = onSnapshot(collection(db, "professors"), (snapshot) => {
      const professorData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProfessors(professorData);
    });

    // cleanup when component unmounts
    return () => unsub();
  }, []);

  return (
    <div>
      <h2>Professor List</h2>
      {professors.map((prof) => (
        <div key={prof.id}>
          <p>
            <strong>ID:</strong> {prof.prof_id}
          </p>
          <p>
            <strong>Name:</strong> {prof.prof_name}
          </p>
          <p>
            <strong>Dept ID:</strong> {prof.dept_id}
          </p>
          <hr />
        </div>
      ))}
    </div>
  );
}
