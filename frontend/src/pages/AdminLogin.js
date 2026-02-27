import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const response = await fetch("http://localhost:5000/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("✅ Admin Login Successful");

      localStorage.setItem("admin", JSON.stringify({
        id: data.admin.id,
        name: data.admin.name,
        email: data.admin.email,
        token: data.token,
      }));

      navigate("/admin/reports");
    } else {
      alert(data.error || "Login Failed");
    }
  };

  return (
    <div className="home-wrapper">
      <nav className="navbar">
        <div className="logo-space"><img src="/logo1.png" alt="logo" width={150} height={100}/></div>
        <div className="nav-links">
          <a href="/">Home</a>
        </div>
      </nav>

      <div className="Login">
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Admin Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit">Login</button>
        </form>
        <p>New Admin? <a href="/admin-signup">Create Account</a></p>
      </div>
    </div>
  );
}

export default AdminLogin;
