/* A few plain line icons, always shown next to a text label. */

const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const HomeIcon = () => (
  <svg {...base}>
    <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </svg>
);

export const TruckIcon = () => (
  <svg {...base}>
    <path d="M2 6h12v10H2zM14 10h4l3 3v3h-7z" />
    <circle cx="6" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
  </svg>
);

export const BookIcon = () => (
  <svg {...base}>
    <path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z" />
    <path d="M8 8h6M8 12h6" />
  </svg>
);

export const GearIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
  </svg>
);
