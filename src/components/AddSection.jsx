// React component used to add a course section to the DB

import { useState } from "react";
import { db } from "../utils/firebase"
import { collection, addDoc } from "firebase/firestore";

export default function AddSection(){
    // attributes for Section table
    //section_id, cid, pid, semester, year, course_start, course_end, grace_minutes, min_minutes
    const [sectionId, setSectionId] = useState("");
    const [courseId, setCourseId] = useState("");
    const [professorId, setProfessorId] = useState("");
    const [semester, setSemester] = useState("");           // values: FALL, WINTER, SPRING, SUMMER
    const [year, setYear] = useState("");
    const [courseStart, setCourseStart] = useState("");     // military time
    const [courseEnd, setCourseEnd] = useState("");         // military time
    const [graceMinutes, setGraceMinutes] = useState("");
    const [minMinutes, setMinMinutes] = useState("");

    //function: add course section
    async function addSection() {
        try{
            await addDoc(collection(db, "Section"), {
                section_id: sectionId,
                cid: courseId,
                pid: professorId,
                semester: semester,
                year: year,
                course_start: courseStart,
                course_end: courseEnd,
                grace_mins: graceMinutes,
                min_mins: minMinutes
            });

            alert("Course section added!");

            //reset form
            setSectionId("");
            setCourseId("");
            setProfessorId("");
            setSemester("");
            setYear("");
            setCourseStart("");
            setCourseEnd("");
            setGraceMinutes("");
            setMinMinutes("");

        } catch (e){
            console.error("Error adding section:", e);
        }
    }

    return (
        <div>
            <h2>Add Section</h2>
            <input
                value={sectionId}
                onChange={e => setSectionId(e.target.value)}
                placeholder="Section ID"
            />
            <input
                value={courseId}
                onChange={e => setCourseId(e.target.value)}
                placeholder="Course ID"
            />
            <input
                value={professorId}
                onChange={e => setProfessorId(e.target.value)}
                placeholder="Professor ID"
            />
            <input
                value={semester}
                onChange={e => setSemester(e.target.value)}
                placeholder="Semester"
            />
            <input
                value={year}
                onChange={e => setYear(e.target.value)}
                placeholder="Year"
            />
            <input
                value={courseStart}
                onChange={e => setCourseStart(e.target.value)}
                placeholder="Course Start Time"
            />
            <input
                value={courseEnd}
                onChange={e => setCourseEnd(e.target.value)}
                placeholder="Course End Time"
            />
            <input
                value={graceMinutes}
                onChange={e => setGraceMinutes(e.target.value)}
                placeholder="Grace Minutes"
            />
            <input
                value={minMinutes}
                onChange={e => setMinMinutes(e.target.value)}
                placeholder="Minimum Minutes"
            />

            <button onClick={addSection}>Add Section</button>
        </div>
    )
}