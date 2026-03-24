import brandLogo from "../assets/logo_list/logo-horizontal-1200x400.png";

/** Breathe pulse duration (seconds) */
const BREATHE_DURATION_SEC = 10;

const SIZE_CLASS = {
  sm: "h-11 w-auto max-w-[160px] sm:h-12 sm:max-w-[180px]",
  md: "h-16 w-auto max-w-[240px] sm:h-20 sm:max-w-[300px]",
  lg: "h-20 w-auto max-w-[320px] sm:h-24 sm:max-w-[400px]",
};

/** Max rendered width (px) — larger than before (was 260px fixed). */
const IMG_MAX_WIDTH_PX = { sm: 300, md: 380, lg: 440 };

/**
 * Universal DhanSource logo loader — use fullScreen for overlays, or inline for sections.
 *
 * @param {object} props
 * @param {boolean} [props.fullScreen] — fixed overlay (entire viewport)
 * @param {'sm'|'md'|'lg'} [props.size]
 * @param {string} [props.label] — visible + screen reader text
 * @param {string} [props.className] — extra classes on wrapper
 */
export default function DhanSourceLoader({
  fullScreen = false,
  size = "md",
  label = "Loading",
  className = "",
}) {
  const imgClass =
    `${SIZE_CLASS[size] ?? SIZE_CLASS.md} ` +
    "object-contain object-center select-none " +
    `[animation:dhan-brand-breathe_${BREATHE_DURATION_SEC}s_ease-in-out_infinite]`;

  const maxImgPx = IMG_MAX_WIDTH_PX[size] ?? IMG_MAX_WIDTH_PX.md;

  const core = (
    <div className="relative flex flex-col items-center gap-3">
      <div
        className="pointer-events-none absolute inset-0 -z-10 scale-[1.8] rounded-full bg-brand-primary/15 blur-3xl"
        aria-hidden
      />
      <img
        src={brandLogo}
        alt=""
        aria-hidden
        className={imgClass}
        style={{ width: `min(92vw, ${maxImgPx}px)`, height: "auto" }}
      />
      {fullScreen ? (
        <span className="text-xs font-medium tracking-wide text-slate-500 sm:text-sm" aria-hidden>
          {label}
        </span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={label}
        className={
          "fixed inset-0 z-[9999] flex flex-col items-center justify-center " +
          "bg-white/93 backdrop-blur-md " +
          className
        }
      >
        {core}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex min-h-[120px] items-center justify-center p-6 sm:p-8 ${className}`}
    >
      {core}
    </div>
  );
}
