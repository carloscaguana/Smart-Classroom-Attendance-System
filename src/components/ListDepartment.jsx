import { useEffect, useState } from "react";
import { db } from "../utils/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function ListDepartment() {
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    async function fetchDepartments() {
      const snapshot = await getDocs(collection(db, "departments"));

      const deptData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setDepartments(deptData);
    }

    fetchDepartments();
  }, []);

  return (
    <div>
      <h2>Department List</h2>
      {departments.map((dept) => (
        <div key={dept.id}>
          <p>
            <strong>ID:</strong> {dept.dept_id}
          </p>
          <p>
            <strong>Name:</strong> {dept.dept_name}
          </p>
          <hr />
        </div>
      ))}
    </div>
  );
}
