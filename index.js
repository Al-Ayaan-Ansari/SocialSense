import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import pg from "pg";
import crypto from "crypto";
import bcrypt from "bcryptjs";


dotenv.config();

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 7000;
app.use(express.static('public'));

// PostgreSQL Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

function generateUniqueId() {
    return crypto.randomBytes(8).toString('hex'); 
}

app.get("/", async (req, res) => {
    const uniqueId = generateUniqueId();

    const ipAddress = req.ip;

    try {
        await pool.query(
            `INSERT INTO visitor_logs (unique_id, ip_address) VALUES ($1, $2)`,
            [uniqueId, ipAddress]
        );
        console.log('Visitor logged with ID:', uniqueId);
    } catch (err) {
        console.error("Error logging visitor:", err.message);
    }

    res.render("home.ejs");
});

app.get("/analysis", (req, res) => {
    res.render("analysis.ejs");
});

const members = [
    {name: "AL AYAAN ANSARI", role: "Full Stack Developer", img: "/images/ayaan.png"},
    {name: "Mohd Adnan Khan", role: "ML Engineer and Developer", img: "/images/me.png"},
    {name: "Mohd Ashrah", role: "ML Engineer", img: "/images/Ashrah.jpg"},
    {name: "Mohd Danish", role: "Back-end Developer", img: "/images/danish.jpg"},
    {name: "Mohd Anas Ansari", role: "Front-end Developer", img: "/images/anas.jpg"}
];

app.get("/about", (req, res) => {
    res.render("about.ejs", {members});
});

app.get("/investable", (req, res) => {
    res.render("investable.ejs");
});

app.get("/quiz", (req, res) => {
    res.render("quiz.ejs");
});
app.get('/quiz1', (req, res) => {
    res.render('quiz1.ejs');
});
app.get('/quiz2', (req, res) => {
    res.render('quiz2.ejs');
});

app.get("/resources", (req, res) => {
    res.render("resources.ejs");
});

app.get("/contact", async (req, res) => {
    res.render("contact.ejs");
});

app.post("/contact", async (req, res) => {
    const { fName, lName, email, category, message } = req.body;
    console.log(fName, lName, email, category, message);
    
    const clean = str => str?.trim().replace(/\s+/g, ' ') || '';
    const values = [fName, lName, email, category, message].map(clean);

    try {
        await pool.query(
            `INSERT INTO contactus (fName, lName, email, category, message) VALUES ($1, $2, $3, $4, $5)`,
            values
        );
        console.log("Contact Us details added successfully.");
        res.redirect("/contact");
    } catch (err) {
        console.error("Error inserting contact details:", err.message);
        res.status(500).send("Error in database");
    }
});

// get a random tip in resource page
app.get('/api/random-tip', async (req, res) => {
    try {
      const result = await pool.query(`SELECT tip FROM tips ORDER BY RANDOM() LIMIT 1`);
      const randomTip = result.rows[0]?.tip;
  
      if (randomTip) {
        res.json({ tip: randomTip });
      } else {
        res.status(404).json({ error: "No tips found." });
      }
    } catch (error) {
      console.error("Error fetching random tip:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  app.get("/login", (req, res) => {
    res.render("login.ejs");
  });
  
  app.get("/signup", (req, res) => {
    res.render("register.ejs");
  });
  
  // Signup Route
  app.post("/signup", async (req, res) => {
    const { fullName, email, password } = req.body;
    console.log(req.body.email,req.body.fullName,req.body.password);
  
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
  
    try {
      // Check if user already exists
      const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: "User already exists" });
      }
  
      // Insert user into database
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password,salt);
  
      await pool.query("INSERT INTO users (full_name, email, password) VALUES ($1, $2, $3)", [
        fullName,
        email,
        hashedPassword,
      ]);
  
      res.status(201).json({ message: "Signup successful" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/login", async (req, res) => {
    const { email, password } = req.body;
  
    try {
  
      const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  
      if (user.rows.length === 0) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
  
      const storedHashedPassword = user.rows[0].password;
  
      const isMatch = await bcrypt.compare(password, storedHashedPassword);
  
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
  
      res.status(200).json({
        message: "Login successful",
        user: { fullName: user.rows[0].full_name, email: user.rows[0].email },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });
  

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
