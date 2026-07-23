const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

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
    const {name, email, password} = req.body;
    if (!name || !email || !password) return res.status(400).json({message: "Name, email and password are required"});
    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) return res.status(409).json({message: "Email is already registered"});
    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await userModel.createUser({
      name,
      email, 
      password_hash,
    });
    const token = createToken(newUser);
    res.status(201).json({token, user: newUser,});

  } catch (error) {
    console.error("Error registering user: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

const loginUser = async (req, res) => {
  try {
    const {email, password} = req.body;
    if (!email || !password) return res.status(400).json({message: "Email and password are required"});
    const user = await userModel.findUserByEmail(email);
    if (!user) return res.status(401).json({message: "Invalid email or password"});
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return res.status(401).json({message: "Invalid email or password"});
    const token = createToken(user);
    res.json({token, user:
      {
        id: user.id, 
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      }
    });
  } catch (error) {
    console.error("Error logging in user: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

module.exports = {
  registerUser, loginUser,
};