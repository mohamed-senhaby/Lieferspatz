import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.set("view engine", "ejs");

const port = process.env.PORT || 3000;

const db = new sqlite3.Database(__dirname + "/database.db", (err) => {
  if (err) {
    console.log("Error opening database:", err.message);
  } else {
    console.log("Successfully connected to SQLite database.");

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userType TEXT NOT NULL,
        FirstName TEXT,
        LastName TEXT,
        Address TEXT,
        PostNumber INTEGER,
        PhoneNumber INTEGER,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        RestaurantName TEXT,
        Category TEXT,
        image TEXT,
        RestaurantAddress TEXT,
        RestaurantPostNumber INTEGER,
        openingTime TEXT,
        closingTime TEXT,
        RestaurantPhoneNumber INTEGER,
        RestaurantEmail TEXT,
        RestaurantPassword TEXT NOT NULL,
        description TEXT
      );
    `);
  }
});

app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(__dirname + "/public"));

// Define your routes
app.get("/", (req, res) => {
  try {
    res.sendFile(__dirname + "/views/main.html");
  } catch (error) {
    console.error("Error retrieving items:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/register", (req, res) => {
  const {
    userType,
    FirstName,
    LastName,
    Address,
    PostNumber,
    PhoneNumber,
    email,
    password,
    RestaurantName,
    Category,
    image,
    RestaurantAddress,
    RestaurantPostNumber,
    openingTime,
    closingTime,
    RestaurantPhoneNumber,
    RestaurantEmail,
    RestaurantPassword,
    description,
  } = req.body;

  // Insert the data into the database
  db.run(
    `
    INSERT INTO users (
      userType,
      FirstName,
      LastName,
      Address,
      PostNumber,
      PhoneNumber,
      email,
      password,
      RestaurantName,
      Category,
      image,
      RestaurantAddress,
      RestaurantPostNumber,
      openingTime,
      closingTime,
      RestaurantPhoneNumber,
      RestaurantEmail,
      RestaurantPassword,
      description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      userType,
      FirstName,
      LastName,
      Address,
      PostNumber,
      PhoneNumber,
      email,
      password,
      RestaurantName,
      Category,
      image,
      RestaurantAddress,
      RestaurantPostNumber,
      openingTime,
      closingTime,
      RestaurantPhoneNumber,
      RestaurantEmail,
      RestaurantPassword,
      description,
    ],
    (err) => {
      if (err) {
        console.error("Error inserting data into database:", err);
        res.status(500).send("Internal Server Error");
      } else {
        console.log(`${userType} Data inserted successfully`);

        if (req.body.userType === "restaurantOwner") {
          res.redirect("/resturant-profile");
        }
      }
    }
  );

  const restaurantName = req.body.RestaurantName;

  res.render("resturant-profile", { restaurantName });
});

app.get("/restaurant-profile", (req, res) => {
  try {
    res.render("/views/resturant-profile.ejs", {
      restaurantName: restaurantName,
    });
  } catch (error) {
    console.error("Error retrieving items:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/register", (req, res) => {
  try {
    res.sendFile(__dirname + "/views/register.html");
  } catch (error) {
    console.error("Error retrieving items:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/Signin", (req, res) => {
  try {
    res.sendFile(__dirname + "/views/signin.html");
  } catch (error) {
    console.error("Error retrieving items:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Add a route to fetch all users
app.get("/users", (req, res) => {
  // Retrieve all users from the "users" table
  db.all("SELECT * FROM users", (err, rows) => {
    if (err) {
      res.status(500).send("Internal Server Error");
    } else {
      res.status(200).json(rows);
    }
  });
});

// Add a route to delete a user by ID
app.get("/users/:id", (req, res) => {
  const userId = req.params.id;

  // Delete the user from the database based on the ID
  db.run("DELETE FROM users WHERE id = ?", [userId], (err) => {
    if (err) {
      console.error("Error deleting user from database:", err);
      res.status(500).send("Internal Server Error");
    } else {
      console.log(`User with ID ${userId} deleted successfully`);
      res.redirect("/users");
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
