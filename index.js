import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import pg from "pg";

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

app.get("/", (req, res) => {
    res.render("home.ejs");
});

app.get("/analysis", (req, res) => {
    res.render("analysis.ejs");
});

const members = [{name:"AL AYAAN ANSARI", role:"Full Stack Developer",img:"/images/logoSocialSense.png"},
    {name:"Mohd Adnan Khan", role:"ML Engineer",img:"/images/logoSocialSense.png"},
    {name:"Mohd Ashrah", role:"ML Engineer",img:"/images/logoSocialSense.png"},
    {name:"Mohd Danish", role:"Back-end Developer",img:"/images/logoSocialSense.png"},
    {name:"Mohd Anas Ansari", role:"Front-end Developer",img:"/images/logoSocialSense.png"}];
app.get("/about", (req, res) => {
    res.render("about.ejs",{members}) ;
});


app.get("/investable", (req, res) => {
    res.render("investable.ejs");
});


app.get("/kids", (req, res) => {
    res.render("kids.ejs");
});




app.get("/resources", (req, res) => {
    res.render("resources.ejs");
});
  
app.get("/contact", async (req, res) => {
    res.render("contact.ejs");
});

app.post("/contact", async (req,res)=>{
    const {fName,lName,email,category,message} = req.body;
    console.log(fName,lName,email,category,message);
    const clean = str => str?.trim().replace(/\s+/g, ' ') || '';
    const values = [fName, lName, email, category, message].map(clean);
    try {
        await pool.query(
          `INSERT INTO contactus (fName, lName, email, category, message) VALUES ($1, $2, $3, $4, $5)`,
          values
        );
        console.log("contact Us detail added succssfully");
        res.redirect("/contact");
    }
    catch(err){
        console.error("Error:", err.message);
        res.status(500).send("error in database");
    }
})

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  