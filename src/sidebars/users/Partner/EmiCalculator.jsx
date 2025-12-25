// import React, { useState, useEffect } from 'react';
// import { Calculator, DollarSign, Calendar, Percent, TrendingUp, PieChart, Info } from 'lucide-react';
 
// const EmiCalculator = () => {
//   const [loanAmount, setLoanAmount] = useState(500000);
//   const [interestRate, setInterestRate] = useState(8.5);
//   const [loanTenure, setLoanTenure] = useState(20);
//   const [emi, setEmi] = useState(0);
//   const [totalAmount, setTotalAmount] = useState(0);
//   const [totalInterest, setTotalInterest] = useState(0);
 
//   // Calculate EMI
//   const calculateEmi = () => {
//     const principal = parseFloat(loanAmount);
//     const rate = parseFloat(interestRate) / 100 / 12; // Monthly interest rate
//     const tenure = parseFloat(loanTenure) * 12; // Total months
 
//     if (principal > 0 && rate > 0 && tenure > 0) {
//       const emiAmount = (principal * rate * Math.pow(1 + rate, tenure)) / (Math.pow(1 + rate, tenure) - 1);
//       const totalAmountPayable = emiAmount * tenure;
//       const totalInterestPayable = totalAmountPayable - principal;
 
//       setEmi(emiAmount);
//       setTotalAmount(totalAmountPayable);
//       setTotalInterest(totalInterestPayable);
//     }
//   };
 
//   useEffect(() => {
//     calculateEmi();
//   }, [loanAmount, interestRate, loanTenure]);
 
//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       maximumFractionDigits: 0
//     }).format(amount);
//   };
 
//   const formatNumber = (num) => {
//     return new Intl.NumberFormat('en-IN').format(num);
//   };
 
//   // Calculate percentages for breakdown
//   const principalPercentage = ((loanAmount / totalAmount) * 100).toFixed(1);
//   const interestPercentage = ((totalInterest / totalAmount) * 100).toFixed(1);
 
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
//       <div className="max-w-6xl mx-auto">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <div className="flex items-center justify-center gap-3 mb-4">
//             <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-lg">
//               <Calculator className="w-8 h-8 text-white" />
//             </div>
//             <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
//               EMI Calculator
//             </h1>
//           </div>
//           <p className="text-gray-600 text-lg">Calculate your loan EMI, total payment, and interest breakdown</p>
//         </div>
 
//         <div className="grid lg:grid-cols-2 gap-8">
//           {/* Input Section */}
//           <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
//             <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
//               <TrendingUp className="w-6 h-6 text-blue-600" />
//               Loan Details
//             </h2>
 
//             <div className="space-y-8">
//               {/* Loan Amount */}
//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
//                   <DollarSign className="w-4 h-4 text-green-600" />
//                   Loan Amount
//                 </label>
//                 <div className="relative mb-4">
//                   <input
//                     type="range"
//                     min="100000"
//                     max="10000000"
//                     step="50000"
//                     value={loanAmount}
//                     onChange={(e) => setLoanAmount(e.target.value)}
//                     className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                   <div className="flex justify-between text-xs text-gray-500 mt-1">
//                     <span>₹1L</span>
//                     <span>₹1Cr</span>
//                   </div>
//                 </div>
//                 <div>
//                   <input
//                     type="number"
//                     value={loanAmount}
//                     onChange={(e) => setLoanAmount(e.target.value)}
//                     className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg font-semibold bg-gray-50 transition-colors"
//                     placeholder="Enter loan amount"
//                   />
//                   <p className="text-sm text-gray-600 mt-1">{formatCurrency(loanAmount)}</p>
//                 </div>
//               </div>
 
