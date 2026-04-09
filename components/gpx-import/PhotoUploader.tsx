"use client";

import { useState, useRef, useCallback } from "react";
import { UploadCloud, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoFile {
  file: File;
  preview: string;
  descricao: string;
}

interface PhotoUploaderProps {
  photos: PhotoFile[];
  onPhotosChange: (photos: PhotoFile[]) => void;
  maxPhotos?: number;
}

export function PhotoUploader({ photos, onPhotosChange, maxPhotos = 2 }: PhotoUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setError(null);

      const remainingSlots = maxPhotos - photos.length;
      if (remainingSlots <= 0) {
        setError(`Máximo de ${maxPhotos} fotos atingido.`);
        return;
      }

      const newPhotos: PhotoFile[] = [];
      for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
        const file = files[i];

        // Validação
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type)) {
          setError(`Arquivo "${file.name}" não é uma imagem válida. Use JPG, PNG ou WebP.`);
          continue;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          setError(`Arquivo "${file.name}" excede 5MB.`);
          continue;
        }

        const preview = URL.createObjectURL(file);
        newPhotos.push({ file, preview, descricao: "" });
      }

      if (newPhotos.length > 0) {
        onPhotosChange([...photos, ...newPhotos]);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [photos, onPhotosChange, maxPhotos]
  );

  const handleRemovePhoto = useCallback(
    (index: number) => {
      const removed = photos[index];
      if (removed.preview.startsWith("blob:")) {
        URL.revokeObjectURL(removed.preview);
      }
      const updated = photos.filter((_, i) => i !== index);
      onPhotosChange(updated);
      setError(null);
    },
    [photos, onPhotosChange]
  );

  const handleDescricaoChange = useCallback(
    (index: number, descricao: string) => {
      const updated = [...photos];
      updated[index] = { ...updated[index], descricao };
      onPhotosChange(updated);
    },
    [photos, onPhotosChange]
  );

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {/* Photo Previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="relative group rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden bg-neutral-50 dark:bg-neutral-950"
            >
              {/* Image Preview */}
              <div className="aspect-video relative bg-neutral-100 dark:bg-neutral-900">
                <img
                  src={photo.preview}
                  alt={photo.descricao || "Foto"}
                  className="w-full h-full object-cover"
                />
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Description Input */}
              <input
                type="text"
                value={photo.descricao}
                onChange={(e) => handleDescricaoChange(index, e.target.value)}
                placeholder="Descrição (opcional)"
                className="w-full px-3 py-2 text-xs border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      )}

      {/* Add Photo Button */}
      {photos.length < maxPhotos && (
        <Button
          type="button"
          variant="outline"
          onClick={handleAddClick}
          className="w-full h-10 gap-2 border-dashed"
        >
          <UploadCloud className="w-4 h-4" />
          <ImageIcon className="w-4 h-4" />
          Adicionar Foto ({photos.length}/{maxPhotos})
        </Button>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <X className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}
