'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PanoramicPanel {
  id: string;
  image: string;
  caption: string;
}

// A broken source (missing file, stale URL) shouldn't leave a blank panel
// in the middle of the band — swap to one of these known-good local
// photos instead, same safety net the rest of the product pages use.
const FALLBACK_IMAGES = [
  '/products/farebi-olive.jpg',
  '/products/polarize-navy.jpg',
  '/products/mard-paisa-maroon.jpg',
  '/products/polarize-cream.jpg',
];

// Old film-roll sprocket-hole perforations, spaced to roughly fill
// whatever width the strip is measured at — purely decorative, so exact
// spacing doesn't matter, just "enough holes, evenly spread".
function SprocketHoles({ width }: { width: number }) {
  const spacing = 26;
  const count = width > 0 ? Math.max(10, Math.round(width / spacing)) : 24;
  return (
    <div className="flex items-center justify-around h-full px-3 sm:px-4">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="block w-[7px] h-[11px] sm:w-2 sm:h-3 rounded-[2px] bg-black flex-shrink-0" />
      ))}
    </div>
  );
}

function PanelImage({ src, fallbackIndex, alt, loading }: { src: string; fallbackIndex: number; alt: string; loading: 'eager' | 'lazy' }) {
  const [errored, setErrored] = useState(false);
  const resolvedSrc = errored
    ? FALLBACK_IMAGES[((fallbackIndex % FALLBACK_IMAGES.length) + FALLBACK_IMAGES.length) % FALLBACK_IMAGES.length]
    : src;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      alt={alt}
      draggable={false}
      className="absolute inset-0 w-full h-full object-cover"
      loading={loading}
      onError={() => setErrored(true)}
    />
  );
}

// A concave "inside of a tunnel" curve — walls tallest at the far ends,
// receding to their shortest at dead center — can't be made with
// border-radius (it only rounds corners, never dips the middle of a
// straight edge), so trace it as a clip-path polygon along a parabola
// instead: full height at the edges, pinched inward by `depth` at center.
function buildTunnelClipPath(depth: number, steps = 28) {
  if (depth <= 0) return 'none';
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * 100;
    const t = (x - 50) / 50; // -1 at left edge → 0 at center → 1 at right edge
    const inset = depth * (1 - t * t); // 0 at edges, `depth` at center
    top.push(`${x}% ${inset}px`);
    bottom.unshift(`${x}% calc(100% - ${inset}px)`);
  }
  return `polygon(${top.join(', ')}, ${bottom.join(', ')})`;
}

export interface PanoramicCurveCarouselProps {
  panels: PanoramicPanel[];
  eyebrow?: string;
  /** Large cropped headline behind the strip, e.g. "MISSION BREAKDOWN" */
  heading?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;

  /** How many panels are visible in the curved band at once */
  visibleCount?: number;
  /** Panels visible at once under 640px — fractional values (e.g. 1.12)
   *  leave a sliver of the next photo peeking in as a swipe affordance */
  mobileVisibleCount?: number;
  /** Vertical "lens" depth (px) of the border-radius curve at the band's ends */
  curveDepth?: number;
  /** Height (px) of the panel band at the desktop reference size */
  bandHeight?: number;
  /** Old film-roll look: sprocket-hole strips above/below the band and a
   *  frame counter on each panel */
  filmStrip?: boolean;

  autoplay?: boolean;
  autoplaySpeed?: number;
  transitionDuration?: number;

  className?: string;
}

