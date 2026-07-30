const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isValidIsoDate = (value) => {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  if (year < 1) return false;

  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const validateTripDatePair = (startDate, endDate) => {
  const hasStartDate =
    startDate !== undefined && startDate !== null && startDate !== "";
  const hasEndDate = endDate !== undefined && endDate !== null && endDate !== "";

  if (hasStartDate !== hasEndDate) {
    return "Start date and end date must be provided together";
  }
  if (!hasStartDate) return null;
  if (!isValidIsoDate(startDate) || !isValidIsoDate(endDate)) {
    return "Start date and end date must use YYYY-MM-DD format";
  }
  if (startDate > endDate) {
    return "Start date cannot be after end date";
  }
  return null;
};

const getTripDateConstraintMessage = (error) => {
  if (
    error?.code === "23514" &&
    /^(Trip |expense_date |itinerary_date )/.test(error.message)
  ) {
    return error.message;
  }
  return null;
};

module.exports = {
  isValidIsoDate,
  validateTripDatePair,
  getTripDateConstraintMessage,
};
