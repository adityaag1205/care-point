// ===== Dependencies =====

const express = require("express");
const fs = require("fs");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const { Document, Packer, Paragraph, TextRun } = require("docx");
const nodemailer = require("nodemailer");
const JWT = "b72e0857b00ba31f7ed68be4e607f9f5e66844942db6a99e4444f2c53528b27d";
const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ===== Database Connection =====
const db = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "2119_Monster",
  database: "CarePoint",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed: " + err.stack);
    return;
  }
  console.log("✅ Connected to MySQL database");
});
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "aditya.agarwal2023a@vitstudent.ac.in",
    pass: "hzmc pxiu wgyj azhb",
  },
});
const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log("Auth Header:", authHeader);

  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT);
    console.log("Decoded token:", decoded);
    req.admin = decoded;
    next();
  } catch (err) {
    console.error("JWT Error:", err.message);
    return res.status(403).json({ error: "Invalid token" });
  }
};
const verifyStudentToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT);
    req.student = decoded; // include name and regNo in JWT payload
    next();
  } catch (err) {
    console.error("JWT verification error:", err.message);
    return res.status(403).json({ error: "Invalid token" });
  }
};




// ===== JWT Secret Key =====


// ===== Student Signup =====
app.post("/student/signup", async (req, res) => {
  const { name, regNo, phone, email, password } = req.body;
  if (!name || !regNo || !phone || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
      "INSERT INTO Users (name, regNo, phone, email, password) VALUES (?, ?, ?, ?, ?)",
      [name, regNo, phone, email, hashedPassword],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Database error" });
        }
        res.status(201).json({ message: "Student registered successfully" });
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== Student Login =====
app.post("/student/login", (req, res) => {
  const { id: regNo, password } = req.body;
  if (!regNo || !password) return res.status(400).json({ error: "All fields are required" });

  db.query("SELECT * FROM users WHERE regNo = ?", [regNo], async (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ regNo: user.regNo, name: user.name, role: "student" }, JWT, { expiresIn: "2h" });

    res.json({
      message: "Login successful",
      user: {
        regNo: user.regNo,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      token
    });
  });
});


// ===== Admin Signup =====
// Admin Signup
app.post("/admin/signup", async (req, res) => {
  const { name, email, password, role, department } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Name, email, password and role are required" });
  }

  // Validate role
  const validRoles = ["SuperAdmin", "MaintenanceStaff"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  // Validate department
  const validDepartments = ["Electrical", "Plumbing", "Laundry", "Internet", "Other", "General"];
  const dept = department && validDepartments.includes(department) ? department : "General";

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO admin (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashedPassword, role, dept],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ error: "Email already registered" });
          }
          console.error(err);
          return res.status(500).json({ error: "Database error" });
        }
        res.status(201).json({ message: "Admin registered successfully" });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ===== Admin Login =====
app.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  db.query("SELECT * FROM admin WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const admin = results[0];
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role, department: admin.department },
      JWT,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Admin login successful",
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        department: admin.department,
      },
      token,
    });
  });
});




// ===== File Upload (Proof) =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
  },
});
const upload = multer({ storage });

// ===== Submit Maintenance Request =====
// Middleware to verify student JWT

// Submit maintenance request
app.post("/submit-request", verifyStudentToken, upload.single("proof"), (req, res) => {
  const { block, roomNo, workType, comments } = req.body;
  const regNo = req.student.regNo; // From token
  const name = req.student.name; // From token
  const proof = req.file ? req.file.path : null;

  const sql =
    "INSERT INTO maintenance_requests (regNo, name, block, roomNo, workType, comments, proof, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";

  const values = [regNo, name, block, roomNo, workType, comments, proof];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // Find admin for this workType
    db.query(
      "SELECT email FROM admin WHERE department = ? AND is_active = TRUE LIMIT 1",
      [workType],
      (err, adminResult) => {
        if (err || adminResult.length === 0) {
          console.error("Admin not found for work type:", workType);
          return res.json({ message: "Request submitted successfully, but no admin email found." });
        }

        const adminEmail = adminResult[0].email;

        const mailOptions = {
          from: "youradminemail@gmail.com",
          to: adminEmail,
          subject: `New ${workType} Request from ${name}`,
          html: `
                        <h3>New Maintenance Request Submitted</h3>
                        <p><strong>Student Name:</strong> ${name}</p>
                        <p><strong>Reg No:</strong> ${regNo}</p>
                        <p><strong>Block:</strong> ${block}</p>
                        <p><strong>Room No:</strong> ${roomNo}</p>
                        <p><strong>Work Type:</strong> ${workType}</p>
                        <p><strong>Comments:</strong> ${comments}</p>
                        <p><strong>Proof File:</strong> ${req.file ? req.file.filename : "None"}</p>
                        <hr>
                        <p>Check the CarePoint dashboard for details.</p>
                    `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Email Error:", error);
            return res.status(500).json({ message: "Request saved, but email failed to send." });
          } else {
            console.log("Email sent to:", adminEmail);
            res.json({ message: `Request submitted successfully, email sent to ${adminEmail}` });
          }
        });
      }
    );
  });
});



