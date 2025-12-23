// AppRoutes.jsx
// This file defines the main application routes for different user roles (Admin, ASM, RM, Partner)
// using React Router. Each section below corresponds to a specific user type and their accessible pages.

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";



import LoginPage from "./LoginPage";

import MainLayout from "./Page/MainLayout";

import Home from "./Page/Home";
import Services from "./Page/Services";
import ChannelPartner from "./Page/ChannelPartner";
import Documents from "./Page/Documents";
import AboutUs from "./Page/AboutUs";
import Contact from "./Page/Contact";
import PrivacyPolicy from "./Page/PrivacyPolicy";
import TermsConditions from "./Page/TermsConditions";


import PartnerRegistrationForm from "./Page/PartnerRegistrationForm";

import { RequestResetForm } from "./Page/RequestResetForm.jsx";
import { ConfirmResetForm } from "./Page/ConfirmResetForm.jsx";


// Import main pages

import AdmainSideBar from "./sidebars/AdmainSideBar";
import AsmSiderbar from "./sidebars/AsmSiderbar";
import RmSidebar from "./sidebars/RmSidebar";
import PartnerSideBar from "./sidebars/PartnerSideBar";
import AddASMPage from "./sidebars/users/Admin/addaccount/AddASMPage";
import AddPartnerPage from "./sidebars/users/Admin/addaccount/AddPartnerPage";
import AddRMPage from "./sidebars/users/Admin/addaccount/AddRMpage";



// Import Admin user pages
import AdminDashboard from "./sidebars/users/Admin/Dashboard";
import AdminPartner from "./sidebars/users/Admin/Partner";
import AdminRM from "./sidebars/users/Admin/RM";
import AdiminASM from "./sidebars/users/Admin/ASM";
import AdiminCustomer from "./sidebars/users/Admin/Customer";
import SetTarget from "./sidebars/users/Admin/SetTarget.jsx"
import AdiminBanks from "./sidebars/users/Admin/Banks";
import Analytics from "./sidebars/users/Admin/Analytics";
import Banner from "./sidebars/users/Admin/Banner";
import RMpartner from "./sidebars/users/Admin/RMpartner";

// Import ASM user pages
import AsmDashboard from "./sidebars/users/ASM/Dashboard";
import AsmASM from "./sidebars/users/ASM/ASM";
import AsmCustomers from "./sidebars/users/ASM/Customers";
import AsmNotifications from "./sidebars/users/ASM/Notifications";
import AsmPartners from "./sidebars/users/ASM/AsmPartners";
import AsmReports from "./sidebars/users/ASM/Reports";
import Applications from "./sidebars/users/ASM/Applications";
import AsmRM from "./sidebars/users/ASM/AsmRM";
import Settings from "./sidebars/users/ASM/Settings";
import AsmPartner from "./sidebars/users/ASM/AsmPartners";
import ASManalytics from "./sidebars/users/ASM/ASManalytics";
import ASMaddRM from "./sidebars/users/ASM/ASMaddRM.jsx";


// Import RM user pages
import RmDashboard from "./sidebars/users/RM/Dashboard";
import RmCustomers from "./sidebars/users/RM/Customers";
import RmPartners from "./sidebars/users/RM/Partners";
import RmLeads from "./sidebars/users/RM/Leads";
import RmReports from "./sidebars/users/RM/Reports";
import CustomerAppliction from "./sidebars/users/RM/CustomerAppliction"
import ActivePartner from "./sidebars/users/RM/ActivePartner";
import RevenueGenerated from "./sidebars/users/RM/RevenueGenerated";
import RManalytics from "./sidebars/users/RM/RManalytics";
import RmApplication from "./sidebars/users/RM/RMApplication";
import PendingPayout from "./sidebars/users/RM/Application/PendingPayout";
import DonePayout from "./sidebars/users/RM/Application/DonePayout";


import BusinessLoan from "./sidebars/users/Partner/ApplicationForm/BusinessLoan";
import GetLoan from "./sidebars/users/Partner/GetLoan";
import HomeLoanSalaried from "./sidebars/users/Partner/ApplicationForm/HomeLoanSalaried";
import HomeLoanSelfEmployee from "./sidebars/users/Partner/ApplicationForm/HomeLoanSelfEmployee";
import PersonalLoan from "./sidebars/users/Partner/ApplicationForm/PersonalLoan";

