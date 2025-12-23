import React from 'react'
import { CheckCircle, Users, Building, Smartphone, Star, ArrowRight } from 'lucide-react';
const AboutUs = () => {

  const stats = [
    { number: '80k+', label: 'Happy Customers' },
    { number: '1000+', label: 'Partners' },
    { number: '45+', label: 'Bank Partnerships' },
    { number: '2018', label: 'Since' }
  ];

  const teamMembers = [
    { name: 'Sana Shaikh', role: 'Area Head' },
    { name: 'Murli Prasad', role: 'Partner' },
    { name: 'Sikha Jain', role: 'Partner' },
    { name: 'Arvind Mane', role: 'Partner' }
  ];

  const features = [
    'Expert Financial Consultation',
    '100% Digital Process',
    'No Physical Visits Required',
    'Zero Agent Commission',
    'Smartphone Accessible',
    'All-India Service'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Hero Section */}
      <section className="py-15 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            We Are <span className="text-[#12B99C]">Trustline Fintech</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-4xl mx-auto">
            Serving Financial Services For Your Dreams At Your Mobile Screen!
          </p>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto shadow-xl">
            <p className="text-lg text-gray-800 leading-relaxed">
              <strong>Trustline Fintech</strong> presents an online platform where anyone and everyone can get expert financial consultation & services in the comfort of their home.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-[#12B99C] mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-semibold">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-8">
                Revolutionary Financial Services
              </h2>
              <div className="prose prose-lg text-gray-700 mb-8">
                <p>
                  When it comes to fulfilling the aspirations of life, money plays a very pivotal role in pushing your dreams towards actuality – and Trustline Fintech understands this.
                </p>
                <p>
                  Skip the tedious traditional financial services involving physical visits, innumerable document submissions, or paying commission to agents. Get financial consultation and services from your smartphone, while relaxing on your couch!
                </p>
              </div>
              {/* <button className="bg-[#12B99C] hover:bg-[#0f9d86] text-white px-8 py-4 rounded-lg font-semibold flex items-center space-x-2 transition-colors">
                <span>Learn More</span>
                <ArrowRight className="h-5 w-5" />
              </button> */}
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Smartphone className="h-8 w-8 text-[#12B99C] mr-3" />
                Why Choose Us?
              </h3>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-[#12B99C] to-[#0f9d86] rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-6">About Trustline Fintech</h2>
            <div className="space-y-4 text-emerald-50">
              <p>
                <strong>Legal Name:</strong> Trustline Fintech
              </p>
              <p>
                Working since 2018, we have grown from partnerships to becoming an independent financial services provider in December 2022.
              </p>
              <p>
                Today, we proudly serve customers across India with our comprehensive digital financial platform, partnering with leading banks, finance companies, and NBFCs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Team</h2>
            <p className="text-xl text-[#12B99C] font-semibold">
              For Every Solution - We have a Dedicated team!
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow">
                <div className="w-20 h-20 bg-gradient-to-br from-[#12B99C] to-[#0f9d86] rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-[#12B99C] font-semibold">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {/* <section className="py-20 bg-gradient-to-r from-[#12B99C] to-[#0f9d86] px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Financial Journey?
          </h2>
          <p className="text-xl mb-8 text-emerald-100">
            Join 80,000+ satisfied customers who trust us with their financial dreams
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-[#12B99C] px-8 py-4 rounded-lg font-semibold hover:bg-emerald-50 transition-colors">
              Get Free Consultation
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-[#12B99C] transition-colors">
              Contact Us
            </button>
          </div>
        </div>
      </section> */}

   
    </div>
  )
}

export default AboutUs
