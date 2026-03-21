import React, { useState } from 'react';
import { FileText, Scale, AlertCircle, CheckCircle, XCircle, DollarSign, Shield, Users } from 'lucide-react';
import { COMPANY_NAME, LEGAL_EMAIL } from "../config/branding";

export default function TermsConditions() {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const mainSections = [
    {
      id: 1,
      icon: <CheckCircle className="w-6 h-6" />,
      title: "Acceptance of Terms",
      content: `By accessing and using ${COMPANY_NAME}'s services, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, you must not use our services. Your continued use of our platform constitutes acceptance of any updates or modifications to these terms.`
    },
    {
      id: 2,
      icon: <Users className="w-6 h-6" />,
      title: "Eligibility",
      content: "You must be at least 18 years old and have the legal capacity to enter into binding contracts to use our services. By registering, you represent and warrant that all information provided is accurate, current, and complete. You are responsible for maintaining the confidentiality of your account credentials."
    },
    {
      id: 3,
      icon: "",
      title: "Services Description",
      content: `${COMPANY_NAME} provides financial technology services including but not limited to payment processing, financial transactions, account management, and related financial services. We reserve the right to modify, suspend, or discontinue any aspect of our services at any time with or without notice.`
    },
    {
      id: 4,
      icon: <Shield className="w-6 h-6" />,
      title: "User Responsibilities",
      content: "You agree to use our services only for lawful purposes and in accordance with these Terms. You must not use our services to engage in fraudulent activities, money laundering, or any illegal transactions. You are responsible for all activities conducted through your account."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Scale className="w-10 h-10 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Terms & Conditions</h1>
              <p className="text-sm text-slate-600 mt-1">{COMPANY_NAME}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 rounded-full p-3">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">
                Welcome to {COMPANY_NAME}
              </h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                These Terms and Conditions govern your use of {COMPANY_NAME}&apos;s services and website. Please read these terms carefully before using our platform. By accessing or using our services, you agree to be bound by these terms and all applicable laws and regulations.
              </p>
              <p className="text-sm text-slate-600">
                <strong>Effective Date:</strong> December 2, 2025
              </p>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-6 mb-8 shadow-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">Important Notice</h3>
              <p className="text-amber-800 text-sm">
                These terms include important information about your rights and obligations. Please review them carefully. By continuing to use our services, you acknowledge that you have read, understood, and agree to these terms.
              </p>
            </div>
          </div>
        </div>

        {/* Main Sections Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {mainSections.map((section) => (
            <div
              key={section.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 border border-slate-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r bg-brand-primary text-white p-6">
                <div className="flex items-center gap-3">
                  {section.icon}
                  <h3 className="text-xl font-semibold">{section.title}</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-slate-700 leading-relaxed">{section.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Sections */}
        <div className="space-y-6">
          {/* Account Terms */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">Account Terms</h3>
            <div className="space-y-4 text-slate-700">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <p>You must provide accurate and complete registration information</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <p>You are responsible for maintaining the security of your account and password</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <p>You must notify us immediately of any unauthorized use of your account</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <p>One person or legal entity may not maintain more than one account without authorization</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <p>We reserve the right to suspend or terminate accounts that violate these terms</p>
              </div>
            </div>
          </div>

          {/* Fees and Payment */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4 flex items-center gap-3">
              Fees and Payment
            </h3>
            <p className="text-slate-700 mb-4">
              Certain services may be subject to fees. All applicable fees will be clearly disclosed before you complete a transaction. You agree to pay all fees associated with your use of our services.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2">Payment Terms:</h4>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">→</span>
                  <span>All fees are non-refundable unless otherwise stated</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">→</span>
                  <span>We may change fees with 30 days advance notice</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">→</span>
                  <span>You authorize us to charge your payment method on file</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">→</span>
                  <span>Failed payments may result in service suspension</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Prohibited Activities */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4 flex items-center gap-3">
              <XCircle className="w-7 h-7 text-red-600" />
              Prohibited Activities
            </h3>
            <p className="text-slate-700 mb-4">You agree not to engage in any of the following prohibited activities:</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-slate-700 flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>Fraudulent or illegal transactions</span>
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-slate-700 flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>Money laundering or terrorist financing</span>
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-slate-700 flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>Violating any applicable laws or regulations</span>
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-slate-700 flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>Attempting to gain unauthorized access</span>
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-slate-700 flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>Interfering with service operations</span>
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-slate-700 flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>Transmitting malware or harmful code</span>
                </p>
              </div>
            </div>
          </div>

          {/* Intellectual Property */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">Intellectual Property</h3>
            <p className="text-slate-700 mb-4">
              All content, features, and functionality of our services, including but not limited to text, graphics, logos, icons, images, software, and trademarks, are the exclusive property of {COMPANY_NAME} and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm text-slate-700">
                You may not reproduce, distribute, modify, create derivative works of, publicly display, or otherwise use any content without our express written permission.
              </p>
            </div>
          </div>

          {/* Limitation of Liability */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">Limitation of Liability</h3>
            <p className="text-slate-700 mb-4">
              To the maximum extent permitted by law, {COMPANY_NAME} shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-slate-700">
                <span className="text-blue-600 font-bold mt-1">1.</span>
                <p>Your access to or use of or inability to access or use our services</p>
              </div>
              <div className="flex items-start gap-3 text-slate-700">
                <span className="text-blue-600 font-bold mt-1">2.</span>
                <p>Any conduct or content of any third party on our services</p>
              </div>
              <div className="flex items-start gap-3 text-slate-700">
                <span className="text-blue-600 font-bold mt-1">3.</span>
                <p>Any content obtained from our services</p>
              </div>
              <div className="flex items-start gap-3 text-slate-700">
                <span className="text-blue-600 font-bold mt-1">4.</span>
                <p>Unauthorized access, use, or alteration of your transmissions or content</p>
              </div>
            </div>
          </div>

          {/* Indemnification */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">Indemnification</h3>
            <p className="text-slate-700">
              You agree to indemnify, defend, and hold harmless {COMPANY_NAME}, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorney's fees, arising out of or in any way connected with your access to or use of our services, your violation of these Terms, or your violation of any rights of another party.
            </p>
          </div>

          {/* Termination */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">Termination</h3>
            <p className="text-slate-700 mb-4">
              We may terminate or suspend your account and access to our services immediately, without prior notice or liability, for any reason, including if you breach these Terms.
            </p>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm text-slate-700">
                Upon termination, your right to use our services will immediately cease. All provisions of these Terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
              </p>
            </div>
          </div>

          {/* Dispute Resolution */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">Dispute Resolution</h3>
            <p className="text-slate-700 mb-4">
              Any dispute arising from these Terms or your use of our services shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h4 className="font-semibold text-slate-900 mb-2">Governing Law</h4>
                <p className="text-sm text-slate-700">These Terms shall be governed by and construed in accordance with applicable laws.</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h4 className="font-semibold text-slate-900 mb-2">Class Action Waiver</h4>
                <p className="text-sm text-slate-700">You agree to bring claims only on an individual basis, not as part of a class action.</p>
              </div>
            </div>
          </div>

          {/* Changes to Terms */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">Changes to Terms</h3>
            <p className="text-slate-700">
              We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the updated Terms on our website and updating the "Effective Date" at the top of this page. Your continued use of our services after such modifications constitutes your acceptance of the updated Terms.
            </p>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">Contact Information</h3>
            <p className="text-slate-700 mb-4">
              If you have any questions about these Terms and Conditions, please contact us:
            </p>
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <div className="space-y-2 text-slate-700">
                <p><strong>Email:</strong> {LEGAL_EMAIL}</p>
                <p><strong>Address:</strong> {COMPANY_NAME} Legal Department</p>
                <p><strong>Phone:</strong> Available through customer support</p>
              </div>
            </div>
          </div>
        </div>

        {/* Acknowledgment CTA */}
        <div className="mt-8 bg-gradient-to-r bg-brand-primary rounded-2xl shadow-xl p-8 text-white">
          <div className="text-center">
            <Scale className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-3">
              Questions About These Terms?
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Our legal team is available to answer any questions you may have about these Terms and Conditions.
            </p>
            <a
              href={`mailto:${LEGAL_EMAIL}`}
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200 shadow-lg"
            >
              Contact Legal Team
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}