// Import Partner user pages
import PartnerDashboard from "./sidebars/users/Partner/Dashboard";
import PartnerCustomers from "./sidebars/users/Partner/Customers";
import PartnerApplications from "./sidebars/users/Partner/Applications";
import PartnerEmiCalculator from "./sidebars/users/Partner/EmiCalculator";
import KYCDetails from "./sidebars/users/Partner/KYCDetails";
import CompleteApplication from "./sidebars/users/Partner/CompleteApplication";
import DocumentUpload from "./sidebars/users/Partner/DocumentUpload";




// import Costomer
import Customer from "./sidebars/users/Customer/Customer";
import EditProfile from "./sidebars/users/userProfile/EditProfile";
import FollowUp from "./sidebars/users/RM/FollowUp";



import Agreement from "../public/Agreement";
import AuthLetter from "../public/AuthLetter";
import IdCard from "../public/IdCard";
import ProtectedRoute from "./utils/ProtectedRoute.jsx";


// import PersonalLoan from "./sidebars/users/Partner/ApplicationForm/PersonalLoan";
// import BusinessLoan from "./sidebars/users/Partner/ApplicationForm/BusinessLoan";
// import HomeLoanSalaried from "./sidebars/users/Partner/ApplicationForm/HomeLoanSalaried";
// import HomeLoanSelfEmployee from "./sidebars/users/Partner/ApplicationForm/HomeLoanSelfEmployee";



const ROLES = {
  ADMIN: "SUPER_ADMIN",
  ASM: "ASM",
  RM: "RM",
  PARTNER: "PARTNER",
  CUSTOMER: "CUSTOMER",
};







const AppRoutes = () => {
  return (
    <Routes>
      {/* Public route: Login page */}

      <Route path="/" element={<MainLayout  />}>
        <Route index element={<Navigate to="Home" replace />} />
        <Route path="Home" element={<Home />} />
        <Route path="services" element={<Services />} />
        <Route path="channel-partner" element={<ChannelPartner />} />
        <Route path="documents" element={<Documents />} />
        <Route path="about-us" element={<AboutUs />} />
        <Route path="contact" element={<Contact />} />
         <Route path="PrivacyPolicy" element={<PrivacyPolicy />} />
          <Route path="TermsConditions" element={<TermsConditions />} />
      </Route>


      <Route path="/LoginPage" element={<LoginPage />} />
      <Route path="/PartnerRegistrationForm" element={<PartnerRegistrationForm  />} />
      

      <Route path="/reset-password/request" element={<RequestResetForm />} />
      <Route path="/reset-password/confirm" element={<ConfirmResetForm />} />


      <Route path="/Agreement" element={<Agreement />} />
      <Route path="/AuthLetter" element={<AuthLetter />} />
      <Route path="/IdCard" element={<IdCard  />} />


{/* ⭐ PUBLIC LOAN FORM ROUTES (For Apply Now Buttons) */}
<Route
  path="/partner/application/personal-loan"
  element={<PersonalLoan />}
/>

<Route
  path="/partner/application/business-loan"
  element={<BusinessLoan />}
/>

<Route
  path="/partner/application/home-loan-salaried"
  element={<HomeLoanSalaried />}
/>

<Route
  path="/partner/application/home-loan-self-employed"
  element={<HomeLoanSelfEmployee />}
/>


   








      {/* Admin routes: Only accessible to Admin users */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
      <Route path="/admin" element={<AdmainSideBar />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="asm" element={<AdiminASM />} />
        <Route path="partner" element={<AdminPartner />} />
        <Route path="rm" element={<AdminRM />} />
        <Route path="customer" element={<AdiminCustomer />} />
        <Route path="target" element={<SetTarget />} />
        <Route path="banks" element={<AdiminBanks />} />
        <Route path="Analytics" element={<Analytics />} />
        <Route path="RM-partner" element={<RMpartner />} />

        {/* Fixed child route paths (relative, no leading /) */}
        <Route path="add-asm-page" element={<AddASMPage />} />
         <Route path="add-rm-page" element={<AddRMPage />} /> 
         <Route path="add-partner-page" element={<AddPartnerPage />} /> 
         <Route path="banner" element={<Banner />} />
        
      </Route>
      </Route>

      {/* ASM routes: Only accessible to ASM users */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.ASM]} />}>
      <Route path="/asm" element={<AsmSiderbar />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AsmDashboard />} />
        <Route path="asm" element={<AsmASM />} />
        <Route path="customers" element={<AsmCustomers />} />
        <Route path="notifications" element={<AsmNotifications />} />
        <Route path="partners" element={<AsmPartners />} />
        <Route path="reports" element={<AsmReports />} />
        <Route path="applications" element={<Applications />} />
        <Route path="settings" element={<Settings  />} />
        <Route path="EditProfile" element={<EditProfile />} /> 
        <Route path="RM" element={<AsmRM />} /> 
        <Route path="partners" element={<AsmPartner />} /> 
        <Route path="ASManalytics" element={<ASManalytics />} /> 
        <Route path="ASMaddRM" element={<ASMaddRM/>} /> 
      </Route>
      </Route>


      

      {/* RM routes: Only accessible to RM users */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.RM]} />}>
      <Route path="/rm" element={<RmSidebar />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<RmDashboard />} />
        <Route path="customers" element={<RmCustomers />} />
        <Route path="partners" element={<RmPartners />} />
        <Route path="leads" element={<RmLeads />} />
        <Route path="reports" element={<RmReports />} />
        <Route path="CustomerAppliction" element={<CustomerAppliction />} />
        <Route path="Active-partners" element={<ActivePartner/>} />
        <Route path="Revenue-generated" element={<RevenueGenerated/>} />
        <Route path="add-partner" element={<AddPartnerPage/>}/>

        <Route path="RManalytics" element={<RManalytics/>}/>
        <Route path="Rm-Application" element={<RmApplication/>}/>
        <Route path="pending-payout" element={<PendingPayout />} />
        <Route path="done-payout" element={<DonePayout/>}/>


        

        <Route path="CustomerAppliction" element={<CustomerAppliction />} />
        <Route path="Active-partners" element={<ActivePartner/>} />
        <Route path="Revenue-generated" element={<RevenueGenerated/>} />
        <Route path="Follow-up" element={<FollowUp/>}/>
     



      </Route>
      </Route>

      {/* Partner routes: Only accessible to Partner users */}

      <Route element={<ProtectedRoute allowedRoles={[ROLES.PARTNER]} />}>
      <Route path="/partner" element={<PartnerSideBar />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PartnerDashboard />} />
        <Route path="customers" element={<PartnerCustomers />} />
        <Route path="applications" element={<PartnerApplications />} />
        <Route path="EmiCalculator" element={<PartnerEmiCalculator />} />
        <Route path="KYCDetails" element={<KYCDetails />} />
        <Route path="complete-application" element={<CompleteApplication />} />
        <Route path="document-upload" element={<DocumentUpload />} />

        <Route path="get-loan" element={<GetLoan />}/>
        <Route path="personal-loan" element={<PersonalLoan />}  />
        <Route path="bussiness-loan" element={<BusinessLoan />}  />
        <Route path="home-loan-salaried" element={<HomeLoanSalaried />}  />
        <Route path="home-loan-self-employee" element={<HomeLoanSelfEmployee />}  />
      </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={[ROLES.CUSTOMER]} />}>
      <Route path="/customer" element={<Customer />} />
      </Route>

      {/* //loanlinkss */}
      

    </Routes>
  );
};

