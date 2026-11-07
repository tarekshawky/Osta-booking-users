// The brand panel's picture: a UAE evening skyline with a modern villa in front, drawn as SVG (no image to download) in the
// navy and blue of the page. Purely decorative.
export function BrandArt({ className = "" }: { className?: string }) {
  const towers: [number, number, number][] = [[40, 330, 70], [120, 260, 56], [196, 360, 64], [610, 300, 62], [690, 380, 74], [770, 280, 50]];
  const windows = (x: number, top: number, w: number) => {
    const out: React.ReactNode[] = [];
    for (let r = 0; r < 14; r++) for (let c = 0; c < Math.floor(w / 16); c++) {
      if ((r * 7 + c * 5 + Math.floor(x / 10)) % 4 === 0) out.push(<rect key={`${x}-${r}-${c}`} x={x + 8 + c * 16} y={top + 14 + r * 20} width="7" height="9" rx="1" fill="#31c7ff" opacity="0.55" />);
    }
    return out;
  };
  return (
    <svg className={className} viewBox="0 0 840 1000" preserveAspectRatio="xMidYMax slice" aria-hidden role="presentation">
      <defs>
        <linearGradient id="br-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#030b1c" /><stop offset="0.55" stopColor="#082049" /><stop offset="1" stopColor="#0c3a78" />
        </linearGradient>
        <radialGradient id="br-moon" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#bfe9ff" stopOpacity="0.9" /><stop offset="1" stopColor="#31c7ff" stopOpacity="0" /></radialGradient>
        <linearGradient id="br-villa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#102a54" /><stop offset="1" stopColor="#081833" /></linearGradient>
        <linearGradient id="br-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#31c7ff" stopOpacity="0.85" /><stop offset="1" stopColor="#087bff" stopOpacity="0.55" /></linearGradient>
      </defs>
      <rect width="840" height="1000" fill="url(#br-sky)" />
      <circle cx="640" cy="170" r="150" fill="url(#br-moon)" />
      {Array.from({ length: 36 }, (_, i) => <circle key={i} cx={(i * 197) % 840} cy={(i * 89) % 420} r={i % 5 === 0 ? 1.6 : 0.9} fill="#bfe9ff" opacity={0.25 + (i % 4) * 0.12} />)}
      {/* distant towers */}
      {towers.map(([x, h, w]) => (
        <g key={x}>
          <rect x={x} y={760 - h} width={w} height={h + 240} fill="#0a2146" />
          <rect x={x} y={760 - h} width={w} height={4} fill="#31c7ff" opacity="0.5" />
          {windows(x, 760 - h, w)}
        </g>
      ))}
      <path d="M392 330 L402 250 L412 330 Z" fill="#0a2146" />
      <rect x="352" y="330" width="100" height="430" rx="4" fill="#0a2146" />
      <rect x="352" y="330" width="100" height="4" fill="#31c7ff" opacity="0.6" />
      {windows(352, 330, 100)}
      {/* horizon glow */}
      <rect x="0" y="720" width="840" height="60" fill="#087bff" opacity="0.18" />
      {/* the villa */}
      <g>
        <rect x="120" y="640" width="600" height="360" fill="url(#br-villa)" />
        <rect x="150" y="600" width="300" height="60" rx="3" fill="#0e2a55" stroke="#31c7ff" strokeOpacity="0.5" />
        <rect x="360" y="548" width="250" height="60" rx="3" fill="#102f5f" stroke="#31c7ff" strokeOpacity="0.55" />
        <rect x="170" y="660" width="210" height="130" rx="4" fill="url(#br-glass)" />
        <rect x="400" y="620" width="190" height="170" rx="4" fill="url(#br-glass)" />
        <rect x="610" y="660" width="90" height="130" rx="4" fill="#0e2a55" stroke="#31c7ff" strokeOpacity="0.4" />
        {[0, 1, 2].map((i) => <rect key={i} x={190 + i * 66} y="672" width="3" height="106" fill="#06132b" opacity="0.6" />)}
        {[0, 1, 2].map((i) => <rect key={`b${i}`} x={420 + i * 60} y="632" width="3" height="146" fill="#06132b" opacity="0.6" />)}
        <rect x="120" y="790" width="600" height="6" fill="#31c7ff" opacity="0.7" />
        <rect x="0" y="796" width="840" height="204" fill="#061226" />
        <rect x="0" y="796" width="840" height="3" fill="#31c7ff" opacity="0.35" />
      </g>
      {/* palms */}
      {[70, 760].map((x) => (
        <g key={x} transform={`translate(${x} 700)`} stroke="#031024" strokeLinecap="round" fill="none">
          <path d="M0 100 C 4 60 -2 30 4 -10" strokeWidth="5" />
          {[-60, -30, 0, 30, 60].map((a) => <path key={a} d={`M4 -10 q ${a} -22 ${a * 1.5} 8`} strokeWidth="4" />)}
        </g>
      ))}
    </svg>
  );
}
