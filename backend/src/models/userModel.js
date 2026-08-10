const pool = require("../config/db");

const findUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT *
     FROM users 
     WHERE LOWER(email) = LOWER($1)`,
     [email]
  );
  return result.rows[0];
};

const createUser = async (userData) => {
  const {
    name,
    email,
    password_hash,
    verification_token_hash,
    verification_token_expires_at,
  } = userData;
  const result = await pool.query(
    `INSERT INTO users 
      (name, email, password_hash, verification_token_hash,
       verification_token_expires_at, verification_email_sent_at,
       verification_send_count, verification_send_window_started_at)
     VALUES
      ($1, $2, $3, $4, $5, NOW(), 1, NOW())
    RETURNING id, name, email, avatar_color, email_verified_at, created_at`,
    [
      name,
      email,
      password_hash,
      verification_token_hash,
      verification_token_expires_at,
    ]
  );
  return result.rows[0];
};

const findUserById = async (id) => {
  const result = await pool.query(
    `SELECT id, name, email, avatar_color, email_verified_at, created_at
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
     RETURNING id, name, email, avatar_color, email_verified_at, created_at`,
    [id, name ?? null, avatar_color ?? null]
  );
  return result.rows[0];
};

const verifyUserByTokenHash = async (tokenHash) => {
  const result = await pool.query(
    `UPDATE users
     SET email_verified_at = NOW(),
       verification_token_hash = NULL,
       verification_token_expires_at = NULL
     WHERE verification_token_hash = $1
       AND verification_token_expires_at > NOW()
       AND email_verified_at IS NULL
     RETURNING id, name, email, avatar_color, email_verified_at, created_at`,
    [tokenHash]
  );
  return result.rows[0];
};

const prepareVerificationResend = async ({
  email,
  verification_token_hash,
  verification_token_expires_at,
}) => {
  const result = await pool.query(
    `UPDATE users
     SET verification_token_hash = $2,
       verification_token_expires_at = $3,
       verification_email_sent_at = NOW(),
       verification_send_count = CASE
         WHEN verification_send_window_started_at IS NULL
           OR verification_send_window_started_at <= NOW() - INTERVAL '24 hours'
         THEN 1
         ELSE verification_send_count + 1
       END,
       verification_send_window_started_at = CASE
         WHEN verification_send_window_started_at IS NULL
           OR verification_send_window_started_at <= NOW() - INTERVAL '24 hours'
         THEN NOW()
         ELSE verification_send_window_started_at
       END
     WHERE LOWER(email) = LOWER($1)
       AND email_verified_at IS NULL
       AND (
         verification_email_sent_at IS NULL
         OR verification_email_sent_at <= NOW() - INTERVAL '60 seconds'
       )
       AND (
         verification_send_window_started_at IS NULL
         OR verification_send_window_started_at <= NOW() - INTERVAL '24 hours'
         OR verification_send_count < 5
       )
     RETURNING id, name, email`,
    [email, verification_token_hash, verification_token_expires_at]
  );
  return result.rows[0];
};

module.exports = {
  findUserByEmail,
  createUser,
  findUserById,
  updateUserProfile,
  verifyUserByTokenHash,
  prepareVerificationResend,
};

