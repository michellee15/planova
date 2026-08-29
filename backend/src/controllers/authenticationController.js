const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

const normalizeEmail = (email) => email.trim().toLowerCase();

const isValidEmail = (email) =>
  typeof email === "string" &&
  email.trim().length > 0 &&
  email.trim().length <= 320 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const createToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const registerUser = async (req, res) => {
  try {
    const {name, email, password} = req.body || {};
    if (
      typeof name !== "string" ||
      name.trim().length === 0 ||
      typeof password !== "string" ||
      password.length === 0 ||
      !isValidEmail(email)
    ) {
      return res
        .status(400)
        .json({message: "A valid name, email and password are required"});
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await userModel.findUserByEmail(normalizedEmail);
    if (existingUser) return res.status(409).json({message: "Email is already registered"});
    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await userModel.createUser({
      name: name.trim(),
      email: normalizedEmail,
      password_hash,
    });

    res.status(201).json({
      message: "Account created. You can now sign in.",
      user: newUser,
    });

  } catch (error) {
    console.error("Error registering user: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

const loginUser = async (req, res) => {
  try {
    const {email, password} = req.body || {};
    if (!isValidEmail(email) || typeof password !== "string" || !password) {
      return res.status(400).json({message: "Email and password are required"});
    }
    const user = await userModel.findUserByEmail(normalizeEmail(email));
    if (!user) return res.status(401).json({message: "Invalid email or password"});
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return res.status(401).json({message: "Invalid email or password"});
    const token = createToken(user);
    res.json({token, user:
      {
        id: user.id, 
        name: user.name,
        email: user.email,
        avatar_color: user.avatar_color,
        created_at: user.created_at,
      }
    });
  } catch (error) {
    console.error("Error logging in user: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

module.exports = {
  registerUser,
  loginUser,
};
