import React from 'react'
// import ChannelPartnerHero from './ChannelPartnerHero'
// import ChannelPartnerOpportunities from './ChannelPartnerOpportunities'
// import PartnerFeedback from './PartnerFeedback'
// import ReferEarnSection from './ReferEarnSection'
// import FaqSection from './FaqSection'

import { useNavigate } from 'react-router-dom';


import {
  DollarSign,
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
      icon: <IndianRupee className="h-10 w-10 text-[#12B99C]" />,
      title: "Earn up to Rs. 1,00,000/month",
      hindiTitle: "1,00,000/ रुपये माह तक कमाएं",
      desc: "A highly rewarding business that can flourish limitlessly with this easy refer and earn business venture.",
    },
    {
      icon: <TrendingUp className="h-10 w-10 text-[#12B99C]" />,
      title: "Great Profits – Low Investment",
      hindiTitle: "बढ़िया मुनाफा – कम निवेश",
      desc: "A low investment business opportunity is rare! Make the most of it and start generating income now.",
    },
    {
      icon: <Briefcase className="h-10 w-10 text-[#12B99C]" />,
      title: "Lifetime Career Opportunity",
      hindiTitle: "आजीवन करियर अवसर",
      desc: "You can rely upon this business and make it your lifelong vehicle to financial success and career growth.",
    },
    {
      icon: <Headphones className="h-10 w-10 text-[#12B99C]" />,
      title: "Access Free Marketing Support",
      hindiTitle: "निःशुल्क Marketing सहायता",
      desc: "Finable India provides the best marketing support for the partners’ businesses to grow substantially.",
    },
    {
      icon: <LayoutDashboard className="h-10 w-10 text-[#12B99C]" />,
      title: "Personal Portal For Tracking Revenue",
      hindiTitle: "ट्रैकिंग के लिए व्यक्तिगत पोर्टल",
      desc: "Access your own smart personal portal wherein you can view all the required information and track your earnings.",
    },
    {
      icon: <Laptop className="h-10 w-10 text-[#12B99C]" />,
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
      feedback: `At trustlinefin Financial Services, the commission structure is fantastic! As a financial advisor, it’s rewarding to see our hard work translate into good earnings.`,
      hindiFeedback: `trustlinefin Financial Services में, कमीशन संरचना शानदार है।`,
    },
    {
      name: "Kiran Gaikwad",
      title: "Channel Partner",
      feedback: `Working at trustlinefin Financial Services is a breeze because of the on-time assistance we receive.`,
      hindiFeedback: `हमें समय पर मिलने वाली सहायता के कारण काम करना आसान है।`,
    },
    {
      name: "Swapnil Borkar",
      title: "Business Owner",
      feedback: `Being part of TrustlineFin is amazing,  
  offering clarity and strong financial support,  
  building trust and growth every single day.`,
      hindiFeedback: `TrustlineFin का हिस्सा होना अद्भुत है,  
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
    <div>
      {/* <section className="mx-auto mt-10">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-800">
            Channel Partner
          </h1>
        </div>
      </section> */}

      {/* <ChannelPartnerHero /> */}

      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-5">
            <h1 className="text-5xl font-bold text-black mb-4 leading-tight font-hindiHeading">
              Become <span className="text-[#12B99C]">Trustline Fintech</span> Partner <br />
              <span className="text-[#12B99C]">Trustline Fintech</span> के Partner बने
            </h1>

            <p className="text-xl text-black max-w-2xl mx-auto">
              Join India's leading financial service provider and help people access loans, credit cards, and more with ease.
            </p>

            <div className="mt-8 max-w-3xl mx-auto">
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full text-black rounded-full animate-pulse"></div>
              </div>
            </div>

            <button className=" cursor-pointer mt-3 bg-[#12B99C] text-black font-semibold px-6 py-3 rounded-lg shadow hover:bg-gray-100 transition-all duration-300"
              onClick={() => { navigate('/PartnerRegistrationForm'); }}
            >
              Join Now
            </button>

            <div className="bg-gradient-to-r from-[#12B99C] to-[#12B99C] rounded-full animate-pulse p-1 mt-15"></div>
          </div>
        </div>
      </section>

      {/* <ChannelPartnerOpportunities /> */}

      <section className="md:px-14 bg-white text-gray-800 py-0">
        <div className="text-center mb-12">
          <h2 className="text-6xl font-bold text-gray-900">
            Big-Revenue Business Opportunity
          </h2>
          <p className="text-3xl text-[#12B99C] mt-2">
            बड़े Income वाला व्यवसायिक अवसर
          </p>
        </div>

        <div className="bg-[#12B99C] text-white px-6 py-4 text-center rounded-md mb-10">
          <p className="text-lg font-medium">
            Channel Partner Plan – Loaded With Business-Centric Perks | चैनल पार्टनर योजना – व्यवसाय-केंद्रित सुविधाओं से भरपूर
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-[#f9f9f9] hover:shadow-xl transition duration-300 rounded-xl p-6 border border-[#12B99C]"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="font-semibold text-lg text-gray-800">{feature.title}</h3>
              <p className="text-[#166534] text-sm mb-2">{feature.hindiTitle}</p>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* <ReferEarnSection /> */}

      <section className="bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto bg-white p-10 rounded-xl shadow-lg border border-gray-200">
          <p className="text-sm text-[#12B99C] font-medium mb-2">
            # Welcome To Trustline Fintech
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Earn Limitless With Refer &{" "}
            <span className="text-[#12B99C]">Earn Business Model!</span>
          </h2>
          <h3 className="text-2xl font-semibold text-[#12B99C] mb-6">
            रेफर और अर्न बिज़नेस मॉडल के साथ{" "}
            <span className="text-green-700">असीमित कमाई करें!</span>
          </h3>

          <p className="text-gray-600 mb-2">
            If you’re a salaried person who wants to generate a great side-income
            or a passionate individual who wants to make it big in life – this is
            for YOU!
          </p>
          <p className="text-gray-600 mb-4">
            यदि आप एक salaried व्यक्ति हैं जो अच्छी side-income generate करना चाहते हैं
            या जो जीवन में कुछ बड़ा करना चाहते हैं – यह आपके लिए है!
          </p>

          <p className="text-gray-600 mb-4">
            Your background does not matter – what matters is your zeal. By
            becoming a Channel Partner, you get to start your own business that
            can earn you up to ₹3 Lakhs monthly.
          </p>
          <p className="text-gray-600 mb-8">
            आपका background बिल्कुल भी मायने नहीं रखता। मायने रखता है आपका जज़्बा। और
            चैनल पार्टनर बनकर, आप अपना खुद का व्यवसाय शुरू कर सकते हैं जिससे आपको ₹3
            लाख तक कमाने की क्षमता है।
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {points.map((point, idx) => (
                <div key={idx} className="flex items-start space-x-2 mb-2">
                  <CheckCircle className="text-[#12B99C]" size={20} />
                  <span className="text-gray-700">{point}</span>
                </div>
              ))}
            </div>
            <div>
              {hindiPoints.map((point, idx) => (
                <div key={idx} className="flex items-start space-x-2 mb-2">
                  <CheckCircle className="text-[#12B99C]" size={20} />
                  <span className="text-gray-700">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* <PartnerFeedback /> */}

      <section className="bg-gray-100 py-20 px-6 feedback-section">
        <div className="max-w-7xl mx-auto text-center">
          {/* Main section title */}
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#12B99C] tracking-tight mb-4">
            What Our Partners Are Saying
          </h2>

          {/* Sub-heading */}
          <p className="text-lg text-gray-600 mb-16 max-w-3xl mx-auto">
            Hear from the people who have found success and growth with our
            platform.
          </p>

          {/* Testimonial cards grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] transform flex flex-col justify-between"
              >
                <div>
                  {/* Quote icon */}
                  <div className="flex justify-between items-start mb-6">
                    <Quote size={48} className="text-gray-200" />
                  </div>

                  {/* English feedback */}
                  <p className="text-lg text-gray-800 leading-relaxed italic mb-4">
                    "{testimonial.feedback}"
                  </p>

                  {/* Hindi feedback */}
                  <p className="text-sm text-gray-500 font-light mb-6">
                    "{testimonial.hindiFeedback}"
                  </p>
                </div>

                {/* Partner name and title */}
                <div className="mt-4 text-left">
                  <p className="font-bold text-[#12B99C] text-lg">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.title}</p>
                </div>
              </div>

            ))}
          </div>
        </div>
      </section>

      {/* <FaqSection /> */}
      <section className="bg-gradient-to-b from-white via-[#f9f9f9] to-[#eef3f8] py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 text-lg md:text-xl mb-12 max-w-3xl mx-auto">
            Your questions, answered clearly to help you make informed decisions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqData.map((faq, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-left"
              >
                <h3 className="text-xl font-semibold text-[#0E7C86] mb-4">
                  Q{index + 1}. {faq.question}
                </h3>
                <p className="text-gray-700 text-base leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
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
//   DollarSign,
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
//       icon: <IndianRupee className="h-10 w-10 text-[#12B99C]" />,
//       title: "Earn up to Rs. 1,00,000/month",
//       hindiTitle: <span className="font-hindi">1,00,000/ रुपये माह तक कमाएं</span>,
//       desc: "A highly rewarding business that can flourish limitlessly with this easy refer and earn business venture.",
//     },
//     {
//       icon: <TrendingUp className="h-10 w-10 text-[#12B99C]" />,
//       title: "Great Profits – Low Investment",
//       hindiTitle: <span className="font-hindi">बढ़िया मुनाफा – कम निवेश</span>,
//       desc: "A low investment business opportunity is rare! Make the most of it and start generating income now.",
//     },
//     {
//       icon: <Briefcase className="h-10 w-10 text-[#12B99C]" />,
//       title: "Lifetime Career Opportunity",
//       hindiTitle: <span className="font-hindi">आजीवन करियर अवसर</span>,
//       desc: "You can rely upon this business and make it your lifelong vehicle to financial success and career growth.",
//     },
//     {
//       icon: <Headphones className="h-10 w-10 text-[#12B99C]" />,
//       title: "Access Free Marketing Support",
//       hindiTitle: <span className="font-hindi">निःशुल्क Marketing सहायता</span>,
//       desc: "Finable India provides the best marketing support for the partners’ businesses to grow substantially.",
//     },
//     {
//       icon: <LayoutDashboard className="h-10 w-10 text-[#12B99C]" />,
//       title: "Personal Portal For Tracking Revenue",
//       hindiTitle: <span className="font-hindi">ट्रैकिंग के लिए व्यक्तिगत पोर्टल</span>,
//       desc: "Access your own smart personal portal wherein you can view all the required information and track your earnings.",
//     },
//     {
//       icon: <Laptop className="h-10 w-10 text-[#12B99C]" />,
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
//             Become <span className="text-[#12B99C]">Trustline Fintech</span> Partner <br />
//             <span className="text-[#12B99C] font-hindi">Trustline Fintech के Partner बने</span>
//           </h1>

//           <p className="text-xl text-black max-w-2xl mx-auto">
//             Join India's leading financial service provider and help people access loans, credit cards, and more with ease.
//           </p>

//           <button className="mt-3 bg-[#12B99C] text-black font-semibold px-6 py-3 rounded-lg shadow hover:bg-gray-100 transition-all duration-300"
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
//           <p className="text-3xl text-[#12B99C] mt-2 font-hindi">
//             बड़े Income वाला व्यवसायिक अवसर
//           </p>
//         </div>

//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
//           {features.map((feature, index) => (
//             <div
//               key={index}
//               className="bg-[#f9f9f9] hover:shadow-xl transition duration-300 rounded-xl p-6 border border-[#12B99C]"
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
//                   <CheckCircle className="text-[#12B99C]" size={20} />
//                   <span>{point}</span>
//                 </div>
//               ))}
//             </div>
//             <div>
//               {hindiPoints.map((point, idx) => (
//                 <div key={idx} className="flex items-start space-x-2 mb-2">
//                   <CheckCircle className="text-[#12B99C]" size={20} />
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
//                   <p className="font-bold text-[#12B99C] text-lg">{testimonial.name}</p>
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