export default AppRoutes;






























// AppRoutes.jsx
// This file defines the main application routes for different user roles (Admin, ASM, RM, Partner)
// using React Router. Each section below corresponds to a specific user type and their accessible pages.

// import React from "react";
// import { Routes, Route, Navigate } from "react-router-dom";



// import LoginPage from "./LoginPage";

// import MainLayout from "./Page/MainLayout";

// import Home from "./Page/Home";
// import Services from "./Page/Services";
// import ChannelPartner from "./Page/ChannelPartner";
// import Documents from "./Page/Documents";
// import AboutUs from "./Page/AboutUs";
// import Contact from "./Page/Contact";

// import PartnerRegistrationForm from "./Page/PartnerRegistrationForm";




// // Import main pages

// import AdmainSideBar from "./sidebars/AdmainSideBar";
// import AsmSiderbar from "./sidebars/AsmSiderbar";
// import RmSidebar from "./sidebars/RmSidebar";
// import PartnerSideBar from "./sidebars/PartnerSideBar";
// import AddASMPage from "./sidebars/users/Admin/addaccount/AddASMPage";
// import AddPartnerPage from "./sidebars/users/Admin/addaccount/AddPartnerPage";
// import AddRMPage from "./sidebars/users/Admin/addaccount/AddRMpage";


