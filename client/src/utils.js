// Small helpers used in many places

// icon = name used by components/Icons.jsx, blurb = short line for category cards
export const CATEGORIES = [
  { value: "storage", label: "Storage", icon: "box", blurb: "Garages, spare rooms, warehouses and inventory space." },
  { value: "parking", label: "Parking", icon: "car", blurb: "Spots for cars, bikes and commercial vehicles." },
  { value: "workspace", label: "Workspaces", icon: "desk", blurb: "Private offices, meeting rooms, coworking spots and studios." },
  { value: "event", label: "Event spaces", icon: "spark", blurb: "Terraces, party halls and photography venues." },
  { value: "sports", label: "Sports", icon: "sports", blurb: "Courts, turfs, pitches and grounds for a game or practice." },
  { value: "other", label: "Other", icon: "other", blurb: "Anything else that does not fit the other categories." },
];

export function categoryLabel(value) {
  return CATEGORIES.find((c) => c.value === value)?.label || value;
}

// Dates are saved at midnight UTC, so we also show them in UTC
export function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
}

// Get the error text from a failed request
export function errorMessage(err) {
  return err.response?.data?.message || err.message || "Something went wrong";
}

// "9876543210" becomes "+91 98765 43210"
export function formatPhone(phone) {
  return "+91 " + phone.slice(0, 5) + " " + phone.slice(5);
}

// Booking status in words. "approved" is shown as "Confirmed". Old "paid" bookings count as confirmed too.
export function statusLabel(status) {
  const labels = { pending: "Pending", approved: "Confirmed", paid: "Confirmed", rejected: "Rejected", cancelled: "Cancelled" };
  return labels[status] || status;
}

// Today's date as YYYY-MM-DD in the visitor's own time zone (used as the lowest date in date pickers)
export function localToday() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
