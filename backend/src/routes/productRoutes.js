import express from "express";
import pool from "../config/dbWrapper.js";

const router = express.Router();

// Helper to convert undefined to null
const safeValue = (v) => (v === undefined ? null : v);

/* =============================
    GET ALL PRODUCTS (WITH PAGINATION)
============================= */
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const offset = (page - 1) * limit;

    const [products] = await pool.query(
      "SELECT * FROM products LIMIT ? OFFSET ?",
      [limit, offset]
    );

    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) as total FROM products"
    );

    res.json({
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});

/* =============================
    GET PRODUCT BY ID
============================= */
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM products WHERE id = ?", [
      req.params.id,
    ]);

    if (rows.length === 0)
      return res.status(404).json({ message: "Not Found" });

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* =============================
    CREATE PRODUCT
============================= */
router.post("/", async (req, res) => {
  const { name, price, description, image } = req.body; // <-- frontend sends 'name'
  const title = name; // map 'name' → 'title'

  try {
    const [result] = await pool.execute(
      "INSERT INTO products (title, price, description, image) VALUES (?, ?, ?, ?)",
      [title ?? null, price ?? null, description ?? null, image ?? null]
    );

    res.json({ id: result.insertId, title, price, description, image });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =============================
    UPDATE PRODUCT
============================= */
router.put("/:id", async (req, res) => {
  const { title, price, description, image } = req.body;

  try {
    const [result] = await pool.execute(
      `UPDATE products 
       SET title = ?, price = ?, description = ?, image = ? 
       WHERE id = ?`,
      [
        safeValue(title),
        safeValue(price),
        safeValue(description),
        safeValue(image),
        req.params.id,
      ]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Product Not Found" });

    res.json({ message: "Updated successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* =============================
    DELETE PRODUCT
============================= */
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.execute("DELETE FROM products WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Product Not Found" });

    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
