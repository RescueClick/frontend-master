import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { FaHandshake, FaLaptop, FaBolt, FaHeadset, FaEnvelope } from "react-icons/fa";
import { Users, Building, MapPin, Shield, Star, Target, Phone, Mail, Wallet, BriefcaseBusiness, Home as HomeIcon, Store } from "lucide-react";

import backgroundImage from "../assets/background_image.jpg";
import { useNavigate } from 'react-router-dom';
import sbiLogo from "../assets/SBI_bank.png";
import iciciLogo from "../assets/icici_bank.jpeg";
import bankOfBarodaLogo from "../assets/bankofbaroda_bank.png";
import axisLogo from "../assets/axis_bank.png";
import hdfcLogo from "../assets/hdfc_bank.png";
import bankOfIndiaLogo from "../assets/bankofindia_bank.png";
import faircentLogo from "../assets/Faircent_bank.png";
import heroFincorpLogo from "../assets/hero_fincorp_bank.jpeg";
import kotakLogo from "../assets/kotak_mahindra_bank.jpeg";
import muthootLogo from "../assets/muthoot_finance_bank.webp";
import tataCapitalLogo from "../assets/TataCapital_bank.png";
import adityaBirlaLogo from "../assets/AdityaBirlaCapital_bank.png";


gsap.registerPlugin(useGSAP);

