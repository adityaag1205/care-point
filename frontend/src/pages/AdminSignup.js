import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminSignup() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "MaintenanceStaff",
        department: "General",
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:5000/admin/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Admin registered successfully!");
                navigate("/admin-login");
            } else {
                alert(data.error || "Signup failed");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Signup failed");
        }
    };

    return (
        <div className="Signup">
            <h2>Admin Signup</h2>
            <form onSubmit={handleSignup}>
                <input type="text" name="name" placeholder="Name" onChange={handleChange} required />
                <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
                <input type="password" name="password" placeholder="Password" onChange={handleChange} required />

                <select name="role" value={formData.role} onChange={handleChange}>
                    <option value="SuperAdmin">SuperAdmin</option>
                    <option value="MaintenanceStaff">MaintenanceStaff</option>
                </select>

                <select name="department" value={formData.department} onChange={handleChange}>
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Laundry">Laundry</option>
                    <option value="Internet">Internet</option>
                    <option value="Other">Other</option>
                    <option value="General">General</option>
                </select>

                <button type="submit">Sign Up</button>
            </form>
        </div>
    );
}

export default AdminSignup;
