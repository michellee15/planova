const test = require("node:test");
const assert = require("node:assert/strict");
const {
  isValidIsoDate,
  validateTripDatePair,
  getTripDateConstraintMessage,
} = require("../src/utils/dateValidation");

test("accepts real ISO calendar dates and rejects invalid dates", () => {
  assert.equal(isValidIsoDate("2026-02-28"), true);
  assert.equal(isValidIsoDate("2028-02-29"), true);
  assert.equal(isValidIsoDate("2026-02-29"), false);
  assert.equal(isValidIsoDate("2026-13-01"), false);
  assert.equal(isValidIsoDate("30-07-2026"), false);
});

test("validates complete and ordered trip date ranges", () => {
  assert.equal(validateTripDatePair(null, null), null);
  assert.equal(validateTripDatePair("2026-08-01", "2026-08-01"), null);
  assert.equal(
    validateTripDatePair("2026-08-01", null),
    "Start date and end date must be provided together"
  );
  assert.equal(
    validateTripDatePair("2026-08-10", "2026-08-01"),
    "Start date cannot be after end date"
  );
});

test("only exposes known trip-date constraint messages", () => {
  assert.equal(
    getTripDateConstraintMessage({
      code: "23514",
      message: "expense_date must be between 2026-08-01 and 2026-08-10 (inclusive)",
    }),
    "expense_date must be between 2026-08-01 and 2026-08-10 (inclusive)"
  );
  assert.equal(
    getTripDateConstraintMessage({
      code: "23514",
      message: "Unrelated database check failed",
    }),
    null
  );
});
