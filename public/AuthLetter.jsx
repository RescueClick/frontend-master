import React, { useRef, useState } from "react";
import domtoimage from "dom-to-image";
import jsPDF from "jspdf";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";



const AuthLetter = () => {
  const certificateRef = useRef(null);

  const location = useLocation();
  const stateData = location.state || {};
  const { name, firstName, lastName, employeeData } = stateData;

  // Keep only first name and last name, omitting middle name
  const getDisplayName = (data) => {
    if (!data) return "";
    if (typeof data === "object") {
      if (data.firstName && data.lastName) {
        return `${data.firstName.trim()} ${data.lastName.trim()}`;
      }
      data = data.name || data.fullName || "";
    }
    const raw = String(data).trim();
    if (!raw) return "";
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length > 2) {
      // First name and last name only, omitting middle name(s)
      return `${parts[0]} ${parts[parts.length - 1]}`;
    }
    return parts.join(" ");
  };

  const displayName = (() => {
    if (firstName && lastName) {
      return `${firstName.trim()} ${lastName.trim()}`;
    }
    if (employeeData?.firstName && employeeData?.lastName) {
      return `${employeeData.firstName.trim()} ${employeeData.lastName.trim()}`;
    }
    return (
      getDisplayName(name) ||
      getDisplayName(employeeData) ||
      "Authorized Partner"
    );
  })();

  const [isDownloading, setIsDownloading] = useState(false);

  const downloadPDF = () => {
    if (isDownloading) return;
    setIsDownloading(true);
    const input = certificateRef.current;

    // Convert DOM to Image
    domtoimage.toPng(input, { quality: 1 })
      .then((dataUrl) => {
        // Create PDF
        const pdf = new jsPDF("landscape", "mm", "letter");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // Add image to PDF
        pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
        const safeName = (displayName || "Partner").replace(/[^a-z0-9]/gi, "_");
        pdf.save(`${safeName}-Certificate.pdf`);
        setIsDownloading(false);
      })
      .catch((error) => {
        console.error("Error generating PDF:", error);
        setIsDownloading(false);
      });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      {/* Certificate */}
      <div
        ref={certificateRef}
        className="relative w-full max-w-[800px] min-h-[560px] bg-white border-[12px] border-teal-500 p-6 sm:p-10 shadow-lg overflow-hidden flex flex-col justify-between"
      >
        {/* Corner Triangles */}
        <div className="absolute top-5 left-5 w-0 h-0 border-l-[30px] sm:border-l-[40px] border-l-teal-500 border-b-[30px] sm:border-b-[40px] border-b-transparent"></div>
        <div className="absolute top-5 right-5 w-0 h-0 border-r-[30px] sm:border-r-[40px] border-r-teal-500 border-b-[30px] sm:border-b-[40px] border-b-transparent"></div>
        <div className="absolute bottom-5 left-5 w-0 h-0 border-l-[30px] sm:border-l-[40px] border-l-teal-500 border-t-[30px] sm:border-t-[40px] border-t-transparent"></div>
        <div className="absolute bottom-5 right-5 w-0 h-0 border-r-[30px] sm:border-r-[40px] border-r-teal-500 border-t-[30px] sm:border-t-[40px] border-t-transparent"></div>

        {/* Decorative Triangles */}
        <div className="absolute top-20 left-[120px] w-0 h-0 border-r-[15px] border-r-teal-500 border-b-[15px] border-b-transparent"></div>
        <div className="absolute top-[120px] left-[160px] w-0 h-0 border-l-[15px] border-l-teal-500 border-t-[15px] border-t-transparent"></div>
        <div className="absolute top-[100px] right-[120px] w-0 h-0 border-l-[15px] border-l-teal-500 border-b-[15px] border-b-transparent"></div>
        <div className="absolute bottom-[180px] left-[60px] w-0 h-0 border-t-[15px] border-t-teal-500 border-r-[15px] border-r-transparent"></div>
        <div className="absolute bottom-[120px] right-[80px] w-0 h-0 border-b-[15px] border-b-teal-500 border-l-[15px] border-l-transparent"></div>
        <div className="absolute bottom-20 right-[140px] w-0 h-0 border-t-[15px] border-t-teal-500 border-r-[15px] border-r-transparent"></div>

        {/* Certificate Main Content */}
        <div>
          {/* Logo */}
          <div className="text-center mb-4 sm:mb-5">
            <span className="text-2xl sm:text-3xl font-bold text-teal-500">DhanSource Capital</span>
          </div>

          {/* Certificate Title */}
          <div className="text-center text-lg sm:text-xl font-bold tracking-[3px] text-gray-700 mb-3 sm:mb-4">
            CERTIFIED PARTNER
          </div>

          {/* Recipient Name - first and last name only, clean display */}
          <div className="text-center text-2xl sm:text-3xl font-bold italic text-teal-600 mb-3 sm:mb-4 break-words px-4">
            {displayName}
          </div>

          {/* Authorization Text */}
          <div className="text-center text-sm sm:text-base italic leading-relaxed text-gray-700 mb-4 sm:mb-6 max-w-xl mx-auto px-4">
            You are hereby authorized to promote and facilitate loan applications<br className="hidden sm:inline" />{" "}
            for all the Financial Products and Services offered by DhanSource Capital
          </div>
        </div>

        {/* Signatures Section - 3 columns so nothing overlaps */}
        <div className="grid grid-cols-3 items-end pt-4 mt-2 border-t border-teal-100 gap-2 sm:gap-4 relative">
          {/* Left Signature */}
          <div className="text-center flex flex-col items-center">
            <div className="h-16 sm:h-20 flex items-center justify-center mb-1">
              <img
                src="/authorized_signatory.png"
                alt="Authorized Signatory"
                className="h-12 sm:h-16 object-contain mix-blend-multiply mx-auto"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <div className="w-24 sm:w-36 border-b-2 border-gray-800 mx-auto mb-1"></div>
            <div className="text-xs sm:text-sm font-bold text-gray-800 mb-0.5 truncate max-w-full px-1">Anil Bagad</div>
            <div className="text-[10px] sm:text-xs font-bold text-teal-600 leading-tight">
              CEO &amp; Director<br />
              DhanSource Capital
            </div>
          </div>

          {/* Center Medal / Seal - dedicated column to prevent overlap */}
          <div className="flex flex-col items-center justify-end pb-1">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border-[3px] border-yellow-400 shadow-md flex items-center justify-center text-center text-[9px] sm:text-[11px] font-bold text-yellow-900 relative">
              <div className="leading-tight">
                DhanSource<br />Certified<br />
                {new Date().getFullYear()}
              </div>
              {/* Medal ribbon */}
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] sm:border-l-[12px] border-l-transparent border-r-[10px] sm:border-r-[12px] border-r-transparent border-t-[10px] sm:border-t-[12px] border-t-yellow-500"></div>
            </div>
          </div>

          {/* Right Signature: Partner Digital Sign */}
          <div className="text-center flex flex-col items-center">
            <div className="h-16 sm:h-20 flex flex-col items-center justify-center mb-1">
              <span className="font-serif italic text-gray-800 text-xs sm:text-sm font-bold truncate max-w-[130px] sm:max-w-[180px] block px-1">
                {displayName}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded bg-emerald-50 border border-emerald-300 text-emerald-700 text-[9px] sm:text-[10px] font-semibold whitespace-nowrap">
                ✓ Digitally Signed
              </span>
            </div>
            <div className="w-24 sm:w-36 border-b-2 border-gray-800 mx-auto mb-1"></div>
            <div className="text-xs sm:text-sm font-bold text-gray-800 mb-0.5 truncate max-w-[130px] sm:max-w-[180px] px-1">
              {displayName}
            </div>
            <div className="text-[10px] sm:text-xs font-bold text-teal-600 leading-tight">
              Partner Digital Sign<br />
              Channel Partner
            </div>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={downloadPDF}
        disabled={isDownloading}
        className={`mt-5 px-6 py-2 bg-teal-500 text-white font-semibold rounded-lg shadow hover:bg-teal-600 transition flex items-center gap-2 ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isDownloading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating PDF...
          </>
        ) : (
          "Download PDF"
        )}
      </button>
    </div>
  );
};

export default AuthLetter;