//               {/* Interest Rate */}
//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
//                   <Percent className="w-4 h-4 text-orange-600" />
//                   Annual Interest Rate
//                 </label>
//                 <div className="relative mb-4">
//                   <input
//                     type="range"
//                     min="1"
//                     max="30"
//                     step="0.1"
//                     value={interestRate}
//                     onChange={(e) => setInterestRate(e.target.value)}
//                     className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500"
//                   />
//                   <div className="flex justify-between text-xs text-gray-500 mt-1">
//                     <span>1%</span>
//                     <span>30%</span>
//                   </div>
//                 </div>
//                 <div>
//                   <input
//                     type="number"
//                     value={interestRate}
//                     onChange={(e) => setInterestRate(e.target.value)}
//                     step="0.1"
//                     className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none text-lg font-semibold bg-gray-50 transition-colors"
//                     placeholder="Enter interest rate"
//                   />
//                   <p className="text-sm text-gray-600 mt-1">{interestRate}% per annum</p>
//                 </div>
//               </div>
 
//               {/* Loan Tenure */}
//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
//                   <Calendar className="w-4 h-4 text-purple-600" />
//                   Loan Tenure
//                 </label>
//                 <div className="relative mb-4">
//                   <input
//                     type="range"
//                     min="1"
//                     max="30"
//                     step="1"
//                     value={loanTenure}
//                     onChange={(e) => setLoanTenure(e.target.value)}
//                     className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
//                   />
//                   <div className="flex justify-between text-xs text-gray-500 mt-1">
//                     <span>1 Yr</span>
//                     <span>30 Yrs</span>
//                   </div>
//                 </div>
//                 <div>
//                   <input
//                     type="number"
//                     value={loanTenure}
//                     onChange={(e) => setLoanTenure(e.target.value)}
//                     className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg font-semibold bg-gray-50 transition-colors"
//                     placeholder="Enter loan tenure"
//                   />
//                   <p className="text-sm text-gray-600 mt-1">{loanTenure} years ({loanTenure * 12} months)</p>
//                 </div>
//               </div>
//             </div>
//           </div>
 
//           {/* Results Section */}
//           <div className="space-y-6">
//             {/* EMI Result Card */}
//             <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white transform hover:scale-105 transition-transform duration-300">
//               <div className="flex items-center gap-3 mb-4">
//                 <Calculator className="w-8 h-8" />
//                 <h2 className="text-2xl font-bold">Monthly EMI</h2>
//               </div>
//               <div className="text-5xl font-bold mb-2">
//                 {formatCurrency(emi)}
//               </div>
//               <p className="text-blue-100 text-lg">
//                 You'll pay this amount every month for {loanTenure} years
//               </p>
//             </div>
 
//             {/* Summary Cards */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//               <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
//                 <div className="flex items-center gap-3 mb-3">
//                   <div className="p-2 bg-green-100 rounded-lg">
//                     <DollarSign className="w-5 h-5 text-green-600" />
//                   </div>
//                   <h3 className="font-semibold text-gray-800">Total Amount</h3>
//                 </div>
//                 <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
//                 <p className="text-sm text-gray-600 mt-1">Principal + Interest</p>
//               </div>
 
//               <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
//                 <div className="flex items-center gap-3 mb-3">
//                   <div className="p-2 bg-red-100 rounded-lg">
//                     <TrendingUp className="w-5 h-5 text-red-600" />
//                   </div>
//                   <h3 className="font-semibold text-gray-800">Total Interest</h3>
//                 </div>
//                 <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalInterest)}</p>
//                 <p className="text-sm text-gray-600 mt-1">Extra amount paid</p>
//               </div>
//             </div>
 
//             {/* Breakdown Chart */}
//             <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <PieChart className="w-6 h-6 text-purple-600" />
//                 <h3 className="text-xl font-bold text-gray-800">Payment Breakdown</h3>
//               </div>
 
//               {/* Visual Breakdown */}
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors duration-200">
//                   <div className="flex items-center gap-3">
//                     <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
//                     <span className="font-semibold text-gray-700">Principal Amount</span>
//                   </div>
//                   <div className="text-right">
//                     <p className="font-bold text-gray-900">{formatCurrency(loanAmount)}</p>
//                     <p className="text-sm text-gray-600">{principalPercentage}%</p>
//                   </div>
//                 </div>
 
