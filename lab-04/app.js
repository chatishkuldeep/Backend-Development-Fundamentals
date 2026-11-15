const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.post("/register/", async (request, response) => {
  try {
    const { username, name, password, gender, location } = request.body;

    if (!username || !password) {
      return response.status(400).json({ message: "Invalid user details" });
    }

    const selectUserQuery = `SELECT * FROM user WHERE username = ?;`;
    const dbUser = await db.get(selectUserQuery, [username]);

    if (dbUser !== undefined) {
      return response.status(400).json({ message: "User already exists" });
    }

    if (password.length < 5) {
      return response.status(400).json({ message: "Password is too short" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createUserQuery = `
      INSERT INTO user (username, name, password, gender, location)
      VALUES (?, ?, ?, ?, ?);
    `;
    await db.run(createUserQuery, [
      username,
      name || "",
      hashedPassword,
      gender || "",
      location || "",
    ]);

    response.status(200).json({ message: "User created successfully" });
  } catch (error) {
    response.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/login/", async (request, response) => {
  try {
    const { username, password } = request.body;

    if (!username || !password) {
      return response.status(400).json({ message: "Invalid user details" });
    }

    const selectUserQuery = `SELECT * FROM user WHERE username = ?;`;
    const dbUser = await db.get(selectUserQuery, [username]);

    if (dbUser === undefined) {
      return response.status(400).json({ message: "Invalid user" });
    }

    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);

    if (isPasswordMatched === true) {
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.status(200).json({ jwt_token: jwtToken });
    } else {
      response.status(400).json({ message: "Invalid password" });
    }
  } catch (error) {
    response.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/users/", async (request, response) => {
  try {
    const getUsersQuery = `SELECT username, name, gender, location FROM user;`;
    const users = await db.all(getUsersQuery);
    response.status(200).json(users);
  } catch (error) {
    response.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = app;
