import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const EmployeeIdCard = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [employeeData, setEmployeeData] = useState({
    name: 'Nishant Maske',
    designation: 'Partner',
    id: '506',
    // email: 'nishantmaske321@gmail.com',
    // phone: '+91 8983436866',
    location: 'Hinjawadi, Maharashtra',
    initials: 'NM',
    photo: null
  });

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const updateEmployeeData = (newData) => {
    setEmployeeData(prevData => ({ ...prevData, ...newData }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
      <div 
        className={`
          relative w-60 h-96 bg-white rounded-3xl shadow-2xl 
          border-2 border-teal-500/10 overflow-hidden
          transition-all duration-500 ease-out
          hover:transform hover:-translate-y-2 hover:shadow-3xl
          hover:rotate-x-1
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
      >
        {/* Animated top border */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-500 via-amber-500 to-teal-500 bg-[length:200%_200%] animate-gradient-x"></div>

        {/* Header Section */}
        <div className="bg-gradient-to-br from-teal-500 to-blue-500 text-white p-5 text-center relative">
          <div className="text-xs font-bold tracking-widest uppercase mb-1 leading-tight">
            Our Great Collaborations
          </div>
          <div className="text-[10px] opacity-90 font-light">
            DhanSource Capital
          </div>
          
          {/* ID Number Badge */}
          <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-md text-white px-2 py-1 rounded-xl text-[9px] font-bold border border-white/30">
            ID: {employeeData.id}
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-slate-50 px-5 py-6 text-center">
          {/* Employee Photo */}
          <div className="relative w-25 h-25 mx-auto mb-4 group">
            <div 
              className="
                w-full h-full rounded-2xl bg-gradient-to-br from-teal-500 to-blue-500 
                flex items-center justify-center shadow-lg shadow-teal-500/30
                border-3 border-white overflow-hidden
                transition-all duration-300 ease-out
                group-hover:scale-105 group-hover:rotate-y-1
              "
            >
              {employeeData.photo ? (
                <img 
                  src={employeeData.photo} 
                  alt="Employee" 
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-white text-2xl font-bold drop-shadow-lg">
                  {employeeData.initials}
                </div>
              )}
            </div>
          </div>

          {/* Employee Name */}
          <div className="text-gray-900 text-base font-bold mb-2 leading-tight">
            {employeeData.name}
          </div>

          {/* Designation */}
          <div className="inline-block bg-teal-500/10 text-teal-600 text-sm font-semibold uppercase tracking-wide px-3 py-1 rounded-2xl border border-teal-500/20 mb-5">
            {employeeData.designation}
          </div>
        </div>

        {/* Contact Details */}
        <div className="px-5 mb-5 space-y-2">
          {/* <div className="flex items-center px-1 text-[11px] text-gray-900">
            <Mail className="w-3.5 h-3.5 text-amber-500 mr-2 flex-shrink-0" />
            <span className="font-medium flex-1 text-left">{employeeData.email}</span>
          </div> */}
          
          {/* <div className="flex items-center px-1 text-[11px] text-gray-900">
            <Phone className="w-3.5 h-3.5 text-amber-500 mr-2 flex-shrink-0" />
            <span className="font-medium flex-1 text-left">{employeeData.phone}</span>
          </div> */}
          
          <div className="flex items-center px-1 text-[11px] text-gray-900">
            <MapPin className="w-3.5 h-3.5 text-amber-500 mr-2 flex-shrink-0" />
            <span className="font-medium flex-1 text-left">{employeeData.location}</span>
          </div>
        </div>

        {/* Office Address Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-br from-gray-900 to-gray-700 text-white p-3 text-center rounded-b-3xl">
          <h4 className="text-[10px] font-semibold uppercase tracking-wide mb-1 text-amber-400">
            Head Office
          </h4>
          <div className="text-[9px] leading-tight opacity-90 font-light">
            123 Business Park, Hinjawadi Phase 1,<br />
            Pune, Maharashtra 411057, India<br />
            <strong>Phone:</strong> +91-20-1234-5678
          </div>
        </div>

        {/* Security Badge */}
        <div className="absolute top-36 -right-4 w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg shadow-amber-500/40 transform rotate-12">
          ✓
        </div>

        {/* Security Pattern */}
        <div className="absolute top-52 -left-8 w-15 h-15 bg-gradient-to-r from-transparent via-teal-500/5 to-transparent rounded-full transform -rotate-30"></div>
      </div>

      {/* Demo Controls */}
      <div className="fixed top-5 right-5 bg-white p-4 rounded-xl shadow-lg border max-w-xs">
        <h3 className="font-bold text-sm mb-3 text-gray-800">Update Employee Data</h3>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Name"
            value={employeeData.name}
            onChange={(e) => updateEmployeeData({ name: e.target.value })}
            className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <input
            type="text"
            placeholder="Designation"
            value={employeeData.designation}
            onChange={(e) => updateEmployeeData({ designation: e.target.value })}
            className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <input
            type="text"
            placeholder="ID"
            value={employeeData.id}
            onChange={(e) => updateEmployeeData({ id: e.target.value })}
            className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <input
            type="text"
            placeholder="Email"
            value={employeeData.email}
            onChange={(e) => updateEmployeeData({ email: e.target.value })}
            className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <input
            type="text"
            placeholder="Phone"
            value={employeeData.phone}
            onChange={(e) => updateEmployeeData({ phone: e.target.value })}
            className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>
    </div>
  );
};

export default EmployeeIdCard;