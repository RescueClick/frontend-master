import React, { useState } from 'react';
import { Shield, Lock, Eye, FileText, Users, Mail } from 'lucide-react';
import { COMPANY_NAME, PRIVACY_EMAIL } from "../config/branding";

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState(null);

  const sections = [
    {
      id: 1,
      icon: <FileText className="w-6 h-6" />,
      title: "Information We Collect",
      content: [
        "Personal identification information (Name, email address, phone number)",
        "Financial information necessary for our services",
        "Usage data and analytics",
        "Device and browser information",
        "Cookies and similar tracking technologies"
      ]
    },
    {
      id: 2,
      icon: <Eye className="w-6 h-6" />,
      title: "How We Use Your Information",
      content: [
        "Provide and maintain our financial services",
        "Process transactions and send notifications",
        "Improve and personalize user experience",
        "Comply with legal obligations and regulations",
        "Prevent fraud and enhance security",
        "Send marketing communications (with your consent)"
      ]
    },
    {
      id: 3,
      icon: <Users className="w-6 h-6" />,
      title: "Information Sharing",
      content: [
        "We do not sell your personal information to third parties",
        "We may share data with trusted service providers",
        "Legal compliance and law enforcement requests",
        "Business transfers (mergers, acquisitions)",
        "With your explicit consent for specific purposes"
      ]
    },
    {
      id: 4,
      icon: <Lock className="w-6 h-6" />,
      title: "Data Security",
      content: [
        "Industry-standard encryption for data transmission",
        "Secure storage with access controls",
        "Regular security audits and assessments",
        "Employee training on data protection",
        "Incident response procedures",
        "Multi-factor authentication options"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Shield className="w-10 h-10 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
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
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">
                Your Privacy Matters to Us
              </h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                At {COMPANY_NAME}, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our financial services and website.
              </p>
              <p className="text-sm text-slate-600">
                <strong>Last Updated:</strong> December 2, 2025
              </p>
            </div>
          </div>
        </div>

        {/* Main Sections */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {sections.map((section) => (
            <div
              key={section.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 border border-slate-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                <div className="flex items-center gap-3">
                  {section.icon}
                  <h3 className="text-xl font-semibold">{section.title}</h3>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {section.content.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-700">
                      <span className="text-blue-600 mt-1 font-bold">•</span>
                      <span className="flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Sections */}
        <div className="space-y-6">
          {/* Your Rights */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4 flex items-center gap-3">
              <Users className="w-7 h-7 text-blue-600" />
              Your Rights
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-slate-700">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h4 className="font-semibold text-slate-900 mb-2">Access & Portability</h4>
                <p className="text-sm">Request access to your personal data and receive it in a portable format.</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h4 className="font-semibold text-slate-900 mb-2">Correction</h4>
                <p className="text-sm">Request correction of inaccurate or incomplete personal information.</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h4 className="font-semibold text-slate-900 mb-2">Deletion</h4>
                <p className="text-sm">Request deletion of your personal data, subject to legal obligations.</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h4 className="font-semibold text-slate-900 mb-2">Opt-Out</h4>
                <p className="text-sm">Unsubscribe from marketing communications at any time.</p>
              </div>
            </div>
          </div>

          {/* Cookies */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">Cookies & Tracking</h3>
            <p className="text-slate-700 mb-4">
              We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content. You can control cookies through your browser settings, though some features may not function properly if disabled.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900">
                <strong>Note:</strong> Essential cookies required for site functionality cannot be disabled.
              </p>
            </div>
          </div>

          {/* Data Retention */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">Data Retention</h3>
            <p className="text-slate-700">
              We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, comply with legal obligations, resolve disputes, and enforce our agreements. When data is no longer needed, we securely delete or anonymize it.
            </p>
          </div>

          {/* International Transfers */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">International Data Transfers</h3>
            <p className="text-slate-700">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
            </p>
          </div>

          {/* Children's Privacy */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">Children's Privacy</h3>
            <p className="text-slate-700">
              Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </div>

          {/* Changes to Policy */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">Changes to This Policy</h3>
            <p className="text-slate-700">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. We encourage you to review this policy periodically.
            </p>
          </div>
        </div>

        {/* Contact Section */}
        {/* <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-semibold mb-2 flex items-center gap-3">
                <Mail className="w-7 h-7" />
                Questions About Your Privacy?
              </h3>
              <p className="text-blue-100">
                We're here to help. Contact our privacy team for any concerns or inquiries.
              </p>
            </div>
            <a
              href={`mailto:${PRIVACY_EMAIL}`}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200 shadow-lg whitespace-nowrap"
            >
              Contact Us
            </a>
          </div>
        </div> */}
      </main>
    
    </div>
  );
}