import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const GetLoan = () => {
  const [selectedLoan, setSelectedLoan] = useState("");
  const navigate = useNavigate();

  const loanTypes = [
    {
      id: "personal",
      title: "Personal Loan",
      subtitle: "For Salaried Individuals",
      description: "Quick personal loans with competitive rates for salaried professionals",
      icon: "👤",
      route: "/partner/personal-loan"
    },
    {
      id: "business",
      title: "Business Loan", 
      subtitle: "For Entrepreneurs",
      description: "Flexible business financing solutions for growing enterprises",
      icon: "💼",
      route: "/partner/bussiness-loan"
    },
    {
      id: "home-salaried",
      title: "Home Loan",
      subtitle: "For Salaried Person",
      description: "Affordable home loans with attractive interest rates for salaried individuals",
      icon: "🏠",
      route: "/partner/home-loan-salaried"
    },
    {
      id: "home-business",
      title: "Home Loan",
      subtitle: "For Self Employed",
      description: "Home financing options tailored for self-employed professionals and business owners",
      icon: "🏡",
      route: "/partner/home-loan-self-employee"
    }
  ];

  const handleLoanSelection = (loan) => {
    setSelectedLoan(loan.id);
      navigate(loan.route);

  };

  return (
    <section 
      className="min-h-screen flex items-center justify-center p-3"
      style={{
        backgroundSize: '200% 200%',
    
      }}
    >
  
      
      <div className="w-full max-w-6xl">
        <div className="text-center mb-6">
          <h1 
            className="text-4xl md:text-5xl font-extrabold mb-4"
            style={{ color: '#111827' }}
          >
            Choose Your Loan
          </h1>
          <p 
            className="text-lg md:text-xl opacity-80 max-w-2xl mx-auto"
            style={{ color: '#111827' }}
          >
            Select the loan type that best suits your needs and get started with your application
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loanTypes.map((loan) => (
            <div
              key={loan.id}
              onClick={() => handleLoanSelection(loan)}
              className={`
                relative cursor-pointer group transition-all duration-300 transform hover:scale-105 hover:-translate-y-2
                ${selectedLoan === loan.id ? 'scale-105 -translate-y-2' : ''}
              `}
            >
              <div
                className="h-full p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 hover:border-opacity-100 border-opacity-20"
                style={{
                  backgroundColor: '#F8FAFC',
                  borderColor: 'var(--color-brand-primary)',
                  boxShadow: selectedLoan === loan.id 
                    ? '0 25px 50px -12px rgba(18, 185, 156, 0.4)' 
                    : '0 10px 25px -3px rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* Icon Section */}
                <div className="text-center mb-4">
                  <div 
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl mb-3 transition-all duration-300 group-hover:scale-110"
                    style={{ 
                      backgroundColor: 'var(--color-brand-primary)',
                      color: '#F8FAFC'
                    }}
                  >
                    {loan.icon}
                  </div>
                </div>

                {/* Content Section */}
                <div className="text-center">
                  <h3 
                    className="text-xl font-bold mb-2"
                    style={{ color: '#111827' }}
                  >
                    {loan.title}
                  </h3>
                  <p 
                    className="text-sm font-medium mb-3 opacity-80"
                    style={{ color: 'var(--color-brand-primary)' }}
                  >
                    {loan.subtitle}
                  </p>
                  <p 
                    className="text-sm opacity-70 leading-relaxed"
                    style={{ color: '#111827' }}
                  >
                    {loan.description}
                  </p>
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                  style={{ backgroundColor: 'var(--color-brand-primary)' }}
                />

                {/* Selection Indicator */}
                {selectedLoan === loan.id && (
                  <div 
                    className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-brand-primary)' }}
                  >
                    <span className="text-white text-sm">✓</span>
                  </div>
                )}
              </div>

              {/* Loading State */}
              {selectedLoan === loan.id && (
                <div 
                  className="absolute -bottom-12 left-0 right-0 text-center text-sm font-medium py-2 px-4 rounded-lg mx-4"
                  style={{
                    backgroundColor: 'var(--color-brand-primary)',
                    color: '#F8FAFC',
                    animation: 'pulse 1.5s infinite'
                  }}
                >
                  Redirecting to {loan.title}...
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <p 
            className="text-lg opacity-70"
            style={{ color: '#111827' }}
          >
            Need help choosing? <span 
              className="font-semibold cursor-pointer hover:underline transition-all duration-200"
              style={{ color: 'var(--color-brand-primary)' }}
            >
              Contact our experts
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default GetLoan;
