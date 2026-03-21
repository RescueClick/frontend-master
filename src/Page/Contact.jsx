import React, { useState } from "react";
import { Send, Phone, Mail, MessageSquare, User, CheckCircle } from "lucide-react";
import { backendurl } from "../feature/urldata";
import { COMPANY_NAME, CONTACT_EMAIL } from "../config/branding";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    queries: "",
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }
    if (!formData.queries.trim()) newErrors.queries = "Please tell us about your queries";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await fetch(`${backendurl}/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            message: formData.queries,
          }),
        });
        const data = await response.json();
        if (data.success) {
          alert("Success! We'll get back to you shortly.");
          setFormData({ name: "", email: "", phone: "", queries: "" });
          setIsSubmitted(true);
        } else {
          alert("Failed to send email. Please try again.");
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        alert("Something went wrong. Please try again.");
      }
    } else {
      setErrors(newErrors);
    }
  };

  const inputClass = (field) =>
    `w-full rounded-xl border px-4 py-3 text-slate-900 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
      errors[field]
        ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
        : "border-slate-200 bg-white focus:border-brand-primary focus:ring-brand-primary/20"
    }`;

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100/90 via-white to-slate-50/95 py-16 px-4 sm:py-24">
        <div className="mx-auto max-w-lg">
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-10 text-center shadow-lg ring-1 ring-slate-900/5">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-hover shadow-lg shadow-brand-primary/25">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Thank you</h2>
            <p className="mt-3 text-slate-600">
              Your message has been sent. Our team will get back to you within 24 hours.
            </p>
            <div className="mt-8 rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-5 py-4 text-left text-sm text-slate-700">
              <p className="font-semibold text-slate-900">What happens next?</p>
              <p className="mt-2 leading-relaxed text-slate-600">
                We review your query and respond with next steps tailored to your needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero — Home-style dark band */}
      <section className="relative overflow-hidden bg-slate-950 py-14 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.98)_0%,rgba(15,23,42,0.92)_40%,rgba(13,148,136,0.12)_100%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-15%,rgba(13,148,136,0.2),transparent_60%)]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-primary-light sm:text-xs">Contact us</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
            Talk to{" "}
            <span className="bg-gradient-to-r from-brand-primary-light via-emerald-300 to-brand-primary bg-clip-text text-transparent">
              {COMPANY_NAME}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Share your query—we’ll connect you with the right specialist for loans, partnerships, or platform support.
          </p>
        </div>
      </section>

      <section className="relative border-t border-slate-200 bg-gradient-to-b from-slate-50/80 to-white py-14 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(13,148,136,0.06),transparent_55%)]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-12 lg:items-start">
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)] sm:p-8 lg:p-10">
              <div className="mb-8 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Send a message</h2>
                  <p className="mt-1 text-sm text-slate-600">We typically reply within one business day.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <User className="h-4 w-4 text-brand-primary" />
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={inputClass("name")}
                    placeholder="Full name"
                  />
                  {errors.name && <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Mail className="h-4 w-4 text-brand-primary" />
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClass("email")}
                    placeholder="you@example.com"
                  />
                  {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
                </div>
                <div>
                  <label htmlFor="phone" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Phone className="h-4 w-4 text-brand-primary" />
                    Phone *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputClass("phone")}
                    placeholder="10-digit mobile number"
                  />
                  {errors.phone && <p className="mt-1.5 text-sm text-red-600">{errors.phone}</p>}
                </div>
                <div>
                  <label htmlFor="queries" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <MessageSquare className="h-4 w-4 text-brand-primary" />
                    Message *
                  </label>
                  <textarea
                    id="queries"
                    name="queries"
                    rows={5}
                    value={formData.queries}
                    onChange={handleChange}
                    className={`${inputClass("queries")} resize-y`}
                    placeholder="Loan needs, partnership interest, or other questions…"
                  />
                  {errors.queries && <p className="mt-1.5 text-sm text-red-600">{errors.queries}</p>}
                </div>
                <button
                  type="submit"
                  className="inline-flex w-full min-h-[48px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-hover px-8 py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-primary/25 transition hover:from-brand-primary-hover hover:to-[#0d5c56] hover:shadow-lg sm:text-base"
                >
                  <Send className="h-5 w-5" />
                  Send message
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
                <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">Why {COMPANY_NAME}?</h3>
                <ul className="mt-5 space-y-4 text-sm text-slate-600 sm:text-[15px]">
                  {[
                    { t: "Digital-first", d: "Apply and track progress without repeated branch visits." },
                    { t: "Expert guidance", d: "Structured support for customers and channel partners." },
                    { t: "Wide lender network", d: "Options across banks and NBFCs on one platform." },
                    { t: "Pan-India", d: "Serving users and partners across regions." },
                  ].map((item) => (
                    <li key={item.t} className="flex gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
                      <span>
                        <span className="font-medium text-slate-800">{item.t}</span>
                        <span className="mt-0.5 block text-slate-600">{item.d}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-900 text-white shadow-lg">
                <div className="h-1 w-full bg-gradient-to-r from-brand-primary to-teal-500" aria-hidden />
                <div className="p-6 sm:p-8">
                  <h3 className="text-lg font-semibold sm:text-xl">Direct contact</h3>
                  <div className="mt-6 space-y-5 text-sm">
                    <a href="tel:+918766681450" className="flex items-start gap-3 transition hover:text-brand-primary-light">
                      <Phone className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary-light" />
                      <span>
                        <span className="font-semibold">+91 8766681450</span>
                        <span className="mt-0.5 block text-xs text-slate-400">Mon–Fri, 9:00 AM – 6:00 PM</span>
                      </span>
                    </a>
                    <a
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT_EMAIL)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 break-all transition hover:text-brand-primary-light"
                    >
                      <Mail className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary-light" />
                      <span className="font-medium">{CONTACT_EMAIL}</span>
                    </a>
                    <div className="flex items-start gap-3">
                      <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary-light" />
                      <span className="text-slate-300">All-India service for customers and partners.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
