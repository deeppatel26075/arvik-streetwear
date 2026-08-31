'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Curved3DCarouselItem {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  /** Small label pinned to the top of the card, e.g. "4. DARK OLIVE" */
  tag?: string;
  /** Caption bar pinned to the bottom of the card, e.g. "HEAVYWEIGHT 240 GSM COTTON" */
  caption?: string;
}

export interface Curved3DCarouselProps {
  items: Curved3DCarouselItem[];
  /** Optional eyebrow + heading rendered above the carousel */
  eyebrow?: string;
  heading?: string;

  /** ---- Geometry — every number below is freely tunable ---- */
  /** Base card width in px at the desktop reference size */
  cardWidth?: number;
  /** Base card height in px at the desktop reference size */
  cardHeight?: number;
  /** Horizontal distance (px) between each card's center, at distance 1 */
  step?: number;
  /** CSS perspective depth in px — smaller = more dramatic curvature */
  perspective?: number;
  /** Degrees each card rotates around Y per step of distance from center */
  rotationDeg?: number;
  /** How far back (px) each card is pushed per step of distance */
  depthStep?: number;
  /** How much each card shrinks per step of distance (0–1) */
  scaleStep?: number;
  /** Smallest scale a far card can shrink to */
  minScale?: number;
  /** How much opacity fades per step of distance (0–1) */
  opacityFalloff?: number;
  /** Vertical "wrap" amount (px) — cards dip by distance^2 * curvature, giving the concave arc */
  curvature?: number;
  /** Cards further than this many steps from center are fully hidden */
  maxVisibleSteps?: number;

  /** ---- Motion ---- */
  autoplay?: boolean;
  autoplaySpeed?: number;
  transitionDuration?: number;

  className?: string;
}

