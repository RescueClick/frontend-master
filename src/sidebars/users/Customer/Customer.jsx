import React, { useState, useEffect } from "react";
import axios from "axios";
import { Phone, DollarSign, User, Calendar, Info, CheckCircle, XCircle, Clock } from "lucide-react";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../../../components/NotificationBell";
import { loanTypeToTableShort } from "../../../utils/loanTypeShort";


const Customer = () => {
  const [applications, setApplications] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {

    const {customerToken} = getAuthData();

    if (!customerToken) {
      navigate('/LoginPage');
    }
    
  
   
  }, [])
  
  
  useEffect(() => {
    const fetchApplications = async () => {
      const { customerToken } = getAuthData();
      if (!customerToken) return;

      try {
        const res = await axios.get(`${backendurl}/customer/get-applications`, {
          headers: { Authorization: `Bearer ${customerToken}` },
          withCredentials: true,
        });
        setApplications(res.data);
      } catch (err) {
        console.error("Error fetching applications:", err);
      }
    };

    fetchApplications();
  }, []);

  const statusColors = {
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    DISBURSED: "bg-purple-100 text-purple-700",
    default: "bg-blue-100 text-blue-700",
  };

  // Progress bar configuration
  const statusSteps = [
    { key: 'SUBMITTED', label: 'Submitted', icon: CheckCircle },
    { key: 'UNDER_REVIEW', label: 'Under Review', icon: Clock },
    { key: 'APPROVED', label: 'Approved', icon: CheckCircle },
    { key: 'AGREEMENT', label: 'Agreement', icon: CheckCircle },
    { key: 'DISBURSED', label: 'Disbursed', icon: CheckCircle }
  ];

  const getStatusProgress = (currentStatus) => {
    if (currentStatus === 'REJECTED') {
      return { currentStep: -1, isRejected: true };
    }
    
    const currentIndex = statusSteps.findIndex(step => step.key === currentStatus);
    return { currentStep: currentIndex, isRejected: false };
  };

  const ProgressBar = ({ status }) => {

    
    const { currentStep, isRejected } = getStatusProgress(status);

    if (isRejected) {
      return (
        <div className="mb-4">
          <div className="flex items-center justify-center p-3 bg-red-50 rounded-lg">
            <XCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-700 font-medium">Application Rejected</span>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          {statusSteps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div key={step.key} className="flex flex-col items-center relative flex-1">
                {/* Connection line */}
                {index > 0 && (
                  <div className={`absolute left-0 top-3 w-full h-0.5 -z-10 ${
                    index <= currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`} style={{ left: '-50%', width: '100%' }} />
                )}
                
                {/* Step circle */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                  isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isCurrent 
                      ? 'bg-blue-500 text-white animate-pulse' 
                      : 'bg-gray-200 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : isCurrent ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  )}
                </div>
                
                {/* Step label */}
                <span className={`text-xs text-center ${
                  isCompleted ? 'text-green-600 font-medium' : 
                  isCurrent ? 'text-blue-600 font-medium' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Progress line background */}
        <div className="relative">
          <div className="h-1 bg-gray-200 rounded-full">
            <div 
              className={`h-1 bg-green-500 rounded-full transition-all duration-500 ${
                currentStep === -1 ? 'w-0' : ''
              }`}
              style={{ width: currentStep >= 0 ? `${((currentStep + 1) / statusSteps.length) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>
    );
  };

  const handleCallPartner = (phone) => {
    const phoneNumber = phone;
    window.location.href = `tel:${phoneNumber}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm py-2 px-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            My Loans
          </h1>
          <NotificationBell />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center px-3 sm:px-6 py-2">
        {/* Applications */}
        {applications.map((app, idx) => {
          const statusClass = statusColors[app.status] || statusColors.default;

          return (
            <div
              key={idx}
              className="bg-white shadow-md rounded-xl p-4 sm:p-6 w-full max-w-md mb-5"
            >
              {/* Header Row */}
              <div className="flex justify-between items-center text-sm mb-3">
                <div className="flex items-center gap-1 text-gray-600">
                  <Info className="w-4 h-4" />
                  <span className="font-medium">loan ID #{app.appNo}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {app.formFillingDate
                      ? new Date(app.formFillingDate).toLocaleDateString("en-GB")
                      : "-"}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <ProgressBar status={app.status} />

              {/* Loan Details */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-2 sm:p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600">Loan Type</p>
                  <p className="text-sm sm:text-base font-semibold">
                    {loanTypeToTableShort(app.loanType)}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600">Applied</p>
                  <p className="text-sm sm:text-base font-semibold">
                    ₹{app.appliedLoanAmount?.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-gray-600">Approved</p>
                  <p className="text-sm sm:text-base font-semibold">
                    {app.approvedLoanAmount
                      ? `₹${app.approvedLoanAmount.toLocaleString()}`
                      : "Pending"}
                  </p>
                </div>

                <div className="p-2 sm:p-3 bg-green-50 rounded-lg">
                  <p className="text-xs">Status:</p>
                  <span
                    className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${statusClass}`}
                  >
                    {app.status}
                  </span>
                </div>
              </div>

              {/* Remarks */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <span className="text-sm text-black">Remark: </span>
                <span className="text-sm text-blue-700">
                  {app.remarks || "No remarks available"}
                </span>
                {app.lastUpdateDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last Updated:{" "}
                    {new Date(app.lastUpdateDate).toLocaleDateString("en-GB")}
                  </p>
                )}
              </div>

              <h1 className="py-2">RM phone number: {applications[0]?.rm?.phone}</h1>

              {/* Customer & Partner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                <div className="p-3 bg-white border rounded-lg">
                  <p className="font-medium mb-1">Customer</p>
                  <p className="truncate">
                    {`${app.customer.firstName} ${app.customer.middleName} ${app.customer.lastName}`}
                  </p>
                  <p className="text-xs py-1">{app.customer.email}</p>
                  <p className="text-xs py-1">{app.customer.phone}</p>
                </div>
                <div className="p-3 bg-white border rounded-lg">
                  <p className="font-medium">Partner</p>
                  <p className="truncate py-1">
                    {app?.partner?.firstName} {app?.partner?.lastName}
                  </p>
                  <p className="text-xs py-1">ID: {app?.partner?.employeeId}</p>
                  <p className="text-xs py-1">Phone: {app?.partner?.phone}</p>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* Call Partner Button */}
      {applications.length > 0 && (
        <div className="sticky bottom-6 flex justify-center px-3">
          <button
            onClick={() => { handleCallPartner(applications[0]?.partner?.phone); }}
            className="w-full max-w-md bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-full shadow-md flex items-center justify-center gap-2 text-sm sm:text-base transition"
          >
            <Phone className="h-5 w-5" />
            <span>Call Partner</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Customer;