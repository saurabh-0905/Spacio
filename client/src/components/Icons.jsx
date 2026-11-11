// All icons in one place. Usage: <Icon name="search" size={20} />
const PATHS = {
  box: "M21 8l-9-5-9 5v8l9 5 9-5V8z M3 8l9 5 9-5 M12 13v8",
  car: "M3 17v-5l2-6h14l2 6v5H3z M3 12h18 M7 17v2 M17 17v2",
  desk: "M3 4h18v12H3z M8 20h8 M12 16v4",
  spark: "M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L12 3z",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14z M21 21l-4.5-4.5",
  pin: "M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z M12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  calendar: "M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4",
  chat: "M4 5h16v11H9l-5 4V5z",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z",
  card: "M3 6h18v12H3z M3 10h18 M7 15h4",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
  arrow: "M5 12h14 M13 6l6 6-6 6",
  back: "M19 12H5 M11 6l-6 6 6 6",
  menu: "M4 7h16 M4 12h16 M4 17h16",
  close: "M6 6l12 12 M18 6L6 18",
  map: "M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z M9 4v14 M15 6v14",
  grid: "M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z",
  plus: "M12 5v14 M5 12h14",
  target: "M9 12a3 3 0 106 0 3 3 0 10-6 0 M12 3v3 M12 18v3 M3 12h3 M18 12h3",
  check: "M5 12l5 5 9-10",
  image: "M4 5h16v14H4z M4 16l5-5 4 4 3-3 4 4",
  home: "M4 11l8-7 8 7v9H4v-9z M10 20v-6h4v6",
  wallet: "M3 7h17v13H3z M3 7l14-3v3 M16 14h2",
  clock: "M12 3a9 9 0 100 18 9 9 0 000-18z M12 7v5l3 2",
  send: "M4 12l16-8-6 16-3-6-7-2z",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8z M4 21a8 8 0 0116 0",
  logout: "M9 4H5v16h4 M16 8l4 4-4 4 M20 12H9",
  bot: "M5 8h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2z M12 8V5 M12 5h.01 M9 12.3v1.4 M15 12.3v1.4 M9.5 16.3c1.4 1 3.6 1 5 0 M1.5 12v3 M22.5 12v3",
  sports: "M12 3a9 9 0 100 18 9 9 0 000-18z M3 12h18 M12 3v18 M5.6 5.6c3.5 3 3.5 10.8 0 12.8 M18.4 5.6c-3.5 3-3.5 10.8 0 12.8",
  other: "M12 3l9 5-9 5-9-5 9-5z M3 13l9 5 9-5",
  edit: "M4 20h4L19 9l-4-4L4 16v4z M13.5 6.5l4 4",
  mail: "M3 6h18v12H3z M3 7l9 7 9-7",
  alert: "M12 4l9 16H3L12 4z M12 10v4 M12 17h.01",
  trash: "M5 7h14 M9 7V4h6v3 M7 7l1 13h8l1-13",
};

export default function Icon({ name, size = 20 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
