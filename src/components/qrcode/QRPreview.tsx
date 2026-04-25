import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { useQRCode, type QROptions } from "@/hooks/useQRCode";
import { cn } from "@/lib/utils";

export function QRPreview({
  url,
  size = 256,
  options,
  className,
}: {
  url: string;
  size?: number;
  options?: QROptions;
  className?: string;
}) {
  const { generateQR } = useQRCode();
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const optColor = options?.color;
  const optBg = options?.background;
  const optEcl = options?.errorCorrectionLevel;
  const optMargin = options?.margin;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    generateQR(url, {
      size,
      color: optColor,
      background: optBg,
      errorCorrectionLevel: optEcl,
      margin: optMargin,
    })
      .then((data) => {
        if (!cancelled) {
          setSrc(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [url, size, optColor, optBg, optEcl, optMargin, generateQR]);

  return (
    <div
      className={cn(
        "rounded-[10px] border border-line bg-bg-2 grid place-items-center overflow-hidden",
        className
      )}
      style={{ width: size, height: size }}
    >
      {loading ? (
        <div className="text-[11px] text-ink-4">Génération…</div>
      ) : error || !src ? (
        <ImageOff size={20} className="text-ink-4" />
      ) : (
        <img
          src={src}
          alt={`QR code ${url}`}
          width={size}
          height={size}
          className="block"
        />
      )}
    </div>
  );
}
