// AppRoutes.jsx
// This file defines the main application routes for different user roles (Admin, ASM, RM, Partner)
// using React Router. Each section below corresponds to a specific user type and their accessible pages.

import React from "react";
import { Routes, Route, Navigate, useSearchParams } from "react-router-dom";
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
import DeleteAccount from "./Page/DeleteAccount";
import PageNotFound from "./Page/PageNotFound";


import PartnerRegistrationForm from "./Page/PartnerRegistrationForm";
import { PARTNER_REGISTRATION_ROUTE } from "./config/publicReferral.js";

import { RequestResetForm } from "./Page/RequestResetForm.jsx";
import { ConfirmResetForm } from "./Page/ConfirmResetForm.jsx";
import ConfirmEmailChange from "./Page/ConfirmEmailChange.jsx";
import PartnerStorefront from "./Page/PartnerStorefront.jsx";

// Import main pages

import AdmainSideBar from "./sidebars/AdmainSideBar";
import AsmSiderbar from "./sidebars/AsmSiderbar";
import RsmSidebar from "./sidebars/RsmSidebar";
import RmSidebar from "./sidebars/RmSidebar";
import PartnerSideBar from "./sidebars/PartnerSideBar";
import AddASMPage from "./sidebars/users/Admin/addaccount/AddASMPage";
import AddPartnerPage from "./sidebars/users/Admin/addaccount/AddPartnerPage";
import AddRMPage from "./sidebars/users/Admin/addaccount/AddRMpage";
import AddRSMPage from "./sidebars/users/Admin/addaccount/AddRSMPage.jsx";
import ChatDashboard from "./sidebars/users/shared/chat/ChatDashboard";



// Import Admin user pages
import AdminDashboard from "./sidebars/users/Admin/Dashboard";
import AdminPartner from "./sidebars/users/Admin/Partner";
import AdminMovePartners from "./sidebars/users/Admin/MovePartners";
import AdminRM from "./sidebars/users/Admin/RM";
import AdminRSM from "./sidebars/users/Admin/RSM";
import AdiminASM from "./sidebars/users/Admin/ASM";
import AdiminCustomer from "./sidebars/users/Admin/Customer";
import AdminLeads from "./sidebars/users/Admin/AdminLeads";
import AdminPendingPayout from "./sidebars/users/Admin/AdminPendingPayout";
import AdminDonePayout from "./sidebars/users/Admin/AdminDonePayout";
import AdminPayouts from "./sidebars/users/Admin/AdminPayouts";
import SetTarget from "./sidebars/users/Admin/SetTarget.jsx"
import PartnerTargets from "./sidebars/users/Admin/PartnerTargets";
import AdiminBanks from "./sidebars/users/Admin/Banks";
import AdminFindBankRm from "./sidebars/users/Admin/FindBankRm";
import Analytics from "./sidebars/users/Admin/Analytics";
import Banner from "./sidebars/users/Admin/Banner";
import RMpartner from "./sidebars/users/Admin/RMpartner";
import DeleteAccountRequests from "./sidebars/users/Admin/DeleteAccountRequests";
import AdminIncentives from "./sidebars/users/Admin/AdminIncentives";
import AdminEligibleIncentive from "./sidebars/users/Admin/AdminEligibleIncentive";
import AdminDoneIncentive from "./sidebars/users/Admin/AdminDoneIncentive";
import AdminPendingIncentive from "./sidebars/users/Admin/AdminPendingIncentive";
import AdminSettings from "./sidebars/users/Admin/AdminSettings";
import AdminPublicLoanReferral from "./sidebars/users/Admin/AdminPublicLoanReferral";
import AdminReferralRewardAmounts from "./sidebars/users/Admin/AdminReferralRewardAmounts";
import AdminReferralRewards from "./sidebars/users/Admin/AdminReferralRewards";
import AdminReferralBanners from "./sidebars/users/Admin/AdminReferralBanners";
import AdminDisbursedLoans from "./sidebars/users/Admin/AdminDisbursedLoans";
import AdminPartnerLevels from "./sidebars/users/Admin/AdminPartnerLevels";
import RewardsAndLevelsHub from "./sidebars/users/Admin/RewardsAndLevelsHub";
import PayoutAndIncentivesHub from "./sidebars/users/Admin/PayoutAndIncentivesHub";

