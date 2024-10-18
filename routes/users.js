const express = require("express");
const isAuthenticated = require("../middlewares/auth");
const User = require("../models/user");
const { z } = require("zod");

const router = express.Router();

/**
 * User registration API route
 */

const registrationSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(3, "Password must be at least 3 characters long"),
});

router.post("/register", async (req, res) => {
  try {
    const result = registrationSchema.safeParse(req.body);

    if (result.success) {
      const { username, email, password } = result.data;

      // check in DB
      const existingUser = await User.findOne({
        $or: [{ email: email }, { username: username }],
      });

      // user already exist
      if (existingUser) {
        return res.status(400).json({ message: "user already exist!" });
      }

      // create user
      const newUser = new User({ username, email, password });
      // actually save to DB
      await newUser.save();

      res.status(201).json({ message: "user registered successfully!" });
    } else {
      return res.status(400).json({ errors: result.error.errors });
    }
  } catch (err) {
    console.error("Error: API /register: \n", JSON.stringify(err));
    res.status(500).json({ error: err?.message });
  }
});

/**
 * User login API route
 */

// Login schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string(),
});

// Login route
router.post("/login", async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ errors: result.error.errors });
    }

    const { email, password } = result.data;

    // Find user in database
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }
    // Set user session
    req.session.userId = user._id; // Store the user's ID in the session

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res
          .status(500)
          .json({ message: "Error logging in because of session" });
      }
      res.status(200).json({ message: "Logged in successfully" });
    });
  } catch (err) {
    console.error("Error in /login route:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Logout route
router.post("/logout", (req, res) => {
  // Check if the user is logged in
  if (req.session && req.session.userId) {
    // Destroy the session for the current user
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }

      // Clear the session cookie
      res.clearCookie("megamart.sid", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      return res.json({ message: "Logged out successfully" });
    });
  } else {
    return res.status(400).json({ message: "No active session" });
  }
});

/**
 * User profile API route
 */
router.get("/profile", isAuthenticated, async (req, res) => {
  try {
    // Set cache control headers to prevent caching
    res.set("Cache-Control", "no-store");

    // Fetch the user data from the database using the userId from the session
    const user = await User.findById(req.session.userId).select("-password"); // Exclude password from the response

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the user data
    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
