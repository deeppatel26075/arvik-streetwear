'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface CurvedWallPanel {
  id: string;
  image: string;
  caption: string;
}

export interface CurvedWallCarouselProps {
  panels: CurvedWallPanel[];
  heading?: string;
  eyebrow?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;

  /** Panel size at the desktop reference width */
  panelWidth?: number;
  panelHeight?: number;
  gap?: number;
  /** CSS perspective (px) — smaller = more dramatic cylinder curve */
  perspective?: number;
  /** Max rotateY (deg) a fully-offscreen-adjacent panel reaches */
  maxRotation?: number;
  /** Smallest scale a rotated side panel shrinks to */
  minScale?: number;

  className?: string;
}

export default function CurvedWallCarousel({
  panels,
  heading,
  eyebrow,
  ctaLabel = 'Explore Now',
  onCtaClick,
  panelWidth = 340,
  panelHeight = 460,
  gap = 28,
  perspective = 1200,
  maxRotation = 22,
  minScale = 0.86,
  className = '',
}: CurvedWallCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  const dragRef = useRef<{ startX: number; startScroll: number; dragging: boolean }>({
    startX: 0,
    startScroll: 0,
    dragging: false,
  });

  // The 3D "cylinder" tilt only reads well once panels have room to sit
  // side by side — below that, the wall collapses to a flat swipeable strip.
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Scroll-driven curve: on every scroll frame, measure each panel's
  // distance from the track's horizontal center and rotate/scale it
  // accordingly — mutating styles directly (not React state) so this
  // stays smooth at 60fps instead of re-rendering on every scroll tick.
  const updatePanelTransforms = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    if (!isDesktop) {
      panelRefs.current.forEach((el) => {
        if (el) el.style.transform = 'none';
      });
      return;
    }

    const trackRect = track.getBoundingClientRect();
    const centerX = trackRect.left + trackRect.width / 2;

    panelRefs.current.forEach((el) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const panelCenter = rect.left + rect.width / 2;
      const distance = (panelCenter - centerX) / (rect.width + gap);
      const clamped = Math.max(-2.2, Math.min(2.2, distance));
      const rotateY = -clamped * maxRotation;
      const scale = Math.max(minScale, 1 - Math.abs(clamped) * 0.12);
      const translateZ = -Math.abs(clamped) * 60;
      el.style.transform = `translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
      el.style.opacity = `${Math.max(0.45, 1 - Math.abs(clamped) * 0.22)}`;
    });
  }, [isDesktop, gap, maxRotation, minScale]);

  const onScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      updatePanelTransforms();
    });
  }, [updatePanelTransforms]);

  useEffect(() => {
    updatePanelTransforms();
    window.addEventListener('resize', onScroll);
    return () => window.removeEventListener('resize', onScroll);
  }, [onScroll, updatePanelTransforms]);

  // Drag-to-scroll for mouse users — overflow-x-auto alone only responds
  // to wheel/trackpad/touch, not a click-drag, so desktop mouse needs this.
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track) return;
    dragRef.current = { startX: e.clientX, startScroll: track.scrollLeft, dragging: true };
    track.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track || !dragRef.current.dragging) return;
    track.scrollLeft = dragRef.current.startScroll - (e.clientX - dragRef.current.startX);
    onScroll();
  };

  const endDrag = () => {
    dragRef.current.dragging = false;
  };

  return (
    <section
      className={`relative w-full overflow-hidden py-16 sm:py-24 ${className}`}
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% 20%, #2f3524 0%, #14150f 45%, #050503 80%, #000000 100%)',
      }}
    >
      {(eyebrow || heading) && (
        <div className="relative z-10 max-w-[1440px] mx-auto px-5 sm:px-10 mb-10 sm:mb-16 text-center">
          {eyebrow && (
            <span className="block text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.4em] text-white/50 mb-3">
              {eyebrow}
            </span>
          )}
          {heading && (
            <h2 className="font-syne font-extrabold uppercase text-white text-3xl sm:text-5xl lg:text-6xl leading-[0.95] tracking-tight">
              {heading}
            </h2>
          )}
        </div>
      )}

      <div style={{ perspective: isDesktop ? `${perspective}px` : 'none' }}>
        <div
          ref={trackRef}
          onScroll={onScroll}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
          className="relative flex overflow-x-auto snap-x snap-mandatory touch-pan-x cursor-grab active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            gap,
            paddingInline: `max(1.25rem, calc(50% - ${panelWidth / 2}px))`,
            transformStyle: isDesktop ? 'preserve-3d' : undefined,
          }}
        >
          {panels.map((panel, i) => (
            <div
              key={panel.id}
              ref={(el) => {
                panelRefs.current[i] = el;
              }}
              className="relative flex-shrink-0 snap-center"
              style={{ width: panelWidth, transition: 'transform 120ms ease-out, opacity 120ms ease-out' }}
            >
              <div className="relative rounded-sm overflow-hidden border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]" style={{ height: panelHeight }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={panel.image}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover select-none"
                  loading={i < 3 ? 'eager' : 'lazy'}
                />
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
              </div>
              <p className="mt-4 text-center text-xs sm:text-sm text-white/80 font-sans px-2">
                {panel.caption}
              </p>
            </div>
          ))}
        </div>
      </div>

      {ctaLabel && (
        <div className="relative z-10 flex justify-center mt-10 sm:mt-14">
          <button
            type="button"
            onClick={onCtaClick}
            className="border-2 border-white text-white bg-transparent font-extrabold uppercase tracking-[0.25em] text-xs sm:text-sm px-9 sm:px-12 py-4 sm:py-5 hover:bg-white hover:text-black transition-colors duration-300"
          >
            {ctaLabel}
          </button>
        </div>
      )}
    </section>
  );
}
