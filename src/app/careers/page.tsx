import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Mail, PenTool, Camera, Megaphone, Package } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Careers | ARVIIK',
  description:
    'There are no open roles at ARVIIK right now. Introduce yourself and we will reach out when the team grows.',
};

// When a role opens, add it to OPEN_ROLES and the "no openings" panel is
// replaced by the list automatically.
const OPEN_ROLES: { title: string; type: string; location: string; href: string }[] = [];

const CAREERS_EMAIL = 'info@arviik.in';

const FUTURE_AREAS = [
  { icon: PenTool, title: 'Design', text: 'Graphics, prints and concepts with something to say.' },
  { icon: Camera, title: 'Content', text: 'Photo, video and storytelling around each drop.' },
  { icon: Megaphone, title: 'Community', text: 'Growing the people who wear the identity.' },
  { icon: Package, title: 'Operations', text: 'Getting every order out fast and right.' },
];

export default function CareersPage() {
  const hasOpenings = OPEN_ROLES.length > 0;
  const mailto = `mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent('Careers at ARVIIK — Introduction')}`;

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-stone-950 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(163,230,53,0.10),transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center space-y-5">
          <span className="text-[10px] text-lime-400 font-extrabold tracking-[0.35em] uppercase block">
            Careers
          </span>
          <h1 className="font-syne font-extrabold text-4xl sm:text-6xl uppercase tracking-wider text-white leading-[0.95]">
            Build The Identity
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 font-medium max-w-md mx-auto leading-relaxed">
            ARVIIK is a small team with big ideas about what streetwear should say. When we grow,
            we want people who care about it as much as we do.
          </p>
        </div>
      </section>

      {/* Openings */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        {hasOpenings ? (
          <ul className="space-y-3">
            {OPEN_ROLES.map((r) => (
              <li key={r.title}>
                <Link
                  href={r.href}
                  className="flex items-center justify-between gap-4 p-5 border border-stone-200 rounded-xl hover:border-stone-900 transition-colors"
                >
                  <div>
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-stone-900">{r.title}</h3>
                    <p className="text-[11px] text-stone-500 font-medium mt-1">{r.type} · {r.location}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-stone-900 flex-shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="relative text-center border border-dashed border-stone-300 rounded-2xl px-6 py-12 sm:py-14 space-y-4">
            <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.3em] text-stone-500">
              <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
              Open Positions · 0
            </span>
            <h2 className="font-syne font-extrabold text-2xl sm:text-3xl uppercase tracking-wider text-stone-950">
              No Openings Yet
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 font-medium max-w-md mx-auto leading-relaxed">
              We&apos;re not hiring right now. But if ARVIIK feels like you, we&apos;d still like to
              hear from you. Send us a short intro and your work, and we&apos;ll reach out when a role
              opens up.
            </p>
            <div className="pt-2">
              <a
                href={mailto}
                className="inline-flex items-center gap-2 bg-stone-950 hover:bg-stone-900 text-white text-xs font-extrabold uppercase tracking-widest px-7 py-4 rounded-xl transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>Introduce Yourself</span>
              </a>
              <p className="text-[11px] text-stone-400 font-medium mt-3">{CAREERS_EMAIL}</p>
            </div>
          </div>
        )}
      </section>

      {/* Where we'll grow */}
      <section className="bg-stone-50 border-y border-stone-200/60 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-[10px] text-stone-400 font-extrabold tracking-[0.3em] uppercase block">
              Future Roles
            </span>
            <h2 className="font-syne font-extrabold text-xl sm:text-2xl uppercase tracking-wider text-stone-950">
              Where We&apos;ll Grow
            </h2>
            <p className="text-xs text-stone-500 font-medium max-w-md mx-auto leading-relaxed">
              The kind of work we expect to hire for first. Mention any of these in your intro.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FUTURE_AREAS.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.title} className="p-5 bg-white border border-stone-200/80 rounded-xl space-y-3">
                  <div className="h-9 w-9 rounded-full bg-stone-950 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-lime-400" />
                  </div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-900">{a.title}</h3>
                  <p className="text-[11px] text-stone-500 leading-relaxed font-medium">{a.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center space-y-5">
        <h2 className="font-syne font-extrabold text-xl sm:text-2xl uppercase tracking-wider text-stone-950">
          Until Then, Wear The Identity
        </h2>
        <Link
          href="/shop"
          className="inline-flex items-center space-x-2 bg-stone-950 hover:bg-stone-900 text-white text-xs font-extrabold uppercase tracking-widest px-8 py-4 rounded-xl transition-colors"
        >
          <span>Shop The Collection</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
