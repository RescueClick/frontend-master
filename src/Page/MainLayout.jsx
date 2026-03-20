import React, { useState, useEffect } from "react";
import { Menu, X, ChevronDown, Phone, Mail, Clock } from "lucide-react";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import logo from '../assets/logo.png'


const MainLayout = () => {

  const navigate = useNavigate();
  const location = useLocation();



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
                <Clock className="w-4 h-4 text-[#12B99C]" />
                <p className="font-semibold">
                  Opening Hour :
                  <span className="text-gray-400"> Mon - Fri, 9:00 AM - 6:00 PM</span>
                </p>
              </div>

              {/* Call Us */}
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#12B99C]" />
                <a href="tel:+918766681450" className="font-semibold hover:text-[#12B99C]">
                  Call Us : <span className="text-gray-400">+91 8766681450</span>
                </a>
              </div>

              {/* Email Us */}
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#12B99C]" />
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=contact@trustlinefintech.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold hover:text-[#12B99C]"
                >
                  Email Us : <span className="text-gray-400">contact@trustlinefintech.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Navbar */}
        <header className="bg-white w-full font-inter border-b border-gray-100">
          <div className="max-w-7xl mx-auto sm:px-6">
            <div className="flex justify-between items-center py-3">
              {/* Logo */}
              <div className="flex items-center gap-2 sm:gap-3">


                <div>
                  <img
                    src={logo}
                    alt="Logo"
                    style={{ width: "48px", height: "48px" }}
                    className="object-contain"
                  />
                </div>

                <div className="block leading-tight">
                  <div className="text-base sm:text-xl font-bold text-gray-800">Trustline Fintech</div>
                  <div className="text-[10px] sm:text-xs text-[#12B99C] font-medium">
                    Financial Consultancy
                  </div>
                </div>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-6">
                {navItems.map((item, index) => {
                  const isActive = isPathActive(item.href);
                  return (
                    <div key={index} className="relative group nav-link">
                      <NavLink
                        to={item.href}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium transition-all duration-200 ${isActive
                          ? "text-[#12B99C] bg-[#12B99C]/10"
                          : "text-gray-700 hover:text-[#12B99C] hover:bg-[#12B99C]/5"
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
                  className="cursor-pointer hidden lg:inline-flex items-center px-4 py-2 border border-[#12B99C] text-[#12B99C] font-medium rounded-full hover:bg-[#12B99C]/10 transition-all duration-200"
                  onClick={() => { navigate('/PartnerRegistrationForm'); }}
                >
                  <h1>Become Partner</h1>
                </button>




                {/* Login */}
                <button
                  className="cursor-pointer hidden lg:inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#12B99C] to-[#0ea688] text-white font-medium rounded-full hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                  onClick={() => {
                    navigate("/LoginPage");
                  }}
                >
                  <h1>Login</h1>
                </button>

                {/* Mobile Menu */}
                <button
                  onClick={toggleMenu}
                  className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-[#12B99C] hover:bg-gray-100"
                >
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        <div
          className={`fixed inset-0 bg-white z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${isMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          onClick={toggleMenu}
        >
          <div
            className="fixed right-0 top-0 h-full w-64 bg-white shadow-lg p-6 flex flex-col font-inter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Navigation</h2>
              <button
                onClick={toggleMenu}
                className="p-2 rounded-md text-gray-700 hover:text-[#12B99C] hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex flex-col space-y-4 flex-grow">
              {navItems.map((item, index) => {
                const isActive = isPathActive(item.href);
                return (
                  <NavLink
                    key={index}
                    to={item.href}
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isActive
                      ? "text-[#12B99C] bg-[#12B99C]/10"
                      : "text-gray-700 hover:text-[#12B99C] hover:bg-[#12B99C]/5"
                      }`}
                  >
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
            <div className="mt-6">
              <button
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-[#0ea688] text-white font-medium rounded-full hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                onClick={() => {
                  navigate("/LoginPage");
                  toggleMenu();
                }}
              >
                <h1>Login</h1>
              </button>
            </div>
          </div>
        </div>

      </div>

      <main>
        <Outlet />
      </main>





      <footer className="bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 text-white pt-12 pb-6 px-4 sm:px-10 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10">

          {/* About Us */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-[#12B99C]">About Us</h2>
            <p className="text-sm leading-relaxed text-gray-300">
              Trustline Fintech brings to you the easiest & most optimized online portal for effective financial consultation and services.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-[#12B99C]">Quick Links</h2>
            <ul className="space-y-3 text-sm text-gray-300">
              <li><a href="/Home" className="hover:text-[#12B99C] transition">Home</a></li>
              {/* <li><a href="/AboutUs" className="hover:text-[#12B99C] transition">About Us</a></li> */}
              <li><a href="/Contact" className="hover:text-[#12B99C] transition">Contact Us</a></li>
              <li><a href="/PartnerRegistrationForm" className="hover:text-[#12B99C] transition">Apply for Channel Partner</a></li>
              <li>
                <a
                  href="/delete-account"
                  className="hover:text-[#12B99C] transition"
                >
                  Delete Account Help
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4 text-[#12B99C]">Social Links</h2>
            <div className="mt-6">

              <div className="flex items-center gap-4  transform -translate-x-5 ">

                <a
                  href="https://www.facebook.com/profile.php?id=61578373723382"
                  target="_blank"
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-400 hover:border-[#12B99C] hover:text-[#12B99C] transition"
                >
                  <FaFacebookF size={18} />
                </a>

                <a
                  href="https://www.instagram.com/trustline_fintech"
                  target="_blank"
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-400 hover:border-[#12B99C] hover:text-[#12B99C] transition"
                >
                  <FaInstagram size={20} />
                </a>

                <a
                  href="https://wa.me/918766681450"
                  target="_blank"
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-400 hover:border-[#12B99C] hover:text-[#12B99C] transition"
                >
                  <FaWhatsapp size={20} />
                </a>

              </div>
            </div>
          </div>
          {/* Legal */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-[#12B99C]">Documents & Legal</h2>
            <ul className="space-y-3 text-sm text-gray-300">
              <li><a href="/Documents" className="hover:text-[#12B99C]">Documents List</a></li>
              <li><a href="/TermsConditions" className="hover:text-[#12B99C]">Terms & Conditions</a></li>
              <li><a href="/PrivacyPolicy" className="hover:text-[#12B99C]">Privacy Policy</a></li>
            </ul>
          </div>




          {/* Contact */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-[#12B99C]">Contact & Address</h2>

            <ul className="space-y-4 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 flex items-center justify-center text-[#12B99C] mt-1">
                  <FaEnvelope size={16} />
                </span>
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=contact@trustlinefintech.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#12B99C] transition"
                >
                  contact@trustlinefintech.com
                </a>

              </li>

              <li className="flex items-start gap-3">
                <span className="w-5 h-5 flex items-center justify-center text-[#12B99C] mt-1">
                  <FaPhoneAlt size={16} />
                </span>
                <a
                  href="tel:+918766681450"
                  className="hover:text-[#12B99C] transition"
                >
                  +91 8766681450
                </a>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-5 h-5 flex items-center justify-center text-[#12B99C] mt-1">
                  <FaMapMarkerAlt size={16} />
                </span>
                <span>
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

        {/* Divider */}
        <div className="border-t border-gray-700 mt-10 pt-4 text-center text-sm text-gray-400">
          © 2025 Trustline Fintech. All Rights Reserved.
        </div>
      </footer>
    </>
  )
}

export default MainLayout;
