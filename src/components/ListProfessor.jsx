import { useEffect, useState } from "react";
import { db } from "../utils/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function ListProfessor() {
    const [professors, setProfessors] = useState([]);

    useEffect(() => {
        async function fetchProfessors() {
            const snapshot = await getDocs(collection(db, "professors"));

            const professorData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setProfessors(professorData);
        }

        fetchProfessors();
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