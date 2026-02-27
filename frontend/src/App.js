import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Reports from "./pages/AdminReports";
import Form from "./pages/Form";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminLogin from "./pages/AdminLogin";
import AdminSignup from "./pages/AdminSignup";
import StudentReports from "./pages/StudentReports";

import "./index.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-wrapper">
      <nav className="navbar">
        <div className="logo-space">
          <img src="/logo1.png" alt="Care Point Logo" className="logo" width={150} height={100} />
        </div>
        <div className="nav-links">
          <a href="/">Home</a>
          <a href="/student/requests">Student Form</a>
          <a href="/admin/reports">Reports</a>
          <a href="mailto:support@carepoint.com">Contact</a>
        </div>
      </nav>
      <center>
        <div className="home-container">
          <h1 className="home-title">Welcome to CarePoint</h1>
          <h2 className="home-description">
            Your one-stop platform for managing student reports efficiently.
          </h2>
          <div className="button-group">
            <button className="primary-btn" onClick={() => navigate("/login")}>I'm a Student</button>
            <button className="secondary-btn" onClick={() => navigate("/admin-login")}>I'm an Admin</button>
          </div>
        </div>
      </center>
      <footer className="footer">
        &copy; 2025 Care Point™ | All Rights Reserved | Contact:{" "}
        <a href="mailto:support@carepoint.com" className="footer-link">support@carepoint.com</a>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/student/requests" element={<Form />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-signup" element={<AdminSignup />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/student/reports" element={<StudentReports />} />
      </Routes>
    </Router>
  );
}

export default App;
