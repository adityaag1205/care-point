import React, { useEffect, useState } from "react";

const StudentReports = ({ regNo }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/student-requests?regNo=${regNo}`)
      .then((res) => res.json())
      .then((data) => {
        setRequests(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching requests:", error);
        setLoading(false);
      });
  }, [regNo]);

  return (
    <div>
      <h2>Your Maintenance Requests</h2>
      {loading ? (
        <p>Loading...</p>
      ) : requests.length === 0 ? (
        <p>You have not submitted any requests yet.</p>
      ) : (
        <ul>
          {requests.map((request) => (
            <li key={request.id}>
              <strong>Work Type:</strong> {request.workType} | <strong>Category:</strong> {request.category} | <strong>Comments:</strong> {request.comments}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StudentReports;