// ===== Fetch Student Requests =====
app.get("/student/reports/:regNo", verifyStudentToken, (req, res) => {
  const { regNo } = req.params;

  const sql = `
    SELECT 
      mr.id, 
      mr.regNo, 
      mr.name, 
      mr.block, 
      mr.roomNo, 
      mr.workType, 
      mr.comments, 
      mr.proof, 
      DATE_FORMAT(mr.submitted_at, '%e %b %Y, %l:%i %p') AS submitted_at,
      mr.status,
      COALESCE(f.rating, 0) AS rating
    FROM maintenance_requests mr
    LEFT JOIN feedback f 
      ON mr.id = f.request_id AND f.student_id = ?
    WHERE mr.regNo = ?
    ORDER BY mr.submitted_at DESC
  `;

  db.query(sql, [regNo, regNo], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    if (results.length === 0) {
      return res.json({ message: "You have not submitted any requests yet.", requests: [] });
    }

    res.json({ requests: results });
  });
});


// Get reports for admin department
app.get("/admin/reports/:department", (req, res) => {
  const { department } = req.params;

  if (!department) {
    return res.status(400).json({ error: "Department is required" });
  }

  const sql = "SELECT * FROM maintenance_requests WHERE workType = ?";
  db.query(sql, [department], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.json({ message: "No reports found for your department", reports: [] });
    }

    res.json({ reports: results });
  });
});
// ✅ Update request status
app.put("/admin/updateStatus/:id", verifyAdminToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["pending", "resolved"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  const sql = "UPDATE maintenance_requests SET status = ? WHERE id = ?";
  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.json({ message: `Status updated to ${status}` });
  });
});

app.get("/admin/reports", verifyAdminToken, (req, res) => {
  const { role, department } = req.admin;

  let sql;
  let params = [];

  if (role === "SuperAdmin") {
    sql = `
    SELECT 
      mr.id, mr.regNo, mr.name, mr.block, mr.roomNo, 
      mr.workType, mr.comments, mr.proof, 
      DATE_FORMAT(mr.submitted_at, '%e %b %Y, %l:%i %p') AS date,
      mr.status,
      f.rating
    FROM maintenance_requests mr
    LEFT JOIN feedback f ON mr.id = f.request_id
    ORDER BY mr.submitted_at DESC
  `;
  } else {
    sql = `
    SELECT 
      mr.id, mr.regNo, mr.name, mr.block, mr.roomNo, 
      mr.workType, mr.comments, mr.proof, 
      DATE_FORMAT(mr.submitted_at, '%e %b %Y, %l:%i %p') AS date,
      mr.status,
      f.rating
    FROM maintenance_requests mr
    LEFT JOIN feedback f ON mr.id = f.request_id
    WHERE mr.workType = ?
    ORDER BY mr.submitted_at DESC
  `;
    params = [department];
  }



  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ reports: results });
  });
});


