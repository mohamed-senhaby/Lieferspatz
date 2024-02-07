/*app.js*/

import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import { dirname } from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.set("view engine", "ejs");

const port = process.env.PORT;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
  })
);
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
      itemPrice REAL NOT NULL, 
      image TEXT,
      category TEXT,
      description TEXT,
      FOREIGN KEY (restaurant_id) REFERENCES users (id)
    );
    
    
`);

    db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER,
      user_id INTEGER,
      item_id INTEGER,
      item_name TEXT,
      quantity INTEGER,
      total_price INTEGER,
      order_status TEXT DEFAULT 'In Progress',
      order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      order_date_date DATE, 
      order_date_time TIME,
      FOREIGN KEY (restaurant_id) REFERENCES users (id),
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (item_id) REFERENCES items (id)
    );
    
`);
  }
});

app.get("/", (req, res) => {
  try {
    res.render("main.ejs");
  } catch (error) {
    console.error("Error retrieving items:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/register", (req, res) => {
  try {
    res.render("register.ejs");
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

        res.redirect("/signin");
      }
    }
  );
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
  try {
    const signedInUser = req.session.user;

    if (!signedInUser) {
      console.error("User not authenticated");
      return res.redirect("/signin");
    }

    const userPlz = signedInUser.PostNumber;

    const minPlz = userPlz - 5;
    const maxPlz = userPlz + 5;

    db.all(
      "SELECT * FROM users WHERE userType = 'restaurantOwner' AND RestaurantPostNumber >= ? AND RestaurantPostNumber <= ?",
      [minPlz, maxPlz],
      (err, restaurants) => {
        if (err) {
          console.error("Error retrieving restaurants from the database:", err);
          res.status(500).send("Internal Server Error");
        } else {
          res.render("restaurants.ejs", { restaurants });
        }
      }
    );
  } catch (error) {
    console.error("Error retrieving restaurants:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/resturant-profile/:id", (req, res) => {
  try {
    const restaurantId = req.params.id;
    const signedInUser = req.session.user;

    if (!signedInUser) {
      console.error("User not authenticated");
      return res.redirect("/signin");
    }

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
          if (!restaurant) {
            res.status(404).send("Restaurant not found");
          } else {
            db.all(
              "SELECT * FROM items WHERE restaurant_id = ?",
              [restaurantId],
              (err, items) => {
                if (err) {
                  console.error(
                    "Error retrieving items from the database:",
                    err
                  );
                  res.status(500).send("Internal Server Error");
                } else {
                  res.render("resturant-profile.ejs", { restaurant, items });
                }
              }
            );
          }
        }
      }
    );
  } catch (error) {
    console.error("Error retrieving restaurant profile:", error);
    res.status(500).send("Internal Server Error");
  }
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
          return res.status(500).send("Internal Server Error");
        }

        db.all(
          `SELECT * FROM orders WHERE restaurant_id = ${signedInUser.id}`,
          (err, orders) => {
            if (err) {
              console.error("Error retrieving orders from the database:", err);
              return res.status(500).send("Internal Server Error");
            }

            res.render("DashboardRest.ejs", {
              restaurantName: signedInRestaurantName,
              items: items,
              orders: orders,
            });
          }
        );
      }
    );
  } catch (error) {
    console.error("Error retrieving items:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.put("/update-order-status/:id", (req, res) => {
  const orderId = req.params.id;
  const newStatus = req.body.newStatus;

  db.run(
    "UPDATE orders SET order_status = ? WHERE id = ?",
    [newStatus, orderId],
    (err) => {
      if (err) {
        console.error("Error updating order status in the database:", err);
        res
          .status(500)
          .json({ success: false, error: "Internal Server Error" });
      } else {
        res.json({ success: true });
      }
    }
  );
});

