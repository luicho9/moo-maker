import { cn } from "@/lib/utils";
import type { CowConfig, Pattern } from "./params";

const HORN_EDGE = "#000000";
const INK = "#2A211D";

export type Look = Pick<
  CowConfig,
  "base" | "spot" | "snout" | "hoof" | "pattern" | "tuft" | "tuftColor" | "hornColor"
>;

export function Swatch({
  base,
  spot,
  pattern,
  className,
}: {
  base: string;
  spot: string;
  pattern: Pattern;
  className?: string;
}) {
  const backgrounds: Record<Pattern, string> = {
    none: base,
    patches: `radial-gradient(circle at 65% 35%, ${spot} 0 28%, transparent 29%), radial-gradient(circle at 30% 72%, ${spot} 0 18%, transparent 19%), ${base}`,
    dots: `radial-gradient(circle at 30% 30%, ${spot} 0 11%, transparent 12%), radial-gradient(circle at 70% 40%, ${spot} 0 9%, transparent 10%), radial-gradient(circle at 45% 72%, ${spot} 0 10%, transparent 11%), ${base}`,
    belt: `linear-gradient(90deg, ${base} 0 32%, ${spot} 32% 68%, ${base} 68%)`,
    face: `linear-gradient(90deg, ${base} 0 55%, ${spot} 55%)`,
  };
  return (
    <span
      className={cn("size-10 shrink-0 rounded-full shadow-inner", className)}
      style={{ background: backgrounds[pattern] }}
    />
  );
}

type HeadProps = {
  look: Look;
  horns?: CowConfig["horns"];
  headwear?: CowConfig["headwear"];
  neckwear?: CowConfig["neckwear"];
  facewear?: CowConfig["facewear"];
  eyes?: CowConfig["eyes"];
  blush?: number;
  // Accessory colors; each falls back to the item's usual color.
  colors?: { head?: string; neck?: string; face?: string };
  className?: string;
};

export function HeadIcon({
  look,
  horns = "none",
  headwear = "none",
  neckwear = "none",
  facewear = "none",
  eyes = "round",
  blush = 0,
  colors = {},
  className,
}: HeadProps) {
  const spotted = look.pattern === "patches" || look.pattern === "dots";
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      {horns === "nubs" && (
        <g fill={look.hornColor} stroke={HORN_EDGE} strokeOpacity=".15" strokeWidth="1">
          <rect x="14.5" y="11" width="5" height="7" rx="2.5" />
          <rect x="28.5" y="11" width="5" height="7" rx="2.5" />
        </g>
      )}
      {horns === "long" && (
        <g fill="none" stroke={look.hornColor} strokeWidth="4" strokeLinecap="round">
          <path d="M17 17 C 11 16, 7 12, 6 5" />
          <path d="M31 17 C 37 16, 41 12, 42 5" />
        </g>
      )}
      <ellipse cx="9.5" cy="23" rx="6" ry="3" fill={look.base} stroke={INK} strokeOpacity=".15" transform="rotate(20 9.5 23)" />
      <ellipse cx="38.5" cy="23" rx="6" ry="3" fill={look.base} stroke={INK} strokeOpacity=".15" transform="rotate(-20 38.5 23)" />
      <ellipse cx="24" cy="26" rx="12.5" ry="12" fill={look.base} stroke={INK} strokeOpacity=".15" />
      {spotted && <ellipse cx="29" cy="19" rx="5" ry="4" fill={look.spot} />}
      {look.pattern === "face" && <ellipse cx="24" cy="28" rx="7" ry="10" fill={look.spot} />}
      {look.tuft > 0.05 && <ellipse cx="24" cy="15.5" rx="8" ry="3.5" fill={look.tuftColor} />}
      <ellipse cx="24" cy="32" rx="8.5" ry="5.5" fill={look.snout} />
      <circle cx="21" cy="32" r="1.2" fill={INK} />
      <circle cx="27" cy="32" r="1.2" fill={INK} />
      {blush > 0.01 && (
        <g fill="#FF8FA3" opacity={0.4 + blush * 0.5}>
          <ellipse cx="14.5" cy="28" rx="2.6" ry="1.6" />
          <ellipse cx="33.5" cy="28" rx="2.6" ry="1.6" />
        </g>
      )}

      {[19, 29].map((x) =>
        eyes === "wink" && x === 29 ? (
          <path key={x} d="M27 24.5 Q29 22 31 24.5" fill="none" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
        ) : (
          <g key={x}>
            <circle cx={x} cy="24" r="1.6" fill={INK} />
            {eyes === "sleepy" && <path d={`M${x - 2} 23.6 h4`} stroke={look.base} strokeWidth="1.8" />}
            {eyes === "lashes" && (
              <path
                d={`M${x - 1.6} 22.2 l-0.8 -1.4 M${x} 21.8 v-1.6 M${x + 1.6} 22.2 l0.8 -1.4`}
                stroke={INK}
                strokeWidth="0.8"
                strokeLinecap="round"
              />
            )}
          </g>
        ),
      )}

      {facewear === "glasses" && (
        <g fill="none" stroke={colors.face ?? INK} strokeWidth="1.3">
          <circle cx="19" cy="24" r="3.6" />
          <circle cx="29" cy="24" r="3.6" />
          <path d="M22.6 24 h2.8" />
        </g>
      )}
      {facewear === "nosering" && (
        <circle cx="24" cy="36.5" r="2.4" fill="none" stroke={colors.face ?? "#E8B547"} strokeWidth="1.2" />
      )}

      {neckwear === "bell" && (
        <g>
          <path d="M13 37 Q24 44 35 37" fill="none" stroke={colors.neck ?? "#D9534F"} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M21.5 41 h5 l1.5 5 h-8 z" fill="#E8B547" />
        </g>
      )}
      {neckwear === "bandana" && (
        <g fill={colors.neck ?? "#3E7CC9"}>
          <path d="M13 37 Q24 44 35 37 L24 47 Z" />
        </g>
      )}
      {neckwear === "bowtie" && (
        <g fill={colors.neck ?? "#D9534F"}>
          <path d="M24 42 L18 39 v6 Z M24 42 L30 39 v6 Z" />
          <circle cx="24" cy="42" r="1.6" />
        </g>
      )}

      {headwear === "crown" && (
        <g>
          {[
            [14, 15, colors.head ?? "#FF8FB1"],
            [19, 12.5, "#FFFFFF"],
            [24, 11.5, "#FFC94D"],
            [29, 12.5, "#B9A6EA"],
            [34, 15, colors.head ?? "#FF8FB1"],
          ].map(([x, y, c]) => (
            <circle key={x} cx={x} cy={y} r="2.6" fill={c as string} stroke={INK} strokeOpacity=".15" />
          ))}
        </g>
      )}
      {headwear === "hat" && (
        <g>
          <ellipse cx="24" cy="15" rx="15" ry="3" fill={colors.head ?? "#C8955B"} />
          <rect x="16.5" y="5" width="15" height="10" rx="3" fill={colors.head ?? "#C8955B"} />
          <rect x="16.5" y="11" width="15" height="2.5" fill="#7A4B2A" />
        </g>
      )}
      {headwear === "party" && (
        <g>
          <path d="M18 15 L24 1.5 L30 15 Z" fill={colors.head ?? "#7FB7E8"} />
          <path d="M20.2 10 L27.8 10" stroke="#FFFFFF" strokeWidth="1.4" />
          <circle cx="24" cy="2" r="2" fill="#FFFFFF" />
        </g>
      )}
    </svg>
  );
}