const Home = () => {

  const navigate = useNavigate();


  const container = useRef(null);
  const button = useRef(null);

  useGSAP(() => {
    const lines = container.current.querySelectorAll(".line");

    // ✅ Create timeline for sequential animation
    const tl = gsap.timeline();

    // Animate lines with stagger
    tl.from(lines, {
      x: 150,
      opacity: 0,
      stagger: 0.3,
      duration: 1,
      ease: "power3.out",
    });

    // Animate button after lines finish

  }, []);



  const services = [
    {
      title: "Personal Loan",
      description: "Get Personal Loan Upto 40 Lac. Min. Salary 12k.",
      icon: <Wallet className="w-10 h-10 text-[#12B99C]" />,
    },
    {
      title: "Business Loan",
      description:
        "Consulting with financial advisors or business experts can help…",
      icon: <BriefcaseBusiness className="w-10 h-10 text-[#12B99C]" />,
    },
    {
      title: "Home Loan (Salaried)",
      description:
        "Easy home loans tailored for salaried customers with quick approvals.",
      icon: <HomeIcon className="w-10 h-10 text-[#12B99C]" />,
    },
    {
      title: "Home Loan (Self Employed)",
      description:
        "Flexible home loans designed for self-employed professionals & business owners.",
      icon: <Store className="w-10 h-10 text-[#12B99C]" />,
    },
  ];


  const cardData = [
    {
      icon: <FaHandshake size={32} className="text-[#12B99C]" />,
      title: "Tie-up with Leading NBFCs",
      desc: "Our top-grade collaborations ensure an extended range of financial services for our customers.",
    },
    {
      icon: <FaLaptop size={32} className="text-[#12B99C]" />,
      title: "Online Financial Process",
      desc: "With a few clicks, your consultation process gets started without time wastage or splurging.",
    },
    {
      icon: <FaBolt size={32} className="text-[#12B99C]" />,
      title: "Quick Service as Lightning",
      desc: "Customers and Partners Will Get Fast Services on time With Full Support.",
    },
    {
      icon: <FaHeadset size={32} className="text-[#12B99C]" />,
      title: "Free Loan Consultancy",
      desc: "Our experts are always ready to help & guide you in streamlining and scaling your finances.",
    },
  ];


  const partners = [
    { name: "SBI", logo: sbiLogo, description: "India’s largest public sector bank." },
    { name: "ICICI Bank", logo: iciciLogo, description: "Leading private sector bank." },
    { name: "Bank of Baroda", logo: bankOfBarodaLogo, description: "Trusted nationalized bank." },
    { name: "Axis Bank", logo: axisLogo, description: "Innovative financial services provider." },
    { name: "HDFC Bank", logo: hdfcLogo, description: "Top private bank with wide services." },
    { name: "Bank of India", logo: bankOfIndiaLogo, description: "Reliable government bank." },
    { name: "Faircent", logo: faircentLogo, description: "India’s leading P2P lending platform." },
    { name: "Hero Fincorp", logo: heroFincorpLogo, description: "Trusted non-banking finance firm." },
    { name: "Kotak Mahindra", logo: kotakLogo, description: "Progressive financial services." },
    { name: "Muthoot Finance", logo: muthootLogo, description: "Largest gold loan NBFC." },
    { name: "Tata Capital", logo: tataCapitalLogo, description: "Trusted TATA financial arm." },
    { name: "Aditya Birla Capital", logo: adityaBirlaLogo, description: "Diverse financial solutions." },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-teal-600 to-slate-900 flex items-center overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-48 sm:h-48 lg:w-72 lg:h-72 bg-gradient-to-r from-teal-400/10 to-emerald-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 right-1/3 w-24 h-24 sm:w-32 sm:h-32 lg:w-48 lg:h-48 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 py-8 sm:py-12 lg:py-0">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">

            {/* Left Content */}
            <div className="max-w-2xl text-center lg:text-left order-2 lg:order-1">
              {/* Modern digital banking badge */}

              <h1
                ref={container}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[4.5rem] font-black text-white leading-[1.1] mb-4 sm:mb-6 tracking-tight"
              >
                <div className="line bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                  Quick Cash
                </div>
                <div className="line bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                  Zero Stress.
                </div>
                <div className="line bg-gradient-to-r from-[#12B99C] via-emerald-400 to-teal-400 bg-clip-text text-transparent drop-shadow-2xl">
                  Trustline Fintech
                </div>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-8 sm:mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0 font-light">
                Get Loan in minutes, Low Cibil Score no issue, Tie-up with 100+ lenders.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6">
                <button
                  ref={button}
                  className="group relative w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-pink-500 via-red-500 to-pink-600 text-white font-bold text-base sm:text-lg rounded-full shadow-2xl hover:shadow-[0_20px_40px_rgba(236,72,153,0.4)] transform hover:-translate-y-2 transition-all duration-500 overflow-hidden"
                  onClick={() => navigate('/PartnerRegistrationForm')}
                >
                  <span className="cursor-pointer relative z-10">Become A Partner →</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-red-400 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>


              </div>
            </div>

            {/* Right Content - Enhanced Circular Design */}
            <div className="relative order-1 lg:order-2 flex justify-center lg:justify-end w-full lg:w-auto">
              <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[400px] lg:h-[400px] xl:w-[450px] xl:h-[450px] relative">

                {/* Outer rotating ring */}
                <div className="absolute -inset-2 sm:-inset-4 rounded-full bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 opacity-25 animate-spin" style={{ animationDuration: '20s' }}></div>

                {/* Main circular background with enhanced gradient and glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 opacity-90 shadow-2xl animate-pulse" style={{ animationDuration: '3s' }}>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-transparent"></div>
                </div>

                {/* Glowing ring effect */}
                <div className="absolute -inset-1 sm:-inset-2 rounded-full bg-gradient-to-r from-emerald-300 via-teal-400 to-cyan-400 opacity-30 blur-xl animate-pulse"></div>

                {/* Central image container with enhanced effects */}
                <div className="absolute inset-6 sm:inset-8 lg:inset-10 rounded-full bg-white/30 backdrop-blur-2xl border-2 border-white/60 overflow-hidden shadow-2xl hover:scale-105 transition-transform duration-700 group">
                  <img
                    src="https://images.pexels.com/photos/8441813/pexels-photo-8441813.jpeg"
                    alt="Professional using laptop for financial services"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-emerald-500/10"></div>
                </div>

                {/* Enhanced floating security badge - responsive positioning */}
                <div className="absolute top-4 sm:top-6 lg:top-10 -right-2 sm:-right-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-2 sm:px-3 lg:px-5 py-1 sm:py-2 lg:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-1 sm:space-x-2 shadow-xl border border-white/30 backdrop-blur-sm hover:scale-110 transition-transform duration-300 float-animation">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                  <span className="hidden sm:inline">100% Safe & Secure</span>
                  <span className="sm:hidden">Safe</span>
                </div>

                {/* Enhanced floating user avatars - responsive sizing */}
                <div className="absolute top-4 sm:top-6 lg:top-8 left-8 sm:left-12 lg:left-20 w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 border-2 sm:border-3 border-white flex items-center justify-center shadow-xl overflow-hidden hover:scale-125 transition-transform duration-300" style={{ animation: 'float 4s ease-in-out infinite 1s' }}>
                  <img
                    src="https://images.pexels.com/photos/5816286/pexels-photo-5816286.jpeg"
                    alt="User avatar"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute -inset-1 bg-rose-300/40 rounded-full blur-md"></div>
                </div>

                <div className="absolute bottom-8 sm:bottom-12 lg:bottom-20 left-4 sm:left-8 lg:left-12 w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 sm:border-3 border-white flex items-center justify-center shadow-xl overflow-hidden hover:scale-125 transition-transform duration-300" style={{ animation: 'float 4s ease-in-out infinite 2s' }}>
                  <img
                    src="https://images.pexels.com/photos/8292888/pexels-photo-8292888.jpeg"
                    alt="User avatar"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute -inset-1 bg-blue-300/40 rounded-full blur-md"></div>
                </div>

                {/* Enhanced floating cursor - responsive sizing */}
                <div className="absolute bottom-6 sm:bottom-8 lg:bottom-12 right-8 sm:right-12 lg:right-20 w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-white rounded-full shadow-xl flex items-center justify-center hover:scale-125 transition-transform duration-300" style={{ animation: 'float 2s ease-in-out infinite 0.5s' }}>
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 bg-gray-700 rounded-full"></div>
                  <div className="absolute -inset-1 sm:-inset-2 bg-white/40 rounded-full blur-lg"></div>
                </div>

                {/* Additional floating elements - responsive sizing */}
                <div className="absolute top-16 sm:top-24 lg:top-32 -left-3 sm:-left-6 lg:-left-8 w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full shadow-lg" style={{ animation: 'float 3s ease-in-out infinite 1.5s' }}></div>
                <div className="absolute bottom-16 sm:bottom-24 lg:bottom-32 -right-2 sm:-right-4 lg:-right-6 w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 bg-gradient-to-r from-violet-400 to-purple-500 rounded-full shadow-lg" style={{ animation: 'float 4s ease-in-out infinite 0.8s' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom keyframes for floating animation */}
        <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        @media (min-width: 640px) {
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(5deg); }
          }
        }
        @media (min-width: 1024px) {
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
        }
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
      </section>


      {/* Services */}

      <section className="bg-[#12B99C]/20 py-16 px-4 overflow-x-hidden">
        <div className="max-w-7xl mx-auto text-center mb-10">
          <h2 className="text-4xl font-bold text-[#0f3d3e] mb-4">
            We Love To Serve
          </h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            We fill our work space with new excitement every day. We indulge in
            amazingly exciting tasks.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="service-card bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-300 h-full"
            >
              <div className="bg-[#FFEDE1] p-4 rounded-full mb-4 text-[#12B99C]">
                {service.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {service.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4">{service.description}</p>
              <button
                className="cursor-pointer bg-[#12B99C] text-white px-5 py-2 rounded-full hover:bg-[#0f4f28] text-sm font-semibold mt-auto"
                onClick={() => {
                  switch (service.title) {
                    case "Personal Loan":
                      navigate("/partner/application/personal-loan");
                      break;
                    case "Business Loan":
                      navigate("/partner/application/business-loan");
                      break;
                    case "Home Loan (Salaried)":
                      navigate("/partner/application/home-loan-salaried");
                      break;
                    case "Home Loan (Self Employed)":
                      navigate("/partner/application/home-loan-self-employed");
                      break;
                    default:
                      navigate("/partner/application/personal-loan");
                  }
                }}
              >
                Apply Now
              </button>
            </div>
          ))}
        </div>
      </section>



      <section className="relative min-h-screen w-full flex items-center justify-center bg-gray-900 px-4 py-10 overflow-hidden">
        {/* Background color wash for subtle effect */}
        <div className="absolute inset-0" style={{ backgroundColor: '#12B99C', opacity: 0.1 }}></div>

        <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 md:p-16 max-w-6xl w-full flex flex-col md:flex-row items-center gap-12 border border-gray-100 transform transition-transform duration-500 hover:scale-[1.02]">

          {/* Left Image */}
          <div className="w-full md:w-1/2 flex justify-center">
            <img
              src="https://thumbs.dreamstime.com/b/businessman-using-tablet-laptop-analyzing-sales-data-economic-growth-graph-chart-business-strategy-digital-marketing-154742021.jpg"
              alt="Businessman analyzing financial data"
              className="w-full max-w-lg h-auto rounded-2xl shadow-xl object-cover transform transition-transform duration-500 hover:scale-105"
              loading="lazy"
            />
          </div>

          {/* Right Content */}
          <div className="w-full md:w-1/2 text-center md:text-left space-y-6">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
              Become a <span style={{ color: '#12B99C' }}>Trustline Fintech</span> Partner
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Partner with us to unlock new financial growth opportunities. As a trusted associate, you’ll help clients reach their goals while earning generous rewards.
            </p>
            <p className="text-2xl text-gray-900 font-bold leading-snug">
              Earn up to <span style={{ color: '#12B99C' }} className="font-extrabold">₹1,00,000</span> per month by becoming a trusted financial partner.
            </p>

            <button
              onClick={() => { navigate('/PartnerRegistrationForm'); }}
              className="mt-6 px-10 py-4 text-white text-lg font-bold rounded-full shadow-lg transition-all transform hover:-translate-y-1 hover:shadow-xl duration-300" style={{ backgroundColor: '#12B99C', hover: { backgroundColor: '#0e9c7d' } }}>
              Join Now
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white text-gray-800 overflow-hidden py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {cardData.map((card, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-8 border border-gray-100 h-full flex flex-col text-center"
              >
                <div className="flex justify-center items-center mb-4">{card.icon}</div>
                <h3 className="text-lg font-bold mb-2">{card.title}</h3>
                <p className="text-sm text-gray-600">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 text-white">
        {/* Hero Section */}
        <section className="px-6 py-6">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Why Choose
              <br />
              <span style={{ color: '#12B99C' }}>Trustline Fintech</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Experience the future of finance with our comprehensive suite of services,
              trusted by thousands across India for reliable and innovative financial solutions.
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  icon: <Users className="w-8 h-8 text-white" />,
                  value: `1000+`,
                  title: 'Customer Volume',
                  desc: 'Massive customer base showcasing our authenticity & trustworthiness',
                  color: 'from-green-500 to-emerald-500',
                },
                {
                  icon: <Building className="w-8 h-8 text-white" />,
                  value: `100+`,
                  title: 'Partners',
                  desc: 'Extensive partner network contributing to our mounting presence & reach',
                  color: 'from-blue-500 to-cyan-500',
                },
                {
                  icon: <Shield className="w-8 h-8 text-white" />,
                  value: <Star className="w-10 h-10 mx-auto" />,
                  title: 'Leading NBFCs',
                  desc: 'Strategic partnerships with top NBFCs for superior collaborations',
                  color: 'from-purple-500 to-pink-500',
                },
                {
                  icon: <MapPin className="w-8 h-8 text-white" />,
                  value: 'All',
                  title: 'India Service',
                  desc: 'Comprehensive coverage across every state & city in India',
                  color: 'from-orange-500 to-red-500',
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center"
                >
                  <div className={`w-16 h-16 bg-gradient-to-r ${item.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    {item.icon}
                  </div>
                  <div className="text-4xl font-bold mb-2" style={{ color: '#12B99C' }}>
                    {item.value}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>


      <section className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 text-white">


        <div className="relative z-10 px-6 py-16">
          <div className="max-w-6xl mx-auto">

            {/* Header Section */}
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-100 bg-clip-text text-transparent">
                About <span className="text-teal-400">Us</span>
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-teal-400 to-emerald-400 mx-auto mb-8"></div>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Empowering India's financial future with innovative solutions for every community
              </p>
            </div>

            {/* Main About Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
              <div className="space-y-6">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                  <p className="text-lg text-gray-300 leading-relaxed mb-6">
                    <span className="text-teal-400 font-bold text-xl">Trustline Fintech</span> focuses mainly on crucial customer groups, reaching out to individuals and small businesses often untapped in urban, semi-urban, and rural areas of India.
                  </p>
                  <p className="text-lg text-gray-300 leading-relaxed">
                    Our goal is to provide <span className="text-teal-400 font-semibold">easy-to-use, transparent financial products</span> that cater to the rapidly evolving financial needs of India.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-2xl p-8 backdrop-blur-lg border border-white/10">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-teal-400 mb-4">Our Mission</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Bridging the financial gap across India with innovative, accessible, and transparent financial solutions for every community.
                    </p>
                  </div>
                </div>
              </div>
            </div>



            {/* Contact Section */}
            <div className="bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-2xl p-8 backdrop-blur-lg border border-white/10">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
                Contact <span className="text-teal-400">Us</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-teal-500/50 transition-all duration-300 group">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Call Us</h3>
                      <a href="tel:+918766681450" className="text-xl font-bold text-teal-400 hover:text-teal-300 transition-colors">
                        +91 8766681450
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-teal-500/50 transition-all duration-300 group">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Email Us</h3>

                      <a
                        href="https://mail.google.com/mail/?view=cm&fs=1&to=contact@trustlinefintech.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-bold text-teal-400 hover:text-teal-300 transition-colors break-all"
                      >
                        contact@trustlinefintech.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="relative py-20 px-6 sm:px-10 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Trusted Collaborations
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            We're proud to partner with the most trusted financial institutions to
            bring you seamless loan and credit services.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {partners.map((partner) => (
              <div
                key={partner.name}
                className="partner-card relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 h-45 flex flex-col items-center justify-center border border-white/20 shadow-xl"
              >
                {/* Partner Logo */}
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="w-20 h-20 object-contain mb-4"
                />

                {/* Partner Name */}
                <h3 className="text-white font-bold text-sm text-center px-2">
                  {partner.name}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>



    </>
  );
};

export default Home;