// Import ASM user pages
import AsmDashboard from "./sidebars/users/ASM/Dashboard";
import Applications from "./sidebars/users/ASM/Applications";
import AsmRM from "./sidebars/users/ASM/AsmRM";
import AsmRSM from "./sidebars/users/ASM/AsmRSM";
import AsmPayouts from "./sidebars/users/ASM/AsmPayouts";
import AsmIncentives from "./sidebars/users/ASM/AsmIncentives";
import AsmPendingIncentive from "./sidebars/users/ASM/AsmPendingIncentive";
import AsmDoneIncentive from "./sidebars/users/ASM/AsmDoneIncentive";
import AsmEligibleIncentive from "./sidebars/users/ASM/AsmEligibleIncentive";
import AsmFollowUps from "./sidebars/users/ASM/AsmFollowUps";
import AsmPendingPayout from "./sidebars/users/ASM/AsmPendingPayout";
import AsmDonePayout from "./sidebars/users/ASM/AsmDonePayout";
import AsmPartnerTargets from "./sidebars/users/ASM/AsmPartnerTargets";
import AsmPartners from "./sidebars/users/ASM/AsmPartners";
import AsmMovePartners from "./sidebars/users/ASM/AsmMovePartners";
import Settings from "./sidebars/users/ASM/Settings";
import ASManalytics from "./sidebars/users/ASM/ASManalytics";
import EditProfile from "./sidebars/users/userProfile/EditProfile";

// Import RSM user pages
import RsmDashboard from "./sidebars/users/RSM/Dashboard";
import RsmRMs from "./sidebars/users/RSM/RsmRMs";
import RsmApplications from "./sidebars/users/RSM/RsmApplications";
import RsmFollowUps from "./sidebars/users/RSM/RsmFollowUps";
import RsmApplicationView from "./sidebars/users/RSM/RsmApplicationView";
import RsmPartnerTargets from "./sidebars/users/RSM/RsmPartnerTargets";
import RsmPartners from "./sidebars/users/RSM/RsmPartners";
import RsmAnalytics from "./sidebars/users/RSM/RsmAnalytics";
import Banks from "./sidebars/users/RSM/Banks";
import AsmFindBankRm from "./sidebars/users/RSM/FindBankRm";


// Import RM user pages
import RmDashboard from "./sidebars/users/RM/Dashboard";
import RmCustomers from "./sidebars/users/RM/Customers";
import RmPartners from "./sidebars/users/RM/Partners";
import RmLeads from "./sidebars/users/RM/Leads";
import HierarchyLeads from "./sidebars/users/shared/HierarchyLeads";
import RmReports from "./sidebars/users/RM/Reports";
import CustomerAppliction from "./sidebars/users/RM/CustomerAppliction"
import ActivePartner from "./sidebars/users/RM/ActivePartner";
import RevenueGenerated from "./sidebars/users/RM/RevenueGenerated";
import RManalytics from "./sidebars/users/RM/RManalytics";
import RmApplication from "./sidebars/users/RM/RMApplication";
import RmPartnerTargets from "./sidebars/users/RM/RmPartnerTargets";
// Payout components moved to ASM and Admin


import BusinessLoan from "./sidebars/users/Partner/ApplicationForm/BusinessLoan";
import GetLoan from "./sidebars/users/Partner/GetLoan";
import HomeLoanSalaried from "./sidebars/users/Partner/ApplicationForm/HomeLoanSalaried";
import HomeLoanSelfEmployee from "./sidebars/users/Partner/ApplicationForm/HomeLoanSelfEmployee";
import HomeLoan from "./sidebars/users/Partner/ApplicationForm/HomeLoan";
import LapLoanSalaried from "./sidebars/users/Partner/ApplicationForm/LapLoanSalaried";
import LapLoanSelfEmployee from "./sidebars/users/Partner/ApplicationForm/LapLoanSelfEmployee";
import LapLoan from "./sidebars/users/Partner/ApplicationForm/LapLoan";
import PersonalLoan from "./sidebars/users/Partner/ApplicationForm/PersonalLoan";

