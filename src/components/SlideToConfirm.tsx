'use client';

import { useRef, useState } from 'react';
import { ChevronRight, Check } from 'lucide-react';

interface SlideToConfirmProps {
  label: string;
  completedLabel?: string;
  onConfirm: () => void;
  className?: string;
}

const THUMB_SIZE = 48;
const TRACK_PADDING = 4;
const COMPLETE_THRESHOLD = 0.85;

export default function SlideToConfirm({
  label,
  completedLabel = 'Confirmed',
  onConfirm,
  className = '',
}: SlideToConfirmProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const maxXRef = useRef(0);

  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [completed, setCompleted] = useState(false);

  const getMaxX = () => {
    const track = trackRef.current;
    if (!track) return 0;
    return Math.max(0, track.clientWidth - THUMB_SIZE - TRACK_PADDING * 2);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (completed) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    maxXRef.current = getMaxX();
    startXRef.current = e.clientX - dragX;
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || completed) return;
    const next = Math.max(0, Math.min(e.clientX - startXRef.current, maxXRef.current));
    setDragX(next);
  };

  const finishDrag = () => {
    if (!dragging || completed) return;
    setDragging(false);
    const max = maxXRef.current;
    if (max > 0 && dragX >= max * COMPLETE_THRESHOLD) {
      setDragX(max);
      setCompleted(true);
      setTimeout(onConfirm, 280);
    } else {
      setDragX(0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (completed) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      maxXRef.current = getMaxX();
      setDragX(maxXRef.current);
      setCompleted(true);
      setTimeout(onConfirm, 280);
    }
  };

  const max = maxXRef.current || getMaxX();
  const progress = max > 0 ? dragX / max : 0;

  return (
    <div
      ref={trackRef}
      className={`relative w-full h-14 bg-stone-950 rounded-full overflow-hidden select-none touch-none ${className}`}
    >
      <div
        className="absolute inset-y-0 left-0 bg-lime-400"
        style={{ width: `${TRACK_PADDING + dragX + THUMB_SIZE}px` }}
      />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-14">
        <span
          className="text-white font-extrabold text-xs uppercase tracking-widest transition-opacity duration-150"
          style={{ opacity: Math.max(0, 1 - progress * 1.4) }}
        >
          {completed ? completedLabel : label}
        </span>
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onKeyDown={handleKeyDown}
        className={`absolute top-1 left-1 h-12 w-12 rounded-full bg-white shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-lime-400 ${
          dragging ? '' : 'transition-transform duration-300 ease-out'
        }`}
        style={{ transform: `translateX(${dragX}px)` }}
      >
        {completed ? (
          <Check className="h-5 w-5 text-stone-950" />
        ) : (
          <ChevronRight className="h-5 w-5 text-stone-950" />
        )}
      </div>
    </div>
  );
}
