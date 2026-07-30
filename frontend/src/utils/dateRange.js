const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function toDateInputValue(value) {
  if (typeof value !== "string") return "";

  const date = value.slice(0, 10);
  return ISO_DATE_PATTERN.test(date) ? date : "";
}

export function getTripDateRange(trip) {
  return {
    startDate: toDateInputValue(trip?.start_date),
    endDate: toDateInputValue(trip?.end_date),
  };
}

export function hasCompleteDateRange(dateRange) {
  return Boolean(dateRange?.startDate && dateRange?.endDate);
}

export function getDateRangeMessage(
  value,
  dateRange,
  label = "Date",
) {
  if (!value) return "";

  if (!hasCompleteDateRange(dateRange)) {
    return `Set the trip start and end dates before choosing a ${label.toLowerCase()}.`;
  }

  if (value < dateRange.startDate || value > dateRange.endDate) {
    return `${label} must be between ${dateRange.startDate} and ${dateRange.endDate} (inclusive).`;
  }

  return "";
}

export function getDateRangeHelp(dateRange) {
  if (!hasCompleteDateRange(dateRange)) {
    return "Set the trip start and end dates before adding a date.";
  }

  return `Choose a date from ${dateRange.startDate} to ${dateRange.endDate}, inclusive.`;
}
