# Restaurant Management System

This is a web application built with Node.js and Express.js for managing a restaurant business. It includes features for user authentication, registration, restaurant profile management, menu management, and order processing.

## Features

- User authentication: Sign up and sign in functionality for customers and restaurant owners.
- Restaurant profile management: Restaurant owners can create and manage their profiles, including details such as restaurant name, address, contact information, and opening hours.
- Menu management: Restaurant owners can add, update, and delete items from their menu.
- Order processing: Customers can browse the menu, add items to their cart, and place orders. Restaurant owners can view and manage incoming orders.
- Session management: Uses Express session middleware for managing user sessions.

## Setup

1. **Clone the repository:**
   ```
   git clone https://github.com/your-username/restaurant-management-system.git
   ```

2. **Install dependencies:**
   ```
   cd restaurant-management-system
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory and add the following variables:
   ```
   PORT=3000
   SESSION_KEY=your_session_secret_key
   ```

4. **Database setup:**
   - This application uses SQLite database. Ensure you have SQLite installed.
   - The database file (`database.db`) will be created automatically upon running the application.

5. **Run the application:**
   ```
   npm start
   ```

6. **Access the application:**
   Open your web browser and navigate to `http://localhost:3000`.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.
