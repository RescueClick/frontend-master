import React from "react";
import { Link } from "react-router-dom";
import { Shield, Lock, Eye, FileText, Users, Mail } from "lucide-react";
import LegalPageShell, { LegalSection } from "../components/LegalPageShell";
import { COMPANY_NAME, PRIVACY_EMAIL } from "../config/branding";

const toc = [
  { id: "overview", label: "Overview" },
  { id: "collect", label: "Information we collect" },
  { id: "use", label: "How we use data" },
  { id: "sharing", label: "Information sharing" },
  { id: "security", label: "Data security" },
  { id: "rights", label: "Your rights" },
  { id: "cookies", label: "Cookies & tracking" },
  { id: "retention", label: "Data retention" },
  { id: "international", label: "International transfers" },
  { id: "children", label: "Children's privacy" },
  { id: "changes", label: "Policy changes" },
  { id: "contact", label: "Contact" },
];

const summaryCards = [
  {
    id: "collect",
    icon: <FileText className="h-6 w-6 shrink-0" aria-hidden />,
    title: "Information we collect",
    items: [
      "Personal identification information (name, email address, phone number)",
      "Financial information necessary for our services",
      "Usage data and analytics",
      "Device and browser information",
      "Cookies and similar tracking technologies",
    ],
  },
  {
    id: "use",
    icon: <Eye className="h-6 w-6 shrink-0" aria-hidden />,
    title: "How we use your information",
    items: [
      "Provide and maintain our financial services",
      "Process transactions and send notifications",
      "Improve and personalize user experience",
      "Comply with legal obligations and regulations",
      "Prevent fraud and enhance security",
      "Send marketing communications (with your consent)",
    ],
  },
  {
    id: "sharing",
    icon: <Users className="h-6 w-6 shrink-0" aria-hidden />,
    title: "Information sharing",
    items: [
      "We do not sell your personal information to third parties",
      "We may share data with trusted service providers",
      "Legal compliance and law enforcement requests",
      "Business transfers (mergers, acquisitions)",
      "With your explicit consent for specific purposes",
    ],
  },
  {
    id: "security",
    icon: <Lock className="h-6 w-6 shrink-0" aria-hidden />,
    title: "Data security",
    items: [
      "Industry-standard encryption for data transmission",
      "Secure storage with access controls",
      "Regular security audits and assessments",
      "Employee training on data protection",
      "Incident response procedures",
      "Multi-factor authentication options",
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      titleIcon={<Shield className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />}
      meta={{ label: "Last updated", value: "December 2, 2025" }}
      toc={toc}
      hero={{
        id: "overview",
        title: "Your privacy matters to us",
        icon: <Shield className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />,
        body: (
          <p>
            At {COMPANY_NAME}, we are committed to protecting your privacy and ensuring the security of
            your personal information. This Privacy Policy explains how we collect, use, disclose, and
            safeguard your information when you use our financial services and website.
          </p>
        ),
      }}
      footerAside={
        <p className="border-t border-slate-200/90 pt-8 text-center text-sm text-slate-600">
          Related:{" "}
          <Link
            to="/TermsConditions"
            className="font-semibold text-brand-primary underline-offset-4 outline-none hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            Terms & Conditions
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
          Summary
        </h2>
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
          {summaryCards.map((section) => (
            <article
              key={section.id}
              id={section.id}
              className="scroll-mt-28 flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition hover:border-slate-300/90 hover:shadow-md"
            >
              <div className="flex items-center gap-3 bg-gradient-to-br from-brand-primary to-brand-primary-hover px-5 py-4 text-white sm:px-6 sm:py-5">
                {section.icon}
                <h3 className="text-base font-semibold leading-snug sm:text-lg">{section.title}</h3>
              </div>
              <ul className="list-none space-y-2.5 border-t border-slate-100 p-5 sm:p-6">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3 text-[15px] leading-7 text-slate-700 sm:text-base sm:leading-8">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>

      <LegalSection id="rights" title="Your rights" icon={<Users className="text-brand-primary" aria-hidden />}>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { h: "Access & portability", p: "Request access to your personal data and receive it in a portable format." },
            { h: "Correction", p: "Request correction of inaccurate or incomplete personal information." },
            { h: "Deletion", p: "Request deletion of your personal data, subject to legal obligations." },
            { h: "Opt-out", p: "Unsubscribe from marketing communications at any time." },
          ].map((card) => (
            <div
              key={card.h}
              className="rounded-xl border border-brand-primary/15 bg-brand-primary/5 p-4 sm:p-5"
            >
              <h4 className="font-semibold text-slate-900">{card.h}</h4>
              <p className="mt-2 text-[14px] leading-relaxed sm:text-[15px]">{card.p}</p>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection id="cookies" title="Cookies & tracking">
        <p>
          We use cookies and similar technologies to enhance your experience, analyze usage, and provide
          personalized content. You can control cookies through your browser settings, though some features
          may not function properly if disabled.
        </p>
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 p-4 sm:p-5">
          <p className="text-[14px] text-amber-950 sm:text-[15px]">
            <strong className="font-semibold">Note:</strong> Essential cookies required for site
            functionality cannot be disabled.
          </p>
        </div>
      </LegalSection>

      <LegalSection id="retention" title="Data retention">
        <p>
          We retain your personal information only for as long as necessary to fulfill the purposes
          outlined in this Privacy Policy, comply with legal obligations, resolve disputes, and enforce our
          agreements. When data is no longer needed, we securely delete or anonymize it.
        </p>
      </LegalSection>

      <LegalSection id="international" title="International data transfers">
        <p>
          Your information may be transferred to and processed in countries other than your own. We ensure
          appropriate safeguards are in place to protect your data in accordance with this Privacy Policy
          and applicable laws.
        </p>
      </LegalSection>

      <LegalSection id="children" title="Children's privacy">
        <p>
          Our services are not intended for individuals under the age of 18. We do not knowingly collect
          personal information from children. If you believe we have collected information from a child,
          please contact us immediately.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any material changes by
          posting the new policy on this page and updating the &quot;Last Updated&quot; date. We encourage you
          to review this policy periodically.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact us">
        <p>
          For privacy-related questions or requests, reach out to our team. We aim to respond in a
          reasonable timeframe.
        </p>
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <Mail className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Privacy team</p>
              <p className="mt-0.5 text-sm text-slate-600">{PRIVACY_EMAIL}</p>
            </div>
          </div>
          <a
            href={`mailto:${PRIVACY_EMAIL}`}
            className="inline-flex min-h-[48px] w-full shrink-0 items-center justify-center rounded-xl bg-brand-primary px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 sm:w-auto"
          >
            Email privacy
          </a>
        </div>
      </LegalSection>
    </LegalPageShell>
  );
}
