// Decorative QR visual — stylized pattern, not a real QR.
// Swap to a real QR library (e.g. qrcode.react) when wiring to production.

const SIZE = 25;

function makeMatrix(seed: string): boolean[][] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const rng = () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
  const m: boolean[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => rng() > 0.5)
  );
  // Finder patterns (3 corners)
  const stamp = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const on =
          x === 0 ||
          x === 6 ||
          y === 0 ||
          y === 6 ||
          (x >= 2 && x <= 4 && y >= 2 && y <= 4);
        m[oy + y][ox + x] = on;
      }
    }
  };
  stamp(0, 0);
  stamp(SIZE - 7, 0);
  stamp(0, SIZE - 7);
  return m;
}

export function QRPreview({ value, size = 180 }: { value: string; size?: number }) {
  const m = makeMatrix(value);
  const cell = size / SIZE;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="#f6f1e7" rx={10} />
      {m.map((row, y) =>
        row.map((on, x) =>
          on ? (
            <rect
              key={`${x}-${y}`}
              x={x * cell + 1}
              y={y * cell + 1}
              width={cell - 0.5}
              height={cell - 0.5}
              fill="#14110e"
              rx={cell * 0.15}
            />
          ) : null
        )
      )}
    </svg>
  );
}
