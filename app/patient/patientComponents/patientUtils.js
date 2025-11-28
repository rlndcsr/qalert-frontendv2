// Utility functions for patient page

export const getTodayDateString = () => {
  // Use local YYYY-MM-DD (user's local date) so "today" matches what the
  // user expects in their timezone. Server timestamps may be in UTC; we
  // normalize dates using the local date part for comparisons below.
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const getOrdinalPosition = (num) => {
  if (!num || num < 1) return "";
  const ordinals = [
    "",
    "First",
    "Second",
    "Third",
    "Fourth",
    "Fifth",
    "Sixth",
    "Seventh",
    "Eighth",
    "Ninth",
    "Tenth",
    "Eleventh",
    "Twelfth",
    "Thirteenth",
    "Fourteenth",
    "Fifteenth",
    "Sixteenth",
    "Seventeenth",
    "Eighteenth",
    "Nineteenth",
    "Twentieth",
    "Twenty-first",
    "Twenty-second",
    "Twenty-third",
    "Twenty-fourth",
    "Twenty-fifth",
    "Twenty-sixth",
    "Twenty-seventh",
    "Twenty-eighth",
    "Twenty-ninth",
    "Thirtieth",
  ];

  if (num <= 30) {
    return ordinals[num];
  }

  // For numbers above 30, use numeric format with suffix
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return num + "st";
  if (j === 2 && k !== 12) return num + "nd";
  if (j === 3 && k !== 13) return num + "rd";
  return num + "th";
};

// Normalize various date inputs to YYYY-MM-DD (returns null if not parseable)
export const toYMD = (value) => {
  if (!value) return null;
  if (typeof value === "string") {
    // Already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    // Try parsing ISO / datetime strings
    const parsed = new Date(value);
    if (!isNaN(parsed)) {
      // Return the local date portion (YYYY-MM-DD) so comparisons use the
      // user's local day instead of UTC date parts.
      const yyyy = parsed.getFullYear();
      const mm = String(parsed.getMonth() + 1).padStart(2, "0");
      const dd = String(parsed.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  if (value instanceof Date && !isNaN(value)) {
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const dd = String(value.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
};

// Convert YYYY-MM-DD string to a local Date at midnight
export const ymdToLocalDate = (ymd) => {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split("-").map((v) => parseInt(v, 10));
  return new Date(y, m - 1, d);
};

// Days difference: dateA - dateB (both YYYY-MM-DD strings) in full days
export const daysBetween = (aYmd, bYmd) => {
  const aDate = ymdToLocalDate(aYmd);
  const bDate = ymdToLocalDate(bYmd);
  if (!aDate || !bDate) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((aDate - bDate) / msPerDay);
};

export const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};
