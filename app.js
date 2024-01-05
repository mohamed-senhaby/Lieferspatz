/*app.js*/

import express from "express";
import bodyParser from "body-parser";
import session from "express-session"; // Add session middleware
import { dirname } from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.set("view engine", "ejs");

const port = process.env.PORT;

app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);
// Serve static files from the 'public' directory
app.use(express.static(__dirname + "/public"));

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

    db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER,
      itemName TEXT NOT NULL,
      itemPrice INTEGER NOT NULL,
      image TEXT,
      category TEXT,
      description TEXT,
      FOREIGN KEY (restaurant_id) REFERENCES users (id)
    );
    
`);
  }
});

// Define your routes
app.get("/", (req, res) => {
  try {
    res.render("main.ejs");
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
          res.redirect("/DashboardRest");
        } else {
          res.redirect("/restaurants");
        }
      }
    }
  );
});

app.get("/resturant-profile/:id", (req, res) => {
  const restaurantId = req.params.id;

  // Fetch restaurant data
  db.get(
    "SELECT * FROM users WHERE id = ?",
    [restaurantId],
    (err, restaurant) => {
      if (err) {
        console.error(
          "Error retrieving restaurant data from the database:",
          err
        );
        res.status(500).send("Internal Server Error");
      } else {
        // Check if restaurant data is found
        if (!restaurant) {
          res.status(404).send("Restaurant not found");
        } else {
          // Fetch items associated with the restaurant
          db.all(
            "SELECT * FROM items WHERE restaurant_id = ?",
            [restaurantId],
            (err, items) => {
              if (err) {
                console.error("Error retrieving items from the database:", err);
                res.status(500).send("Internal Server Error");
              } else {
                // Render the template and pass the restaurant and items data
                res.render("resturant-profile.ejs", { restaurant, items });
              }
            }
          );
        }
      }
    }
  );
});

app.get("/register", (req, res) => {
  try {
    res.render("register.ejs");
  } catch (error) {
    console.error("Error retrieving items:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/signin", (req, res) => {
  try {
    res.render("signin.ejs");
  } catch (error) {
    console.error("Error retrieving items:", error);
    res.status(500).send("Internal Server Error");
  }
});

const handleSignIn = (req, res, userType, emailColumn, passwordColumn) => {
  const { email, password } = req.body;

  db.get(
    `SELECT * FROM users WHERE ${emailColumn} = ? AND ${passwordColumn} = ?`,
    [email, password],
    (err, row) => {
      if (err) {
        console.error("Error checking user data in the database:", err);
        return res.status(500).send("Internal Server Error");
      }

      if (row) {
        req.session.user = row;
        redirectToProfile(res, userType, row);
      } else {
        console.log("User not found");
        res.status(401).send("Invalid email or password");
      }
    }
  );
};

const redirectToProfile = (res, userType, userData) => {
  if (userType === "customer") {
    res.redirect(`/restaurants`);
  } else {
    res.redirect(`/DashboardRest`);
  }
};

app.post("/signin", (req, res) => {
  const user = req.body.userType;

  if (user === "customer") {
    handleSignIn(req, res, user, "email", "password");
  } else {
    handleSignIn(req, res, user, "RestaurantEmail", "RestaurantPassword");
  }
});

app.get("/restaurants", (req, res) => {
  db.all(
    "SELECT * FROM users WHERE userType = 'restaurantOwner'",
    (err, restaurants) => {
      if (err) {
        console.error("Error retrieving restaurants from the database:", err);
        res.status(500).send("Internal Server Error");
      } else {
        res.render("restaurants.ejs", { restaurants });
      }
    }
  );
});

app.get("/DashboardRest", (req, res) => {
  try {
    const signedInUser = req.session.user;

    if (!signedInUser) {
      console.error("User not authenticated");
      return res.redirect("/signin");
    }

    const signedInRestaurantName = signedInUser.RestaurantName;

    db.all(
      `SELECT * FROM items WHERE restaurant_id = ${signedInUser.id}`,
      (err, items) => {
        if (err) {
          console.error("Error retrieving items from the database:", err);
          res.status(500).send("Internal Server Error");
        } else {
          // Render the view with both restaurant name and items
          res.render("DashboardRest.ejs", {
            restaurantName: signedInRestaurantName,
            items: items,
          });
        }
      }
    );
  } catch (error) {
    console.error("Error retrieving items:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/add-item", (req, res) => {
  const { itemName, itemPrice, image, category, description } = req.body;

  console.log(req.session.user);

  // Retrieve the restaurant owner's information from the session
  const restaurantOwner = req.session.user;
  const restaurantId = restaurantOwner ? restaurantOwner.id : null;

  if (restaurantId === null) {
    console.error("User ID is undefined in the session");
    return res.status(500).send("Internal Server Error");
  }

  // Insert the item data into the database
  db.run(
    `
    INSERT INTO items (restaurant_id, itemName, itemPrice, image, category, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
    [restaurantId, itemName, itemPrice, image, category, description],
    (err) => {
      if (err) {
        console.error("Error inserting item data into database:", err);
        res.status(500).send("Internal Server Error");
      } else {
        console.log("Item Data inserted successfully");
        res.redirect("/DashboardRest");
      }
    }
  );
});

