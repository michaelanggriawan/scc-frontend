"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui";
import { fileUrl } from "@/lib/api";

const AUTO_SLIDE_MS = 4000;

export function RoomGalleryLightbox({
  photos,
  roomName,
  onClose,
}: {
  photos: string[];
  roomName: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  function goNext() {
    setPaused(true);
    setIndex((i) => (i + 1) % photos.length);
  }
  function goPrev() {
    setPaused(true);
    setIndex((i) => (i - 1 + photos.length) % photos.length);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, photos.length]);

  useEffect(() => {
    if (paused || photos.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % photos.length);
    }, AUTO_SLIDE_MS);
    return () => clearInterval(t);
  }, [paused, photos.length]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (photos.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-mahogany-2/90 backdrop-blur-sm"
      onClick={onClose}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white/80 hover:text-white cursor-pointer"
        aria-label="Close gallery"
      >
        <Icon name="close" className="w-6 h-6" />
      </button>

      {photos.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-3 md:left-8 top-1/2 -translate-y-1/2 text-white/80 hover:text-white cursor-pointer p-2"
          aria-label="Previous photo"
        >
          <Icon name="arrowLeft" className="w-7 h-7 md:w-8 md:h-8" />
        </button>
      )}

      <div
        className="relative max-w-[90vw] max-h-[85vh] flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fileUrl(photos[index])}
          alt={`${roomName} photo ${index + 1}`}
          className="max-w-[90vw] max-h-[75vh] object-contain"
        />
        {photos.length > 1 && (
          <p className="text-xs text-white/70 tracking-wide">
            {index + 1} / {photos.length}
          </p>
        )}
      </div>

      {photos.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-3 md:right-8 top-1/2 -translate-y-1/2 text-white/80 hover:text-white cursor-pointer p-2"
          aria-label="Next photo"
        >
          <Icon name="arrowRight" className="w-7 h-7 md:w-8 md:h-8" />
        </button>
      )}
    </div>
  );
}
