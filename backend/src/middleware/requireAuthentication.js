const jwt = require("jsonwebtoken");

const requireAuth = (req, res, next) => {
  try {
    const authenticationHeader = req.headers.authorization;
    if (!authenticationHeader || !authenticationHeader.startsWith("Bearer ")) {
      return res.status(401).json({message: "Authorisation token required"})
    }
    const token = authenticationHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };
    next();
  } catch (error) {
    console.error("Authentication error: ", error);
    res.status(401).json({message: "Invalid or expired token"});
  }
};

module.exports = requireAuth;