//                 <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors duration-200">
//                   <div className="flex items-center gap-3">
//                     <div className="w-4 h-4 bg-red-600 rounded-full"></div>
//                     <span className="font-semibold text-gray-700">Interest Amount</span>
//                   </div>
//                   <div className="text-right">
//                     <p className="font-bold text-gray-900">{formatCurrency(totalInterest)}</p>
//                     <p className="text-sm text-gray-600">{interestPercentage}%</p>
//                   </div>
//                 </div>
 
//                 {/* Progress Bar */}
//                 <div className="mt-6">
//                   <div className="flex justify-between text-sm text-gray-600 mb-2">
//                     <span>Principal vs Interest</span>
//                     <span>Total: {formatCurrency(totalAmount)}</span>
//                   </div>
//                   <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
//                     <div className="h-full flex">
//                       <div
//                         className="bg-blue-600 transition-all duration-500 ease-in-out"
//                         style={{ width: `${principalPercentage}%` }}
//                       ></div>
//                       <div
//                         className="bg-red-600 transition-all duration-500 ease-in-out"
//                         style={{ width: `${interestPercentage}%` }}
//                       ></div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
 
//             {/* Additional Info */}
//             <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
//               <div className="flex items-start gap-3">
//                 <Info className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
//                 <div>
//                   <h4 className="font-semibold text-gray-800 mb-2">Key Information</h4>
//                   <ul className="text-sm text-gray-600 space-y-1">
//                     <li className="flex items-start gap-1">
//                       <span className="text-indigo-500 mt-1">•</span>
//                       <span>EMI remains constant throughout the loan tenure</span>
//                     </li>
//                     <li className="flex items-start gap-1">
//                       <span className="text-indigo-500 mt-1">•</span>
//                       <span>Early payments can significantly reduce total interest</span>
//                     </li>
//                     <li className="flex items-start gap-1">
//                       <span className="text-indigo-500 mt-1">•</span>
//                       <span>Interest rates may vary based on credit score and lender</span>
//                     </li>
//                     <li className="flex items-start gap-1">
//                       <span className="text-indigo-500 mt-1">•</span>
//                       <span>Consider processing fees and other charges</span>
//                     </li>
//                   </ul>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
 
//         {/* Detailed Breakdown Table */}
//         <div className="mt-8 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
//           <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
//             <TrendingUp className="w-6 h-6 text-green-600" />
//             Loan Summary
//           </h3>
         
//           <div className="grid md:grid-cols-3 gap-6 mb-8">
//             <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-colors duration-300">
//               <h4 className="text-lg font-semibold text-gray-700 mb-2">Monthly Payment</h4>
//               <p className="text-3xl font-bold text-blue-600">{formatCurrency(emi)}</p>
//               <p className="text-sm text-gray-600 mt-1">For {loanTenure * 12} months</p>
//             </div>
           
//             <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-colors duration-300">
//               <h4 className="text-lg font-semibold text-gray-700 mb-2">Principal Amount</h4>
//               <p className="text-3xl font-bold text-green-600">{formatCurrency(loanAmount)}</p>
//               <p className="text-sm text-gray-600 mt-1">{principalPercentage}% of total payment</p>
//             </div>
           
//             <div className="text-center p-6 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl hover:from-red-100 hover:to-pink-100 transition-colors duration-300">
//               <h4 className="text-lg font-semibold text-gray-700 mb-2">Total Interest</h4>
//               <p className="text-3xl font-bold text-red-600">{formatCurrency(totalInterest)}</p>
//               <p className="text-sm text-gray-600 mt-1">{interestPercentage}% of total payment</p>
//             </div>
//           </div>
 
//           {/* Quick Stats */}
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
//               <p className="text-sm text-gray-600 mb-1">Loan Amount</p>
//               <p className="font-bold text-gray-800">₹{formatNumber(loanAmount)}</p>
//             </div>
//             <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
//               <p className="text-sm text-gray-600 mb-1">Interest Rate</p>
//               <p className="font-bold text-gray-800">{interestRate}%</p>
//             </div>
//             <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
//               <p className="text-sm text-gray-600 mb-1">Tenure</p>
//               <p className="font-bold text-gray-800">{loanTenure} Years</p>
//             </div>
//             <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
//               <p className="text-sm text-gray-600 mb-1">Total Payments</p>
//               <p className="font-bold text-gray-800">{loanTenure * 12}</p>
//             </div>
//           </div>
//         </div>
 