app.get("/my-order", (req, res) => {
  try {
    const signedInUser = req.session.user;

    if (!signedInUser) {
      console.error("User not authenticated");
      return res.redirect("/signin");
    }

    const userId = signedInUser.id;

    db.all(
      "SELECT * FROM orders WHERE user_id = ?",
      [userId],
      (err, orders) => {
        if (err) {
          console.error("Error retrieving orders from the database:", err);
          return res.status(500).send("Internal Server Error");
        }

        res.render("myOrder.ejs", { orders });
      }
    );
  } catch (error) {
    console.error("Error retrieving orders:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/add-item", (req, res) => {
  const { itemName, itemPrice, image, category, description } = req.body;

  const restaurantOwner = req.session.user;
  const restaurantId = restaurantOwner ? restaurantOwner.id : null;

  if (restaurantId === null) {
    console.error("User ID is undefined in the session");
    return res.status(500).send("Internal Server Error");
  }

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

app.post("/update-item/:id", (req, res) => {
  const itemId = req.params.id;
  const {
    editItemName,
    editItemPrice,
    editImage,
    editCategory,
    editDescription,
  } = req.body;

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

app.all("/delete-menu", (req, res) => {
  const restaurantId = req.session.user ? req.session.user.id : null;

  if (restaurantId === null) {
    console.error("User ID is undefined in the session");
    return res.status(500).send("Internal Server Error");
  }

  if (req.method === "POST") {
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
    res.status(405).send("Method Not Allowed");
  }
});

app.post("/saveCart", (req, res) => {
  const cartItems = req.body.items;
  const userId = req.session.user ? req.session.user.id : null;

  if (!userId) {
    console.error("User not authenticated");
    return res.status(401).send("Unauthorized");
  }

  let counter = 0;

  const processCartItem = () => {
    const item = cartItems[counter];

    if (!item) {
      console.log("Orders placed successfully");
      return res.status(200).json({ message: "Orders placed successfully" });
    }

    const { name, price, count } = item;

    db.get(
      "SELECT restaurant_id, id AS item_id FROM items WHERE itemName = ? AND itemPrice = ?",
      [name, price],
      (err, itemData) => {
        if (err) {
          console.error("Error fetching item details:", err);
          return res.status(500).send("Internal Server Error");
        }

        if (!itemData) {
          console.error("Item not found in the database");
          return res.status(404).send("Item not found");
        }

        const { restaurant_id, item_id } = itemData;
        const total_price = price * count;

        db.run(
          `
          INSERT OR IGNORE INTO orders (restaurant_id, user_id, item_id, item_name, quantity, total_price, order_status, order_date, order_date_date, order_date_time)
          VALUES (?, ?, ?, ?, ?, ?, 'In Progress', CURRENT_TIMESTAMP, DATE(CURRENT_TIMESTAMP), TIME(CURRENT_TIMESTAMP))
          `,
          [restaurant_id, userId, item_id, name, count, total_price],
          (insertErr) => {
            if (insertErr) {
              console.error(
                "Error inserting or ignoring order into the database:",
                insertErr
              );
              return res.status(500).send("Internal Server Error");
            }

            counter++;
            processCartItem();
          }
        );
      }
    );
  };

  processCartItem();
});

app.get("/checkout", (req, res) => {
  try {
    const signedInUser = req.session.user;

    if (!signedInUser) {
      console.error("User not authenticated");
      return res.redirect("/signin");
    }

    const userId = signedInUser.id;

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    db.all(
      `
      SELECT *
      FROM orders o 
      WHERE user_id = ? AND order_date_date = ? AND order_date_time <= ?
      AND NOT EXISTS (
        SELECT 1
        FROM orders
        WHERE user_id = o.user_id AND item_id = o.item_id
          AND order_date_date = ? AND order_date_time > o.order_date_time
      )
      `,
      [userId, now.split(" ")[0], now.split(" ")[1], now.split(" ")[0]],
      (err, orders) => {
        if (err) {
          console.error("Error retrieving user orders from the database:", err);
          return res.status(500).send("Internal Server Error");
        }

        res.render("checkout.ejs", { orders });
      }
    );
  } catch (error) {
    console.error("Error retrieving items:", error);
    res.status(500).send("Internal Server Error");
  }
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

app.get("/orders/:id", (req, res) => {
  const orderID = req.params.id;

  db.run("DELETE FROM orders WHERE id = ?", [orderID], (err) => {
    if (err) {
      console.error("Error deleting user from database:", err);
      res.status(500).send("Internal Server Error");
    } else {
      console.log(`User with ID ${orderID} deleted successfully`);
      res.redirect("/orders");
    }
  });
});

app.get("/orders", (req, res) => {
  db.all("SELECT * FROM orders", (err, rows) => {
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

app.get("/signout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.status(500).send("Internal Server Error");
    } else {
      res.redirect("/");
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
