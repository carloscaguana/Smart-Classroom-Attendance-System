// React component used to list attendance records in DB

import { useEffect, useState } from "react";
import { db } from "../utils/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function ListAttendance(){
    const [records, setAttendanceRecord] = useState([]);

    useEffect(() => {
        // function: list attendance records
        async function fetchAttendanceRecords() {
            const snapshot = await getDocs(collection(db, "Attendance"));

            const recordData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setAttendanceRecord(recordData);
        }
        fetchAttendanceRecords();
    }, []);

    return (
        <div>
            <h2>Attendance Records</h2>
            {records.map(record => (
                <div key={record.id}>
                    <p><strong>StudentID:</strong> {record.student_id}</p>
                    <p><strong>SectionID:</strong> {record.section_id}</p>
                    <p><strong>Status:</strong> {record.status}</p>
                    <p><strong>Date:</strong> {record.date}</p>
                    <p><strong>TotalSeconds:</strong> {record.seconds}</p>
                    <hr />
                </div>
            ))}
        </div>
    );
}