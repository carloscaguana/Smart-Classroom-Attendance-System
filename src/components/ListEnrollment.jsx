import { useEffect, useState } from "react";
import { db } from "../utils/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function ListEnrollment() {
    const [enrollments, setEnrollments] = useState([]);

    useEffect(() => {
        async function fetchEnrollments() {
            const snapshot = await getDocs(collection(db, "enrollments"));

            const enrollmentData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setEnrollments(enrollmentData);
        }

        fetchEnrollments();
    }, []);

    return (
        <div>
            <h2>Enrollment List</h2>
            {enrollments.map((enr) => (
                <div key={enr.id}>
                    <p>
                        <strong>Student ID:</strong> {enr.student_id}
                    </p>
                    <p>
                        <strong>Section ID:</strong> {enr.section_id}
                    </p>
                    <hr />
                </div>
            ))}
        </div>
    );
}