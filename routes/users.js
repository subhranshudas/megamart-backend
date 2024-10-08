const express = require("express");

const User = require("../models/user");
const bcrypt = require("bcrypt");
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

module.exports = router;