// // Import Admin user pages
// import AdminDashboard from "./sidebars/users/Admin/Dashboard";
// import AdminPartner from "./sidebars/users/Admin/Partner";
// import AdminRM from "./sidebars/users/Admin/RM";
// import AdiminASM from "./sidebars/users/Admin/ASM";
// import AdiminCustomer from "./sidebars/users/Admin/Customer";
// import AdiminBanks from "./sidebars/users/Admin/Banks";
// import AdiminExportUsers from "./sidebars/users/Admin/ExportUsers";
// import Analytics from "./sidebars/users/Admin/Analytics";
// import Banner from "./sidebars/users/Admin/Banner";
// import RMpartner from "./sidebars/users/Admin/RMpartner";

// // Import ASM user pages
// import AsmDashboard from "./sidebars/users/ASM/Dashboard";
// import AsmASM from "./sidebars/users/ASM/ASM";
// import AsmCustomers from "./sidebars/users/ASM/Customers";
// import AsmNotifications from "./sidebars/users/ASM/Notifications";
// import AsmPartners from "./sidebars/users/ASM/AsmPartners";
// import AsmReports from "./sidebars/users/ASM/Reports";
// import Applications from "./sidebars/users/ASM/Applications";
// import AsmRM from "./sidebars/users/ASM/AsmRM";
// import Settings from "./sidebars/users/ASM/Settings";
// import AsmPartner from "./sidebars/users/ASM/AsmPartners";


// // Import RM user pages
// import RmDashboard from "./sidebars/users/RM/Dashboard";
// import RmCustomers from "./sidebars/users/RM/Customers";
// import RmPartners from "./sidebars/users/RM/Partners";
// import RmLeads from "./sidebars/users/RM/Leads";
// import RmReports from "./sidebars/users/RM/Reports";
// import CustomerAppliction from "./sidebars/users/RM/CustomerAppliction"
// import ActivePartner from "./sidebars/users/RM/ActivePartner";
// import RevenueGenerated from "./sidebars/users/RM/RevenueGenerated";
// import RManalytics from "./sidebars/users/RM/RManalytics";
// import RmApplication from "./sidebars/users/RM/RMApplication";
// import PendingPayout from "./sidebars/users/RM/Application/PendingPayout";
// import DonePayout from "./sidebars/users/RM/Application/DonePayout";


// import BusinessLoan from "./sidebars/users/Partner/ApplicationForm/BusinessLoan";
// import GetLoan from "./sidebars/users/Partner/GetLoan";
// import HomeLoanSalaried from "./sidebars/users/Partner/ApplicationForm/HomeLoanSalaried";
// import HomeLoanSelfEmployee from "./sidebars/users/Partner/ApplicationForm/HomeLoanSelfEmployee";
// import PersonalLoan from "./sidebars/users/Partner/ApplicationForm/PersonalLoan";

// // Import Partner user pages
// import PartnerDashboard from "./sidebars/users/Partner/Dashboard";
// import PartnerCustomers from "./sidebars/users/Partner/Customers";
// import PartnerApplications from "./sidebars/users/Partner/Applications";
// import PartnerEmiCalculator from "./sidebars/users/Partner/EmiCalculator";
// import KYCDetails from "./sidebars/users/Partner/KYCDetails";




// // import Costomer
// import Customer from "./sidebars/users/Customer/Customer";
// import EditProfile from "./sidebars/users/userProfile/EditProfile";
// import FollowUp from "./sidebars/users/RM/FollowUp";



// import Agreement from "../public/Agreement";
// import AuthLetter from "../public/AuthLetter";
// import IdCard from "../public/IdCard";
// import ProtectedRoute from "./utils/ProtectedRoute.jsx";

// const ROLES = {
//   ADMIN: "SUPER_ADMIN",
//   ASM: "ASM",
//   RM: "RM",
//   PARTNER: "PARTNER",
//   CUSTOMER: "CUSTOMER",
// };






// const AppRoutes = () => {
//   return (
//     <Routes>
//       {/* Public route: Login page */}

//       <Route path="/" element={<MainLayout  />}>
//         <Route index element={<Navigate to="Home" replace />} />
//         <Route path="Home" element={<Home />} />
//         <Route path="services" element={<Services />} />
//         <Route path="channel-partner" element={<ChannelPartner />} />
//         <Route path="documents" element={<Documents />} />
//         <Route path="about-us" element={<AboutUs />} />
//         <Route path="contact" element={<Contact />} />
//       </Route>


//       <Route path="/LoginPage" element={<LoginPage />} />
//       <Route path="/PartnerRegistrationForm" element={<PartnerRegistrationForm  />} />


//       <Route path="/Agreement" element={<Agreement />} />
//       <Route path="/AuthLetter" element={<AuthLetter />} />
//       <Route path="/IdCard" element={<IdCard  />} />



   








