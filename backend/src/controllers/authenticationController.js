const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const userModel = require("../models/userModel");
const emailService = require("../services/emailService");

const VERIFICATION_TOKEN_TTL_MS = 30 * 60 * 1000;
const RESEND_RESPONSE = {
  message:
    "If an unverified account exists for that email, a verification email will be sent.",
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const isValidEmail = (email) =>
  typeof email === "string" &&
  email.trim().length > 0 &&
  email.trim().length <= 320 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const createVerificationToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
    expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
  };
};

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
    const verification = createVerificationToken();
    const newUser = await userModel.createUser({
      name: name.trim(),
      email: normalizedEmail,
      password_hash,
      verification_token_hash: verification.tokenHash,
      verification_token_expires_at: verification.expiresAt,
    });

    try {
      await emailService.sendVerificationEmail({
        to: newUser.email,
        name: newUser.name,
        token: verification.token,
      });
    } catch (error) {
      console.error("Error sending verification email: ", error);
      return res.status(503).json({
        code: "VERIFICATION_EMAIL_FAILED",
        message:
          "Account created, but the verification email could not be sent. Wait one minute, then request another email.",
        email: newUser.email,
      });
    }

    res.status(201).json({
      message: "Account created. Check your email to verify your account.",
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
    if (!user.email_verified_at) {
      return res.status(403).json({
        code: "EMAIL_NOT_VERIFIED",
        message: "Verify your email before signing in.",
        email: user.email,
      });
    }
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

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body || {};
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        code: "INVALID_OR_EXPIRED_VERIFICATION_TOKEN",
        message: "This verification link is invalid or has expired.",
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await userModel.verifyUserByTokenHash(tokenHash);
    if (!user) {
      return res.status(400).json({
        code: "INVALID_OR_EXPIRED_VERIFICATION_TOKEN",
        message: "This verification link is invalid or has expired.",
      });
    }

    res.json({ message: "Email verified. You can now sign in." });
  } catch (error) {
    console.error("Error verifying email: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "A valid email is required" });
    }

    const verification = createVerificationToken();
    const user = await userModel.prepareVerificationResend({
      email: normalizeEmail(email),
      verification_token_hash: verification.tokenHash,
      verification_token_expires_at: verification.expiresAt,
    });

    if (user) {
      try {
        await emailService.sendVerificationEmail({
          to: user.email,
          name: user.name,
          token: verification.token,
        });
      } catch (error) {
        console.error("Error resending verification email: ", error);
      }
    }

    res.status(202).json(RESEND_RESPONSE);
  } catch (error) {
    console.error("Error preparing verification email resend: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationEmail,
};
