import React from 'react'
// import ChannelPartnerHero from './ChannelPartnerHero'
// import ChannelPartnerOpportunities from './ChannelPartnerOpportunities'
// import PartnerFeedback from './PartnerFeedback'
// import ReferEarnSection from './ReferEarnSection'
// import FaqSection from './FaqSection'

import { useNavigate } from 'react-router-dom';
import { COMPANY_NAME } from "../config/branding";
import { PARTNER_REGISTRATION_ROUTE } from "../config/publicReferral.js";

import {
  IndianRupee,
  TrendingUp,
  Briefcase,
  Headphones,
  LayoutDashboard,
  Laptop,
  CheckCircle,
  Quote,
} from "lucide-react";

const Channelpartner = () => {

  const navigate = useNavigate();


  const features = [
    {
      icon: <IndianRupee className="h-10 w-10 text-brand-primary" />,
      title: "Earn up to Rs. 1,00,000/month",
      hindiTitle: "1,00,000/ रुपये माह तक कमाएं",
      desc: "A highly rewarding business that can flourish limitlessly with this easy refer and earn business venture.",
    },
    {
      icon: <TrendingUp className="h-10 w-10 text-brand-primary" />,
      title: "Great Profits – Low Investment",
      hindiTitle: "बढ़िया मुनाफा – कम निवेश",
      desc: "A low investment business opportunity is rare! Make the most of it and start generating income now.",
    },
    {
      icon: <Briefcase className="h-10 w-10 text-brand-primary" />,
      title: "Lifetime Career Opportunity",
      hindiTitle: "आजीवन करियर अवसर",
      desc: "You can rely upon this business and make it your lifelong vehicle to financial success and career growth.",
    },
    {
      icon: <Headphones className="h-10 w-10 text-brand-primary" />,
      title: "Access Free Marketing Support",
      hindiTitle: "निःशुल्क Marketing सहायता",
      desc: "Finable India provides the best marketing support for the partners’ businesses to grow substantially.",
    },
    {
      icon: <LayoutDashboard className="h-10 w-10 text-brand-primary" />,
      title: "Personal Portal For Tracking Revenue",
      hindiTitle: "ट्रैकिंग के लिए व्यक्तिगत पोर्टल",
      desc: "Access your own smart personal portal wherein you can view all the required information and track your earnings.",
    },
    {
      icon: <Laptop className="h-10 w-10 text-brand-primary" />,
      title: "Completely Digital Business",
      hindiTitle: "पूर्णतः डिजिटल बिज़नेस",
      desc: "This business requires near-to-none infrastructure. Conduct this business remotely, maybe even without an office.",
    },
  ];


  const points = [
    "Dreaming to be a successful business-person",
    "A housewife who wants to start something of her own",
    "A salaried person wanting to earn a handy side-income",
    "A student who intends to earn via this digital business",
    "A self-employed person looking for another business",
    "Anyone who wants to start a successful business",
  ];

  const hindiPoints = [
    "एक सफल व्यवसायी बनने का सपना देख रहे हो",
    "एक गृहिणी जो अपना कुछ शुरू करना चाहती है",
    "एक व्यक्ति जो salaried व्यक्ति हैं और side-income generate करना चाहते हैं",
    "एक छात्र जो इस डिजिटल व्यवसाय के माध्यम से कमाई करने का इरादा रखता है",
    "एक स्व-नियोजित व्यक्ति जिसे व्यवसाय की तलाश है",
    "जो कोई भी एक सफल व्यवसाय शुरू करना चाहता है",
  ];

  // Testimonial data array
  const testimonials = [
    {
      name: "Dipak Lad",
      title: "Financial Advisor",
      feedback: `At ${COMPANY_NAME}, the commission structure is fantastic! As a financial advisor, it’s rewarding to see our hard work translate into good earnings.`,
      hindiFeedback: `${COMPANY_NAME} में, कमीशन संरचना शानदार है।`,
    },
    {
      name: "Kiran Gaikwad",
      title: "Channel Partner",
      feedback: `Working at ${COMPANY_NAME} is a breeze because of the on-time assistance we receive.`,
      hindiFeedback: `हमें समय पर मिलने वाली सहायता के कारण काम करना आसान है।`,
    },
    {
      name: "Swapnil Borkar",
      title: "Business Owner",
      feedback: `Being part of ${COMPANY_NAME} is amazing,  
  offering clarity and strong financial support,  
  building trust and growth every single day.`,
      hindiFeedback: `${COMPANY_NAME} का हिस्सा होना अद्भुत है,  
  यह स्पष्टता और मजबूत वित्तीय सहायता देता है,  
  और हर दिन विश्वास और विकास बढ़ाता है।`,
    }
  ];

  const faqData = [
    {
      question: "What is a Personal Loan?",
      answer:
        "A personal loan is an unsecured loan that does not require any collateral. It is usually taken for purposes like weddings, travel, medical expenses, or debt consolidation, and is repaid in fixed EMIs over a 1–5 year term.",
    },
    {
      question: "How is my loan eligibility calculated?",
      answer:
        "Eligibility is based on factors such as your monthly income, credit score, employment type, existing EMIs, and overall financial stability.",
    },
    {
      question: "What is the difference between Pre-Closure and Part-Prepayment?",
      answer:
        "Pre-closure means paying off your entire loan amount before the scheduled term ends. Part-prepayment means paying a lump sum in addition to your EMI, which reduces your principal and future interest.",
    },
    {
      question: "Can I pre-close my personal loan?",
      answer:
        "Yes, you can. Most lenders allow pre-closure, though some may charge a small fee depending on their policies.",
    },
    {
      question: "How long does loan disbursement take?",
      answer:
        "Once your documents are verified and loan is approved, disbursal usually happens within 24 to 72 hours depending on the lender.",
    },
  ];


  return (
    <div className="min-h-screen bg-white">
      {/* Hero — aligned with Home marketing hero */}
      <section className="relative overflow-hidden bg-slate-950 py-16 sm:py-24">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.98)_0%,rgba(15,23,42,0.92)_40%,rgba(13,148,136,0.12)_100%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-15%,rgba(13,148,136,0.2),transparent_60%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:56px_56px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-primary-light sm:text-xs">
            Channel partner
          </p>
          <h1 className="font-hindiHeading text-balance text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
            Become <span className="bg-gradient-to-r from-brand-primary-light via-emerald-300 to-brand-primary bg-clip-text text-transparent">{COMPANY_NAME}</span>{" "}
            partner
          </h1>
          <p className="mt-3 text-lg font-medium text-teal-100/95 sm:text-xl">{COMPANY_NAME} के Partner बने</p>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Join a trusted lending marketplace: help customers access credit, grow your income, and run your partner business digitally.
          </p>
          <button
            type="button"
            className="mt-10 inline-flex min-h-[48px] items-center justify-center rounded-full bg-brand-primary px-10 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-primary/25 transition hover:bg-brand-primary-hover hover:shadow-xl sm:text-base"
            onClick={() => {
              navigate(PARTNER_REGISTRATION_ROUTE);
            }}
          >
            Join now
          </button>
        </div>
      </section>

      <section className="border-t border-slate-200/80 bg-gradient-to-b from-slate-100/90 via-white to-slate-50/95 py-16 px-4 sm:py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center md:mb-14">
            <h2 className="text-balance text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
              Big-revenue business opportunity
            </h2>
            <p className="mt-2 text-lg font-medium text-brand-primary sm:text-xl md:text-2xl">बड़े Income वाला व्यवसायिक अवसर</p>
          </div>

          <div className="mb-12 rounded-2xl border border-brand-primary/20 bg-gradient-to-r from-brand-primary/10 via-teal-50/80 to-brand-primary/10 px-5 py-4 text-center sm:px-8 sm:py-5">
            <p className="text-sm font-medium leading-relaxed text-slate-800 sm:text-base">
              Channel Partner Plan – loaded with business-centric perks | चैनल पार्टनर योजना – व्यवसाय-केंद्रित सुविधाओं से भरपूर
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-primary/25 hover:shadow-md sm:p-7"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary transition group-hover:bg-brand-primary/15">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-1 text-sm font-medium text-teal-800/90">{feature.hindiTitle}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-16 px-4 sm:py-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50/40 p-8 shadow-sm ring-1 ring-slate-900/5 sm:p-10 md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Welcome to {COMPANY_NAME}</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Earn with refer &amp; earn
            <span className="text-brand-primary"> — built for growth</span>
          </h2>
          <h3 className="mt-3 text-lg font-semibold text-teal-800 md:text-xl">
            रेफर और अर्न बिज़नेस मॉडल के साथ असीमित कमाई करें
          </h3>

          <p className="mt-6 text-[15px] leading-relaxed text-slate-600 md:text-base">
            If you’re salaried and want strong side income—or you’re driven to build something bigger—this is for you.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-600 md:text-base">
            यदि आप अच्छी side-income चाहते हैं या जीवन में कुछ बड़ा करना चाहते हैं — यह आपके लिए है।
          </p>

          <p className="mt-6 text-[15px] leading-relaxed text-slate-600 md:text-base">
            Your background matters less than your intent. As a channel partner, you can build a scalable business with strong earning
            potential.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-600 md:text-base">
            आपका background कम मायने रखता है; मायने रखता है आपका जज़्बा। चैनल पार्टनर बनकर आप अपना व्यवसाय बढ़ा सकते हैं।
          </p>

          <div className="mt-10 grid grid-cols-1 gap-8 border-t border-slate-200/90 pt-10 md:grid-cols-2 md:gap-10">
            <div>
              {points.map((point, idx) => (
                <div key={idx} className="mb-3 flex items-start gap-3 text-sm text-slate-700 md:text-[15px]">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" size={20} />
                  <span>{point}</span>
                </div>
              ))}
            </div>
            <div>
              {hindiPoints.map((point, idx) => (
                <div key={idx} className="mb-3 flex items-start gap-3 text-sm text-slate-700 md:text-[15px]">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" size={20} />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-gradient-to-b from-slate-100/50 to-white py-16 px-4 sm:py-24 sm:px-6">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Testimonials</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">What partners say</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            Real feedback from people building with our platform.
          </p>

          <div className="mt-12 grid gap-6 text-left md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm transition hover:border-brand-primary/20 hover:shadow-md"
              >
                <div>
                  <Quote className="mb-5 h-10 w-10 text-slate-200" aria-hidden />
                  <p className="text-[15px] leading-relaxed text-slate-800 md:text-base">“{testimonial.feedback}”</p>
                  <p className="mt-4 text-sm leading-relaxed text-slate-500">“{testimonial.hindiFeedback}”</p>
                </div>
                <div className="mt-8 border-t border-slate-100 pt-5">
                  <p className="font-semibold text-brand-primary">{testimonial.name}</p>
                  <p className="text-sm text-slate-500">{testimonial.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-16 px-4 sm:py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">Frequently asked questions</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
              Clear answers to common questions about loans and how we work.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
            {faqData.map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-6 text-left shadow-sm transition hover:border-brand-primary/20 hover:bg-white sm:p-8"
              >
                <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                  <span className="text-brand-primary">Q{index + 1}.</span> {faq.question}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-[15px]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Channelpartner

//import React from 'react'
// import ChannelPartnerHero from './ChannelPartnerHero'
// import ChannelPartnerOpportunities from './ChannelPartnerOpportunities'
// import PartnerFeedback from './PartnerFeedback'
// import ReferEarnSection from './ReferEarnSection'
// import FaqSection from './FaqSection'

// import { useNavigate } from 'react-router-dom';

// import {
//   IndianRupee,
//   IndianRupee,
//   TrendingUp,
//   Briefcase,
//   Headphones,
//   LayoutDashboard,
//   Laptop,
//   CheckCircle,
//   Quote,
// } from "lucide-react";

// const Channelpartner = () => {

//   const navigate = useNavigate();


//   const features = [
//     {
//       icon: <IndianRupee className="h-10 w-10 text-brand-primary" />,
//       title: "Earn up to Rs. 1,00,000/month",
//       hindiTitle: <span className="font-hindi">1,00,000/ रुपये माह तक कमाएं</span>,
//       desc: "A highly rewarding business that can flourish limitlessly with this easy refer and earn business venture.",
//     },
//     {
//       icon: <TrendingUp className="h-10 w-10 text-brand-primary" />,
//       title: "Great Profits – Low Investment",
//       hindiTitle: <span className="font-hindi">बढ़िया मुनाफा – कम निवेश</span>,
//       desc: "A low investment business opportunity is rare! Make the most of it and start generating income now.",
//     },
//     {
//       icon: <Briefcase className="h-10 w-10 text-brand-primary" />,
//       title: "Lifetime Career Opportunity",
//       hindiTitle: <span className="font-hindi">आजीवन करियर अवसर</span>,
//       desc: "You can rely upon this business and make it your lifelong vehicle to financial success and career growth.",
//     },
//     {
//       icon: <Headphones className="h-10 w-10 text-brand-primary" />,
//       title: "Access Free Marketing Support",
//       hindiTitle: <span className="font-hindi">निःशुल्क Marketing सहायता</span>,
//       desc: "Finable India provides the best marketing support for the partners’ businesses to grow substantially.",
//     },
//     {
//       icon: <LayoutDashboard className="h-10 w-10 text-brand-primary" />,
//       title: "Personal Portal For Tracking Revenue",
//       hindiTitle: <span className="font-hindi">ट्रैकिंग के लिए व्यक्तिगत पोर्टल</span>,
//       desc: "Access your own smart personal portal wherein you can view all the required information and track your earnings.",
//     },
//     {
//       icon: <Laptop className="h-10 w-10 text-brand-primary" />,
//       title: "Completely Digital Business",
//       hindiTitle: <span className="font-hindi">पूर्णतः डिजिटल बिज़नेस</span>,
//       desc: "This business requires near-to-none infrastructure. Conduct this business remotely, maybe even without an office.",
//     },
//   ];


//   const points = [
//     "Dreaming to be a successful business-person",
//     "A housewife who wants to start something of her own",
//     "A salaried person wanting to earn a handy side-income",
//     "A student who intends to earn via this digital business",
//     "A self-employed person looking for another business",
//     "Anyone who wants to start a successful business",
//   ];

//   const hindiPoints = [
//     <span className="font-hindi">एक सफल व्यवसायी बनने का सपना देख रहे हो</span>,
//     <span className="font-hindi">एक गृहिणी जो अपना कुछ शुरू करना चाहती है</span>,
//     <span className="font-hindi">एक व्यक्ति जो salaried व्यक्ति हैं और side-income generate करना चाहते हैं</span>,
//     <span className="font-hindi">एक छात्र जो इस डिजिटल व्यवसाय के माध्यम से कमाई करने का इरादा रखता है</span>,
//     <span className="font-hindi">एक स्व-नियोजित व्यक्ति जिसे व्यवसाय की तलाश है</span>,
//     <span className="font-hindi">जो कोई भी एक सफल व्यवसाय शुरू करना चाहता है</span>,
//   ];

//   // Testimonial data array
//   const testimonials = [
//     {
//       name: "Dipak Lad",
//       title: "Financial Advisor",
//       feedback: `At trustlinefin Financial Services, the commission structure is fantastic! As a financial advisor, it’s rewarding to see our hard work translate into good earnings.`,
//       hindiFeedback: <span className="font-hindi">trustlinefin Financial Services में, कमीशन संरचना शानदार है।</span>,
//     },
//     {
//       name: "Kiran Gaikwad",
//       title: "Channel Partner",
//       feedback: `Working at trustlinefin Financial Services is a breeze because of the on-time assistance we receive.`,
//       hindiFeedback: <span className="font-hindi">हमें समय पर मिलने वाली सहायता के कारण काम करना आसान है।</span>,
//     },
//     {
//       name: "Swapnil Borkar",
//       title: "Business Owner",
//       feedback: `Being part of TrustlineFin is amazing,  
//   offering clarity and strong financial support,  
//   building trust and growth every single day.`,
//       hindiFeedback: <span className="font-hindi">TrustlineFin का हिस्सा होना अद्भुत है,  
//   यह स्पष्टता और मजबूत वित्तीय सहायता देता है,  
//   और हर दिन विश्वास और विकास बढ़ाता है।</span>,
//     }
//   ];

//   const faqData = [
//     {
//       question: "What is a Personal Loan?",
//       answer:
//         "A personal loan is an unsecured loan that does not require any collateral. It is usually taken for purposes like weddings, travel, medical expenses, or debt consolidation, and is repaid in fixed EMIs over a 1–5 year term.",
//     },
//     {
//       question: "How is my loan eligibility calculated?",
//       answer:
//         "Eligibility is based on factors such as your monthly income, credit score, employment type, existing EMIs, and overall financial stability.",
//     },
//     {
//       question: "What is the difference between Pre-Closure and Part-Prepayment?",
//       answer:
//         "Pre-closure means paying off your entire loan amount before the scheduled term ends. Part-prepayment means paying a lump sum in addition to your EMI, which reduces your principal and future interest.",
//     },
//     {
//       question: "Can I pre-close my personal loan?",
//       answer:
//         "Yes, you can. Most lenders allow pre-closure, though some may charge a small fee depending on their policies.",
//     },
//     {
//       question: "How long does loan disbursement take?",
//       answer:
//         "Once your documents are verified and loan is approved, disbursal usually happens within 24 to 72 hours depending on the lender.",
//     },
//   ];


//   return (
//     <div>
//       {/* HERO */}
//       <section className="py-12 px-4">
//         <div className="max-w-7xl mx-auto text-center mb-5">
//           <h1 className="text-5xl font-bold text-black mb-4 leading-tight font-hindiHeading">
//             Become <span className="text-brand-primary">Trustline Fintech</span> Partner <br />
//             <span className="text-brand-primary font-hindi">Trustline Fintech के Partner बने</span>
//           </h1>

//           <p className="text-xl text-black max-w-2xl mx-auto">
//             Join India's leading financial service provider and help people access loans, credit cards, and more with ease.
//           </p>

//           <button className="mt-3 bg-brand-primary text-black font-semibold px-6 py-3 rounded-lg shadow hover:bg-gray-100 transition-all duration-300"
//             onClick={() => { navigate('/PartnerRegistrationForm'); }}
//           >
//             Join Now
//           </button>
//         </div>
//       </section>

//       {/* FEATURES */}
//       <section className="md:px-14 bg-white text-gray-800 py-0">
//         <div className="text-center mb-12">
//           <h2 className="text-6xl font-bold text-gray-900">
//             Big-Revenue Business Opportunity
//           </h2>
//           <p className="text-3xl text-brand-primary mt-2 font-hindi">
//             बड़े Income वाला व्यवसायिक अवसर
//           </p>
//         </div>

//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
//           {features.map((feature, index) => (
//             <div
//               key={index}
//               className="bg-[#f9f9f9] hover:shadow-xl transition duration-300 rounded-xl p-6 border border-brand-primary"
//             >
//               <div className="mb-4">{feature.icon}</div>
//               <h3 className="font-semibold text-lg text-gray-800">{feature.title}</h3>
//               <p className="text-[#166534] text-sm mb-2">{feature.hindiTitle}</p>
//               <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* WHO CAN JOIN */}
//       <section className="bg-white py-16 px-4">
//         <div className="max-w-6xl mx-auto bg-white p-10 rounded-xl shadow-lg border border-gray-200">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               {points.map((point, idx) => (
//                 <div key={idx} className="flex items-start space-x-2 mb-2">
//                   <CheckCircle className="text-brand-primary" size={20} />
//                   <span>{point}</span>
//                 </div>
//               ))}
//             </div>
//             <div>
//               {hindiPoints.map((point, idx) => (
//                 <div key={idx} className="flex items-start space-x-2 mb-2">
//                   <CheckCircle className="text-brand-primary" size={20} />
//                   {point}
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* TESTIMONIALS */}
//       <section className="bg-gray-100 py-20 px-6 feedback-section">
//         <div className="max-w-7xl mx-auto text-center">
//           <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
//             {testimonials.map((testimonial, idx) => (
//               <div
//                 key={idx}
//                 className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] transform flex flex-col justify-between"
//               >
//                 <div>
//                   <div className="flex justify-between items-start mb-6">
//                     <Quote size={48} className="text-gray-200" />
//                   </div>
//                   <p className="text-lg text-gray-800 leading-relaxed italic mb-4">
//                     "{testimonial.feedback}"
//                   </p>
//                   <p className="text-sm text-gray-500 font-light mb-6">
//                     {testimonial.hindiFeedback}
//                   </p>
//                 </div>
//                 <div className="mt-4 text-left">
//                   <p className="font-bold text-brand-primary text-lg">{testimonial.name}</p>
//                   <p className="text-sm text-gray-500">{testimonial.title}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* FAQ */}
//       <section className="bg-gradient-to-b from-white via-[#f9f9f9] to-[#eef3f8] py-20 px-6">
//         <div className="max-w-6xl mx-auto text-center">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//             {faqData.map((faq, index) => (
//               <div
//                 key={index}
//                 className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-left"
//               >
//                 <h3 className="text-xl font-semibold text-[#0E7C86] mb-4">
//                   Q{index + 1}. {faq.question}
//                 </h3>
//                 <p className="text-gray-700 text-base leading-relaxed">
//                   {faq.answer}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>
//     </div>
//   )
// }

// export default Channelpartner;
