import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ✅ Logout handler
  const handleLogout = () => {
    localStorage.removeItem("admin");
    alert("You have been logged out successfully!");
    navigate("/admin-login");
  };

  // Fetch department-specific reports on component mount
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const admin = JSON.parse(localStorage.getItem("admin"));
        if (!admin || !admin.token) {
          setError("Admin not logged in");
          setLoading(false);
          navigate("/admin-login");
          return;
        }

        const response = await fetch("http://localhost:5000/admin/reports", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${admin.token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch reports");
        }

        const data = await response.json();
        setReports(data.reports || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [navigate]);

  // Download reports in selected format
  const downloadReport = async (format) => {
    try {
      const admin = JSON.parse(localStorage.getItem("admin"));
      if (!admin || !admin.token) {
        alert("Admin not logged in");
        return;
      }

      const response = await fetch(`http://localhost:5000/admin/download/${format}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${admin.token}`,
        },
        body: JSON.stringify({ reports }),
      });

      if (!response.ok) throw new Error("Failed to download file");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `department_report.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert("Error downloading file: " + err.message);
    }
  };
  const handleStatusChange = async (id, currentStatus) => {
  const newStatus = currentStatus === "resolved" ? "pending" : "resolved";

  try {
    const response = await fetch(`http://localhost:5000/student/updateStatus/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (response.ok) {
      setReports((prevReports) =>
        prevReports.map((r) =>
          r.id === id ? { ...r, status: newStatus } : r
        )
      );
    } else {
      alert("Failed to update status.");
    }
  } catch (error) {
    console.error("Error updating status:", error);
  }
};


  return (
    <div className="home-wrapper">
      <nav className="navbar">
        <div className="logo-space">
          <img src="/logo1.png" alt="Care Point Logo" className="logo" width={150} height={100} />
        </div>
        <div className="nav-links">
          <a href="/">Home</a>
          {/* ✅ Logout Button */}
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="reports-container">
        <h2 className="Heading">Department Reports</h2>

        {loading ? (
          <p>Loading reports...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : reports.length === 0 ? (
          <p>No reports available for your department.</p>
        ) : (
          <>
            <div className="Download">
              <h3 className="Download-Heading">Download as:</h3>
              <button className="Pdf" onClick={() => downloadReport("pdf")}>PDF</button>
              <button className="Excel" onClick={() => downloadReport("xlsx")}>Excel</button>
              <button className="Docx" onClick={() => downloadReport("docx")}>Docx</button>
            </div>

            <div className="Report-Data">
              <h3 className="Report-Heading">Report Data:</h3>
              <table className="report-table">
  <thead>
    <tr>
      <th>id</th>
      <th>Reg No</th>
      <th>Name</th>
      <th>Block</th>
      <th>Room No</th>
      <th>Work Type</th>
      <th>Comments</th>
      <th>Proof</th>
      <th>Date</th>
      <th>Status</th> 
      <th>Feedback</th>
    </tr>
  </thead>

  <tbody>
    {reports.map((report, index) => (
      <tr key={index}>
        <td>{index + 1}</td>
        <td>{report.regNo}</td>
        <td>{report.name}</td>
        <td>{report.block}</td>
        <td>{report.roomNo}</td>
        <td>{report.workType}</td>
        <td>{report.comments}</td>
        <td>
          {report.proof ? (
            <a
              href={`http://localhost:5000/${report.proof}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View
            </a>
          ) : (
            "N/A"
          )}
        </td>
        <td>{report.date}</td>
        <td>
          <input
            type="checkbox"
            checked={report.status === "resolved"}
            onChange={() => handleStatusChange(report.id, report.status)}
          />{" "}
          {report.status === "resolved" ? "Resolved" : "Pending"}
        </td>
        <td>
  {report.rating ? (
    [...Array(5)].map((_, i) => (
      <span key={i} style={{ color: i < report.rating ? "gold" : "gray" }}>★</span>
    ))
  ) : (
    "No Feedback"
  )}
</td>

      </tr>
    ))}
  </tbody>
</table>

            </div>
          </>
        )}
      </div>

      <footer className="footer">
        <p>
          &copy; 2025 Care Point™ | All Rights Reserved | Contact:{" "}
          <a href="mailto:support@carepoint.com" className="footer-link">
            support@carepoint.com
          </a>
        </p>
      </footer>
    </div>
  );
};

export default AdminReports;
