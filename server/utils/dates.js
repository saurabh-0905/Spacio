// Spacio saves booking dates as calendar days at midnight UTC.
// "Today" means today's date in India (IST, UTC+5:30), so it is right even when the server runs on UTC.
export function todayIST() {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
}
