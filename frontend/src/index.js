import React from 'react';
import ReactDOM from 'react-dom/client';
//import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { useNavigate } from 'react-router-dom';

export default function HomePage(){
  const navigate=useNavigate();
  return(
    <>
      <nav className="navbar">
        <div className="logo-space">Logo</div>
        <div className="nav-links">
          <a href="/">Home</a>
          <a href="/form">Student Form</a>
          <a href="/reports">Reports</a>
          <a href="/contact">Contact</a>
        </div>
      </nav>

      <div className="container">
        <h2>Welcome to Care Point™</h2>
        <p>Select an option below:</p>
        <button onClick={() => navigate("/form")}>I am a Student</button>
        <button onClick={() => navigate("/reports")}>Download Reports</button>
      </div>

      <footer className="footer">
        &copy; 2025 Care Point™ | All Rights Reserved | Contact: support@carepoint.com
      </footer>
    </>
  );
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
reportWebVitals();
