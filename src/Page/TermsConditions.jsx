import React from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Scale,
  AlertCircle,
  CheckCircle,
  XCircle,
  Shield,
  Users,
  Briefcase,
} from "lucide-react";
import LegalPageShell, { LegalSection } from "../components/LegalPageShell";
import { COMPANY_NAME, LEGAL_EMAIL } from "../config/branding";

const toc = [
  { id: "overview", label: "Overview" },
  { id: "notice", label: "Important notice" },
  { id: "key-terms", label: "Key terms" },
  { id: "account-terms", label: "Account terms" },
  { id: "fees", label: "Fees & payment" },
  { id: "prohibited", label: "Prohibited activities" },
  { id: "ip", label: "Intellectual property" },
  { id: "liability", label: "Limitation of liability" },
  { id: "indemnification", label: "Indemnification" },
  { id: "termination", label: "Termination" },
  { id: "dispute", label: "Dispute resolution" },
  { id: "changes", label: "Changes to terms" },
  { id: "contact", label: "Contact" },
];

const mainSections = [
  {
    id: 1,
    icon: <CheckCircle className="h-6 w-6 shrink-0" aria-hidden />,
    title: "Acceptance of Terms",
    content: `By accessing and using ${COMPANY_NAME}'s services, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, you must not use our services. Your continued use of our platform constitutes acceptance of any updates or modifications to these terms.`,
  },
  {
    id: 2,
    icon: <Users className="h-6 w-6 shrink-0" aria-hidden />,
    title: "Eligibility",
    content:
      "You must be at least 18 years old and have the legal capacity to enter into binding contracts to use our services. By registering, you represent and warrant that all information provided is accurate, current, and complete. You are responsible for maintaining the confidentiality of your account credentials.",
  },
  {
    id: 3,
    icon: <Briefcase className="h-6 w-6 shrink-0" aria-hidden />,
    title: "Services Description",
    content: `${COMPANY_NAME} provides financial technology services including but not limited to payment processing, financial transactions, account management, and related financial services. We reserve the right to modify, suspend, or discontinue any aspect of our services at any time with or without notice.`,
  },
  {
    id: 4,
    icon: <Shield className="h-6 w-6 shrink-0" aria-hidden />,
    title: "User Responsibilities",
    content:
      "You agree to use our services only for lawful purposes and in accordance with these Terms. You must not use our services to engage in fraudulent activities, money laundering, or any illegal transactions. You are responsible for all activities conducted through your account.",
  },
];

