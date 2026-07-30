const STORAGE_KEY = "planova_preferences";

export const defaultPreferences = {
  defaultCurrency: "SGD",
  distanceUnit: "km",
  dateFormat: "day-first",
  defaultRadiusKm: 5,
  confirmDeletes: true,
};

export function getPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...defaultPreferences, ...(saved || {}) };
  } catch {
    return defaultPreferences;
  }
}

export function savePreferences(preferences) {
  const nextPreferences = { ...defaultPreferences, ...preferences };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPreferences));
  window.dispatchEvent(
    new CustomEvent("planova:preferences-updated", {
      detail: nextPreferences,
    }),
  );
  return nextPreferences;
}

export function formatDisplayDate(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const { dateFormat } = getPreferences();
  const locale =
    dateFormat === "month-first"
      ? "en-US"
      : dateFormat === "year-first"
        ? "en-CA"
        : "en-GB";

  if (dateFormat === "year-first") {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDistance(distanceKm) {
  const numericDistance = Number(distanceKm);
  if (!Number.isFinite(numericDistance)) return "";

  if (getPreferences().distanceUnit === "mi") {
    return `${(numericDistance * 0.621371).toFixed(1)} mi`;
  }

  return `${numericDistance} km`;
}
