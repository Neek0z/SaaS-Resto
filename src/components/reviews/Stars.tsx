export function Stars({
  rating,
  scale = 5,
  size = 12,
}: {
  rating: number;
  scale?: number;
  size?: number;
}) {
  const normalized = (rating / scale) * 5;
  const filled = Math.round(normalized);
  return (
    <span className="text-amber tracking-[1px]" style={{ fontSize: size }}>
      {"★".repeat(filled)}
      <span className="text-ink-4">{"★".repeat(Math.max(0, 5 - filled))}</span>
    </span>
  );
}