//       {/* Admin routes: Only accessible to Admin users */}

//       <Route path="/admin" element={<AdmainSideBar />}>
//         <Route index element={<Navigate to="dashboard" replace />} />
//         <Route path="dashboard" element={<AdminDashboard />} />
//         <Route path="asm" element={<AdiminASM />} />
//         <Route path="partner" element={<AdminPartner />} />
//         <Route path="rm" element={<AdminRM />} />
//         <Route path="customer" element={<AdiminCustomer />} />
//         <Route path="banks" element={<AdiminBanks />} />
//         <Route path="export-users" element={<AdiminExportUsers />} />
//         <Route path="Analytics" element={<Analytics />} />
//         <Route path="RM-partner" element={<RMpartner />} />

//         {/* Fixed child route paths (relative, no leading /) */}
//         <Route path="add-asm-page" element={<AddASMPage />} />
//          <Route path="add-rm-page" element={<AddRMPage />} /> 
//          <Route path="add-partner-page" element={<AddPartnerPage />} /> 
//          <Route path="banner" element={<Banner />} />
        
//       </Route>
    

//       {/* ASM routes: Only accessible to ASM users */}
    
//       <Route path="/asm" element={<AsmSiderbar />}>
//         <Route index element={<Navigate to="dashboard" replace />} />
//         <Route path="dashboard" element={<AsmDashboard />} />
//         <Route path="asm" element={<AsmASM />} />
//         <Route path="customers" element={<AsmCustomers />} />
//         <Route path="notifications" element={<AsmNotifications />} />
//         <Route path="partners" element={<AsmPartners />} />
//         <Route path="reports" element={<AsmReports />} />
//         <Route path="applications" element={<Applications />} />
//         <Route path="settings" element={<Settings  />} />
//         <Route path="EditProfile" element={<EditProfile />} /> 
//         <Route path="RM" element={<AsmRM />} /> 
//         <Route path="partners" element={<AsmPartner />} /> 
//       </Route>
 

//       {/* RM routes: Only accessible to RM users */}

//       <Route path="/rm" element={<RmSidebar />}>
//         <Route index element={<Navigate to="dashboard" replace />} />
//         <Route path="dashboard" element={<RmDashboard />} />
//         <Route path="customers" element={<RmCustomers />} />
//         <Route path="partners" element={<RmPartners />} />
//         <Route path="leads" element={<RmLeads />} />
//         <Route path="reports" element={<RmReports />} />
//         <Route path="CustomerAppliction" element={<CustomerAppliction />} />
//         <Route path="Active-partners" element={<ActivePartner/>} />
//         <Route path="Revenue-generated" element={<RevenueGenerated/>} />
//         <Route path="add-partner" element={<AddPartnerPage/>}/>

//         <Route path="RManalytics" element={<RManalytics/>}/>
//         <Route path="Rm-Application" element={<RmApplication/>}/>
//         <Route path="pending-payout" element={<PendingPayout />} />
//         <Route path="done-payout" element={<DonePayout/>}/>


        

//         <Route path="CustomerAppliction" element={<CustomerAppliction />} />
//         <Route path="Active-partners" element={<ActivePartner/>} />
//         <Route path="Revenue-generated" element={<RevenueGenerated/>} />
//         <Route path="Follow-up" element={<FollowUp/>}/>
     



//       </Route>
  

//       {/* Partner routes: Only accessible to Partner users */}

    
//       <Route path="/partner" element={<PartnerSideBar />}>
//         <Route index element={<Navigate to="dashboard" replace />} />
//         <Route path="dashboard" element={<PartnerDashboard />} />
//         <Route path="customers" element={<PartnerCustomers />} />
//         <Route path="applications" element={<PartnerApplications />} />
//         <Route path="EmiCalculator" element={<PartnerEmiCalculator />} />
//         <Route path="KYCDetails" element={<KYCDetails />} />

//         <Route path="get-loan" element={<GetLoan />}/>
//         <Route path="personal-loan" element={<PersonalLoan />}  />
//         <Route path="bussiness-loan" element={<BusinessLoan />}  />
//         <Route path="home-loan-salaried" element={<HomeLoanSalaried />}  />
//         <Route path="home-loan-self-employee" element={<HomeLoanSelfEmployee />}  />
//       </Route>
 

//       <Route path="/customer" element={<Customer />} />


//     </Routes>
//   );
// };

// export default AppRoutes;

