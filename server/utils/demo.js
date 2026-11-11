// Listings created by this account get a "Demo listing" tag.
// You can change the address with a DEMO_EMAIL variable in server/.env.
export const DEMO_EMAIL = (process.env.DEMO_EMAIL || "spacioapp.support@gmail.com").toLowerCase();

export function isDemoEmail(email) {
  return Boolean(email) && String(email).toLowerCase() === DEMO_EMAIL;
}
