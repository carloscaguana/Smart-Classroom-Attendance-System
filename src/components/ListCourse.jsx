import { useEffect, useState } from "react";
import { db } from "../utils/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function ListCourse() {
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        async function fetchCourses() {
            // firestore joins

            const [courseSnap, profSnap, deptSnap] = await Promise.all([
                getDocs(collection(db, "courses")),
                getDocs(collection(db, "professors")),
                getDocs(collection(db, "departments")),
            ]);

            const profMap = {};
            profSnap.forEach((doc) => {
                const data = doc.data();
                profMap[data.prof_id] = data;
            });

            const deptMap = {};
            deptSnap.forEach((doc) => {
                const data = doc.data();
                deptMap[data.dept_id] = data;
            });

            const courseData = courseSnap.docs.map((doc) => {
                const data = doc.data();
                const prof = profMap[data.prof_id];
                const dept = prof ? deptMap[prof.dept_id] : null;

                return {
                    id: doc.id,
                    ...data, 
                    prof_name: prof ? prof.prof_name : "(unknown)",
                    dept_name: dept ? dept.dept_name : "(unknown)",
                };
            });

            setCourses(courseData);
        }

        fetchCourses();
    }, []);

    return (
        <div>
            <h2>Course List</h2>
            {courses.map((course) => (
                <div key={course.id}>
                    <p>
                        <strong>ID:</strong> {course.course_id}
                    </p>
                    <p>
                        <strong>Name:</strong> {course.course_name}
                    </p>
                    <p>
                        <strong>Credits:</strong> {course.credits}
                    </p>
                    <p>
                        <strong>Professor:</strong> {course.prof_name}
                    </p>
                    <p>
                        <strong>Department:</strong> {course.dept_name}
                    </p>
                    <hr />
                </div>
            ))}
        </div>
    );
}