import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, FileQuestion } from "lucide-react";
import { COMPANY_NAME } from "../config/branding";

const PageNotFound = () => {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100/90 via-white to-slate-50/95">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-10 text-center shadow-lg ring-1 ring-slate-900/5">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-hover shadow-lg shadow-brand-primary/25">
            <FileQuestion className="h-8 w-8 text-white" aria-hidden />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-primary sm:text-xs">
            404 · Page not found
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            This page isn’t in the system
          </h1>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
            The address <span className="font-mono text-slate-800">{pathname}</span> doesn’t match any
            route. Check the URL or return to the site home.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/Home"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-primary/25 transition hover:bg-brand-primary-hover"
            >
              <Home className="h-4 w-4" aria-hidden />
              Back to home
            </Link>
            <Link
              to="/LoginPage"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Go to login
            </Link>
          </div>
          <p className="mt-8 text-xs text-slate-500">{COMPANY_NAME}</p>
        </div>
      </div>
    </div>
  );
};

export default PageNotFound;
