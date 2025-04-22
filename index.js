import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import pg from "pg";
import crypto from "crypto";

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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
