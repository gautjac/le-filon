// Minimal stroke icons, sized via the parent's font-size (1em).
type P = { className?: string };
const base = "currentColor";

export function PickaxeIcon({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="1em" height="1em" fill="none"
      stroke={base} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 19 13 11" />
      <path d="M3 6c4 0 6 2 8 4M21 6c-4 0-6 2-8 4" />
      <path d="M11 9l2 2" />
    </svg>
  );
}

export function LedgerIcon({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="1em" height="1em" fill="none"
      stroke={base} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z" />
      <path d="M5 4v14M9 8h6M9 12h6M9 16h3" />
    </svg>
  );
}

export function VeinIcon({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="1em" height="1em" fill="none"
      stroke={base} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 20c3-5 5-6 7-9s3-5 5-7" />
      <path d="M11 11c1.5.4 2.5-.4 4 .2" />
      <path d="M7 15c1.2 0 1.8-1 3-1" />
      <circle cx="16" cy="4" r="1.4" />
    </svg>
  );
}

export function SearchIcon({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="1em" height="1em" fill="none"
      stroke={base} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

export function CheckIcon({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="1em" height="1em" fill="none"
      stroke={base} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

export function RotateIcon({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="1em" height="1em" fill="none"
      stroke={base} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 4v4h4" />
    </svg>
  );
}

export function CloseIcon({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="1em" height="1em" fill="none"
      stroke={base} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function LinkIcon({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="1em" height="1em" fill="none"
      stroke={base} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 13a4 4 0 0 0 5.7.4l2.8-2.8a4 4 0 0 0-5.6-5.6l-1.6 1.6" />
      <path d="M15 11a4 4 0 0 0-5.7-.4l-2.8 2.8a4 4 0 0 0 5.6 5.6l1.6-1.6" />
    </svg>
  );
}

export function ArrowIcon({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="1em" height="1em" fill="none"
      stroke={base} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function LampIcon({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="1em" height="1em" fill="none"
      stroke={base} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 3h6l1 5a4 4 0 0 1-8 0z" />
      <path d="M12 13v5M9 21h6" />
    </svg>
  );
}
