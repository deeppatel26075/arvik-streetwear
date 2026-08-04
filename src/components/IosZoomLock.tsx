'use client';

import { useEffect } from 'react';

export default function IosZoomLock() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Block multi-touch pinch zooming (2+ fingers)
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // 2. Block WebKit gesture zoom (pinch/rotate on iOS Safari)
    const handleGesture = (e: Event) => {
      e.preventDefault();
    };

    // 3. Block double-tap zooming
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        // Prevent default zoom action on double tap unless clicking interactive elements
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

    // Attach non-passive event listeners to intercept iOS Safari touch gestures
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('gesturestart', handleGesture, { passive: false });
    document.addEventListener('gesturechange', handleGesture, { passive: false });
    document.addEventListener('gestureend', handleGesture, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('gesturestart', handleGesture);
      document.removeEventListener('gesturechange', handleGesture);
      document.removeEventListener('gestureend', handleGesture);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return null;
}
