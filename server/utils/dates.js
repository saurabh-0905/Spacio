// Spacio saves booking dates as calendar days at midnight UTC.
// "Today" means today's date in India (IST, UTC+5:30), so it is right even when the server runs on UTC.
export function todayIST() {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
}

// Minutes since midnight right now in India (IST)
export function nowMinutesIST() {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return ist.getUTCHours() * 60 + ist.getUTCMinutes();
}

// "14:00" -> 840, "24:00" -> 1440. Only whole hours from 00:00 to 24:00 are accepted. Anything else -> null.
export function hourToMinutes(text) {
  const match = /^(\d{1,2}):00$/.exec(String(text || "").trim());
  if (!match) return null;
  const hour = Number(match[1]);
  return hour >= 0 && hour <= 24 ? hour * 60 : null;
}