//         {/* Footer */}
//         <div className="mt-8 text-center">
//           <p className="text-gray-500 text-sm">
//             This calculator provides estimates. Actual EMI may vary based on lender terms and conditions.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };
 
// export default EmiCalculator;

import React, { useState, useEffect } from 'react';
import {
  Calculator,
  DollarSign,
  Calendar,
  Percent,
  TrendingUp,
  PieChart,
  Info,
} from 'lucide-react';

const MIN_AMOUNT = 5000;
const MAX_AMOUNT = 10000000; // 1 crore
const MIN_RATE = 0;
const MAX_RATE = 100;
const MIN_TENURE = 0;
const MAX_TENURE = 50;

const clamp = (value, min, max) => {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
};

const sanitizeNumber = (raw, allowDecimal = false) => {
  if (typeof raw === "number") return raw;
  if (typeof raw !== "string") return NaN;
  const cleaned = allowDecimal
    ? raw.replace(/[^0-9.]/g, "")
    : raw.replace(/\D/g, "");
  if (cleaned === "") return NaN;
  return allowDecimal ? parseFloat(cleaned) : parseInt(cleaned, 10);
};
 
const EmiCalculator = () => {
  const [loanAmount, setLoanAmount] = useState(500000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanTenure, setLoanTenure] = useState(20);
  const [loanAmountInput, setLoanAmountInput] = useState("500000");
  const [interestRateInput, setInterestRateInput] = useState("8.5");
  const [loanTenureInput, setLoanTenureInput] = useState("20");
  const [emi, setEmi] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
 
  // Calculate EMI
  const calculateEmi = () => {
    const principal = Number(loanAmount);
    const rate = Number(interestRate) / 100 / 12; // Monthly interest rate
    const tenure = Number(loanTenure) * 12; // Total months
 
    if (principal > 0 && rate > 0 && tenure > 0) {
      const emiAmount = (principal * rate * Math.pow(1 + rate, tenure)) / (Math.pow(1 + rate, tenure) - 1);
      const totalAmountPayable = emiAmount * tenure;
      const totalInterestPayable = totalAmountPayable - principal;
 
      setEmi(emiAmount);
      setTotalAmount(totalAmountPayable);
      setTotalInterest(totalInterestPayable);
    }
  };
 
  useEffect(() => {
    calculateEmi();
  }, [loanAmount, interestRate, loanTenure]);
 
  const formatCurrency = (amount) => {
    if (!Number.isFinite(amount)) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (!Number.isFinite(num)) return "0";
    return new Intl.NumberFormat("en-IN").format(num);
  };

  const handleAmountTextChange = (value) => {
    setLoanAmountInput(value);
    const parsed = sanitizeNumber(value, false);
    if (Number.isNaN(parsed)) {
      setLoanAmount(0);
      return;
    }
    const clamped = clamp(parsed, MIN_AMOUNT, MAX_AMOUNT);
    setLoanAmount(clamped);
  };

  const handleRateTextChange = (value) => {
    setInterestRateInput(value);
    const parsed = sanitizeNumber(value, true);
    if (Number.isNaN(parsed)) {
      setInterestRate(0);
      return;
    }
    const clamped = clamp(parsed, MIN_RATE, MAX_RATE);
    setInterestRate(clamped);
  };

  const handleTenureTextChange = (value) => {
    setLoanTenureInput(value);
    const parsed = sanitizeNumber(value, false);
    if (Number.isNaN(parsed)) {
      setLoanTenure(0);
      return;
    }
    const clamped = clamp(parsed, MIN_TENURE, MAX_TENURE);
    setLoanTenure(clamped);
  };

  const handleAmountSlider = (val) => {
    const clamped = clamp(val, MIN_AMOUNT, MAX_AMOUNT);
    setLoanAmount(clamped);
    setLoanAmountInput(String(Math.round(clamped)));
  };

  const handleRateSlider = (val) => {
    const clamped = clamp(val, MIN_RATE, MAX_RATE);
    setInterestRate(clamped);
    setInterestRateInput(String(clamped));
  };

  const handleTenureSlider = (val) => {
    const clamped = clamp(val, MIN_TENURE, MAX_TENURE);
    setLoanTenure(clamped);
    setLoanTenureInput(String(Math.round(clamped)));
  };
 
  // Calculate percentages for breakdown
  const principalPercentage =
    totalAmount > 0 ? ((loanAmount / totalAmount) * 100).toFixed(1) : "0.0";
  const interestPercentage =
    totalAmount > 0 ? ((totalInterest / totalAmount) * 100).toFixed(1) : "0.0";
 
  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-teal-500 rounded-full shadow-lg">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              EMI Calculator
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Calculate your loan EMI, total payment, and interest breakdown</p>
        </div>
 
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-teal-500" />
              Loan Details
            </h2>
 
            <div className="space-y-8">
              {/* Loan Amount */}
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-teal-500" />
                  Loan Amount
                </label>
                <div className="relative mb-4">
                  <input
                    type="range"
                    min="100000"
                    max="10000000"
                    step="50000"
                    value={loanAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500"
                    style={{
                      background: `linear-gradient(to right, #12B99C 0%, #12B99C ${((loanAmount - 100000) / (10000000 - 100000)) * 100}%, #e5e7eb ${((loanAmount - 100000) / (10000000 - 100000)) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>₹1L</span>
                    <span>₹1Cr</span>
                  </div>
                </div>
                <div>
                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none text-lg font-semibold bg-slate-50 transition-colors"
                    placeholder="Enter loan amount"
                  />
                  <p className="text-sm text-gray-600 mt-1">{formatCurrency(loanAmount)}</p>
                </div>
              </div>
 
              {/* Interest Rate */}
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-500" />
                  Annual Interest Rate
                </label>
                <div className="relative mb-4">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => handleRateChange(e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
                    style={{
                      background: `linear-gradient(to right, #F59E0B 0%, #F59E0B ${((interestRate - 1) / (30 - 1)) * 100}%, #e5e7eb ${((interestRate - 1) / (30 - 1)) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1%</span>
                    <span>30%</span>
                  </div>
                </div>
                <div>
                  <input
                    type="number"
                    value={interestRate}
                    onChange={(e) => handleRateChange(e.target.value)}
                    step="0.1"
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none text-lg font-semibold bg-slate-50 transition-colors"
                    placeholder="Enter interest rate"
                  />
                  <p className="text-sm text-gray-600 mt-1">{interestRate}% per annum</p>
                </div>
              </div>
 
              {/* Loan Tenure */}
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-800" />
                  Loan Tenure
                </label>
                <div className="relative mb-4">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={loanTenure}
                    onChange={(e) => handleTenureChange(e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-800"
                    style={{
                      background: `linear-gradient(to right, #1E3A8A 0%, #1E3A8A ${((loanTenure - 1) / (30 - 1)) * 100}%, #e5e7eb ${((loanTenure - 1) / (30 - 1)) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 Yr</span>
                    <span>30 Yrs</span>
                  </div>
                </div>
                <div>
                  <input
                    type="number"
                    value={loanTenure}
                    onChange={(e) => handleTenureChange(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-800 focus:outline-none text-lg font-semibold bg-slate-50 transition-colors"
                    placeholder="Enter loan tenure"
                  />
                  <p className="text-sm text-gray-600 mt-1">{loanTenure} years ({loanTenure * 12} months)</p>
                </div>
              </div>
            </div>
          </div>
 
          {/* Results Section */}
          <div className="space-y-6">
            {/* EMI Result Card */}
            <div className="bg-teal-500 rounded-2xl shadow-xl p-8 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Calculator className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Monthly EMI</h2>
              </div>
              <div className="text-5xl font-bold mb-2">
                {formatCurrency(emi)}
              </div>
              <p className="text-teal-100 text-lg">
                You'll pay this amount every month for {loanTenure} years
              </p>
            </div>
 
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-teal-50 rounded-lg">
                    <DollarSign className="w-5 h-5 text-teal-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Total Amount</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
                <p className="text-sm text-gray-600 mt-1">Principal + Interest</p>
              </div>
 
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Total Interest</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalInterest)}</p>
                <p className="text-sm text-gray-600 mt-1">Extra amount paid</p>
              </div>
            </div>
 
            {/* Breakdown Chart */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <PieChart className="w-6 h-6 text-blue-800" />
                <h3 className="text-xl font-bold text-gray-900">Payment Breakdown</h3>
              </div>
 
              {/* Visual Breakdown */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-teal-500 rounded-full"></div>
                    <span className="font-semibold text-gray-900">Principal Amount</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(loanAmount)}</p>
                    <p className="text-sm text-gray-600">{principalPercentage}%</p>
                  </div>
                </div>
 
                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
                    <span className="font-semibold text-gray-900">Interest Amount</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(totalInterest)}</p>
                    <p className="text-sm text-gray-600">{interestPercentage}%</p>
                  </div>
                </div>
 
                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Principal vs Interest</span>
                    <span>Total: {formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div className="h-full flex">
                      <div
                        className="bg-teal-500 transition-all duration-500 ease-in-out"
                        style={{ width: `${principalPercentage}%` }}
                      ></div>
                      <div
                        className="bg-amber-500 transition-all duration-500 ease-in-out"
                        style={{ width: `${interestPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
 
            {/* Additional Info */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-800 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Key Information</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-start gap-1">
                      <span className="text-blue-800 mt-1">•</span>
                      <span>EMI remains constant throughout the loan tenure</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-blue-800 mt-1">•</span>
                      <span>Early payments can significantly reduce total interest</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-blue-800 mt-1">•</span>
                      <span>Interest rates may vary based on credit score and lender</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-blue-800 mt-1">•</span>
                      <span>Consider processing fees and other charges</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
 
        {/* Detailed Breakdown Table */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-teal-500" />
            Loan Summary
          </h3>
         
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors duration-300">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Monthly Payment</h4>
              <p className="text-3xl font-bold text-teal-500">{formatCurrency(emi)}</p>
              <p className="text-sm text-gray-600 mt-1">For {loanTenure * 12} months</p>
            </div>
           
            <div className="text-center p-6 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors duration-300">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Principal Amount</h4>
              <p className="text-3xl font-bold text-teal-500">{formatCurrency(loanAmount)}</p>
              <p className="text-sm text-gray-600 mt-1">{principalPercentage}% of total payment</p>
            </div>
           
            <div className="text-center p-6 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors duration-300">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Total Interest</h4>
              <p className="text-3xl font-bold text-amber-500">{formatCurrency(totalInterest)}</p>
              <p className="text-sm text-gray-600 mt-1">{interestPercentage}% of total payment</p>
            </div>
          </div>
 
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors duration-200">
              <p className="text-sm text-gray-600 mb-1">Loan Amount</p>
              <p className="font-bold text-gray-900">₹{formatNumber(loanAmount)}</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors duration-200">
              <p className="text-sm text-gray-600 mb-1">Interest Rate</p>
              <p className="font-bold text-gray-900">{interestRate}%</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors duration-200">
              <p className="text-sm text-gray-600 mb-1">Tenure</p>
              <p className="font-bold text-gray-900">{loanTenure} Years</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors duration-200">
              <p className="text-sm text-gray-600 mb-1">Total Payments</p>
              <p className="font-bold text-gray-900">{loanTenure * 12}</p>
            </div>
          </div>
        </div>
 
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            This calculator provides estimates. Actual EMI may vary based on lender terms and conditions.
          </p>
        </div>
      </div>
    </div>
  );
};
 
export default EmiCalculator;