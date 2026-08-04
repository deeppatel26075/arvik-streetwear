'use client';

import { useEffect } from 'react';

export default function IosZoomLock() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Prevent 2-finger touchstart (pinch start)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // 3. Prevent 2-finger touchmove (pinch moving)
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // 4. Prevent WebKit gestures (iOS native pinch/zoom)
    const handleGesture = (e: Event) => {
      e.preventDefault();
    };

    // 5. Prevent Ctrl + Wheel zoom (trackpad pinch)
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    // 6. Prevent double-tap zoom
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        const target = e.target as HTMLElement;
        const isInteractive = target && (
          target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.closest('button') ||
          target.closest('a')
        );

        if (!isInteractive) {
          e.preventDefault();
        }
      }
      lastTouchEnd = now;
    };

    // Register on both window and document with non-passive listeners
    const options = { passive: false };

    window.addEventListener('touchstart', handleTouchStart, options);
    window.addEventListener('touchmove', handleTouchMove, options);
    window.addEventListener('touchend', handleTouchEnd, options);
    window.addEventListener('wheel', handleWheel, options);

    document.addEventListener('gesturestart', handleGesture, options);
    document.addEventListener('gesturechange', handleGesture, options);
    document.addEventListener('gestureend', handleGesture, options);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('wheel', handleWheel);

      document.removeEventListener('gesturestart', handleGesture);
      document.removeEventListener('gesturechange', handleGesture);
      document.removeEventListener('gestureend', handleGesture);
    };
  }, []);

  return null;
}
