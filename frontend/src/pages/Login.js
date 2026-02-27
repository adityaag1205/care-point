import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

function Login() {
  const [regNo, setRegNo] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:5000/student/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: regNo, password }), // backend expects { id, password }
    });

    const data = await response.json();

    if (response.ok) {
      alert("✅ Student Login Successful");

      localStorage.setItem(
        "student",
        JSON.stringify({
          regNo: data.user.regNo,
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone,
          token: data.token,
        })
      );

      navigate("/student/requests"); // change if your student dashboard path differs
    } else {
      alert(data.error || "Login Failed");
    }
  };

  return (
    <div className="home-wrapper">
      <nav className="navbar">
        <div className="logo-space">
          <img src="/logo1.png" alt="logo" width={150} height={100} />
        </div>
        <div className="nav-links">
          <a href="/">Home</a>
        </div>
      </nav>

      <div className="Login">
        <h2>Student Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Registration Number"
            value={regNo}
            onChange={(e) => setRegNo(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
        <p>
          New Student? <a href="/signup">Create Account</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