// Import Partner user pages
import PartnerDashboard from "./sidebars/users/Partner/Dashboard";
import PartnerCustomers from "./sidebars/users/Partner/Customers";
import PartnerApplications from "./sidebars/users/Partner/Applications";
import PartnerEmiCalculator from "./sidebars/users/Partner/EmiCalculator";
import KYCDetails from "./sidebars/users/Partner/KYCDetails";
import CompleteApplication from "./sidebars/users/Partner/CompleteApplication";
import DocumentUpload from "./sidebars/users/Partner/DocumentUpload";
import MyTarget from "./sidebars/users/Partner/MyTarget";
import IncentiveHistory from "./sidebars/users/Partner/IncentiveHistory";
import PayoutHistory from "./sidebars/users/Partner/PayoutHistory";
import PartnerReferralRewardHistory from "./sidebars/users/Partner/PartnerReferralRewardHistory";
import PartnerAnalytics from "./sidebars/users/Partner/PartnerAnalytics";
import PartnerProfile from "./components/PartnerProfile";
import PartnerEditProfile from "./components/PartnerEditProfile";
// Partner settings uses shared PasswordSettings (same as ASM/RSM/RM)

// import Costomer
import Customer from "./sidebars/users/Customer/Customer";
import FollowUp from "./sidebars/users/RM/FollowUp";
import PasswordSettings from "./sidebars/users/common/PasswordSettings";

import Agreement from "../public/Agreement";
import AuthLetter from "../public/AuthLetter";
import IdCard from "../public/IdCard";
import ProtectedRoute from "./utils/ProtectedRoute.jsx";


// import PersonalLoan from "./sidebars/users/Partner/ApplicationForm/PersonalLoan";
// import BusinessLoan from "./sidebars/users/Partner/ApplicationForm/BusinessLoan";
import CibilAuditLog from "./sidebars/users/Admin/CibilAuditLog";
// import HomeLoanSalaried from "./sidebars/users/Partner/ApplicationForm/HomeLoanSalaried";
// import HomeLoanSelfEmployee from "./sidebars/users/Partner/ApplicationForm/HomeLoanSelfEmployee";



const ROLES = {
  ADMIN: "SUPER_ADMIN",
  ASM: "ASM",
  RSM: "RSM",
  RM: "RM",
  PARTNER: "PARTNER",
  CUSTOMER: "CUSTOMER",
};

/** Old share links used /LoginPage?ref=PT-… — send users straight to partner registration (no login flash). */
function LoginPageRoute() {
  const [searchParams] = useSearchParams();
  const ref = (searchParams.get("ref") || "").trim();
  const upper = ref.toUpperCase();
  if (upper.startsWith("PT-") || upper.startsWith("RM-")) {
    return (
      <Navigate
        to={`${PARTNER_REGISTRATION_ROUTE}?ref=${encodeURIComponent(ref)}`}
        replace
      />
    );
  }
  return <LoginPage />;
}

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public route: Login page */}

      <Route path="/" element={<MainLayout  />}>
        <Route index element={<Navigate to="Home" replace />} />
        <Route path="Home" element={<Home />} />
        <Route path="services" element={<Services />} />
        <Route path="apply" element={<Services />} />
        <Route path="channel-partner" element={<ChannelPartner />} />
        <Route path="documents" element={<Documents />} />
        <Route path="about-us" element={<AboutUs />} />
        <Route path="contact" element={<Contact />} />
        <Route path="PrivacyPolicy" element={<PrivacyPolicy />} />
        <Route path="TermsConditions" element={<TermsConditions />} />
        <Route path="delete-account" element={<DeleteAccount />} />
      </Route>


      <Route path="/login" element={<Navigate to="/LoginPage" replace />} />
      <Route path="/LoginPage" element={<LoginPageRoute />} />
      <Route
        path={PARTNER_REGISTRATION_ROUTE}
        element={<PartnerRegistrationForm />}
      />

      <Route path="/reset-password/request" element={<RequestResetForm />} />
      <Route path="/reset-password/confirm" element={<ConfirmResetForm />} />

      <Route
        path="/email-change/confirm"
        element={<ConfirmEmailChange />}
      />


      <Route path="/Agreement" element={<Agreement />} />
      <Route path="/AuthLetter" element={<AuthLetter />} />
      <Route path="/IdCard" element={<IdCard  />} />

      {/* ⭐ DEDICATED PARTNER DIGITAL STORE / ADVISOR PROFILE (All Partner Data & All Products) */}
      <Route path="/advisor/:partnerCode" element={<PartnerStorefront />} />
      <Route path="/advisor" element={<PartnerStorefront />} />
      <Route path="/store/:partnerCode" element={<PartnerStorefront />} />
      <Route path="/store" element={<PartnerStorefront />} />
      <Route path="/p/:partnerCode" element={<PartnerStorefront />} />
      <Route path="/loan-advisor/:partnerCode" element={<PartnerStorefront />} />
      <Route path="/loan-advisor/*" element={<PartnerStorefront />} />
      <Route path="/loan-advisor" element={<PartnerStorefront />} />
      <Route path="/partner-store/:partnerCode" element={<PartnerStorefront />} />
      <Route path="/loan-saving-agent/*" element={<PartnerStorefront />} />