// ===== Update Request Status (Admin or Student) =====
app.post("/admin/download/:format", verifyAdminToken, async (req, res) => {
  const { format } = req.params;
  const { reports } = req.body;

  if (!reports || reports.length === 0) {
    return res.status(400).json({ error: "No reports to download" });
  }

  console.log("🔹 Download format:", format);
  console.log("🔹 Reports received:", reports.length);

  try {
    // ===== PDF DOWNLOAD =====
    if (format === "pdf") {
      const PDFDocument = require("pdfkit");
      const doc = new PDFDocument();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="department_report.pdf"'
      );
      doc.pipe(res);

      doc.fontSize(18).text("Department Report", { align: "center" });
      doc.moveDown();

      reports.forEach((r, i) => {
        const formattedDate = r.date ? new Date(r.date).toLocaleString() : "N/A";
        const ratingDisplay = r.rating ? `${r.rating} / 5` : "No rating";

        doc.fontSize(12).text(`Report #${i + 1}`, { underline: true });
        doc.text(`Reg No: ${r.regNo}`);
        doc.text(`Name: ${r.name}`);
        doc.text(`Block: ${r.block}`);
        doc.text(`Room No: ${r.roomNo}`);
        doc.text(`Work Type: ${r.workType}`);
        doc.text(`Comments: ${r.comments || "N/A"}`);
        doc.text(`Status: ${r.status || "pending"}`);
        doc.text(`Date: ${formattedDate}`);
        doc.text(`Proof: ${r.proof ? r.proof : "No proof uploaded"}`);
        doc.text(`Feedback (Rating): ${ratingDisplay}`);
        doc.moveDown();
      });

      doc.end();
    }

    // ===== EXCEL DOWNLOAD =====
    else if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Department Reports");

      // Define headers
      sheet.columns = [
        { header: "Reg No", key: "regNo", width: 15 },
        { header: "Name", key: "name", width: 20 },
        { header: "Block", key: "block", width: 10 },
        { header: "Room No", key: "roomNo", width: 10 },
        { header: "Work Type", key: "workType", width: 15 },
        { header: "Comments", key: "comments", width: 25 },
        { header: "Status", key: "status", width: 12 },
        { header: "Date", key: "date", width: 20 },
        { header: "Proof", key: "proof", width: 40 },
        { header: "Feedback (Rating)", key: "rating", width: 18 },
      ];

      // Add rows
      reports.forEach((r) => {
        sheet.addRow({
          regNo: r.regNo,
          name: r.name,
          block: r.block,
          roomNo: r.roomNo,
          workType: r.workType,
          comments: r.comments || "N/A",
          status: r.status || "pending",
          date: r.date ? new Date(r.date).toLocaleString() : "N/A",
          proof: r.proof ? `http://localhost:5000/${r.proof}` : "No proof",
          rating: r.rating ? `${r.rating} / 5` : "No rating",
        });
      });

      // ✅ Make Proof URLs clickable (fixed version)
      const proofColIndex = sheet.columns.findIndex(c => c.key === "proof") + 1;
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          const proofCell = row.getCell(proofColIndex);
          const proofUrl = proofCell.value;
          if (proofUrl && typeof proofUrl === "string" && proofUrl.startsWith("http")) {
            proofCell.value = { text: "View Proof", hyperlink: proofUrl };
            proofCell.font = { color: { argb: "FF0000FF" }, underline: true };
          }
        }
      });

      // Write to buffer and send
      const buffer = await workbook.xlsx.writeBuffer();

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="department_report.xlsx"'
      );

      res.end(Buffer.from(buffer));
    }
    // ===== WORD DOWNLOAD =====
    else if (format === "docx") {
      const { Document, Packer, Paragraph, TextRun } = require("docx");

      const doc = new Document({
        sections: [
          {
            children: reports.map((r, i) => {
              const formattedDate = r.date
                ? new Date(r.date).toLocaleString()
                : "N/A";
              const ratingDisplay = r.rating ? `${r.rating} / 5` : "No rating";

              return new Paragraph({
                children: [
                  new TextRun({ text: `Report #${i + 1}\n`, bold: true }),
                  new TextRun(`Reg No: ${r.regNo}\n`),
                  new TextRun(`Name: ${r.name}\n`),
                  new TextRun(`Block: ${r.block}\n`),
                  new TextRun(`Room No: ${r.roomNo}\n`),
                  new TextRun(`Work Type: ${r.workType}\n`),
                  new TextRun(`Comments: ${r.comments || "N/A"}\n`),
                  new TextRun(`Status: ${r.status || "pending"}\n`),
                  new TextRun(`Date: ${formattedDate}\n`),
                  new TextRun(`Proof: ${r.proof ? r.proof : "No proof uploaded"}\n`),
                  new TextRun(`Feedback (Rating): ${ratingDisplay}\n\n`),
                ],
              });
            }),
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="department_report.docx"'
      );
      res.send(buffer);
    }

    // ===== INVALID FORMAT =====
    else {
      res.status(400).json({ error: "Invalid format" });
    }
  } catch (err) {
    console.error("Download Error:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});



app.post("/student/feedback", verifyStudentToken, (req, res) => {
  const { requestId, rating } = req.body;
  const studentId = req.student.regNo; // From token

  if (!requestId || rating === undefined) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = `
    INSERT INTO feedback (request_id, student_id, rating)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE rating = VALUES(rating), created_at = NOW()
  `;

  db.query(sql, [requestId, studentId, rating], (err) => {
    if (err) {
      console.error("Feedback Error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Feedback saved successfully!" });
  });
});

// ✅ Allow student to update their complaint status
app.put("/student/updateStatus/:id", verifyStudentToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const student = req.student; // extracted from token (contains regNo)

  // Validate input
  if (!status || !["pending", "resolved"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  // Update only if the request belongs to the logged-in student
  const sql = `
    UPDATE maintenance_requests
    SET status = ?
    WHERE id = ? AND regNo = ?
  `;

  db.query(sql, [status, id, student.regNo], (err, result) => {
    if (err) {
      console.error("Error updating status:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res
        .status(403)
        .json({ error: "Unauthorized or request not found" });
    }

    res.json({ message: "Status updated successfully" });
  });
});




// ===== Report APIs (existing ones stay same) =====
// ... (keep your /get-reports, /download/pdf, /download/xlsx, /download/docx routes unchanged)


// ===== Start Server =====
app.listen(5000, () => console.log("🚀 Server running on port 5000"))
