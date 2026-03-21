import React, { useRef } from "react";
import domtoimage from "dom-to-image";
import jsPDF from "jspdf";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";



const AuthLetter = () => {
  
  const certificateRef = useRef(null);


  const location = useLocation();
  const { name } = location.state || {};


  const downloadPDF = () => {
    const input = certificateRef.current;

    // Convert DOM to Image
    domtoimage.toPng(input, { quality: 1 })
      .then((dataUrl) => {
        // Create PDF
        const pdf = new jsPDF("landscape", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // Add image to PDF
        pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${name}-Certificate.pdf`);
      })
      .catch((error) => {
        console.error("Error generating PDF:", error);
      });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      {/* Certificate */}
      <div
        ref={certificateRef}
        className="relative w-full max-w-[800px] h-[520px] bg-white border-[12px] border-teal-500 p-10 overflow-hidden"
      >
        {/* Corner Triangles */}
        <div className="absolute top-5 left-5 w-0 h-0 border-l-[40px] border-l-teal-500 border-b-[40px] border-b-transparent"></div>
        <div className="absolute top-5 right-5 w-0 h-0 border-r-[40px] border-r-teal-500 border-b-[40px] border-b-transparent"></div>
        <div className="absolute bottom-5 left-5 w-0 h-0 border-l-[40px] border-l-teal-500 border-t-[40px] border-t-transparent"></div>
        <div className="absolute bottom-5 right-5 w-0 h-0 border-r-[40px] border-r-teal-500 border-t-[40px] border-t-transparent"></div>

        {/* Decorative Triangles */}
        <div className="absolute top-20 left-[120px] w-0 h-0 border-r-[15px] border-r-teal-500 border-b-[15px] border-b-transparent"></div>
        <div className="absolute top-[120px] left-[160px] w-0 h-0 border-l-[15px] border-l-teal-500 border-t-[15px] border-t-transparent"></div>
        <div className="absolute top-[100px] right-[120px] w-0 h-0 border-l-[15px] border-l-teal-500 border-b-[15px] border-b-transparent"></div>
        <div className="absolute bottom-[180px] left-[60px] w-0 h-0 border-t-[15px] border-t-teal-500 border-r-[15px] border-r-transparent"></div>
        <div className="absolute bottom-[120px] right-[80px] w-0 h-0 border-b-[15px] border-b-teal-500 border-l-[15px] border-l-transparent"></div>
        <div className="absolute bottom-20 right-[140px] w-0 h-0 border-t-[15px] border-t-teal-500 border-r-[15px] border-r-transparent"></div>

        {/* Logo */}
        <div className="text-center mb-7">
          <span className="text-3xl font-bold text-teal-500">DhanSource Capital</span>
        </div>

        {/* Certificate Title */}
        <div className="text-center text-xl font-bold tracking-[3px] text-gray-700 mb-5">
          CERTIFIED PARTNER
        </div>

        {/* Recipient Name */}
        <div className="text-center text-3xl font-bold italic text-teal-500 mb-7">
          {name}
        </div>

        {/* Authorization Text */}
        <div className="text-center text-lg italic leading-relaxed text-gray-700 mb-10">
          You are hereby authorized to promote and provide consultation<br />
          for all the Financial Products and Services offered by DhanSource Capital
        </div>

        {/* Signatures Section */}
        <div className="flex justify-between items-end mt-10 relative">
          {/* Left Signature */}
          <div className="text-center flex-1">
            <div className="w-48 border-b-2 border-gray-800 mx-auto mb-2"></div>
            <div className="text-base font-bold text-gray-800 mb-1">Anil Bagad</div>
            <div className="text-sm font-bold text-teal-500">
              CEO & Director<br />
              DhanSource Capital
            </div>
          </div>

          {/* Medal */}
          <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border-[3px] border-yellow-400 shadow-lg flex items-center justify-center text-center text-xs font-bold text-yellow-800">
            <div className="relative">
              DhanSource Capital<br />Certified<br />
              {new Date().getFullYear()}
              {/* Medal ribbon */}
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[15px] border-t-yellow-400"></div>
            </div>
          </div>

          {/* Right Signature */}
          <div className="text-center flex-1">
            <div className="w-48 border-b-2 border-gray-800 mx-auto mb-2"></div>
            <div className="text-base font-bold text-gray-800 mb-1">Kanchan Ghorpade</div>
            <div className="text-sm font-bold text-teal-500">
              MD<br />
              DhanSource Capital
            </div>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={downloadPDF}
        className="mt-5 px-6 py-2 bg-teal-500 text-white font-semibold rounded-lg shadow hover:bg-teal-600 transition"
      >
        Download PDF
      </button>
    </div>
  );
};

export default AuthLetter;
