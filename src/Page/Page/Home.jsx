import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { FaHandshake, FaLaptop, FaBolt, FaHeadset } from "react-icons/fa";
import { Users, Building, MapPin, Shield, Star ,Target,Phone ,Mail} from "lucide-react";
import { useNavigate } from "react-router-dom";

import backgroundImage from "../assets/background_image.jpg";
import { COMPANY_NAME, SUPPORT_EMAIL } from "../../config/branding";


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
      icon: "https://cdn-icons-png.flaticon.com/512/1006/1006771.png",
    },
    {
      title: "Business Loan",
      description:
        "Consulting with financial advisors or business experts can help…",
      icon: "https://cdn-icons-png.flaticon.com/512/2881/2881032.png",
    },
    {
      title: "Credit Card",
      description:
        "We are providing credit card to salaried and business both personal.",
      icon: "https://cdn-icons-png.flaticon.com/512/893/893292.png",
    },
    {
      title: "Vehicle Loan",
      description:
        "We are providing vehicle loan to those who are willing to buy any vehicle.",
      icon: "https://cdn-icons-png.flaticon.com/512/743/743007.png",
    },
  ];


  const cardData = [
    {
      icon: <FaHandshake size={32} className="text-brand-primary" />,
      title: "Tie-up with Leading NBFCs",
      desc: "Our top-grade collaborations ensure an extended range of financial services for our customers.",
    },
    {
      icon: <FaLaptop size={32} className="text-brand-primary" />,
      title: "Online Financial Process",
      desc: "With a few clicks, your consultation process gets started without time wastage or splurging.",
    },
    {
      icon: <FaBolt size={32} className="text-brand-primary" />,
      title: "Quick Service as Lightning",
      desc: "Customers and Partners Will Get Fast Services on time With Full Support.",
    },
    {
      icon: <FaHeadset size={32} className="text-brand-primary" />,
      title: "Free Loan Consultancy",
      desc: "Our experts are always ready to help & guide you in streamlining and scaling your finances.",
    },
  ];


  const partners = [
    { name: "SBI", domain: "sbi.co.in", description: "India’s largest public sector bank." },
    { name: "ICICI Bank", domain: "icicibank.com", description: "Leading private sector bank." },
    { name: "Bank of Baroda", domain: "bankofbaroda.in", description: "Trusted nationalized bank." },
    { name: "Axis Bank", domain: "axisbank.com", description: "Innovative financial services provider." },
    { name: "HDFC Bank", domain: "hdfcbank.com", description: "Top private bank with wide services." },
    { name: "Bank of India", domain: "bankofindia.co.in", description: "Reliable government bank." },
    { name: "Faircent", domain: "faircent.com", description: "India’s leading P2P lending platform." },
    { name: "Hero Fincorp", domain: "herofincorp.com", description: "Trusted non-banking finance firm." },
    { name: "Kotak Mahindra", domain: "kotak.com", description: "Progressive financial services." },
    { name: "Muthoot Finance", domain: "muthootfinance.com", description: "Largest gold loan NBFC." },
    { name: "Tata Capital", domain: "tatacapital.com", description: "Trusted TATA financial arm." },
    { name: "Aditya Birla Capital", domain: "adityabirlacapital.com", description: "Diverse financial solutions." },
];

  return (
    <>
      {/* Hero Section */}
      <section
        className="h-screen bg-cover bg-center flex items-center pl-16"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="max-w-xl p-6 rounded-lg">
          <h1
            ref={container}
            className="text-[80px] font-bold text-white leading-tight"
          >
            <div className="line">Fast, Secure</div>
            <div className="line">& Affordable</div>
            <div className="line">Loans for</div>
            <div className="line">Everyone</div>
          </h1>

          <button
            ref={button}
            className="px-8 py-4 mt-6 bg-gradient-to-r from-brand-primary to-brand-primary-hover text-white font-semibold rounded-full shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
          >
            Apply Now
          </button>
        </div>
      </section>


{/* Services */}

      <section className="bg-brand-primary/20 py-16 px-4 overflow-x-hidden">
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
            className="service-card bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-300"
          >
            <div className="bg-[#FFEDE1] p-4 rounded-full mb-4">
              <img
                src={service.icon}
                alt={service.title}
                className="w-10 h-10 object-contain"
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {service.title}
            </h3>
            <p className="text-gray-600 text-sm mb-4">{service.description}</p>
            {/* <button className="bg-brand-primary text-white px-5 py-2 rounded-full hover:bg-brand-primary-hover text-sm font-semibold">
              Apply Now
            </button> */}
          </div>
        ))}
      </div>

      <div className="flex justify-center items-center mt-12">
        <button
          onClick={() => navigate("/services")}
          className="flex items-center gap-2 bg-brand-primary text-white px-8 py-3 rounded-full font-semibold text-lg shadow-md hover:bg-brand-primary-hover hover:shadow-lg transform hover:scale-105 transition-all duration-300 border-2 border-transparent"
        >
          More Services
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </button>
      </div>
    </section>



    <section className="relative min-h-screen w-full flex items-center justify-center bg-gray-900 px-4 py-10 overflow-hidden">
      {/* Background color wash for subtle effect */}
      <div className="absolute inset-0" style={{ backgroundColor: 'var(--color-brand-primary)', opacity: 0.1 }}></div>
      
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 md:p-16 max-w-6xl w-full flex flex-col md:flex-row items-center gap-12 border border-gray-100 transform transition-transform duration-500 hover:scale-[1.02]">
        
        {/* Left Image */}
        <div className="w-full md:w-1/2 flex justify-center">
          <img
            src="https://thumbs.dreamstime.com/b/businessman-using-tablet-laptop-analyzing-sales-data-economic-growth-graph-chart-business-strategy-digital-marketing-154742021.jpg"
            alt="Businessman analyzing financial data"
            className="w-full max-w-sm h-auto rounded-2xl shadow-xl object-cover transform transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* Right Content */}
        <div className="w-full md:w-1/2 text-center md:text-left space-y-6">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
            Become a <span style={{ color: 'var(--color-brand-primary)' }}>{COMPANY_NAME}</span> Partner
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Partner with us to unlock new financial growth opportunities. As a trusted associate, you’ll help clients reach their goals while earning generous rewards.
          </p>
          <p className="text-2xl text-gray-900 font-bold">
            Earn up to <span style={{ color: 'var(--color-brand-primary)' }} className="font-extrabold">₹1,00,000</span> per month by becoming a trusted financial partner.
          </p>
          <button className="mt-6 px-10 py-4 text-white text-lg font-bold rounded-full shadow-lg transition-all transform hover:-translate-y-1 hover:shadow-xl duration-300" style={{ backgroundColor: 'var(--color-brand-primary)', hover: { backgroundColor: '#0e9c7d' } }}>
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
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Why Choose
            <br />
            <span style={{ color: 'var(--color-brand-primary)' }}>{COMPANY_NAME}</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Experience the future of finance with our comprehensive suite of services,
            trusted by thousands across India for reliable and innovative financial solutions.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-16">
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
                <div className="text-4xl font-bold mb-2" style={{ color: 'var(--color-brand-primary)' }}>
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
            <span className="text-teal-400 font-bold text-xl">{COMPANY_NAME}</span> focuses mainly on crucial customer groups, reaching out to individuals and small businesses often untapped in urban, semi-urban, and rural areas of India.
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
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-lg font-bold text-teal-400 hover:text-teal-300 transition-colors break-all">
                {SUPPORT_EMAIL}
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
                            key={partner.domain}
                            className="partner-card relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 h-45 flex flex-col items-center justify-center border border-white/20 shadow-xl"
                        >
                            {/* Partner Logo */}
                            <img
                                src={`https://logo.clearbit.com/${partner.domain}`}
                                alt={partner.name}
                                className="w-20 h-20 object-contain mb-4"
                                onError={(e) => e.currentTarget.classList.add('hidden')}
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
