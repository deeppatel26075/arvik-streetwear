'use client';

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// "Shop by Category" as a big, endlessly looping horizontal carousel.
// The cards are rendered three times; whenever the scroll drifts into the
// first or last copy it's silently moved back by one copy's width, so you
// can keep swiping either way forever. With a mouse you can grab and pull
// the row; a drag never counts as a click on a card.

export interface CategoryItem {
  title: string;
  eyebrow: string;
  eyebrowClass: string;
  href: string;
  image: string;
}

const COPIES = 3;

export default function CategoryCarousel({ items }: { items: CategoryItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  // Width of one full copy of the list.
  const copyWidth = () => {
    const el = trackRef.current;
    return el ? el.scrollWidth / COPIES : 0;
  };

  // Start in the middle copy so both directions have room.
  useLayoutEffect(() => {
    const el = trackRef.current;
    if (el) el.scrollLeft = copyWidth();
  }, [items.length]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const w = copyWidth();
      if (!w) return;
      if (el.scrollLeft < w * 0.5) el.scrollLeft += w;
      else if (el.scrollLeft > w * 1.5) el.scrollLeft -= w;
    };
    const onResize = () => {
      el.scrollLeft = copyWidth();
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Mouse drag ("pull") with a little glide after letting go.
  const drag = useRef({ active: false, moved: false, x: 0, left: 0, lastX: 0, lastT: 0, v: 0, raf: 0 });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = trackRef.current;
    if (!el) return;
    cancelAnimationFrame(drag.current.raf);
    drag.current = { ...drag.current, active: true, moved: false, x: e.clientX, left: el.scrollLeft, lastX: e.clientX, lastT: performance.now(), v: 0 };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = trackRef.current;
    if (!d.active || !el) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = 'grabbing';
    }
    if (!d.moved) return;
    const now = performance.now();
    d.v = (e.clientX - d.lastX) / Math.max(1, now - d.lastT);
    d.lastX = e.clientX;
    d.lastT = now;
    el.scrollLeft = d.left - dx;
    // The loop may have shifted scrollLeft; keep the drag anchored.
    d.left = el.scrollLeft + dx;
  };

  const endDrag = () => {
    const d = drag.current;
    const el = trackRef.current;
    if (!d.active || !el) return;
    d.active = false;
    el.style.cursor = '';
    if (!d.moved) return;
    // Glide: keep moving with the release speed, slowing down.
    let v = d.v * 16; // px per frame
    const glide = () => {
      if (Math.abs(v) < 0.4) return;
      el.scrollLeft -= v;
      v *= 0.94;
      d.raf = requestAnimationFrame(glide);
    };
    d.raf = requestAnimationFrame(glide);
  };

  // A drag shouldn't open the card it started on.
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  const loop = Array.from({ length: COPIES }, (_, copy) => items.map((item) => ({ item, copy }))).flat();

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
        className="flex gap-3 lg:gap-5 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-3 overscroll-x-contain select-none md:cursor-grab"
      >
        {loop.map(({ item, copy }, i) => {
          const clone = copy !== 1;
          return (
            <Link
              key={`${copy}-${item.title}`}
              href={item.href}
              data-cat-card
              aria-hidden={clone || undefined}
              tabIndex={clone ? -1 : undefined}
              className="group flex-shrink-0 w-[150px] sm:w-[160px] lg:w-[31vw] xl:w-[380px] bg-white rounded-2xl lg:rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              <div className="relative h-[150px] sm:h-[175px] lg:h-auto lg:aspect-[4/5] bg-stone-100 overflow-hidden">
                <Image
                  src={item.image}
                  alt={clone ? '' : item.title}
                  fill
                  sizes="(max-width: 1023px) 170px, 380px"
                  loading={i < items.length * 2 ? 'eager' : 'lazy'}
                  className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              </div>
              <div className="p-2.5 sm:p-3 lg:px-6 lg:py-5 border-t border-stone-100">
                <span className={`text-[10px] sm:text-[11px] lg:text-xs font-bold uppercase tracking-wide block mb-0.5 lg:mb-1 ${item.eyebrowClass}`}>{item.eyebrow}</span>
                <h3 className="font-syne font-extrabold text-[10px] sm:text-sm lg:text-xl uppercase tracking-tight text-stone-950 leading-tight">
                  {item.title}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
