const fs = require("node:fs/promises");
const path = require("node:path");
require("dotenv").config();
const pool = require("../src/config/db");

const migrationsDirectory = path.join(__dirname, "..", "db", "migrations");

const runMigrations = async () => {
  const migrationFiles = (await fs.readdir(migrationsDirectory))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const migrationFile of migrationFiles) {
    const migrationPath = path.join(migrationsDirectory, migrationFile);
    const sql = await fs.readFile(migrationPath, "utf8");
    await pool.query(sql);
    console.log(`Applied migration: ${migrationFile}`);
  }
};

runMigrations()
  .catch((error) => {
    const connectionErrors = Array.isArray(error.errors)
      ? error.errors
          .map((cause) => cause.code || cause.message)
          .filter(Boolean)
          .join(", ")
      : "";
    const details = error.message || error.code || connectionErrors || error.name;
    console.error("Migration failed:", details);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
