import React, { useState, useEffect } from "react";
import "../index.css";

// ⭐ Star Rating Component
// ⭐ Star Rating Component
const StarRating = ({ requestId, studentId, existingRating, onRate }) => {
  const [rating, setRating] = useState(existingRating || 0);
  const [hover, setHover] = useState(0);
  const [locked, setLocked] = useState(existingRating > 0); // 🔒 lock if feedback exists

  const handleRating = async (value) => {
    if (locked) return; // 🚫 prevent changing once submitted

    setRating(value);
    onRate(requestId, value);

    try {
      const student = JSON.parse(localStorage.getItem("student"));
      const response = await fetch("http://localhost:5000/student/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${student?.token}`,
        },
        body: JSON.stringify({
          requestId,
          studentId,
          rating: value,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit feedback");

      console.log("✅ Feedback submitted successfully");
      setLocked(true); // 🔒 Lock stars after successful submission
    } catch (error) {
      console.error("❌ Error submitting feedback:", error);
    }
  };

  return (
    <div>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => handleRating(star)}
          onMouseEnter={() => !locked && setHover(star)}
          onMouseLeave={() => !locked && setHover(0)}
          style={{
            cursor: locked ? "default" : "pointer",
            color: star <= (hover || rating) ? "gold" : "gray",
            fontSize: "20px",
            opacity: locked ? 0.7 : 1,
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
};


function StudentReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const student = JSON.parse(localStorage.getItem("student")); // from login

  useEffect(() => {
    if (!student) {
      setMessage("Please log in to view your complaints.");
      setLoading(false);
      return;
    }

    const fetchReports = async () => {
      try {
        // Fetch reports
        const response = await fetch(
          `http://localhost:5000/student/reports/${student.regNo}`,
          {
            headers: {
              Authorization: `Bearer ${student.token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.error || "Failed to fetch complaints.");
          setLoading(false);
          return;
        }

        if (!data.requests || data.requests.length === 0) {
          setMessage("You have not submitted any requests yet.");
          setLoading(false);
          return;
        }

        // Fetch feedback ratings for this student
        setReports(data.requests);
      } catch (error) {
        console.error("Error fetching reports:", error);
        setMessage("Server error. Try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [student]);

  const handleStatusToggle = async (requestId, currentStatus) => {
  const newStatus = currentStatus === "resolved" ? "pending" : "resolved";

  try {
    const response = await fetch(
  `http://localhost:5000/student/updateStatus/${requestId}`,
  {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${student.token}`, // ✅ include token
    },
    body: JSON.stringify({ status: newStatus }),
  }
);


    if (response.ok) {
      setReports((prevReports) =>
        prevReports.map((r) =>
          r.request_id === requestId ? { ...r, status: newStatus } : r
        )
      );
    } else {
      console.error("Failed to update status");
    }
  } catch (err) {
    console.error("Error updating status:", err);
  }
};


  // 🔹 Handle rating update locally
  const handleRatingUpdate = (requestId, newRating) => {
    setReports((prevReports) =>
      prevReports.map((r) =>
        r.id === requestId ? { ...r, rating: newRating } : r
      )
    );
  };

  return (
    <div className="page">
      <nav className="navbar">
        <div className="logo-space">
          <img src="/logo1.png" alt="logo" width={150} height={100} />
        </div>
        <div className="nav-links">
          <a href="/">Home</a>
          <a href="/student/requests">Submit Complaint</a>
          <a href="/student/reports">My Complaints</a>
        </div>
      </nav>

      <main className="reports-container">
        <h2>My Complaints</h2>
        {loading ? (
          <p>Loading...</p>
        ) : message ? (
          <p>{message}</p>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Work Type</th>
                <th>Block</th>
                <th>Room No</th>
                <th>Comments</th>
                <th>Submitted On</th>
                <th>Proof</th>
                <th>Status</th>
                <th>Feedback</th> {/* ⭐ New Column */}
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.workType}</td>
                  <td>{r.block}</td>
                  <td>{r.roomNo}</td>
                  <td>{r.comments}</td>
                  <td>{new Date(r.submitted_at).toLocaleString()}</td>
                  <td>
                    {r.proof ? (
                      <a
                        href={`http://localhost:5000/${r.proof}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View
                      </a>
                    ) : (
                      "No Proof"
                    )}
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={r.status === "resolved"}
                      onChange={() => handleStatusToggle(r.id, r.status)}
                    />{" "}
                    {r.status === "resolved" ? "Resolved" : "Pending"}
                  </td>
                  <td>
                    {/* ⭐ Add Rating Stars */}
                    <StarRating
                      requestId={r.id}
                      studentId={student.id}
                      existingRating={r.rating}
                      onRate={handleRatingUpdate}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      <footer className="footer">
        <p>
          © 2025 Care Point™ | All Rights Reserved | Contact:{" "}
          <a href="mailto:support@carepoint.com" className="footer-link">
            support@carepoint.com
          </a>
        </p>
      </footer>
    </div>
  );
}

export default StudentReports;