{/* ⭐ PUBLIC LOAN FORM ROUTES (For Apply Now Buttons & Partner Share Links) */}
      <Route
        path="/partner/application"
        element={<PersonalLoan />}
      />
      <Route
        path="/partner/apply"
        element={<PersonalLoan />}
      />

      <Route
        path="/partner/application/personal-loan"
        element={<PersonalLoan />}
      />
      <Route
        path="/apply/personal-loan"
        element={<PersonalLoan />}
      />

      <Route
        path="/partner/application/business-loan"
        element={<BusinessLoan />}
      />
      <Route
        path="/apply/business-loan"
        element={<BusinessLoan />}
      />

      <Route
        path="/partner/application/home-loan-salaried"
        element={<HomeLoanSalaried />}
      />
      <Route
        path="/apply/home-loan-salaried"
        element={<HomeLoanSalaried />}
      />

      <Route
        path="/partner/application/home-loan-self-employed"
        element={<HomeLoanSelfEmployee />}
      />
      <Route
        path="/apply/home-loan-self-employed"
        element={<HomeLoanSelfEmployee />}
      />

      <Route
        path="/partner/application/home-loan"
        element={<HomeLoan />}
      />
      <Route
        path="/apply/home-loan"
        element={<HomeLoan />}
      />

      <Route
        path="/partner/application/lap-loan-salaried"
        element={<LapLoanSalaried />}
      />
      <Route
        path="/apply/lap-loan-salaried"
        element={<LapLoanSalaried />}
      />

      <Route
        path="/partner/application/lap-loan-self-employed"
        element={<LapLoanSelfEmployee />}
      />
      <Route
        path="/apply/lap-loan-self-employed"
        element={<LapLoanSelfEmployee />}
      />

      <Route
        path="/partner/application/lap-loan"
        element={<LapLoan />}
      />
      <Route
        path="/apply/lap-loan"
        element={<LapLoan />}
      />
      {/* Admin routes: Only accessible to Admin users */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, "ADMIN", "SUPER_ADMIN"]} />}>
      <Route path="/admin" element={<AdmainSideBar />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="chat" element={<ChatDashboard currentRole="SUPER_ADMIN" />} />
        <Route path="asm" element={<AdiminASM />} />
        <Route path="rsm" element={<AdminRSM />} />
        <Route path="RSM" element={<AdminRSM />} />
        <Route path="rm" element={<AdminRM />} />
        <Route path="RM" element={<AdminRM />} />
        <Route path="partner" element={<AdminPartner />} />
        <Route path="Partner" element={<AdminPartner />} />
        <Route path="move-partners" element={<AdminMovePartners />} />
        <Route path="public-loan-referral" element={<AdminPublicLoanReferral />} />
        <Route path="referral-reward-amounts" element={<AdminReferralRewardAmounts />} />
        <Route path="referral-rewards" element={<RewardsAndLevelsHub initialTab="rewards" />} />
        <Route path="rewards-levels" element={<RewardsAndLevelsHub />} />
        <Route path="referral-banners" element={<Banner initialTab="referral" />} />
        <Route path="customer" element={<AdiminCustomer />} />
        <Route path="leads" element={<AdminLeads />} />
        <Route path="target" element={<Navigate to="/admin/incentives" replace />} />
        <Route path="partner-targets" element={<Navigate to="/admin/incentives" replace />} />
        <Route path="banks" element={<AdiminBanks />} />
        <Route path="find-bank-rm" element={<AdminFindBankRm />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="Analytics" element={<Analytics />} />
        <Route path="rm-partner" element={<RMpartner />} />
        <Route path="RM-partner" element={<RMpartner />} />
        <Route path="delete-requests" element={<DeleteAccountRequests />} />
        <Route path="settings" element={<AdminSettings />} />

        {/* Fixed child route paths (relative, no leading /) */}
        <Route path="add-asm-page" element={<AddASMPage />} />
        <Route path="add-rm-page" element={<AddRMPage />} /> 
        <Route path="add-rsm-page" element={<AddRSMPage />} /> 
        <Route path="add-partner-page" element={<AddPartnerPage />} /> 
        <Route path="banner" element={<Banner />} />
        <Route path="payout" element={<PayoutAndIncentivesHub initialTab="payout" />} />
        <Route path="payout-incentives" element={<PayoutAndIncentivesHub />} />
        <Route path="pending-payout" element={<AdminPendingPayout />} />
        <Route path="done-payout" element={<AdminDonePayout />} />
        <Route path="incentives" element={<PayoutAndIncentivesHub initialTab="incentives" />} />
        <Route path="partner-levels" element={<RewardsAndLevelsHub initialTab="levels" />} />
        <Route path="incentives/pending" element={<Navigate to="/admin/incentives" replace state={{ defaultTab: "eligible" }} />} />
        <Route path="incentives/eligible" element={<Navigate to="/admin/incentives" replace state={{ defaultTab: "eligible" }} />} />
        <Route path="incentives/done" element={<Navigate to="/admin/incentives" replace state={{ defaultTab: "paid" }} />} />
        <Route path="cibil-audit" element={<CibilAuditLog />} />
        <Route path="disbursed-loans" element={<AdminDisbursedLoans />} />
        <Route path="withdrawals" element={<Navigate to="/admin/payout" replace />} />
        
      </Route>
      </Route>

      {/* RSM routes: Regional Sales Manager (Senior) */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.RSM, ROLES.ASM, ROLES.ADMIN, "ADMIN", "SUPER_ADMIN"]} />}>
      <Route path="/rsm" element={<AsmSiderbar />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AsmDashboard />} />
        <Route path="chat" element={<ChatDashboard currentRole="RSM" />} />
        <Route path="asms" element={<AsmRSM />} />
        <Route path="rsms" element={<AsmRSM />} />
        <Route path="rms" element={<AsmRM />} /> 
        <Route path="applications" element={<Applications />} />
        <Route path="applications/view" element={<RsmApplicationView />} />
        <Route path="partners" element={<AsmPartners />} />
        <Route path="move-partners" element={<AsmMovePartners />} />
        <Route path="payouts" element={<AsmPayouts />} />
        <Route path="pending-payout" element={<Navigate to="/rsm/payouts" replace state={{ defaultTab: "pending" }} />} />
        <Route path="done-payout" element={<Navigate to="/rsm/payouts" replace state={{ defaultTab: "done" }} />} />
        <Route path="incentives" element={<AsmIncentives />} />
        <Route path="pending-incentive" element={<Navigate to="/rsm/incentives" replace state={{ defaultTab: "all" }} />} />
        <Route path="eligible-incentive" element={<Navigate to="/rsm/incentives" replace state={{ defaultTab: "eligible" }} />} />
        <Route path="done-incentive" element={<Navigate to="/rsm/incentives" replace state={{ defaultTab: "paid" }} />} />
        <Route path="withdrawals" element={<Navigate to="/rsm/payouts" replace />} />
        <Route path="leads" element={<HierarchyLeads />} />
        <Route path="follow-ups" element={<AsmFollowUps />} />
        <Route path="find-bank-rm" element={<AdminFindBankRm />} />
        <Route path="partner-targets" element={<Navigate to="/rsm/incentives" replace />} />
        <Route path="settings" element={<PasswordSettings  />} />
        <Route path="EditProfile" element={<EditProfile />} />
        <Route path="analytics" element={<ASManalytics />} />
        <Route path="ASManalytics" element={<ASManalytics />} />
      </Route>
      </Route>

      {/* ASM routes: Area Sales Manager (Specialized) */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.ASM, ROLES.RSM, ROLES.ADMIN, "ADMIN", "SUPER_ADMIN"]} />}>
      <Route path="/asm" element={<RsmSidebar />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<RsmDashboard />} />
        <Route path="chat" element={<ChatDashboard currentRole="ASM" />} />
        <Route path="rms" element={<RsmRMs />} />
        <Route path="partners" element={<RsmPartners />} />
        <Route path="move-partners" element={<AsmMovePartners />} />
        <Route path="applications" element={<RsmApplications />} />
        <Route path="applications/view" element={<RsmApplicationView />} />
        <Route path="analytics" element={<RsmAnalytics />} />
        <Route path="leads" element={<HierarchyLeads />} />
        <Route path="follow-ups" element={<RsmFollowUps />} />
        <Route path="banks" element={<Banks />} />
        <Route path="find-bank-rm" element={<AsmFindBankRm />} />
        <Route path="settings" element={<PasswordSettings />} />
        <Route path="EditProfile" element={<EditProfile />} />
      </Route>
      </Route>

      {/* RM routes: Only accessible to RM users */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.RM, ROLES.ASM, ROLES.RSM, ROLES.ADMIN, "ADMIN", "SUPER_ADMIN"]} />}>
      <Route path="/rm" element={<RmSidebar />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<RmDashboard />} />
        <Route path="chat" element={<ChatDashboard currentRole="RM" />} />
        <Route path="customers" element={<RmCustomers />} />
        <Route path="partners" element={<RmPartners />} />
        <Route path="leads" element={<RmLeads />} />
        <Route path="reports" element={<RmReports />} />
        <Route path="CustomerAppliction" element={<CustomerAppliction />} />
        <Route path="Active-partners" element={<ActivePartner/>} />
        <Route path="Revenue-generated" element={<RevenueGenerated/>} />
        <Route path="add-partner" element={<AddPartnerPage/>}/>

        <Route path="analytics" element={<RManalytics/>}/>
        <Route path="RManalytics" element={<RManalytics/>}/>
        <Route path="Rm-Application" element={<RmApplication/>}/>
        <Route path="partner-targets" element={<Navigate to="/rm/dashboard" replace />} />
        <Route path="settings" element={<PasswordSettings />} />
        <Route path="EditProfile" element={<EditProfile />} />
        {/* Payout routes moved to ASM and Admin */}


        

        <Route path="CustomerAppliction" element={<CustomerAppliction />} />
        <Route path="Active-partners" element={<ActivePartner/>} />
        <Route path="Revenue-generated" element={<RevenueGenerated/>} />
        <Route path="Follow-up" element={<FollowUp/>}/>
        <Route path="personal-loan" element={<PersonalLoan actorRole="rm" />} />
        <Route path="bussiness-loan" element={<BusinessLoan actorRole="rm" />} />
        <Route path="home-loan" element={<HomeLoan />} />
        <Route path="home-loan-salaried" element={<HomeLoanSalaried actorRole="rm" />} />
        <Route path="home-loan-self-employee" element={<HomeLoanSelfEmployee actorRole="rm" />} />
        <Route path="lap-loan" element={<LapLoan />} />
        <Route path="lap-loan-salaried" element={<LapLoanSalaried actorRole="rm" />} />
        <Route path="lap-loan-self-employee" element={<LapLoanSelfEmployee actorRole="rm" />} />
     



      </Route>
      </Route>

      {/* Partner routes: Only accessible to Partner users */}

      <Route element={<ProtectedRoute allowedRoles={[ROLES.PARTNER, ROLES.ADMIN, "ADMIN", "SUPER_ADMIN"]} />}>
        <Route path="/partner" element={<PartnerSideBar />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PartnerDashboard />} />
          <Route path="profile" element={<PartnerProfile />} />
          <Route path="edit-profile" element={<PartnerEditProfile />} />
          <Route path="customers" element={<PartnerCustomers />} />
          <Route path="applications" element={<PartnerApplications />} />
          <Route path="analytics" element={<PartnerAnalytics />} />
          <Route path="settings" element={<PasswordSettings />} />
          <Route path="EmiCalculator" element={<PartnerEmiCalculator />} />
          <Route path="KYCDetails" element={<KYCDetails />} />
          <Route path="complete-application" element={<CompleteApplication />} />
          <Route path="document-upload" element={<DocumentUpload />} />
          <Route path="my-target" element={<Navigate to="/partner/incentives" replace />} />
          <Route path="incentives" element={<IncentiveHistory />} />
          <Route path="referral-rewards" element={<PartnerReferralRewardHistory />} />
          <Route path="payouts" element={<PayoutHistory />} />

          <Route path="get-loan" element={<GetLoan />} />
          <Route path="personal-loan" element={<PersonalLoan />} />
          <Route path="bussiness-loan" element={<BusinessLoan />} />
          <Route path="home-loan" element={<HomeLoan />} />
          <Route path="home-loan-salaried" element={<HomeLoanSalaried />} />
          <Route path="home-loan-self-employee" element={<HomeLoanSelfEmployee />} />
          <Route path="lap-loan" element={<LapLoan />} />
          <Route path="lap-loan-salaried" element={<LapLoanSalaried />} />
          <Route path="lap-loan-self-employee" element={<LapLoanSelfEmployee />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN, "ADMIN", "SUPER_ADMIN"]} />}>
      <Route path="/customer" element={<Customer />} />
      </Route>

      {/* //loanlinkss */}

      <Route path="*" element={<PageNotFound />} />
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

