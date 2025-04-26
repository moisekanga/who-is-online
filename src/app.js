const express = require("express");
const path = require("path");
const app = express();

// Set up EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));

// Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock user data for testing
const users = [
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Smith", email: "jane@example.com" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com" },
    { id: 4, name: "Alice Williams", email: "alice@example.com" },
    { id: 5, name: "Charlie Brown", email: "charlie@example.com" }
];

// Routes
app.get("/", (req, res) => {
    res.render("index", {
        title: "Who Is Online",
        users: users,
        wsPort: process.env.PORT || 3050
    });
});

// API routes
app.get("/api/users", (req, res) => {
    res.json(users);
});

app.get("/api/users/:id", (req, res) => {
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
});

module.exports = app;
