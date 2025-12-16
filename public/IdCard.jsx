// import React, { useState, useEffect, useRef } from "react";
// import { Mail, Phone, MapPin } from "lucide-react";
// import domtoimage from "dom-to-image";
// import jsPDF from "jspdf";
// import { useLocation } from "react-router-dom";

// import html2canvas from "html2canvas";


// const IdCard = () => {
//   const [isVisible, setIsVisible] = useState(false);
//   const idCardRef = useRef(null);

//   const location = useLocation();
//   const { employeeData } = location.state || {};
//   //   name: "Nishant Maske",
//   //   designation: "Partner",
//   //   id: "506",
//   //   location: "Hinjawadi, Maharashtra",
//   //   initials: "NM",
//   //   photo: null,
//   // });





//   const downloadPDF = () => {
//     const input = idCardRef.current;
  
//     // Get element dimensions
//     const width = input.offsetWidth;
//     const height = input.offsetHeight;
  
//     domtoimage
//       .toPng(input, {
//         quality: 1,
//         width: width * 3,
//         height: height * 3,
//         style: {
//           transform: "scale(3)",
//           transformOrigin: "top left",
//         },
//       })
//       .then((imgData) => {
//         // Calculate PDF dimensions based on element aspect ratio
//         const pdf = new jsPDF({
//           orientation: height > width ? "portrait" : "landscape",
//           unit: "mm",
//           format: [height * 0.264583, width * 0.264583], // px → mm
//         });
  
//         pdf.addImage(imgData, "PNG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
//         pdf.save(`${employeeData.name}-IDCard.pdf`);
//       })
//       .catch((err) => console.error("Failed to generate PDF", err));
//   };
  
  

//   return (
//     <div className="w-[100%] h-[100vh] flex justify-center items-center flex-col ">

// <div
// ref={idCardRef}
// className={`
//   relative w-80 h-120 bg-white rounded-3xl shadow-2xl 
//   border-2 border-teal-500/10 overflow-hidden

// `}
// >

// {/* Header Section */}
// <div className="bg-gradient-to-br from-teal-500 to-blue-500 text-white p-5 text-center relative">
//   <div className="text-xs font-bold tracking-widest uppercase mt-5 leading-tight">
//     Our Great Collaborations
//   </div>
//   <div className="text-[10px] opacity-90 font-light">Trustline Fintech</div>

//   {/* ID Number Badge */}
//   <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-md text-white px-2 py-1 rounded-xl text-[8px] font-bold border border-white/30 whitespace-nowrap">
//   ID: {employeeData.id}
// </div>
// </div>

// <div className="px-5 py-6 text-center">
//   <div className="relative w-25 h-25 mx-auto mb-4 group">
//     <div
//       className="
//         w-full h-full rounded-2xl 
//         flex items-center justify-center
//         overflow-hidden
//         border-3 border-teal-500 
//       "
//     >
//       {employeeData.photo ? (
//         <div className="w-24 h-24 overflow-hidden rounded-lg "> {/* Optional inner border */}
//           <img
//             src={employeeData.photo || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
//             alt="Set new profile image"
//             className="w-full h-full object-cover"
//           />
//         </div>
//       ) : (
//         <div className="text-white text-2xl font-bold ">
//           {employeeData.initials}
//         </div>
//       )}
//     </div>
//   </div>

//   <div className="text-gray-900 text-base font-bold mb-2 leading-tight">
//     {employeeData.name}
//   </div>
//   <div className="inline-block mt-5 bg-teal-500/10 text-teal-600 text-sm font-semibold uppercase tracking-wide px-3 py-1 rounded-2xl border border-teal-500/20 mb-5">
//     {employeeData.designation}
//   </div>
// </div>


// <div className="px-4 mb-4 flex justify-center  ">
//   <div className="flex items-start gap-2 text-[11px] text-gray-900 break-words">
//     <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-[2px]" />
//     <span className="font-medium text-left leading-snug">{employeeData.location}</span>
//   </div>
// </div>

// {/* Office Address Footer */}
// <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-br from-gray-900 to-gray-700 text-white p-3 text-center rounded-b-3xl">
//   <h4 className="text-[10px] font-semibold uppercase tracking-wide mb-1 text-amber-400">
//     Head Office
//   </h4>
//   <div className="text-[9px] leading-tight opacity-90 font-light">
//   3rd Floor, A Wing, City Vista, Rescue click Private Limited Office No _014, Kharadi, Pune, Maharashtra 411014<br />
//     <strong>Phone:</strong> +91 8766681450
//   </div>
// </div>

