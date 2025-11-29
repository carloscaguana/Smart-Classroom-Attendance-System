// React component used to list course sections available in DB

import { useEffect, useState } from "react";
import { db } from "../utils/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function ListSection(){
    const [sections, setSection] = useState([]);

    useEffect(() => {
        // function: list attendance records
        async function fetchSection() {
            const snapshot = await getDocs(collection(db, "Section"));

            const sectionData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setSection(sectionData);
        }
        fetchSection();
    }, []);

    return (
        <div>
            <h2>Sections</h2>
            {sections.map(section => (
                <div key={section.id}>
                    <p><strong>SectionID:</strong> {section.section_id}</p>
                    <p><strong>CourseID:</strong> {section.cid}</p>
                    <p><strong>ProfessorID:</strong> {section.pid}</p>
                    <p><strong>Semester:</strong> {section.semester}</p>
                    <p><strong>Year:</strong> {section.year}</p>
                    <p><strong>CourseStartTime:</strong> {section.course_start}</p>
                    <p><strong>CourseEndTime:</strong> {section.course_end}</p>
                    <p><strong>Grace Minutes:</strong> {section.grace_mins}</p>
                    <p><strong>Minimum Minutes:</strong> {section.min_mins}</p>
                    <hr />
                </div>
            ))}
        </div>
    );
}