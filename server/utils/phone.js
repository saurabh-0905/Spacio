// "+91 98765-43210", "098765 43210" and "9876543210" all become "9876543210"
export function cleanPhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

// A valid Indian mobile number: 10 digits starting with 6, 7, 8 or 9
export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}
