const pool = require("../config/db");

const findUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT *
     FROM users 
     WHERE email = $1`,
     [email]
  );
  return result.rows[0];
};

const createUser = async (userData) => {
  const {name, email, password_hash} = userData;
  const result = await pool.query(
    `INSERT INTO users 
      (name, email, password_hash)
     VALUES
      ($1, $2, $3)
    RETURNING id, name, email, avatar_color, created_at`,
    [name, email, password_hash]
  );
  return result.rows[0];
};

const findUserById = async (id) => {
  const result = await pool.query(
    `SELECT id, name, email, avatar_color, created_at
     FROM users 
     WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

const updateUserProfile = async (id, profileData) => {
  const {name, avatar_color} = profileData;
  const result = await pool.query(
    `UPDATE users
     SET name = COALESCE($2, name),
      avatar_color = COALESCE($3, avatar_color)
     WHERE id = $1
     RETURNING id, name, email, avatar_color, created_at`,
    [id, name ?? null, avatar_color ?? null]
  );
  return result.rows[0];
};

module.exports = {
  findUserByEmail, createUser, findUserById, updateUserProfile
};

