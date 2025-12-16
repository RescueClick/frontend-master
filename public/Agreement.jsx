import React, { useState, useEffect, useRef, Fragment } from 'react';
import domtoimage from "dom-to-image";
import { jsPDF } from "jspdf";
import { useLocation } from 'react-router-dom';


const Agreement = () => {
  const [formData, setFormData] = useState({
    partnerName: '',
    partnerId: '',
    aadharNumber: '',
    panNumber: '',
    companyAddress: '',
    partnerOffice: '',
    partnerResidence: ''
  });


  const location = useLocation();
  const { employeeData } = location.state || {};

  const [agreementDate, setAgreementDate] = useState('');
  const [errors, setErrors] = useState({});
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  useEffect(() => {
    setAgreementDate(new Date().toLocaleDateString('en-IN'));
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: false
      }));
    }
  };

  const validateForm = () => {
    const requiredFields = [
      'partnerName',
      'partnerId', 
      'aadharNumber',
      'panNumber',
      'companyAddress',
      'partnerOffice',
      'partnerResidence'
    ];
    
    const newErrors = {};
    let isValid = true;
    
    requiredFields.forEach(field => {
      if (!formData[field].trim()) {
        newErrors[field] = true;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    
    if (!isValid) {
      setIsAlertOpen(true);
    }
    
    return isValid;
  };

  const EditableField = ({ value, onChange, placeholder, className = "" }) => (
    <div
      contentEditable
      suppressContentEditableWarning={true}
      onBlur={(e) => onChange(e.target.textContent)}
      onInput={(e) => onChange(e.target.textContent)}
      className={`outline-none cursor-text transition-all duration-300 ${className}`}
    >
      {value || placeholder}
    </div>
  );



  const contentRef = useRef();

  const handleDownload = () => {
    const node = contentRef.current;
  
    domtoimage.toPng(node, { quality: 1 }) // high-quality image
      .then((dataUrl) => {
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
  
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          const imgWidth = pdfWidth;
          const imgHeight = (img.height * imgWidth) / img.width;
  
          let heightLeft = imgHeight;
          let position = 0;
  
          // First page
          pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight;
  
          // Add extra pages if content is longer than one page
          while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
          }
  
          pdf.save("download.pdf");
        };
      })
      .catch((error) => {
        console.error("Error generating PDF:", error);
      });
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-5">
  

      <button
         onClick={handleDownload}
        
        className="fixed top-8 right-8 z-50 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:from-teal-600 hover:to-emerald-700 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 print:hidden"
      >
        🖨️ Print Agreement
      </button>

      <div className=" w-[100%] flex justify-center ">

      <div ref={contentRef}     className="max-w-4xl bg-gradient-to-br from-white to-slate-50 p-12 border-8 border-emerald-500 rounded-3xl shadow-2xl relative overflow-hidden print:shadow-none print:rounded-none print:p-8">
        <div  className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-amber-500 to-emerald-500"></div>
        <div  className="absolute inset-5 border-2 border-dashed border-emerald-300 rounded-2xl pointer-events-none"></div>
        
        <div className="absolute top-9 left-9 w-16 h-16 border-4 border-emerald-500 border-r-0 border-b-0 print:hidden"></div>
        <div className="absolute top-9 right-9 w-16 h-16 border-4 border-emerald-500 border-l-0 border-b-0 print:hidden"></div>
        <div className="absolute bottom-9 left-9 w-16 h-16 border-4 border-emerald-500 border-r-0 border-t-0 print:hidden"></div>
        <div className="absolute bottom-9 right-9 w-16 h-16 border-emerald-500 border-4 border-l-0 border-t-0 print:hidden"></div>

        <div  className="text-center mb-10 relative z-10 p-8 rounded-2xl bg-emerald-50/50 backdrop-blur-sm">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded"></div>
          
          <h1 className="text-3xl font-extrabold text-emerald-600 mb-4 tracking-wide drop-shadow-sm">
            TRUSTLINE FINTECH
          </h1>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-5 tracking-wide">
            PARTNERSHIP AGREEMENT
          </h2>
          <p className="text-gray-700">
            This agreement signed on <strong> ______________ </strong> and is for
          </p>
          
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-48 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent rounded"></div>
        </div>

        <div className="mb-8">
          <div className="text-xl font-bold text-gray-800 mb-6 p-4 bg-gradient-to-r from-emerald-100/70 to-amber-50/30 border-l-6 border-emerald-500 rounded-r-xl relative shadow-sm">
            PARTNER DETAILS
            <div className="absolute right-5 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full"></div>
          </div>
          
          <div className="overflow-hidden rounded-xl border-4 border-emerald-500 shadow-lg">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                  <th className="p-4 text-left font-semibold uppercase tracking-wide text-sm relative">
                    Partner Name
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"></div>
                  </th>
                  <th className="p-4 text-left font-semibold uppercase tracking-wide text-sm relative">
                    ID No.
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"></div>
                  </th>
                  <th className="p-4 text-left font-semibold uppercase tracking-wide text-sm relative">
                    Aadhar Number 
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"></div>
                  </th>
                  <th className="p-4 text-left font-semibold uppercase tracking-wide text-sm relative">
                    PAN Number
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-slate-50/50">
                  <td className={`p-4 border-b border-emerald-200 hover:bg-emerald-50/30 transition-colors duration-300 ${errors.partnerName ? 'bg-red-50' : ''}`}>
                    <h1>{employeeData?.name}</h1>
                  </td>
                  <td className={`p-4 border-b border-emerald-200 hover:bg-emerald-50/30 transition-colors duration-300 ${errors.partnerId ? 'bg-red-50' : ''}`}>
                    <h1>{employeeData?.IDNo}</h1>
                  </td>
                  <td className={`p-4 border-b border-emerald-200 hover:bg-emerald-50/30 transition-colors duration-300 ${errors.aadharNumber ? 'bg-red-50' : ''}`}>
                   <h1>{employeeData?.Aadhar_Number}</h1> 
                  </td>
                  <td className={`p-4 border-b border-emerald-200 hover:bg-emerald-50/30 transition-colors duration-300 ${errors.panNumber ? 'bg-red-50' : ''}`}>
                   <h1>{employeeData?.PAN_Number }</h1> 
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-8 p-5 bg-slate-50/80 rounded-xl border-l-4 border-amber-500 ">
          <strong>The consideration price (non-refundable) and the above agreement will be valid on full and final payment received.</strong>
        </div>

        <div className="mb-8 p-5 bg-slate-50/80 rounded-xl border-l-4 border-amber-500 text-justify">
          This Agreement comes into force on the date of signing, and the tenure will be as licence validity (Renewal) from the signing date. This agreement may be extended on the agreement of both parties unless earlier terminated.
        </div>

        <div className="mb-8">
          <div className="text-xl font-bold text-gray-800 mb-6 p-4 bg-gradient-to-r from-emerald-100/70 to-amber-50/30 border-l-6 border-emerald-500 rounded-r-xl relative shadow-sm">
            BETWEEN
            <div className="absolute right-5 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full"></div>
          </div>
          
          <div className="mb-6 p-5 bg-slate-50/80 rounded-xl border-l-4 border-amber-500  text-justify">
            <strong>Trustline Fintech Private Limited</strong> (from this point will be known as <strong>TRUSTLINEFINTECH.COM</strong>), a private limited company incorporated under the Company's Act 2013, and having its registered office at{' '}
            <span className={`inline-block min-w-48 ${errors.companyAddress ? 'bg-red-50' : ''}`}>
              <EditableField
                value={formData.companyAddress}
                onChange={(value) => handleInputChange('companyAddress', value)}
                placeholder="[Company Address to be filled]"
                className="focus:bg-amber-50 focus:border focus:border-amber-500 rounded px-2 py-1"
              />
            </span>
            , hereinafter referred to as the <strong>"Franchiser"</strong> which expression shall unless repugnant to the context or meaning thereof include its successors and assigns of ONE PART.
          </div>

          <div className="p-5 bg-slate-50/80 rounded-xl border-l-4 border-amber-500 hover:bg-emerald-50/20 text-justify">
          <b>{employeeData?.name} </b> is a proprietor and having his/her office at _______________ and residence address at ____________________
          
            , from now on referred to as the <strong>"Partner"</strong> which expression unless repugnant to the context or meaning thereof be deemed to include, legal representative, executors, administrators, successors and permitted assigns of the other PART, each a party and collectively referred to as parties.
          </div>
        </div>
        
        <div className="mb-8">
          <div className="text-xl font-bold text-gray-800 mb-6 p-4 bg-gradient-to-r from-emerald-100/70 to-amber-50/30 border-l-6 border-emerald-500 rounded-r-xl relative shadow-sm">
            1. DEFINITIONS
            <div className="absolute right-5 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full"></div>
          </div>
          <div className="p-5 bg-slate-50/80 rounded-xl border-l-4 border-amber-500  text-justify">
            As used herein, the following terms shall have the meanings set forth below:
            <div className="ml-8 mt-4 space-y-3">
              <div className="p-3 bg-white/70 rounded-lg border-l-3 border-emerald-500">
                1. "Services" shall mean the Company's services to be sold by Partner and such services as may be communicated by the Company in writing to the Partner from time to time.
              </div>
              <div className="p-3 bg-white/70 rounded-lg border-l-3 border-emerald-500">
                2. "Territory" shall be allocated during time of engagement by the Company in writing to the Partner. Any change in "Territory" shall be communicated by the Company in writing to the Partner from time to time.
              </div>
              <div className="p-3 bg-white/70 rounded-lg border-l-3 border-emerald-500">
                3. Partner will have the title of "Partner."
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <div className="text-xl font-bold text-gray-800 mb-6 p-4 bg-gradient-to-r from-emerald-100/70 to-amber-50/30 border-l-6 border-emerald-500 rounded-r-xl relative shadow-sm">
            2. APPOINTMENT
            <div className="absolute right-5 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full"></div>
          </div>
          <div className="p-5 bg-slate-50/80 rounded-xl border-l-4 border-amber-500 text-justify">
            Company hereby appoints Partner as its non-exclusive selling agent for the services in the territory, and Partner hereby accepts such appointment. Partner's sole authority shall be to solicit customers for the services in the territory in accordance with the terms of this agreement. Partner shall not have the authority to make any commitments whatsoever on behalf of Company.
          </div>
        </div>
        
        <div className="mb-8">
          <div className="text-xl font-bold text-gray-800 mb-6 p-4 bg-gradient-to-r from-emerald-100/70 to-amber-50/30 border-l-6 border-emerald-500 rounded-r-xl relative shadow-sm">
            3. GENERAL DUTIES
            <div className="absolute right-5 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full"></div>
          </div>
          <div className="p-5 bg-slate-50/80 rounded-xl border-l-4 border-amber-500 hover:bg-emerald-50/20 text-justify">
            Partner shall use his best efforts to promote the services and maximize the sale of the services in the territory. Partner shall also provide reasonable assistance to Company in promotional activities in the territory. Partner will assist the company by taking part in all promotional events, use the marketing inputs judiciously for maximizing orders for the company.
          </div>
        </div>
        
        <div className="mb-8">
          <div className="text-xl font-bold text-gray-800 mb-6 p-4 bg-gradient-to-r from-emerald-100/70 to-amber-50/30 border-l-6 border-emerald-500 rounded-r-xl relative shadow-sm">
            4. RESERVED RIGHTS
            <div className="absolute right-5 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full"></div>
          </div>
          <div className="p-5 bg-slate-50/80 rounded-xl border-l-4 border-amber-500 hover:bg-emerald-50/20  text-justify">
            Company reserves the right to solicit/engage other Agents, Partners directly from businesses within the territory. Partner's task is to solicit customers from all potential businesses in the territory.
          </div>
        </div>
        
        <div className="mb-8">
          <div className="text-xl font-bold text-gray-800 mb-6 p-4 bg-gradient-to-r from-emerald-100/70 to-amber-50/30 border-l-6 border-emerald-500 rounded-r-xl relative shadow-sm">
            5. CONFLICT OF INTEREST
            <div className="absolute right-5 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full"></div>
          </div>
          <div className="p-5 bg-slate-50/80 rounded-xl border-l-4 border-amber-500  text-justify">
            Partner warrants to Company that it does not currently represent or promote any Services that compete with the Company's Services. During the term of this Agreement, Partner shall not represent, promote or otherwise try to sell within the Territory any Services that, in Company's judgment, compete with the Services covered by this Agreement.
          </div>
        </div>
        
        <div className="mb-8">
          <div className="text-xl font-bold text-gray-800 mb-6 p-4 bg-gradient-to-r from-emerald-100/70 to-amber-50/30 border-l-6 border-emerald-500 rounded-r-xl relative shadow-sm">
            6. INDEPENDENT CONTRACTOR
            <div className="absolute right-5 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full"></div>
          </div>
          <div className="p-5 bg-slate-50/80 rounded-xl border-l-4 border-amber-500 hover:bg-emerald-50/20  text-justify">
            Partner is an independent contractor, and nothing contained in this Agreement shall be construed to (i) give either party the power to direct and control the day-to-day activities of the other, (ii) Constitute the parties as partners, joint ventures, co-owners or otherwise, or (iii) allow Partner to create or assume any obligation on behalf of Company for any purpose whatsoever. Partner is not an employee of Company and is not entitled to any employee benefits. Partner shall be responsible for paying all income taxes and other taxes charged to Partner on amounts earned hereunder.
          </div>
        </div>
        
        <div className="mb-8">
          <div className="text-xl font-bold text-gray-800 mb-6 p-4 bg-gradient-to-r from-emerald-100/70 to-amber-50/30 border-l-6 border-emerald-500 rounded-r-xl relative shadow-sm">
            7. INDEMNIFICATION BY PARTNER
            <div className="absolute right-5 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full"></div>
          </div>
          <div className="p-5 bg-slate-50/80 rounded-xl border-l-4 border-amber-500 hover:bg-emerald-50/20  text-justify">
            Partner shall indemnify and hold Company free and harmless from any and all claims, damages or lawsuits (including reasonable attorney's fees) arising out of negligence or malfeasant acts of Partner or misrepresentation or breach of any obligations under this agreement.
          </div>
        </div>

        <div className="mb-8">
          <div className="text-xl font-bold text-gray-800 mb-6 p-4 bg-gradient-to-r from-emerald-100/70 to-amber-50/30 border-l-6 border-emerald-500 rounded-r-xl relative shadow-sm">
            8. COMMISSION
            <div className="absolute right-5 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full"></div>
          </div>
          
          <div className="p-5 mb-4 bg-slate-50/80 rounded-xl border-l-4 border-amber-500 hover:bg-emerald-50/20 text-justify">
            <strong>A. Sole Compensation:</strong> The Company shall pay the Partner a commission at such rate as may be communicated by the Company in writing to the Partner, for whole or part of the services hereto, based on the Maximum Retailing Price of the product as fixed by the company on every new order. This commission will be subjected to the relevant taxes as applicable.
          </div>
          
          <div className="p-5 mb-4 bg-slate-50/80 rounded-xl border-l-4 border-amber-500 hover:bg-emerald-50/20  text-justify">
            <strong>B. Basis of Commission:</strong> The Commission shall apply to all sales orders from customers solicited by Partner. No commissions shall be paid on orders solicited directly by Company within the Territory or orders received from outside the Territory unless otherwise agreed in writing by Company.
          </div>
          
          <div className="p-5 bg-slate-50/80 rounded-xl border-l-4 border-amber-500 hover:bg-emerald-50/20 text-justify">
            <strong>C. Time of Payment:</strong> The commission on all PAID ORDERS shall be due and payable within ten (10) working days after the Partner raises invoice.
          </div>
        </div>
        
        <div className="mb-8">
          <div className="text-xl font-bold text-gray-800 mb-6 p-4 bg-gradient-to-r from-emerald-100/70 to-amber-50/30 border-l-6 border-emerald-500 rounded-r-xl relative shadow-sm">
            9. SALE OF SERVICES
            <div className="absolute right-5 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full"></div>
          </div>
          <div className="p-5 bg-slate-50/80 rounded-xl border-l-4 border-amber-500 text-justify">
            <div className="mb-4">
              <strong>A. Prices and Terms of Sale:</strong> Company shall provide Partner with copies of its current market price and payment schedules. Partner shall quote to Customers only those authorized prices, payment schedules, and terms and conditions as informed by Company.
            </div>
            <div className="mb-4">
              <strong>B. Acceptance:</strong> All requests for service obtained by Partner shall be subject to acceptance by Company. Company specifically reserves the right to reject any request for service for any reason.
            </div>
            <div>
              <strong>C. Collection:</strong> Full responsibility for collection of payment from customers rests with Partner.
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <div className="text-xl font-bold text-gray-800 mb-6 p-4 bg-gradient-to-r from-emerald-100/70 to-amber-50/30 border-l-6 border-emerald-500 rounded-r-xl relative shadow-sm">
            10. TERMINATION
            <div className="absolute right-5 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full"></div>
          </div>
          <div className="p-5 bg-slate-50/80 rounded-xl border-l-4 border-amber-500  text-justify">
            Either party to this agreement shall have the right to terminate this agreement with or without cause with a thirty (30) days written notice to the other party. Upon termination, Partner shall return all Company materials within five (5) days.
          </div>
        </div>
        
        <div className="mb-8">
          <div className="text-xl font-bold text-gray-800 mb-6 p-4 bg-gradient-to-r from-emerald-100/70 to-amber-50/30 border-l-6 border-emerald-500 rounded-r-xl relative shadow-sm">
            11. CONFIDENTIALITY
            <div className="absolute right-5 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full"></div>
          </div>
          <div className="p-5 bg-slate-50/80 rounded-xl border-l-4 border-amber-500 text-justify">
            Partner acknowledges access to confidential information and agrees not to use or disclose such information to third parties during or after the term of this Agreement.
          </div>
        </div>
        
        <div className="mb-8">
          <div className="text-xl font-bold text-gray-800 mb-6 p-4 bg-gradient-to-r from-emerald-100/70 to-amber-50/30 border-l-6 border-emerald-500 rounded-r-xl relative shadow-sm">
            12. GOVERNING LAW
            <div className="absolute right-5 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full"></div>
          </div>
          <div className="p-5 bg-slate-50/80 rounded-xl border-l-4 border-amber-500  text-justify">
            This Agreement will be governed by and construed in accordance with the laws of Republic of India. Each Party submits to the exclusive jurisdiction of the courts of India.
          </div>
        </div>

        <div className="mt-16 pt-10 relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-emerald-500 rounded"></div>
          
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="w-full md:w-5/12 text-center p-6 bg-gradient-to-br from-slate-50/80 to-white/60 rounded-2xl border-2 border-emerald-200 relative">
              <div className="absolute -top-1 -left-1 -right-1 -bottom-1 bg-gradient-to-45 from-emerald-500 to-amber-500 rounded-2xl opacity-50 -z-10"></div>
              
              <div className="h-12 border-b-4 border-emerald-500 mb-4 rounded-sm relative">
                <div className="absolute right-2 bottom-1 text-lg">✒️</div>
              </div>
              <div className="font-bold">For TRUSTLINE FINTECH PRIVATE LIMITED</div>
              <div>Authorized Signatory</div>
            </div>
            
            <div className="w-full md:w-5/12 text-center p-6 bg-gradient-to-br from-slate-50/80 to-white/60 rounded-2xl border-2 border-emerald-200 relative">
              <div className="absolute -top-1 -left-1 -right-1 -bottom-1 bg-gradient-to-45 from-emerald-500 to-amber-500 rounded-2xl opacity-50 -z-10"></div>
              
              <div className="h-12 border-b-4 border-emerald-500 mb-4 rounded-sm relative">
                <div className="absolute right-2 bottom-1 text-lg">✒️</div>
              </div>
              <div className="font-bold">Partner Signature</div>
              <div>{employeeData?.name}</div>
            </div>
          </div>
        </div>
      </div>


      </div>



    </div>
  );
};

export default Agreement;