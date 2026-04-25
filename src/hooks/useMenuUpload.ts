import { useCallback, useState } from "react";
import { deleteItemPhoto, uploadItemPhoto } from "@/lib/api/menu-db";
import { extensionFor, resizeImage } from "@/lib/image";

type UseMenuUpload = {
  uploading: boolean;
  progress: number; // 0..100 (approximatif, basé sur étapes)
  error: string | null;
  upload: (restaurantId: string, itemId: string, file: File) => Promise<string | null>;
  remove: (publicUrl: string) => Promise<void>;
  reset: () => void;
};

export function useMenuUpload(): UseMenuUpload {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (restaurantId: string, itemId: string, file: File): Promise<string | null> => {
      setError(null);
      setUploading(true);
      setProgress(5);
      try {
        if (!file.type.startsWith("image/")) {
          throw new Error("Le fichier doit être une image.");
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("Image trop volumineuse (10 Mo max).");
        }
        setProgress(25);
        const blob = await resizeImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.8, mime: "image/jpeg" });
        setProgress(70);
        const url = await uploadItemPhoto(restaurantId, itemId, blob, extensionFor(blob.type));
        setProgress(100);
        return url;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Échec de l'envoi de la photo.");
        return null;
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const remove = useCallback(async (publicUrl: string) => {
    await deleteItemPhoto(publicUrl);
  }, []);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  return { uploading, progress, error, upload, remove, reset };
}
