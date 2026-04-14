const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/ChatAppUser.js");
const router = express.Router();

require("dotenv").config();

const jwtSecret = process.env.JWT_SECRET;

router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(400)
        .json({ Message: "User already exists. Continue with Log In" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ username: username, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, jwtSecret, {
      expiresIn: "24h",
    });
    res.status(201).json({ token, username });
  } catch (error) {
    res.status(500).json({ Message: "Server Error", Error: error });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const checkUser = await User.findOne({ username });
    if (!checkUser) {
      return res.status(404).json({ Error: "User not found" });
    }

    const doesPasswordMatch = await checkUser.compare(password);
    if (!doesPasswordMatch) {
      return res.status(400).json({ Message: "Invalid Password" });
    }

    return res.status(200).json({ Message: "Login successful" });
  } catch (error) {
    return res.status(500).json({ Message: "Unable to login", Error: error });
  }
});

module.exports = router;