export default function TermsConditions() {
  return (
    <LegalPageShell
      title="Terms & Conditions"
      titleIcon={<Scale className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />}
      meta={{ label: "Effective date", value: "December 2, 2025" }}
      toc={toc}
      hero={{
        id: "overview",
        title: `Welcome to ${COMPANY_NAME}`,
        icon: <FileText className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />,
        body: (
          <>
            <p>
              These Terms and Conditions govern your use of {COMPANY_NAME}&apos;s services and website.
              Please read these terms carefully before using our platform. By accessing or using our
              services, you agree to be bound by these terms and all applicable laws and regulations.
            </p>
          </>
        ),
      }}
      footerAside={
        <p className="border-t border-slate-200/90 pt-8 text-center text-sm text-slate-600">
          Related:{" "}
          <Link
            to="/PrivacyPolicy"
            className="font-semibold text-brand-primary underline-offset-4 outline-none hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            Privacy Policy
          </Link>
        </p>
      }
    >
      <div
        id="notice"
        className="scroll-mt-28 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-5 sm:p-6 md:p-7"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <AlertCircle className="h-6 w-6 shrink-0 text-amber-700 sm:mt-0.5" aria-hidden />
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-amber-950 sm:text-lg">Important notice</h2>
            <p className="mt-2 text-[15px] leading-7 text-amber-950/90 sm:text-base sm:leading-8">
              These terms include important information about your rights and obligations. Please review
              them carefully. By continuing to use our services, you acknowledge that you have read,
              understood, and agree to these terms.
            </p>
          </div>
        </div>
      </div>

      <div id="key-terms" className="scroll-mt-28 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
          Key terms
        </h2>
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
          {mainSections.map((section) => (
            <article
              key={section.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition hover:border-slate-300/90 hover:shadow-md"
            >
              <div className="flex items-center gap-3 bg-gradient-to-br from-brand-primary to-brand-primary-hover px-5 py-4 text-white sm:px-6 sm:py-5">
                {section.icon}
                <h3 className="text-base font-semibold leading-snug sm:text-lg">{section.title}</h3>
              </div>
              <p className="border-t border-slate-100 p-5 text-[15px] leading-7 text-slate-700 sm:p-6 sm:text-base sm:leading-8">
                {section.content}
              </p>
            </article>
          ))}
        </div>
      </div>

      <LegalSection id="account-terms" title="Account terms">
        <ul className="list-none space-y-3">
          {[
            "You must provide accurate and complete registration information.",
            "You are responsible for maintaining the security of your account and password.",
            "You must notify us immediately of any unauthorized use of your account.",
            "One person or legal entity may not maintain more than one account without authorization.",
            "We reserve the right to suspend or terminate accounts that violate these terms.",
          ].map((line) => (
            <li key={line} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection id="fees" title="Fees and payment">
        <p>
          Certain services may be subject to fees. All applicable fees will be clearly disclosed before
          you complete a transaction. You agree to pay all fees associated with your use of our services.
        </p>
        <div className="rounded-xl border border-brand-primary/15 bg-brand-primary/5 p-4 sm:p-5">
          <h4 className="font-semibold text-slate-900">Payment terms</h4>
          <ul className="mt-3 list-none space-y-2.5 text-[14px] sm:text-[15px]">
            {[
              "All fees are non-refundable unless otherwise stated.",
              "We may change fees with 30 days advance notice.",
              "You authorize us to charge your payment method on file.",
              "Failed payments may result in service suspension.",
            ].map((line) => (
              <li key={line} className="flex gap-2.5">
                <span className="font-medium text-brand-primary" aria-hidden>
                  ·
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </LegalSection>

      <LegalSection id="prohibited" title="Prohibited activities" icon={<XCircle className="text-red-600" />}>
        <p>You agree not to engage in any of the following prohibited activities:</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            "Fraudulent or illegal transactions",
            "Money laundering or terrorist financing",
            "Violating any applicable laws or regulations",
            "Attempting to gain unauthorized access",
            "Interfering with service operations",
            "Transmitting malware or harmful code",
          ].map((label) => (
            <div
              key={label}
              className="flex gap-2.5 rounded-xl border border-red-100 bg-red-50/80 p-4 text-[14px] leading-relaxed text-slate-800 sm:text-[15px]"
            >
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection id="ip" title="Intellectual property">
        <p>
          All content, features, and functionality of our services, including but not limited to text,
          graphics, logos, icons, images, software, and trademarks, are the exclusive property of{" "}
          {COMPANY_NAME} and are protected by international copyright, trademark, and other intellectual
          property laws.
        </p>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
          <p className="text-[14px] sm:text-[15px]">
            You may not reproduce, distribute, modify, create derivative works of, publicly display, or
            otherwise use any content without our express written permission.
          </p>
        </div>
      </LegalSection>

      <LegalSection id="liability" title="Limitation of liability">
        <p>
          To the maximum extent permitted by law, {COMPANY_NAME} shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages, or any loss of profits or revenues,
          whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible
          losses resulting from:
        </p>
        <ol className="list-none space-y-3">
          {[
            "Your access to or use of or inability to access or use our services",
            "Any conduct or content of any third party on our services",
            "Any content obtained from our services",
            "Unauthorized access, use, or alteration of your transmissions or content",
          ].map((line, i) => (
            <li key={line} className="flex gap-3">
              <span className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-md bg-slate-100 text-sm font-semibold text-brand-primary">
                {i + 1}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      </LegalSection>

      <LegalSection id="indemnification" title="Indemnification">
        <p>
          You agree to indemnify, defend, and hold harmless {COMPANY_NAME}, its officers, directors,
          employees, and agents from and against any claims, liabilities, damages, losses, and expenses,
          including reasonable attorney&apos;s fees, arising out of or in any way connected with your
          access to or use of our services, your violation of these Terms, or your violation of any rights
          of another party.
        </p>
      </LegalSection>

      <LegalSection id="termination" title="Termination">
        <p>
          We may terminate or suspend your account and access to our services immediately, without prior
          notice or liability, for any reason, including if you breach these Terms.
        </p>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
          <p className="text-[14px] sm:text-[15px]">
            Upon termination, your right to use our services will immediately cease. All provisions of
            these Terms which by their nature should survive termination shall survive, including ownership
            provisions, warranty disclaimers, indemnity, and limitations of liability.
          </p>
        </div>
      </LegalSection>

      <LegalSection id="dispute" title="Dispute resolution">
        <p>
          Any dispute arising from these Terms or your use of our services shall be resolved through
          binding arbitration in accordance with the rules of the American Arbitration Association.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-brand-primary/15 bg-brand-primary/5 p-4 sm:p-5">
            <h4 className="font-semibold text-slate-900">Governing law</h4>
            <p className="mt-2 text-[14px] sm:text-[15px]">
              These Terms shall be governed by and construed in accordance with applicable laws.
            </p>
          </div>
          <div className="rounded-xl border border-brand-primary/15 bg-brand-primary/5 p-4 sm:p-5">
            <h4 className="font-semibold text-slate-900">Class action waiver</h4>
            <p className="mt-2 text-[14px] sm:text-[15px]">
              You agree to bring claims only on an individual basis, not as part of a class action.
            </p>
          </div>
        </div>
      </LegalSection>

      <LegalSection id="changes" title="Changes to terms">
        <p>
          We reserve the right to modify these Terms at any time. We will notify users of any material
          changes by posting the updated Terms on our website and updating the &quot;Effective Date&quot;
          at the top of this page. Your continued use of our services after such modifications constitutes
          your acceptance of the updated Terms.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact information">
        <p>If you have any questions about these Terms and Conditions, please contact us:</p>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6">
          <dl className="space-y-2 text-[15px] sm:text-base">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</dt>
              <dd>
                <a
                  href={`mailto:${LEGAL_EMAIL}`}
                  className="font-medium text-brand-primary underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                >
                  {LEGAL_EMAIL}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Address</dt>
              <dd>{COMPANY_NAME} Legal Department</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</dt>
              <dd>Available through customer support</dd>
            </div>
          </dl>
        </div>
      </LegalSection>

      <div className="rounded-2xl border border-brand-primary/20 bg-gradient-to-br from-brand-primary to-brand-primary-hover p-6 text-white shadow-lg sm:p-8 md:p-10">
        <div className="mx-auto max-w-xl text-center">
          <Scale className="mx-auto mb-4 h-10 w-10 opacity-95 sm:h-12 sm:w-12" aria-hidden />
          <h3 className="text-lg font-semibold sm:text-xl">Questions about these terms?</h3>
          <p className="mt-3 text-sm leading-relaxed text-white/90 sm:text-base">
            Our legal team is available to answer questions about these Terms and Conditions.
          </p>
          <a
            href={`mailto:${LEGAL_EMAIL}`}
            className="mt-6 inline-flex min-h-[48px] w-full max-w-xs items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-brand-primary shadow-md transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary sm:w-auto"
          >
            Contact legal team
          </a>
        </div>
      </div>
    </LegalPageShell>
  );
}