const DEFAULT_ITEMS: Curved3DCarouselItem[] = [];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function Curved3DCarousel({
  items = DEFAULT_ITEMS,
  eyebrow,
  heading,
  cardWidth = 320,
  cardHeight = 420,
  step = 230,
  perspective = 1400,
  rotationDeg = 42,
  depthStep = 180,
  scaleStep = 0.16,
  minScale = 0.62,
  opacityFalloff = 0.28,
  curvature = 3.2,
  maxVisibleSteps = 3.4,
  autoplay = true,
  autoplaySpeed = 3800,
  transitionDuration = 700,
  className = '',
}: Curved3DCarouselProps) {
  const count = items.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [viewportScale, setViewportScale] = useState(1);

  const trackRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const didDragRef = useRef(false);

  // Respect prefers-reduced-motion: no autoplay, snap instead of animate.
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // Scale the whole geometry down on narrower viewports so mobile shows
  // ~1 main card + peeks, tablet ~3, desktop the full spread — without
  // needing separate layout logic, just shrinking the same transforms.
  useEffect(() => {
    const computeScale = () => {
      const w = window.innerWidth;
      if (w < 480) setViewportScale(0.56);
      else if (w < 640) setViewportScale(0.64);
      else if (w < 1024) setViewportScale(0.8);
      else setViewportScale(1);
    };
    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, []);

  const effCardWidth = cardWidth * viewportScale;
  const effCardHeight = cardHeight * viewportScale;
  const effStep = step * viewportScale;
  const effPerspective = perspective * viewportScale;
  const effDepthStep = depthStep * viewportScale;

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      const next = ((index % count) + count) % count;
      setActiveIndex(next);
    },
    [count]
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  // Autoplay — paused while dragging, hovered/focused, or when the visitor
  // prefers reduced motion.
  useEffect(() => {
    if (!autoplay || paused || isDragging || reducedMotion || count <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % count);
    }, autoplaySpeed);
    return () => clearInterval(id);
  }, [autoplay, paused, isDragging, reducedMotion, count, autoplaySpeed]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'Home') {
      e.preventDefault();
      goTo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      goTo(count - 1);
    }
  };

  // Pointer-based drag/swipe — unified for mouse, touch, and pen.
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (count <= 1) return;
    pointerIdRef.current = e.pointerId;
    dragStartXRef.current = e.clientX;
    didDragRef.current = false;
    setIsDragging(true);
    setPaused(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || pointerIdRef.current !== e.pointerId) return;
    const delta = e.clientX - dragStartXRef.current;
    if (Math.abs(delta) > 4) didDragRef.current = true;
    setDragPx(delta);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    pointerIdRef.current = null;
    setIsDragging(false);
    setPaused(false);
    const stepsMoved = -dragPx / effStep;
    const rounded = Math.round(stepsMoved);
    setDragPx(0);
    if (rounded !== 0) {
      setIsSettling(true);
      goTo(activeIndex + rounded);
    }
    window.setTimeout(() => setIsSettling(false), transitionDuration + 30);
  };

  const handleCardClick = (index: number) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (index !== activeIndex) goTo(index);
  };

  const continuousPosition = activeIndex - dragPx / effStep;

  const cardGeometry = useMemo(() => {
    return items.map((item, i) => {
      let distance = i - continuousPosition;
      // Wrap distance the short way around the loop so e.g. going from
      // the last slide to the first curves through the near side, not
      // sweeping across the whole carousel.
      if (count > 2) {
        if (distance > count / 2) distance -= count;
        else if (distance < -count / 2) distance += count;
      }
      const absD = Math.abs(distance);
      const visible = absD <= maxVisibleSteps;
      const rotateY = clamp(-distance * rotationDeg, -78, 78);
      const translateZ = -absD * effDepthStep;
      const scale = Math.max(minScale, 1 - absD * scaleStep);
      const translateX = distance * effStep;
      const translateY = absD * absD * curvature;
      const opacity = visible ? Math.max(0, 1 - absD * opacityFalloff) : 0;
      const zIndex = Math.round(1000 - absD * 10);
      return { item, distance, absD, visible, rotateY, translateZ, scale, translateX, translateY, opacity, zIndex };
    });
  }, [items, continuousPosition, count, maxVisibleSteps, rotationDeg, effDepthStep, scaleStep, minScale, effStep, curvature, opacityFalloff]);

  const useTransition = !isDragging && !reducedMotion;
  const snapDuration = isSettling || !isDragging ? transitionDuration : 0;

  if (count === 0) return null;

  return (
    <section className={`relative w-full bg-black overflow-hidden py-14 sm:py-20 ${className}`}>
      {(eyebrow || heading) && (
        <div className="relative z-10 max-w-[1440px] mx-auto px-5 sm:px-10 mb-10 sm:mb-16 text-center">
          {eyebrow && (
            <span className="block text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.4em] text-white/50 mb-3">
              {eyebrow}
            </span>
          )}
          {heading && (
            <h2 className="font-syne font-extrabold uppercase text-white text-4xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
              {heading}
            </h2>
          )}
        </div>
      )}

      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={heading || 'Product carousel'}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="relative w-full select-none outline-none touch-pan-y"
        style={{
          height: effCardHeight + 60,
          perspective: `${effPerspective}px`,
          perspectiveOrigin: '50% 40%',
          cursor: isDragging ? 'grabbing' : count > 1 ? 'grab' : 'default',
        }}
      >
        <div
          className="absolute inset-0"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {cardGeometry.map(({ item, distance, visible, rotateY, translateZ, scale, translateX, translateY, opacity, zIndex }, i) => {
            const isActive = i === activeIndex;
            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(i)}
                aria-hidden={!visible}
                aria-current={isActive ? 'true' : undefined}
                className="absolute top-1/2 left-1/2 rounded-2xl overflow-hidden border border-white/10 bg-stone-900 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]"
                style={{
                  width: effCardWidth,
                  height: effCardHeight,
                  marginLeft: -effCardWidth / 2,
                  marginTop: -effCardHeight / 2,
                  transform: `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  transition: useTransition
                    ? `transform ${snapDuration}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${snapDuration}ms ease-out`
                    : 'none',
                  opacity,
                  zIndex,
                  pointerEvents: visible ? 'auto' : 'none',
                  cursor: isActive ? 'default' : 'pointer',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.title}
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading={Math.abs(distance) <= 1 ? 'eager' : 'lazy'}
                />

                {/* Subtle vignette so overlaid text stays legible on any photo */}
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                {item.tag && (
                  <span className="absolute top-3 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] text-white/85">
                    {item.tag}
                  </span>
                )}

                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-center">
                  {item.subtitle && (
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-white/60 mb-1">
                      {item.subtitle}
                    </p>
                  )}
                  <h3 className="font-syne font-extrabold uppercase text-white text-sm sm:text-base tracking-wide mb-1">
                    {item.title}
                  </h3>
                  {item.caption && (
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                      {item.caption}
                    </p>
                  )}
                </div>

                {/* Center card gets a faint glow ring to read as "in focus" */}
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-white/25 pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous slide"
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-[1001] h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next slide"
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-[1001] h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="relative z-10 flex items-center justify-center gap-2 mt-8 sm:mt-12">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === activeIndex}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? 'w-7 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
