const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const requestsByUser = new Map();

const removeExpiredEntries = (now) => {
  if (requestsByUser.size < 1000) return;
  for (const [userId, entry] of requestsByUser.entries()) {
    if (now - entry.windowStartedAt >= WINDOW_MS) {
      requestsByUser.delete(userId);
    }
  }
};

const chatRateLimit = (req, res, next) => {
  const now = Date.now();
  removeExpiredEntries(now);
  const userId = String(req.user.id);
  const current = requestsByUser.get(userId);
  if (!current || now - current.windowStartedAt >= WINDOW_MS) {
    requestsByUser.set(userId, { count: 1, windowStartedAt: now });
    return next();
  }
  if (current.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.ceil(
      (WINDOW_MS - (now - current.windowStartedAt)) / 1000
    );
    res.set("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      message: "Too many chatbot requests. Please try again shortly.",
    });
  }

  current.count += 1;
  return next();
};

module.exports = chatRateLimit;