export function BodyIcon({
  look,
  chubby,
  legs,
  className,
}: {
  look: Look;
  chubby: number;
  legs: number;
  className?: string;
}) {
  const ground = 44;
  const legH = 4 + legs * 11;
  const ry = 7 + chubby * 6;
  const rx = 15 + chubby * 3;
  const cx = 28;
  const cy = ground - legH - ry * 0.7;
  const legTop = cy + ry * 0.4;
  const head = { x: cx + rx + 1, y: cy - ry * 0.55 };
  const spotted = look.pattern === "patches" || look.pattern === "dots";
  return (
    <svg viewBox="0 0 64 48" className={className} aria-hidden>
      <path
        d={`M${cx - rx + 1} ${cy - 2} q -5 4 -4 11`}
        fill="none"
        stroke={look.base}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {[cx - rx + 5, cx - rx + 10, cx + rx - 10, cx + rx - 5].map((x, i) => (
        <g key={i} opacity={i % 2 ? 1 : 0.8}>
          <rect x={x - 2} y={legTop} width="4" height={ground - legTop} rx="2" fill={look.base} stroke={INK} strokeOpacity=".15" />
          <rect x={x - 2.2} y={ground - 2.5} width="4.4" height="2.5" rx="1" fill={look.hoof} />
        </g>
      ))}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={look.base} stroke={INK} strokeOpacity=".15" />
      {spotted && <ellipse cx={cx - 4} cy={cy - ry * 0.25} rx={rx * 0.35} ry={ry * 0.45} fill={look.spot} />}
      {look.pattern === "belt" && <rect x={cx - 4} y={cy - ry + 0.5} width="8" height={ry * 2 - 1} fill={look.spot} />}
      <circle cx={head.x} cy={head.y} r="6.5" fill={look.base} stroke={INK} strokeOpacity=".15" />
      {look.pattern === "face" && <circle cx={head.x + 1.5} cy={head.y} r="4.5" fill={look.spot} />}
      <ellipse cx={head.x + 4} cy={head.y + 2.5} rx="3.5" ry="3" fill={look.snout} />
      <circle cx={head.x + 1} cy={head.y - 1.5} r="1" fill={INK} />
    </svg>
  );
}
