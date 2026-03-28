import React, { useState, useEffect } from "react";
import { Menu, X, ChevronDown, Phone, Mail, Clock, LayoutDashboard } from "lucide-react";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { brandLogo, COMPANY_NAME, COMPANY_NAME_LEGAL, COMPANY_TAGLINE, CONTACT_EMAIL } from "../config/branding";
import { getSessionDashboardBasePath } from "../utils/sessionDashboardPath";


const MainLayout = () => {

  const navigate = useNavigate();
  const location = useLocation();
  const sessionDashboardPath = getSessionDashboardBasePath();



  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navItems = [
    // Keep paths aligned with `AppRoutes.jsx` (note: `Home` uses uppercase path today)
    { name: "Home", href: "/Home" },
    { name: "Services", href: "/services" },
    { name: "Channel Partner", href: "/channel-partner" },
    { name: "Documents", href: "/documents" },
    { name: "About Us", href: "/about-us" },
    { name: "Contact Us", href: "/contact" },

  ];

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const isPathActive = (href) => {
    // Treat "/" as Home and make matching case-insensitive
    const current = (location.pathname || "/").toLowerCase();
    const target = (href || "/").toLowerCase();

    if (target === "/home") {
      return current === "/" || current === "/home";
    }
    return current === target || current.startsWith(`${target}/`);
  };

  return (

    <>

      <div className="sticky top-0 z-50 w-full bg-white shadow-md">
        <div className="hidden lg:block bg-gray-900 text-gray-200 text-[11px] sm:text-xs md:text-sm w-full font-inter">
          <div className="w-full px-3 sm:px-4 lg:px-8 py-2.5 flex flex-col sm:flex-wrap sm:flex-row items-center gap-2 sm:gap-3 md:gap-4 sm:justify-center md:justify-end text-center sm:text-left">
            {/* Right Section: Info */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-6 justify-center">
              {/* Opening Hours */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-primary" />
                <p className="font-semibold">
                  Opening Hour :
                  <span className="text-gray-400"> Mon - Fri, 9:00 AM - 6:00 PM</span>
                </p>
              </div>

              {/* Call Us */}
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-primary" />
                <a href="tel:+918766681450" className="font-semibold hover:text-brand-primary">
                  Call Us : <span className="text-gray-400">+91 8766681450</span>
                </a>
              </div>

              {/* Email Us */}
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-primary" />
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT_EMAIL)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold hover:text-brand-primary"
                >
                  Email Us : <span className="text-gray-400">{CONTACT_EMAIL}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Navbar */}
        <header className="bg-white w-full font-inter border-b border-slate-200/80">
          <div className="mx-auto max-w-[1920px] px-3 sm:px-5 lg:px-8">
            <div className="flex min-h-[3.25rem] items-center justify-between gap-3 py-2.5 sm:min-h-[3.5rem] sm:py-3">
              {/* Logo — same dimensions as before; links to Home */}
              <Link
                to="/Home"
                className="flex shrink-0 items-center rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2"
                aria-label={`${COMPANY_NAME} — home`}
              >
                <img
                  src={brandLogo}
                  alt={COMPANY_NAME}
                  style={{ width: "180px", height: "65px" }}
                  className="object-cover"
                />
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden items-center gap-x-4 rounded-xl bg-teal-50 px-3 py-2 lg:flex xl:gap-x-6 xl:px-4">
                {navItems.map((item, index) => {
                  const isActive = isPathActive(item.href);
                  return (
                    <div key={index} className="relative group nav-link">
                      <NavLink
                        to={item.href}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium transition-all duration-200 ${isActive
                          ? "text-brand-primary bg-brand-primary/10"
                          : "text-gray-700 hover:text-brand-primary hover:bg-brand-primary/5"
                          }`}
                      >
                        {item.name}
                        {item.dropdown && <ChevronDown className="w-4 h-4" />}
                      </NavLink>
                    </div>
                  );
                })}
              </nav>

              {/* Right Buttons */}
              <div className="flex items-center gap-3">

                {/* Sign Up */}
                <button
                  className="cursor-pointer hidden lg:inline-flex items-center px-4 py-2 border border-brand-primary text-brand-primary font-medium rounded-full hover:bg-brand-primary/10 transition-all duration-200"
                  onClick={() => { navigate('/PartnerRegistrationForm'); }}
                >
                  <h1>Become Partner</h1>
                </button>




                {sessionDashboardPath ? (
                  <button
                    type="button"
                    className="cursor-pointer hidden lg:inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-primary-hover text-white font-medium rounded-full hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                    onClick={() => navigate(sessionDashboardPath)}
                  >
                    <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
                    <span>My dashboard</span>
                  </button>
                ) : (
                  <button
                    className="cursor-pointer hidden lg:inline-flex items-center px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-primary-hover text-white font-medium rounded-full hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                    onClick={() => {
                      navigate("/LoginPage");
                    }}
                  >
                    <h1>Login</h1>
                  </button>
                )}

                {/* Mobile menu trigger */}
                <button
                  type="button"
                  onClick={toggleMenu}
                  aria-expanded={isMenuOpen}
                  aria-controls="mobile-nav-drawer"
                  aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                  className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 text-slate-800 shadow-sm shadow-slate-900/5 transition hover:border-brand-primary/25 hover:bg-white hover:text-brand-primary hover:shadow-md active:scale-[0.97] lg:hidden"
                >
                  <span className="sr-only">{isMenuOpen ? "Close" : "Menu"}</span>
                  {isMenuOpen ? <X className="h-[22px] w-[22px]" strokeWidth={2.25} /> : <Menu className="h-[22px] w-[22px]" strokeWidth={2.25} />}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile menu: dimmed backdrop + slide-in drawer */}
        <div
          id="mobile-nav-drawer"
          className={`fixed inset-0 z-[9998] lg:hidden ${isMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
          aria-hidden={!isMenuOpen}
        >
          <div
            className={`absolute inset-0 bg-slate-950/50 backdrop-blur-[3px] transition-opacity duration-300 ease-out ${
              isMenuOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={toggleMenu}
            aria-hidden
          />
          <div
            className={`absolute right-0 top-0 flex h-full w-full max-w-[min(100%,20rem)] flex-col border-l border-slate-200/90 bg-white font-inter shadow-[-12px_0_48px_-8px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out sm:max-w-sm ${
              isMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex shrink-0 items-center justify-center border-b border-slate-100 bg-gradient-to-b from-slate-50/90 to-white px-4 py-5 sm:px-5">
              <Link
                to="/Home"
                onClick={toggleMenu}
                className="flex w-full max-w-[min(100%,17.5rem)] flex-col items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 sm:max-w-[min(100%,19rem)]"
                aria-label={`${COMPANY_NAME} — home`}
              >
               
              </Link>
              <button
                type="button"
                onClick={toggleMenu}
                className="absolute right-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 transition hover:border-brand-primary/30 hover:bg-slate-50 hover:text-brand-primary"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" strokeWidth={2.25} />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4 sm:px-4" aria-label="Mobile">
              {navItems.map((item, index) => {
                const isActive = isPathActive(item.href);
                return (
                  <NavLink
                    key={index}
                    to={item.href}
                    className={`flex min-h-[3rem] items-center rounded-xl pl-3 pr-4 text-[15px] font-medium tracking-tight transition-colors border-l-4 ${
                      isActive
                        ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                        : "border-transparent text-slate-700 hover:bg-slate-50 hover:text-brand-primary"
                    }`}
                  >
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>

            <div className="shrink-0 space-y-3 border-t border-slate-100 bg-slate-50/80 px-4 py-5 sm:px-5">
              <button
                type="button"
                className="flex w-full min-h-[48px] items-center justify-center rounded-full border border-brand-primary/40 bg-white px-4 text-sm font-semibold text-brand-primary shadow-sm transition hover:bg-brand-primary/5"
                onClick={() => {
                  navigate("/PartnerRegistrationForm");
                  toggleMenu();
                }}
              >
                Become partner
              </button>
              {sessionDashboardPath ? (
                <button
                  type="button"
                  className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-hover px-4 text-sm font-semibold text-white shadow-md shadow-brand-primary/20 transition hover:shadow-lg"
                  onClick={() => {
                    navigate(sessionDashboardPath);
                    toggleMenu();
                  }}
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
                  My dashboard
                </button>
              ) : (
                <button
                  type="button"
                  className="flex w-full min-h-[48px] items-center justify-center rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-hover px-4 text-sm font-semibold text-white shadow-md shadow-brand-primary/20 transition hover:shadow-lg"
                  onClick={() => {
                    navigate("/LoginPage");
                    toggleMenu();
                  }}
                >
                  Login
                </button>
              )}
              <a
                href="tel:+918766681450"
                className="flex items-center justify-center gap-2 pt-1 text-xs font-medium text-slate-500 transition hover:text-brand-primary"
              >
                <Phone className="h-3.5 w-3.5 text-brand-primary" />
                +91 8766681450
              </a>
            </div>
          </div>
        </div>

      </div>

      <main>
        <Outlet />
      </main>





      <footer className="border-t border-white/10 bg-slate-950 text-slate-300 pt-14 pb-8 px-4 sm:px-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-12">

          {/* About Us */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4">About us</h2>
            <p className="text-sm leading-relaxed text-slate-400">
              {COMPANY_NAME} brings to you the easiest & most optimized online portal for effective financial consultation and services.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4">Quick links</h2>
            <ul className="space-y-3 text-sm">
              <li><a href="/Home" className="text-slate-400 transition-colors hover:text-white">Home</a></li>
              <li><a href="/Contact" className="text-slate-400 transition-colors hover:text-white">Contact Us</a></li>
              <li><a href="/PartnerRegistrationForm" className="text-slate-400 transition-colors hover:text-white">Apply for Channel Partner</a></li>
              <li>
                <a href="/delete-account" className="text-slate-400 transition-colors hover:text-white">
                  Delete Account Help
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4">Social</h2>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=61578373723382"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-slate-400 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
              >
                <FaFacebookF size={18} />
              </a>
              <a
                href="https://www.instagram.com/trustline_fintech"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-slate-400 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
              >
                <FaInstagram size={20} />
              </a>
              <a
                href="https://wa.me/918766681450"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-slate-400 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
              >
                <FaWhatsapp size={20} />
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4">Documents &amp; legal</h2>
            <ul className="space-y-3 text-sm">
              <li><a href="/Documents" className="text-slate-400 transition-colors hover:text-white">Documents List</a></li>
              <li><a href="/TermsConditions" className="text-slate-400 transition-colors hover:text-white">Terms &amp; Conditions</a></li>
              <li><a href="/PrivacyPolicy" className="text-slate-400 transition-colors hover:text-white">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4">Contact &amp; address</h2>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-slate-500">
                  <FaEnvelope size={16} />
                </span>
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT_EMAIL)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all transition-colors hover:text-white"
                >
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-slate-500">
                  <FaPhoneAlt size={16} />
                </span>
                <a href="tel:+918766681450" className="transition-colors hover:text-white">
                  +91 8766681450
                </a>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-slate-500">
                  <FaMapMarkerAlt size={16} />
                </span>
                <span className="leading-relaxed">
                  SR.No.53/2A/1, Office No. 014,<br />
                  A Wing, 3rd Floor,<br />
                  City Vista, Fountain Road,<br />
                  Ashoka Nagar,<br />
                  Kharadi, Pune - 411014
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-7xl border-t border-white/10 pt-6 text-center text-xs text-slate-500 sm:text-sm">
          © 2025 {COMPANY_NAME_LEGAL}. All rights reserved.
        </div>
      </footer>
    </>
  )
}

export default MainLayout;
