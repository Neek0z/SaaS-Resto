import { useCallback } from "react";
import QRCode from "qrcode";
import type { QRCodeErrorCorrectionLevel } from "qrcode";

export type QROptions = {
  color?: string;
  background?: string;
  errorCorrectionLevel?: QRCodeErrorCorrectionLevel;
  margin?: number;
  size?: number;
};

const DEFAULTS: Required<Omit<QROptions, "size">> = {
  color: "#100d0a",
  background: "#ffffff",
  errorCorrectionLevel: "M",
  margin: 2,
};

function resolve(opts: QROptions = {}) {
  return {
    color: opts.color ?? DEFAULTS.color,
    background: opts.background ?? DEFAULTS.background,
    errorCorrectionLevel: opts.errorCorrectionLevel ?? DEFAULTS.errorCorrectionLevel,
    margin: opts.margin ?? DEFAULTS.margin,
  };
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function useQRCode() {
  const generateQR = useCallback(
    async (url: string, options: QROptions = {}): Promise<string> => {
      const cfg = resolve(options);
      return QRCode.toDataURL(url, {
        width: options.size ?? 256,
        margin: cfg.margin,
        errorCorrectionLevel: cfg.errorCorrectionLevel,
        color: { dark: cfg.color, light: cfg.background },
      });
    },
    []
  );

  const generateSVG = useCallback(
    async (url: string, options: QROptions = {}): Promise<string> => {
      const cfg = resolve(options);
      return QRCode.toString(url, {
        type: "svg",
        margin: cfg.margin,
        errorCorrectionLevel: cfg.errorCorrectionLevel,
        color: { dark: cfg.color, light: cfg.background },
      });
    },
    []
  );

  const generateBlob = useCallback(
    async (url: string, size: number, options: QROptions = {}): Promise<Blob> => {
      const cfg = resolve(options);
      const canvas = document.createElement("canvas");
      await QRCode.toCanvas(canvas, url, {
        width: size,
        margin: cfg.margin,
        errorCorrectionLevel: cfg.errorCorrectionLevel,
        color: { dark: cfg.color, light: cfg.background },
      });
      const blob = await new Promise<Blob | null>((r) =>
        canvas.toBlob(r, "image/png")
      );
      if (!blob) throw new Error("Impossible d'encoder le QR code en PNG.");
      return blob;
    },
    []
  );

  const downloadPNG = useCallback(
    async (url: string, filename: string, size = 512, options: QROptions = {}) => {
      const blob = await generateBlob(url, size, options);
      const href = URL.createObjectURL(blob);
      triggerDownload(href, filename);
      setTimeout(() => URL.revokeObjectURL(href), 1000);
    },
    [generateBlob]
  );

  const downloadSVG = useCallback(
    async (url: string, filename: string, options: QROptions = {}) => {
      const svg = await generateSVG(url, options);
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const href = URL.createObjectURL(blob);
      triggerDownload(href, filename);
      setTimeout(() => URL.revokeObjectURL(href), 1000);
    },
    [generateSVG]
  );

  return { generateQR, generateSVG, generateBlob, downloadPNG, downloadSVG };
}