// {/* Security Badge */}
// <div className="absolute top-36 -right-4 w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg shadow-amber-500/40 transform rotate-12">
//   ✓
// </div>

// {/* Security Pattern */}
// <div className="absolute top-52 -left-8 w-15 h-15 bg-gradient-to-r from-transparent via-teal-500/5 to-transparent rounded-full transform -rotate-30"></div>
// </div>

//  <button
// onClick={downloadPDF}
// className="mt-5 px-6 py-2 bg-teal-500 text-white font-semibold rounded-lg shadow hover:bg-teal-600 transition"
// >
// Download ID Card PDF
// </button>  
      
//     </div>


//   );

// };

// export default IdCard;





import React, { useState, useEffect, useRef } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import jsPDF from "jspdf";
import domtoimage from "dom-to-image";
import { useLocation } from "react-router-dom";

const IdCard = () => {
  const idCardRef = useRef(null);

  const location = useLocation();
  const { employeeData } = location.state || {};

  // -------------------- PDF DOWNLOAD FUNCTION ------------------------
  const downloadPDF = async () => {
    const card = idCardRef.current;
    if (!card) return;

    // Helper to convert all computed colors to inline RGB (fixes oklab issue)
    const convertColorsToRGB = (element) => {
      const computed = window.getComputedStyle(element);
      const colorProps = [
        'color', 'backgroundColor', 'borderColor',
        'borderTopColor', 'borderRightColor',
        'borderBottomColor', 'borderLeftColor',
        'outlineColor', 'textDecorationColor'
      ];

      colorProps.forEach(prop => {
        try {
          const value = computed.getPropertyValue(prop);
          if (value && value.trim() && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
            // Check if value contains oklab or oklch (modern color functions)
            if (value.includes('oklab') || value.includes('oklch')) {
              // Force conversion to RGB by applying to temp element
              const temp = document.createElement('div');
              temp.style.cssText = `${prop}: ${value}; position: absolute; visibility: hidden; pointer-events: none;`;
              document.body.appendChild(temp);
              const rgbValue = window.getComputedStyle(temp).getPropertyValue(prop);
              document.body.removeChild(temp);
              
              if (rgbValue && rgbValue.trim() && rgbValue !== 'rgba(0, 0, 0, 0)') {
                element.style.setProperty(prop, rgbValue, 'important');
              }
            } else {
              // For non-oklab colors, still apply as inline style to ensure consistency
              element.style.setProperty(prop, value, 'important');
            }
          }
        } catch (e) {
          // Continue if property conversion fails
        }
      });

      // Handle background-image gradients that might contain oklab
      try {
        const bgImage = computed.getPropertyValue('background-image');
        if (bgImage && (bgImage.includes('oklab') || bgImage.includes('oklch'))) {
          // For gradients with oklab, we'll need to convert them
          // This is complex, so we'll just ensure the element has a solid background
          const bgColor = computed.getPropertyValue('background-color');
          if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
            const temp = document.createElement('div');
            temp.style.cssText = `background-color: ${bgColor}; position: absolute; visibility: hidden;`;
            document.body.appendChild(temp);
            const rgbValue = window.getComputedStyle(temp).getPropertyValue('background-color');
            document.body.removeChild(temp);
            if (rgbValue) {
              element.style.setProperty('background-color', rgbValue, 'important');
              element.style.setProperty('background-image', 'none', 'important');
            }
          }
        }
      } catch (e) {
        // Continue if background processing fails
      }

      // Process all children recursively
      Array.from(element.children).forEach(child => {
        convertColorsToRGB(child);
      });
    };

    // Clone element to avoid modifying original
    const clonedCard = card.cloneNode(true);
    clonedCard.style.position = 'absolute';
    clonedCard.style.left = '-9999px';
    clonedCard.style.top = '0';
    document.body.appendChild(clonedCard);

    // Convert all colors to inline RGB before rendering
    convertColorsToRGB(clonedCard);

    // Small delay to ensure styles are applied
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      // Get element dimensions
      const width = clonedCard.offsetWidth;
      const height = clonedCard.offsetHeight;

      // Use dom-to-image which handles modern CSS better than html2canvas
      const imgData = await domtoimage.toPng(clonedCard, {
        quality: 1,
        width: width * 3,
        height: height * 3,
        style: {
          transform: "scale(3)",
          transformOrigin: "top left",
        },
        filter: (node) => {
          // Filter out any problematic nodes if needed
          return true;
        }
      });

      // Remove cloned element
      document.body.removeChild(clonedCard);

      // Create an image element to get actual dimensions
      const img = new Image();
      img.src = imgData;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Calculate PDF dimensions in mm
      const pdfWidth = img.width * 0.264583;
      const pdfHeight = img.height * 0.264583;

      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? "portrait" : "landscape",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      });

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${employeeData?.name || "ID"}-IDCard.pdf`);
    } catch (error) {
      // Clean up cloned element on error
      if (document.body.contains(clonedCard)) {
        document.body.removeChild(clonedCard);
      }
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  // -----------------------------------------------------------------------

  return (
    <div className="w-[100%] h-[100vh] flex justify-center items-center flex-col">

      {/* -------------------- ID CARD START -------------------- */}
      <div
        ref={idCardRef}
        className="
          relative w-80 h-120 bg-white rounded-3xl shadow-2xl
          border-2 border-teal-500/10 overflow-hidden
        "
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-teal-500 to-blue-500 text-white p-5 text-center relative">
          <div className="text-xs font-bold tracking-widest uppercase mt-5 leading-tight">
            Our Great Collaborations
          </div>
          <div className="text-[10px] opacity-90 font-light">Trustline Fintech</div>

          {/* ID Number */}
          <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-md text-white px-2 py-1 rounded-xl text-[8px] font-bold border border-white/30 whitespace-nowrap">
            ID: {employeeData.id}
          </div>
        </div>

        {/* Profile */}
        <div className="px-5 py-6 text-center">
          <div className="relative w-25 h-25 mx-auto mb-4 group">
            <div
              className="
                w-full h-full rounded-2xl flex items-center justify-center
                overflow-hidden border-3 border-teal-500
              "
            >
              {employeeData.photo ? (
                <div className="w-24 h-24 overflow-hidden rounded-lg">
                  <img
                    src={
                      employeeData.photo ||
                      "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="text-white text-2xl font-bold">{employeeData.initials}</div>
              )}
            </div>
          </div>

          <div className="text-gray-900 text-base font-bold mb-2 leading-tight">
            {employeeData.name}
          </div>
          <div className="inline-block mt-5 bg-teal-500/10 text-teal-600 text-sm font-semibold uppercase tracking-wide px-3 py-1 rounded-2xl border border-teal-500/20 mb-5">
            {employeeData.designation}
          </div>
        </div>

        {/* Location */}
        <div className="px-4 mb-4 flex justify-center">
          <div className="flex items-start gap-2 text-[11px] text-gray-900 break-words">
            <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-[2px]" />
            <span className="font-medium text-left leading-snug">{employeeData.location}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-br from-gray-900 to-gray-700 text-white p-3 text-center rounded-b-3xl">
          <h4 className="text-[10px] font-semibold uppercase tracking-wide mb-1 text-amber-400">
            Head Office
          </h4>
          <div className="text-[9px] leading-tight opacity-90 font-light">
            3rd Floor, A Wing, City Vista, Rescue Click Private Limited Office No _014,
            Kharadi, Pune, Maharashtra 411014
            <br />
            <strong>Phone:</strong> +91 8766681450
          </div>
        </div>

        {/* Security Badge */}
        <div className="absolute top-36 -right-4 w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg shadow-amber-500/40 transform rotate-12">
          ✓
        </div>

        {/* Decorative Pattern */}
        <div className="absolute top-52 -left-8 w-15 h-15 bg-gradient-to-r from-transparent via-teal-500/5 to-transparent rounded-full transform -rotate-30"></div>
      </div>

      {/* Download Button */}
      <button
        onClick={downloadPDF}
        className="mt-5 px-6 py-2 bg-teal-500 text-white font-semibold rounded-lg shadow hover:bg-teal-600 transition"
      >
        Download ID Card PDF
      </button>
    </div>
  );
};

export default IdCard;