app.get("/users", (req, res) => {
  db.all("SELECT * FROM users", (err, rows) => {
    if (err) {
      res.status(500).send("Internal Server Error");
    } else {
      res.status(200).json(rows);
    }
  });
});

app.get("/items", (req, res) => {
  db.all("SELECT * FROM items", (err, rows) => {
    if (err) {
      res.status(500).send("Internal Server Error");
    } else {
      res.status(200).json(rows);
    }
  });
});

app.get("/users/:id", (req, res) => {
  const userId = req.params.id;

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

// Add route to handle updating items
app.post("/update-item/:id", (req, res) => {
  const itemId = req.params.id;
  const {
    editItemName,
    editItemPrice,
    editImage,
    editCategory,
    editDescription,
  } = req.body;

  // Update the item in the database
  db.run(
    `
    UPDATE items
    SET itemName = ?, itemPrice = ?, image = ?, category = ?, description = ?
    WHERE id = ?
  `,
    [
      editItemName,
      editItemPrice,
      editImage,
      editCategory,
      editDescription,
      itemId,
    ],
    (err) => {
      if (err) {
        console.error("Error updating item in the database:", err);
        res.status(500).send("Internal Server Error");
      } else {
        console.log(`Item with ID ${itemId} updated successfully`);
        res.redirect("/DashboardRest");
      }
    }
  );
});

app.delete("/delete-item/:id", (req, res) => {
  const itemId = req.params.id;
  db.run("DELETE FROM items WHERE id = ?", [itemId], (err) => {
    if (err) {
      console.error("Error deleting item from database:", err);
      res.json({ success: false, error: "Internal Server Error" });
    } else {
      console.log(`Item with ID ${itemId} deleted successfully`);

      res.json({ success: true });
    }
  });
});

// Change the route to handle both GET and POST requests
app.all("/delete-menu", (req, res) => {
  const restaurantId = req.session.user ? req.session.user.id : null;

  if (restaurantId === null) {
    console.error("User ID is undefined in the session");
    return res.status(500).send("Internal Server Error");
  }

  if (req.method === "POST") {
    // Delete all items associated with the restaurant
    db.run(
      "DELETE FROM items WHERE restaurant_id = ?",
      [restaurantId],
      (err) => {
        if (err) {
          console.error("Error deleting items from the database:", err);
          res.status(500).send("Internal Server Error");
        } else {
          console.log("All items deleted successfully");
          res.redirect("/DashboardRest");
        }
      }
    );
  } else {
    // Handle GET request (if needed)
    // You can render a page or provide some information for GET requests
    res.status(405).send("Method Not Allowed");
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
