import React from 'react';

// Shown while a route segment is loading. Deliberately lightweight: a thin
// progress bar under the navbar instead of a full-screen white overlay, so
// navigating between pages never blanks the whole site. min-h keeps the
// footer from jumping up into view while the next page streams in.
export default function Loading() {
  return (
    <div className="relative w-full min-h-[70vh]" aria-busy="true" aria-label="Loading">
      <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden bg-stone-100">
        <div className="h-full w-1/3 bg-stone-900 animate-[arviik-progress_1s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
