import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { COMPANY_NAME } from "../config/branding";

/**
 * Shared layout for legal documents: sticky header, optional TOC, readable column.
 */
export default function LegalPageShell({
  title,
  titleIcon,
  meta,
  hero,
  toc = [],
  children,
  footerAside,
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-5 lg:max-w-7xl">
          <Link
            to="/Home"
            className="mb-4 inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-600 outline-none transition hover:text-brand-primary focus-visible:rounded focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 sm:mb-5"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Back to home
          </Link>
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary sm:h-12 sm:w-12">
              {titleIcon}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
                {title}
              </h1>
              <p className="mt-0.5 text-sm text-slate-600 sm:text-base">{COMPANY_NAME}</p>
              {meta ? (
                <p className="mt-3 text-xs text-slate-500 sm:text-sm">
                  <span className="font-medium text-slate-400">{meta.label}</span>
                  <span className="mx-1.5 text-slate-300" aria-hidden>
                    ·
                  </span>
                  <span className="font-medium text-slate-700">{meta.value}</span>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:max-w-7xl lg:py-12">
        <div className="lg:grid lg:grid-cols-[minmax(0,15.5rem)_minmax(0,1fr)] lg:gap-9 xl:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)] xl:gap-12">
          {toc.length > 0 ? (
            <aside className="mb-8 lg:mb-0">
              <nav
                aria-label="On this page"
                className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:p-5"
              >
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  On this page
                </p>
                <ul className="space-y-0.5 text-sm">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="block rounded-lg px-2 py-1.5 text-slate-600 outline-none transition hover:bg-slate-50 hover:text-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          ) : null}
          <div className="min-w-0 space-y-8 sm:space-y-10">
            {hero ? (
              <section
                id={hero.id}
                className="scroll-mt-28 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-7 md:p-8"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                  {hero.icon ? (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                      {hero.icon}
                    </div>
                  ) : null}
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{hero.title}</h2>
                    <div className="mt-3 space-y-3 text-[15px] leading-7 text-slate-700 sm:text-base sm:leading-8">
                      {hero.body}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
            {children}
            {footerAside}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Consistent card wrapper for legal sections */
export function LegalSection({ id, title, icon, children, className = "" }) {
  return (
    <section
      id={id}
      className={`scroll-mt-28 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-7 md:p-8 ${className}`}
    >
      <h3 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-slate-900 sm:text-xl">
        {icon ? (
          <span className="inline-flex shrink-0 [&_svg]:h-6 [&_svg]:w-6 sm:[&_svg]:h-7 sm:[&_svg]:w-7">{icon}</span>
        ) : null}
        {title}
      </h3>
      <div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-700 sm:text-base sm:leading-8">
        {children}
      </div>
    </section>
  );
}
