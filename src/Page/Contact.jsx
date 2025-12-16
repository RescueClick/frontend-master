
import React, { useState } from 'react';
import { Send, Phone, Mail, MessageSquare, User, CheckCircle } from 'lucide-react';
const Contact = () => {

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    queries: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.queries.trim()) {
      newErrors.queries = 'Please tell us about your queries';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  const newErrors = validateForm();

  if (Object.keys(newErrors).length === 0) {
    try {
      const response = await fetch(`${backendurl}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.queries,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Success! We'll get back to you shortly."); // ✅ simple success alert
        setFormData({
          name: "",
          email: "",
          phone: "",
          queries: "",
        });
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



  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 py-12 px-4   ">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-[#12B99C] rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h2>
            <p className="text-lg text-gray-600 mb-6">
              Your message has been sent successfully. Our financial experts will get back to you within 24 hours.
            </p>
            <div className="bg-gradient-to-r from-[#12B99C] to-[#0f9d86] text-white rounded-lg p-4">
              <p className="font-semibold">What happens next?</p>
              <p className="text-sm text-emerald-100 mt-2">
                Our team will review your query and contact you with personalized financial solutions.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 py-12 px-4">
    <section className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Contact <span className="text-[#12B99C]">Trustline Fintech</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Ready to transform your financial future? Get in touch with our expert team for personalized consultation.
        </p>
      </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-[#12B99C] rounded-full flex items-center justify-center mr-4">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Send us a Message</h2>
                <p className="text-gray-600">Fill out the form below and we'll get back to you</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <User className="h-4 w-4 mr-2 text-[#12B99C]" />
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg transition-colors ${errors.name
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-[#12B99C] focus:border-[#12B99C]'
                    }`}
                  placeholder="Enter your full name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="h-4 w-4 mr-2 text-[#12B99C]" />
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg transition-colors ${errors.email
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-[#12B99C] focus:border-[#12B99C]'
                    }`}
                  placeholder="Enter your email address"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="h-4 w-4 mr-2 text-[#12B99C]" />
                  Phone *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg transition-colors ${errors.phone
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-[#12B99C] focus:border-[#12B99C]'
                    }`}
                  placeholder="Enter your phone number"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              {/* Queries Field */}
              <div>
                <label htmlFor="queries" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <MessageSquare className="h-4 w-4 mr-2 text-[#12B99C]" />
                  Queries *
                </label>
                <textarea
                  id="queries"
                  name="queries"
                  rows="5"
                  value={formData.queries}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg transition-colors resize-vertical ${errors.queries
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-[#12B99C] focus:border-[#12B99C]'
                    }`}
                  placeholder="Tell us about your financial needs, investment goals, loan requirements, or any other queries..."
                ></textarea>
                {errors.queries && <p className="text-red-500 text-sm mt-1">{errors.queries}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-[#12B99C] hover:bg-[#0f9d86] text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <Send className="h-5 w-5" />
                <span>Send Message</span>
              </button>
            </form>
          </div>

        {/* Contact Information */}
        <div className="space-y-8">
          {/* Why Choose Us */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Why Choose Trustline Fintech?</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-[#12B99C] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">100% Digital Process</h4>
                  <p className="text-gray-600 text-sm">No physical visits required - everything from your smartphone</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-[#12B99C] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">Expert Consultation</h4>
                  <p className="text-gray-600 text-sm">Personalized financial advice from certified professionals</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-[#12B99C] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">Trusted by 80k+ Customers</h4>
                  <p className="text-gray-600 text-sm">Join thousands of satisfied customers across India</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-[#12B99C] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">45+ Bank Partnerships</h4>
                  <p className="text-gray-600 text-sm">Wide network of leading banks and financial institutions</p>
                </div>
              </div>
            </div>
          </div>

            {/* Contact Stats */}
            <div className="bg-gradient-to-r from-[#12B99C] to-[#0f9d86] rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Get in Touch Today</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-6 w-6 text-emerald-100" />
                  <div>
                    <p className="font-semibold">+91 8766681450 </p>
                    <p className="text-emerald-100 text-sm">Mon - Fri, 9:00 AM - 6:00 PM</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {/* <Mail className="h-6 w-6 text-emerald-100" /> */}
                  {/* <div>
                    <p className="font-semibold">Quick Response</p>
                    <p className="text-emerald-100 text-sm">We respond within 24 hours guaranteed</p>
                  </div> */}
                  <div className="flex items-center gap-2">
                <Mail className="w-6 h-6 text-emerald-100" />
                <a href="mailto:support@trustlinefintech.com" className="font-semibold hover:text-[#12B99C]">
                  Email Us : <span className="text-emerald-100 text-sm">contact@trustlinefintech.com</span>
                </a>
              </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-6 w-6 text-emerald-100" />
                  <div>
                    <p className="font-semibold">All-India Service</p>
                    <p className="text-emerald-100 text-sm">Serving customers across the entire country</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Contact
