const paths = {
  logo: (
    <>
      <path d="M11 21s5.5-4.7 5.5-10.2a5.5 5.5 0 1 0-11 0C5.5 16.3 11 21 11 21Z" />
      <path d="M8.8 13.5V8h2.5a2.1 2.1 0 0 1 0 4.2H8.8" />
      <path d="m18.5 3-.6 1.7-1.7.6 1.7.6.6 1.7.6-1.7 1.7-.6-1.7-.6-.6-1.7Z" />
    </>
  ),
  trips: (
    <>
      <rect x="4" y="7" width="16" height="12" rx="3" />
      <path d="M9 7V5h6v2M4 12h16M9 12v2h6v-2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  map: (
    <>
      <path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2V6Z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="3" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M15 6.5a3 3 0 0 1 0 5.8M16 14c2.6.3 4 2 4.5 5" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.5-4.6 2.8-7 7-7s6.5 2.4 7 7" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 13.5v-3l-2-.7a6.5 6.5 0 0 0-.6-1.4l.9-1.9-2.1-2.1-1.9.9a6.5 6.5 0 0 0-1.4-.6L11.2 3h-3l-.7 2a6.5 6.5 0 0 0-1.4.6l-1.9-.9-2.1 2.1.9 1.9a6.5 6.5 0 0 0-.6 1.4l-2 .7v3l2 .7a6.5 6.5 0 0 0 .6 1.4l-.9 1.9 2.1 2.1 1.9-.9a6.5 6.5 0 0 0 1.4.6l.7 2h3l.7-2a6.5 6.5 0 0 0 1.4-.6l1.9.9 2.1-2.1-.9-1.9a6.5 6.5 0 0 0 .6-1.4l2-.7Z" transform="translate(2.3 0) scale(.8)" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7h14a2 2 0 0 1 2 2v9H6a2 2 0 0 1-2-2V7Z" />
      <path d="M4 8V6a2 2 0 0 1 2-2h10v3M15 12h5v4h-5a2 2 0 0 1 0-4Z" />
    </>
  ),
  overview: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="4" width="7" height="7" rx="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" />
      <rect x="13" y="13" width="7" height="7" rx="2" />
    </>
  ),
  itinerary: (
    <>
      <circle cx="7" cy="6" r="2" />
      <circle cx="17" cy="18" r="2" />
      <path d="M7 8v2c0 2 1.5 3 3.5 3h3c2 0 3.5 1 3.5 3" />
    </>
  ),
  expenses: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5c-.7-.8-1.8-1.2-3.2-1.2-1.8 0-3.1.9-3.1 2.3 0 3.5 6.2 1.5 6.2 4.8 0 1.4-1.3 2.4-3.3 2.4-1.5 0-2.8-.5-3.6-1.4M12 5.5v13" />
    </>
  ),
  edit: (
    <>
      <path d="m5 15-1 5 5-1L19 9l-4-4L5 15Z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  arrowLeft: <path d="m14 6-6 6 6 6M8 12h11" />,
  arrowRight: <path d="m10 6 6 6-6 6M5 12h11" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  sparkle: (
    <>
      <path d="m12 3-1.2 3.3L7.5 7.5l3.3 1.2L12 12l1.2-3.3 3.3-1.2-3.3-1.2L12 3Z" />
      <path d="m5.5 12-.8 2.2-2.2.8 2.2.8.8 2.2.8-2.2 2.2-.8-2.2-.8-.8-2.2Z" />
    </>
  ),
  logout: <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />,
  check: <path d="m5 12 4 4L19 6" />,
};

function Icon({ name, size = 20, className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <g
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths[name]}
      </g>
    </svg>
  );
}

export default Icon;
