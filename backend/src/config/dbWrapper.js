// config/dbWrapper.js
import mysql from "mysql2/promise"; // MySQL client
import dotenv from "dotenv"; // Load env variables
dotenv.config();

// Create a MySQL connection pool
const pool = mysql.createPool({
  socketPath: process.env.DB_SOCKET, // Unix socket on macOS
  user: process.env.DB_USER,         // root or your MySQL user
  password: process.env.DB_PASSWORD, // leave empty if root has no password
  database: process.env.DB_NAME,     // ecommerce
  waitForConnections: true,
  connectionLimit: 10,
});

// Test the connection
pool.getConnection()
  .then((conn) => {
    console.log("✅ MySQL Connected Successfully!");
    conn.release();
  })
  .catch((err) => console.error("❌ MySQL Connection Failed:", err.message));

// Wrapper for queries using ? placeholders (MySQL style)
const query = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params);
  return [rows]; // return [rows] to mimic mysql2 behavior
};

// Wrapper for execute (for inserts/updates)
const execute = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return [rows];
};

// Export the DB object
export default {
  query,
  execute,
};
