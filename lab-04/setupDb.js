const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "userData.db");

const setupDatabase = async () => {
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await db.exec(`
      DROP TABLE IF EXISTS user;
      CREATE TABLE user (
        username TEXT UNIQUE,
        name TEXT,
        password TEXT,
        gender TEXT,
        location TEXT
      );
    `);

    const hashedPassword1 = await bcrypt.hash("rahul@2026", 10);
    const hashedPassword2 = await bcrypt.hash("priya@2026", 10);

    const insertUserQuery = `
      INSERT INTO user (username, name, password, gender, location)
      VALUES (?, ?, ?, ?, ?);
    `;

    await db.run(insertUserQuery, [
      "rahul",
      "Rahul Sharma",
      hashedPassword1,
      "male",
      "Hyderabad",
    ]);

    await db.run(insertUserQuery, [
      "priya",
      "Priya Verma",
      hashedPassword2,
      "female",
      "Bengaluru",
    ]);

    console.log("Database initialized and seeded successfully.");
    await db.close();
  } catch (error) {
    console.error(`Database setup failed: ${error.message}`);
    process.exit(1);
  }
};

setupDatabase();
