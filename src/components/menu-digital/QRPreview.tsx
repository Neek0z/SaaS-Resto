import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { useQRCode } from "@/hooks/useQRCode";

export function QRPreview({ value, size = 200 }: { value: string; size?: number }) {
  const { generateQR } = useQRCode();
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    setError(false);
    generateQR(value, {
      size,
      color: "#14110e",
      background: "#f6f1e7",
      errorCorrectionLevel: "M",
      margin: 1,
    })
      .then((data) => {
        if (!cancelled) setSrc(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size, generateQR]);

  if (error) {
    return (
      <div
        className="grid place-items-center bg-cream rounded-[8px]"
        style={{ width: size, height: size }}
      >
        <ImageOff size={20} className="text-ink-4" />
      </div>
    );
  }

  if (!src) {
    return (
      <div
        className="grid place-items-center bg-cream rounded-[8px] text-[11px] text-ink-4"
        style={{ width: size, height: size }}
      >
        Génération…
      </div>
    );
  }

  return <img src={src} alt={`QR code ${value}`} width={size} height={size} className="block" />;
}
