import { User, Zap, Building2, Car, Home, CreditCard } from 'lucide-react';
import React from 'react';

const Documents = () => {
  const loanTypes = [
    {
      title: 'Personal Loan',
      icon: User,
      gradient: 'from-purple-500 to-indigo-600',
      documents: [
        'Aadhaar Card',
        'PAN Card',
        'Mobile Number',
        'Email ID',
        'Salary Slip (Last 3 months)',
        'Bank Account Statement (Last 6 months)',
        'Form 16 AS',
        'Office I-card',
        'CIBIL 680+',
        'Current Residential Proof'
      ]
    },
    {
      title: 'Instant Loan',
      icon: Zap,
      gradient: 'from-pink-500 to-rose-500',
      documents: [
        'Aadhaar Card',
        'PAN Card',
        'Mobile Number',
        'Email ID',
        'CIBIL 680+'
      ]
    },
    {
      title: 'Business Loan',
      icon: Building2,
      gradient: 'from-blue-500 to-cyan-500',
      documents: [
        'PAN Card (Individual & Business)',
        'Aadhaar Card',
        'Registration Proof',
        'Bank Account Statement (Last 6 months)',
        'CIBIL 680+'
      ]
    },
    {
      title: 'Home Loan',
      icon: Home,
      gradient: 'from-orange-500 to-yellow-500',
      documents: [
        'Aadhaar Card',
        'PAN Card',
        'Property Documents',
        'Income Proof (Salary Slips)',
        'Bank Statement (Last 6 months)',
        'CIBIL 680+'
      ]
    },
  ];

  return (
    <section className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 py-12 px-4">
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-800 mb-6">
          Documents List
        </h1>
        <p className="text-xl text-gray-600">
          Find the required documents for every type of loan and financial service
        </p>
        <div className="w-full max-w-2xl mx-auto mt-8 h-2 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#0FAA8C]  to-[#0ea688] rounded-full w-full"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-25">
        {loanTypes.map((loan) => {
          const Icon = loan.icon;
          return (
            <div
              key={loan.title}
              className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl"
            >
              <div className="flex items-center mb-6">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${loan.gradient} text-white mr-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">{loan.title}</h3>
              </div>

              <div className={`h-1 bg-gradient-to-r ${loan.gradient} rounded-full mb-6 w-full`}></div>

              <ul className="space-y-3">
                {loan.documents.map((document) => (
                  <li key={document} className="flex items-center text-gray-700">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${loan.gradient} mr-3`}></div>
                    <span className="text-sm">{document}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Documents;
