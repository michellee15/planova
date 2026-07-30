const userModel = require("../models/userModel");

const getCurrentUser = async (req, res) => {
  try {
    const user = await userModel.findUserById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateCurrentUser = async (req, res) => {
  try {
    const { name, avatar_color } = req.body;
    if (name === undefined && avatar_color === undefined) {
      return res.status(400).json({
        message: "Name or avatar colour is required",
      });
    }

    const normalizedName = typeof name === "string" ? name.trim() : name;
    if (
      name !== undefined &&
      (typeof normalizedName !== "string" ||
        normalizedName.length === 0 ||
        normalizedName.length > 80)
    ) {
      return res.status(400).json({
        message: "Display name must be between 1 and 80 characters",
      });
    }

    const normalizedAvatarColor =
      typeof avatar_color === "string" ? avatar_color.toLowerCase() : avatar_color;
    if (
      avatar_color !== undefined &&
      (typeof normalizedAvatarColor !== "string" ||
        !/^#[0-9a-f]{6}$/.test(normalizedAvatarColor))
    ) {
      return res.status(400).json({
        message: "Avatar colour must be a six-digit hex colour",
      });
    }

    const user = await userModel.updateUserProfile(req.user.id, {
      name: normalizedName,
      avatar_color: normalizedAvatarColor,
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getCurrentUser,
  updateCurrentUser,
};