export default function PanoramicCurveCarousel({
  panels,
  eyebrow,
  heading,
  ctaLabel = 'Explore Now',
  onCtaClick,
  visibleCount = 3,
  mobileVisibleCount = 1.12,
  curveDepth = 64,
  bandHeight = 460,
  filmStrip = false,
  autoplay = true,
  autoplaySpeed = 5000,
  transitionDuration = 800,
  className = '',
}: PanoramicCurveCarouselProps) {
  const total = panels.length;
  const [isNarrow, setIsNarrow] = useState(false);
  // Under 640px, three cropped slivers read as clutter — show one photo
  // at a time instead (a sliver of fractional visibleCount peeking in as
  // a swipe hint), and step exactly one panel per swipe so paging still
  // feels 1:1 with "photo 2 of 4" rather than jumping in groups of three.
  const effectiveVisible = isNarrow ? Math.min(mobileVisibleCount, total) : Math.min(visibleCount, total);
  const step = Math.max(1, Math.round(effectiveVisible));
  const pageCount = Math.max(1, Math.ceil(total / step));

  // Infinite loop: clone one page's worth of panels onto each end of the
  // track, so sliding past the last real page reveals the FIRST page's
  // clone (not a dead stop) and vice versa. Once that clone has fully
  // slid into place, we silently re-point to the matching real position
  // — invisible to the eye since the clone looks identical — so the next
  // step still has clone buffer to slide into, indefinitely.
  const canLoop = total > step;
  const cloneCount = canLoop ? step : 0;
  const displayPanels = useMemo(() => {
    if (!canLoop) return panels;
    return [...panels.slice(-cloneCount), ...panels, ...panels.slice(0, cloneCount)];
  }, [panels, canLoop, cloneCount]);

  const [extIndex, setExtIndex] = useState(cloneCount);
  const [jumping, setJumping] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [bandScale, setBandScale] = useState(1);

  const viewportRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const [dragPx, setDragPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // Measure the viewport so panel width (and thus the slide offset) is
  // always exact, and scale the band height down on narrow screens.
  useEffect(() => {
    const measure = () => {
      if (viewportRef.current) setViewportWidth(viewportRef.current.clientWidth);
      const w = window.innerWidth;
      setBandScale(w < 640 ? 0.72 : w < 1024 ? 0.8 : 1);
      setIsNarrow(w < 640);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Mobile gets its own full-bleed "story" layout (see render branch below)
  // instead of the peeking-sliver panoramic band, so each panel there
  // should claim the full viewport width — no adjacent sliver.
  const panelWidth = isNarrow ? viewportWidth : viewportWidth / effectiveVisible;
  const effBandHeight = bandHeight * bandScale;
  const effCurveDepth = Math.min(curveDepth * bandScale, effBandHeight / 2 - 4);
  const tunnelClipPath = useMemo(() => buildTunnelClipPath(effCurveDepth), [effCurveDepth]);

  // Jump straight to a specific real page (used by the pagination dots) —
  // always lands within the real range, so it never needs a loop
  // correction; the browser just animates across whatever lies between.
  const goToRealPage = useCallback(
    (target: number) => {
      const wrapped = ((target % pageCount) + pageCount) % pageCount;
      setExtIndex(cloneCount + wrapped * step);
    },
    [pageCount, cloneCount, step]
  );

  // Step by one page. If a loop-correction is still pending (we're
  // currently sitting in clone territory, about to be silently
  // repositioned), ignore extra taps rather than sliding past the single
  // clone buffer into panels that don't exist.
  const isInCloneZone = (i: number) => canLoop && (i < cloneCount || i >= cloneCount + total);

  const goNext = useCallback(() => {
    setExtIndex((i) => (isInCloneZone(i) ? i : i + step));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, canLoop, cloneCount, total]);

  const goPrev = useCallback(() => {
    setExtIndex((i) => (isInCloneZone(i) ? i : i - step));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, canLoop, cloneCount, total]);

  // Active real page, for the pagination dots — derived from extIndex so
  // it stays correct even while extIndex is briefly sitting in a clone.
  const activePage = (() => {
    const raw = Math.round((extIndex - cloneCount) / step);
    return ((raw % pageCount) + pageCount) % pageCount;
  })();

  useEffect(() => {
    if (!autoplay || paused || isDragging || reducedMotion || pageCount <= 1) return;
    const id = setInterval(() => {
      setExtIndex((i) => (isInCloneZone(i) ? i : i + step));
    }, autoplaySpeed);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, paused, isDragging, reducedMotion, pageCount, autoplaySpeed, step, canLoop, cloneCount, total]);

  // Once a slide into clone territory finishes animating, silently
  // re-point to the equivalent real position (no transition, so it's
  // invisible) — this is what makes the loop feel endless instead of
  // stopping after one extra step.
  useEffect(() => {
    if (!canLoop || isDragging) return;
    const inHeadClone = extIndex < cloneCount;
    const inTailClone = extIndex >= cloneCount + total;
    if (!inHeadClone && !inTailClone) return;
    const timer = setTimeout(() => {
      setJumping(true);
      setExtIndex((i) => (inHeadClone ? i + total : i - total));
    }, transitionDuration + 20);
    return () => clearTimeout(timer);
  }, [extIndex, canLoop, isDragging, cloneCount, total, transitionDuration]);

  useEffect(() => {
    if (!jumping) return;
    const id = requestAnimationFrame(() => setJumping(false));
    return () => cancelAnimationFrame(id);
  }, [jumping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pageCount <= 1) return;
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
    const pageWidth = panelWidth * step;
    if (pageWidth > 0) {
      // Clamp to a single page-step per gesture — the clone buffer only
      // covers one page on each side, so a wilder drag simply can't move
      // further without risking sliding past cloned content into nothing.
      const pagesMoved = Math.max(-1, Math.min(1, Math.round(-dragPx / pageWidth)));
      if (pagesMoved !== 0) {
        setExtIndex((i) => (isInCloneZone(i) ? i : i + pagesMoved * step));
      }
    }
    setDragPx(0);
  };

  const baseOffset = extIndex * panelWidth;
  const trackOffset = -(baseOffset - dragPx);
  const useTransition = !isDragging && !reducedMotion && !jumping;

  const startPanel = extIndex;

  // Mobile gets a dedicated "story" presentation instead of the desktop
  // panoramic tunnel: the tunnel curve is built for a wide landscape band,
  // and on a narrow phone it just letterboxes these tall portrait product
  // photos into a squat strip. A full-bleed, swipeable, Instagram/Snapchat-
  // style vertical carousel (segmented progress bar, caption burned into
  // the photo) suits both the "Product Story" name and a phone screen far
  // better, while the desktop branch below is untouched.
  if (isNarrow) {
    return (
      <section className={`relative w-full bg-black overflow-hidden py-16 ${className}`}>
        {(eyebrow || heading) && (
          <div className="flex items-end justify-between gap-3 px-4 mb-4">
            <div className="min-w-0">
              {eyebrow && (
                <span className="block text-[10px] font-extrabold uppercase tracking-[0.3em] text-white/50">
                  {eyebrow}
                </span>
              )}
              {heading && (
                <h2 className="font-syne font-extrabold uppercase text-lg text-white mt-0.5 leading-tight">
                  {heading}
                </h2>
              )}
            </div>
            {pageCount > 1 && (
              <span className="flex-shrink-0 text-white/40 text-[11px] font-mono font-bold tracking-wider pb-0.5">
                {String(activePage + 1).padStart(2, '0')}/{String(pageCount).padStart(2, '0')}
              </span>
            )}
          </div>
        )}

        <div
          ref={viewportRef}
          role="region"
          aria-roledescription="carousel"
          aria-label={heading || 'Product story'}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="relative w-full overflow-hidden touch-pan-y outline-none"
          style={{ aspectRatio: '4 / 5', cursor: isDragging ? 'grabbing' : pageCount > 1 ? 'grab' : 'default' }}
        >
          <div
            className="absolute inset-y-0 left-0 flex h-full"
            style={{
              transform: `translateX(${trackOffset}px)`,
              transition: useTransition ? `transform ${transitionDuration}ms cubic-bezier(0.22, 1, 0.36, 1)` : 'none',
              width: viewportWidth ? panelWidth * displayPanels.length : '100%',
            }}
          >
            {displayPanels.map((panel, i) => {
              const realIndex = canLoop ? (((i - cloneCount) % total) + total) % total : i;
              return (
                <div
                  key={`story-slot-${i}-${panel.id}`}
                  className="relative h-full flex-shrink-0"
                  style={{ width: panelWidth || '100%' }}
                >
                  <PanelImage
                    src={panel.image}
                    fallbackIndex={realIndex}
                    alt=""
                    loading={i >= startPanel - 1 && i <= startPanel + step ? 'eager' : 'lazy'}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
                  <div className="absolute left-4 right-4 bottom-4 flex items-end justify-between gap-3">
                    <p className="text-white text-sm font-medium leading-snug drop-shadow-sm max-w-[78%]">
                      {panel.caption}
                    </p>
                    <span className="flex-shrink-0 text-white/60 text-[10px] font-mono font-bold tracking-wider">
                      {String(realIndex + 1).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {pageCount > 1 && (
            <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
              {Array.from({ length: pageCount }).map((_, i) => (
                <span
                  key={i}
                  className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
                    i === activePage ? 'bg-white' : 'bg-white/25'
                  }`}
                />
              ))}
            </div>
          )}

          {pageCount > 1 && (
            <>
              <button
                type="button"
                onClick={() => { if (!didDragRef.current) goPrev(); }}
                aria-label="Previous"
                className="absolute left-0 inset-y-0 w-1/3 z-10"
              />
              <button
                type="button"
                onClick={() => { if (!didDragRef.current) goNext(); }}
                aria-label="Next"
                className="absolute right-0 inset-y-0 w-1/3 z-10"
              />
            </>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className={`relative w-full bg-black overflow-hidden py-16 sm:py-24 ${className}`}>
      {eyebrow && (
        <span className="relative z-10 block text-center text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.4em] text-white/50 mb-2">
          {eyebrow}
        </span>
      )}

      {heading && (
        // A bold background statement, not a cropped "ghost" — sized with
        // clamp() so it always fits the full word on one line at a
        // legible-but-still-oversized scale, with enough opacity to
        // actually read.
        <div className="relative max-w-[1600px] mx-auto px-4 mb-4 sm:mb-6">
          <h2
            className="text-center font-syne font-extrabold uppercase text-white/20 leading-[0.92] tracking-tight select-none"
            style={{ fontSize: 'clamp(2.25rem, 8vw, 7rem)' }}
          >
            {heading}
          </h2>
        </div>
      )}

      <div className="relative max-w-[1600px] mx-auto px-2 sm:px-4">
        {filmStrip && (
          <div className="h-4 sm:h-5 bg-[#0d0d0d] border-b border-white/5 mb-1">
            <SprocketHoles width={viewportWidth} />
          </div>
        )}

        {/* Curved viewport — a clip-path polygon traces a concave "inside
            of a tunnel" curve: full height at the far ends, pinched
            inward at dead center, so the panels read as wrapping toward
            the viewer at the edges rather than bulging outward like a
            barrel. overflow-hidden then clips the sliding track
            underneath to that shape. */}
        <div
          ref={viewportRef}
          role="region"
          aria-roledescription="carousel"
          aria-label={heading || 'Panoramic showcase'}
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
          className="relative overflow-hidden touch-pan-y outline-none"
          style={{
            height: effBandHeight,
            clipPath: tunnelClipPath,
            cursor: isDragging ? 'grabbing' : pageCount > 1 ? 'grab' : 'default',
          }}
        >
          <div
            className="absolute inset-y-0 left-0 flex"
            style={{
              transform: `translateX(${trackOffset}px)`,
              transition: useTransition ? `transform ${transitionDuration}ms cubic-bezier(0.22, 1, 0.36, 1)` : 'none',
              width: viewportWidth ? panelWidth * displayPanels.length : '100%',
            }}
          >
            {displayPanels.map((panel, i) => {
              const realIndex = canLoop ? (((i - cloneCount) % total) + total) % total : i;
              return (
                <div
                  key={`slot-${i}-${panel.id}`}
                  className={`relative h-full flex-shrink-0 ${i > 0 ? (filmStrip ? 'border-l-2 border-black' : 'border-l border-white/15') : ''}`}
                  style={{ width: panelWidth || `${100 / effectiveVisible}%` }}
                >
                  <PanelImage
                    src={panel.image}
                    fallbackIndex={realIndex}
                    alt=""
                    loading={i >= startPanel - 1 && i <= startPanel + step ? 'eager' : 'lazy'}
                  />
                  {filmStrip && (
                    <span className="absolute top-2.5 left-2.5 z-10 text-[9px] sm:text-[10px] font-mono font-bold text-white/70 bg-black/40 backdrop-blur-xs px-1.5 py-0.5 rounded-sm tracking-wider">
                      {String(realIndex + 1).padStart(2, '0')}A
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {filmStrip && (
          <div className="h-4 sm:h-5 bg-[#0d0d0d] border-t border-white/5 mt-1">
            <SprocketHoles width={viewportWidth} />
          </div>
        )}

        {/* Captions track — mirrors the image track's slide offset exactly
            so each caption stays aligned under its own panel, without
            being clipped by the curved viewport above (captions live
            outside it). */}
        <div className="relative overflow-hidden mt-10 sm:mt-8">
          <div
            className="flex"
            style={{
              transform: `translateX(${trackOffset}px)`,
              transition: useTransition ? `transform ${transitionDuration}ms cubic-bezier(0.22, 1, 0.36, 1)` : 'none',
              width: viewportWidth ? panelWidth * displayPanels.length : '100%',
            }}
          >
            {displayPanels.map((panel, i) => (
              <p
                key={`caption-${i}-${panel.id}`}
                className="flex-shrink-0 text-center text-white/70 text-xs sm:text-sm px-4 sm:px-8 leading-relaxed"
                style={{ width: panelWidth || `${100 / effectiveVisible}%` }}
              >
                {panel.caption}
              </p>
            ))}
          </div>
        </div>

        {pageCount > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous"
              className="absolute -left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next"
              className="absolute -right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* CTA — pinned to the bottom-center of the curved band, straddling
            the middle divider like the reference. */}
        {ctaLabel && (
          <div
            className="absolute left-1/2 -translate-x-1/2 z-20"
            style={{ top: effBandHeight - effCurveDepth * 0.55 }}
          >
            <button
              type="button"
              onClick={onCtaClick}
              className="bg-black border-2 border-white text-white font-extrabold uppercase tracking-[0.2em] text-xs sm:text-sm px-6 sm:px-9 py-3.5 sm:py-4 hover:bg-white hover:text-black transition-colors whitespace-nowrap"
            >
              {ctaLabel}
            </button>
          </div>
        )}

        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 sm:mt-10">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToRealPage(i)}
                aria-label={`Go to page ${i + 1}`}
                aria-current={i === activePage}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activePage ? 'w-7 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
