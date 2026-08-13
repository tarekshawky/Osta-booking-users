export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" }[size];
  return (
    <span className={`font-extrabold tracking-tight ${dims}`}>
      <span className="text-white">OS</span>
      <span className="bg-gradient-to-b from-accent-2 to-accent bg-clip-text text-transparent">TA</span>
    </span>
  );
}

export function LogoMark({ diameter = 96 }: { diameter?: number }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-full"
      style={{
        width: diameter,
        height: diameter,
        boxShadow: "0 0 30px rgba(94,200,255,0.55), inset 0 0 20px rgba(94,200,255,0.15)",
        border: "1.5px solid rgba(94,200,255,0.7)",
      }}
    >
      <Logo size={diameter > 80 ? "lg" : "md"} />
    </div>
  );
}
