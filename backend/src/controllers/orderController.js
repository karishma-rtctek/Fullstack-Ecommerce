import pool from "../config/dbWrapper.js";
import Razorpay from "razorpay";
import crypto from "crypto";

// -------------------------------
// 1) CREATE RAZORPAY ORDER (NEW)
// -------------------------------
export const createRazorpayOrder = async (req, res) => {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { totalAmount } = req.body;

    const options = {
      amount: totalAmount * 100, // Razorpay takes paisa
      currency: "INR",
      receipt: "rcpt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: totalAmount,
      currency: "INR",
    });
  } catch (err) {
    console.error("Razorpay Order Error:", err);
    res.status(500).json({ message: "Payment order creation failed" });
  }
};

// -------------------------------
// 2) VERIFY PAYMENT (OPTIONAL)
// -------------------------------
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSign === razorpay_signature) {
      return res.json({ success: true });
    }

    res.status(400).json({ success: false });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Payment verification error" });
  }
};



// ------------------------------------------------------------------
// 3) YOUR EXISTING ORDER CODE (UNCHANGED)
// ------------------------------------------------------------------

// CREATE ORDER
export const placeOrder = async (req, res) => {
  const { cartItems, totalAmount } = req.body;
  const userId = req.user.id;

  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    const [orderResult] = await connection.query(
      "INSERT INTO orders (user_id, total) VALUES (?, ?)",
      [userId, totalAmount]
    );

    const orderId = orderResult.insertId;

    for (let item of cartItems) {
      await connection.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
        [orderId, item.id, item.quantity, item.price]
      );
    }

    await connection.commit();
    connection.release();
    res.json({ message: "Order placed", orderId });
  } catch (err) {
    console.error("Order Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};


// GET USER ORDERS
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const [orders] = await pool.query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC",
      [userId]
    );

    res.json(orders);
  } catch (err) {
    console.error("Get User Orders Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};


// GET ORDER DETAILS
export const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;

    const [orderRows] = await pool.query(
      "SELECT * FROM orders WHERE id = ?",
      [orderId]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderRows[0];

    const itemsQuery = `
      SELECT 
        oi.*, 
        p.name AS product_name, 
        p.image AS product_image
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `;

    const [items] = await pool.query(itemsQuery, [orderId]);

    res.json({ order, items });
  } catch (err) {
    console.error("Order Detail Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
