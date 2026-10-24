import { BREEDS, type BreedId, type Extra, type Horns } from "./store";

const HORN = "#F3E6CC";
const HORN_EDGE = "#D9C7A4";
const INK = "#2A211D";

type IconProps = { breed: BreedId; className?: string };

export function HeadIcon({
  breed,
  horns,
  extra,
  className,
}: IconProps & { horns: Horns; extra: Extra }) {
  const b = BREEDS[breed];
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      {horns === "nubs" && (
        <g fill={HORN} stroke={HORN_EDGE} strokeWidth="1">
          <rect x="14.5" y="11" width="5" height="7" rx="2.5" />
          <rect x="28.5" y="11" width="5" height="7" rx="2.5" />
        </g>
      )}
      {horns === "long" && (
        <g fill="none" stroke={HORN} strokeWidth="4" strokeLinecap="round">
          <path d="M17 17 C 11 16, 7 12, 6 5" />
          <path d="M31 17 C 37 16, 41 12, 42 5" />
        </g>
      )}
      <ellipse cx="9.5" cy="23" rx="6" ry="3" fill={b.base} stroke={INK} strokeOpacity=".15" transform="rotate(20 9.5 23)" />
      <ellipse cx="38.5" cy="23" rx="6" ry="3" fill={b.base} stroke={INK} strokeOpacity=".15" transform="rotate(-20 38.5 23)" />
      <ellipse cx="24" cy="26" rx="12.5" ry="12" fill={b.base} stroke={INK} strokeOpacity=".15" />
      {b.spots && <ellipse cx="29" cy="19" rx="5" ry="4" fill={b.spot} />}
      {b.tuft && <ellipse cx="24" cy="15.5" rx="8" ry="3.5" fill="#B5622F" />}
      <ellipse cx="24" cy="32" rx="8.5" ry="5.5" fill={b.snout} />
      <circle cx="21" cy="32" r="1.2" fill={INK} />
      <circle cx="27" cy="32" r="1.2" fill={INK} />
      <circle cx="19" cy="24" r="1.6" fill={INK} />
      <circle cx="29" cy="24" r="1.6" fill={INK} />

      {extra === "bell" && (
        <g>
          <path d="M13 37 Q24 44 35 37" fill="none" stroke="#D9534F" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M21.5 41 h5 l1.5 5 h-8 z" fill="#E8B547" />
        </g>
      )}
      {extra === "crown" && (
        <g>
          {[
            [14, 15, "#FF8FB1"],
            [19, 12.5, "#FFFFFF"],
            [24, 11.5, "#FFC94D"],
            [29, 12.5, "#B9A6EA"],
            [34, 15, "#FF8FB1"],
          ].map(([x, y, c]) => (
            <circle key={x} cx={x} cy={y} r="2.6" fill={c as string} stroke={INK} strokeOpacity=".15" />
          ))}
        </g>
      )}
      {extra === "hat" && (
        <g>
          <ellipse cx="24" cy="15" rx="15" ry="3" fill="#C8955B" />
          <rect x="16.5" y="5" width="15" height="10" rx="3" fill="#C8955B" />
          <rect x="16.5" y="11" width="15" height="2.5" fill="#7A4B2A" />
        </g>
      )}
    </svg>
  );
}

export function BodyIcon({
  breed,
  chubby,
  legs,
  className,
}: IconProps & { chubby: number; legs: number }) {
  const b = BREEDS[breed];
  const ground = 44;
  const legH = 4 + legs * 11;
  const ry = 7 + chubby * 6;
  const rx = 15 + chubby * 3;
  const cx = 28;
  const cy = ground - legH - ry * 0.7;
  const legTop = cy + ry * 0.4;
  const head = { x: cx + rx + 1, y: cy - ry * 0.55 };
  return (
    <svg viewBox="0 0 64 48" className={className} aria-hidden>
      <path
        d={`M${cx - rx + 1} ${cy - 2} q -5 4 -4 11`}
        fill="none"
        stroke={b.base}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {[cx - rx + 5, cx - rx + 10, cx + rx - 10, cx + rx - 5].map((x, i) => (
        <g key={i} opacity={i % 2 ? 1 : 0.8}>
          <rect x={x - 2} y={legTop} width="4" height={ground - legTop} rx="2" fill={b.base} stroke={INK} strokeOpacity=".15" />
          <rect x={x - 2.2} y={ground - 2.5} width="4.4" height="2.5" rx="1" fill={b.hoof} />
        </g>
      ))}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={b.base} stroke={INK} strokeOpacity=".15" />
      {b.spots && <ellipse cx={cx - 4} cy={cy - ry * 0.25} rx={rx * 0.35} ry={ry * 0.45} fill={b.spot} />}
      <circle cx={head.x} cy={head.y} r="6.5" fill={b.base} stroke={INK} strokeOpacity=".15" />
      <ellipse cx={head.x + 4} cy={head.y + 2.5} rx="3.5" ry="3" fill={b.snout} />
      <circle cx={head.x + 1} cy={head.y - 1.5} r="1" fill={INK} />
    </svg>
  );
}
