//updTED CODE

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  Building,
  Store,
  Camera,
  Users,
  Receipt,
  Shield,
  X,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { z } from "zod";
import { getAuthData } from "../../../../utils/localStorage";
import { backendurl } from "../../../../feature/urldata";
import {
  fetchPublicDefaultPartnerReferralCode,
  PUBLIC_LOAN_REFERRAL_FALLBACK,
} from "../../../../feature/publicLoanReferral";
import LoanStepper from "../../../../components/loan/LoanStepper";
import DocumentUploadCard from "../../../../components/loan/DocumentUploadCard";
import DocumentPreviewModal from "../../../../components/loan/DocumentPreviewModal";

export default function BusinessLoan({ embed = false } = {}) {
  const { partnerToken } = getAuthData();
  const isPartnerLoggedIn = Boolean(partnerToken);
  const [defaultReferralCode, setDefaultReferralCode] = useState(
    PUBLIC_LOAN_REFERRAL_FALLBACK
  );

  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    alternateContact: "",
    email: "",
    gender: "",
    motherName: "",
    maritalStatus: "",
    SpouseName: "",
    panNumber: "",

    // Address Information
    currentAddress: "",
    currentAddressPincode: "",
    currentAddressOwnRented: "",
    currentAddressStability: "",
    currentAddressLandmark: "",
    permanentAddress: "",
    permanentAddressPincode: "",
    permanentAddressOwnRented: "",
    permanentAddressStability: "",
    permanentAddressLandmark: "",

    // Business Information
    businessName: "",
    businessAddress: "",
    businessLandmark: "",
    businessVintage: "",

    // Documents
    aadharFront: null,
    aadharBack: null,
    panCard: null,
    addressProof: null,
    lightBill: null,
    utilityBill: null,
    rentAgreement: null,

    // Address Proof Checkboxes
    lightBillSelected: false,
    utilityBillSelected: false,
    rentAgreementSelected: false,
    shopPhoto: null,
    shopAct: null,
    udhyamAadhar: null,
    itr: null,
    gstNumber: "",
    gstDoc: null,
    bankStatementFile1: null,
    bankStatementFile2: null,
    businessOtherDocs: null,
    selfie: null,

    // Co-applicant (for female applicants)
    coApplicantAadharFront: null,
    coApplicantAadharBack: null,
    coApplicantPan: null,
    coApplicantMobile: "",
    coApplicantSelfie: null,

    // Legacy fields (keeping for compatibility)
    password: "",
    confirmPassword: "",
    fullName: "",
    dob: "",
    shopName: "",
    reference1Name: "",
    reference1Contact: "",
    reference2Name: "",
    reference2Contact: "",
    otherDocs: null,
    annualTurnover: "",
    partnerReferralCode: "",
  });

  const [sameAddress, setSameAddress] = useState(false);
  const [documentModel, setdocumentModel] = useState(null);
  const [applicationId, setApplicationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [savedApplication, setSavedApplication] = useState(null);
  const abortControllerRef = useRef(null);

  const loanDraftStorageKey = embed
    ? "trustline.businessLoanDraft.embed.v1"
    : "trustline.businessLoanDraft.v1";
  const steps = [
    "Personal",
    "Address",
    "Loan & Business",
    "Documents",
    "References",
    "Review",
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [touchedFields, setTouchedFields] = useState({});
  const [showClientValidation, setShowClientValidation] = useState(false);

  const stepFirstFieldName = useMemo(
    () => [
      "firstName",
      "currentAddress",
      "loanAmount",
      "aadharFront",
      "reference1Name",
      isPartnerLoggedIn ? "reference2Contact" : "partnerReferralCode",
    ],
    [isPartnerLoggedIn]
  );

  useEffect(() => {
    if (isPartnerLoggedIn) return;
    let cancelled = false;
    fetchPublicDefaultPartnerReferralCode().then((code) => {
      if (cancelled) return;
      setDefaultReferralCode(code);
      setFormData((prev) => {
        const existing = String(prev.partnerReferralCode ?? "").trim();
        if (existing) return prev;
        return { ...prev, partnerReferralCode: code };
      });
    });
    return () => {
      cancelled = true;
    };
  }, [isPartnerLoggedIn]);

  // Cleanup function to cancel pending requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (documentModel && documentModel.startsWith("blob:")) {
        URL.revokeObjectURL(documentModel);
      }
    };
  }, [documentModel]);

  const openDocumentPreview = (docValue) => {
    if (!docValue) return;
    const url =
      docValue?.preview
        ? docValue.preview
        : docValue instanceof File
        ? URL.createObjectURL(docValue)
        : "";
    if (url) setdocumentModel(url);
  };
  const renderPreviewLink = (fieldName) =>
    formData[fieldName] ? (
      <button
        type="button"
        className="mt-1 text-sm font-medium text-blue-600 underline"
        onClick={() => openDocumentPreview(formData[fieldName])}
      >
        Preview selected file
      </button>
    ) : null;

  useEffect(() => {
    if (successMessage) toast.success(successMessage);
  }, [successMessage]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const serializeDraftFormData = (data) => {
    const copy = { ...data };
    // localStorage can't persist File objects; drop them so draft restore doesn't break.
    for (const key of Object.keys(copy)) {
      const v = copy[key];
      if (v instanceof File) copy[key] = null;
    }
    return copy;
  };

  // Load draft from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(loanDraftStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.formData) {
        setFormData((prev) => ({ ...prev, ...parsed.formData }));
      }
      if (typeof parsed?.currentStep === "number") {
        setCurrentStep(Math.max(0, Math.min(parsed.currentStep, steps.length - 1)));
      }
      if (typeof parsed?.maxStep === "number") {
        setMaxStep(Math.max(0, Math.min(parsed.maxStep, steps.length - 1)));
      }
    } catch (e) {
      // Ignore draft restore failures
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist draft as the user progresses
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          loanDraftStorageKey,
          JSON.stringify({
            currentStep,
            maxStep,
            formData: serializeDraftFormData(formData),
          })
        );
      } catch (e) {
        // ignore quota errors etc.
      }
    }, 400);
    return () => clearTimeout(t);
  }, [currentStep, maxStep, formData]);

  const fileLike = (v) =>
    v instanceof File ||
    (v && typeof v === "object" && typeof v.size === "number");

  const zodFileRequired = (message) =>
    z.any().refine((v) => fileLike(v), { message: message || "This document is required." });

  const zodRequiredTextMin3 = (message) =>
    z.string().trim().min(3, message || "This field must be at least 3 characters long.");

  const pinSchema = z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code.");

  const phoneSchema = z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Phone number must be exactly 10 digits.");

  const panSchema = z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toUpperCase() : v),
    z
      .string()
      .regex(
        /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
        "Enter a valid PAN card number (e.g., ABCDE1234F)."
      )
  );

  const emailSchema = z.string().trim().email("Invalid email format.");

  const positiveNumberSchema = z.preprocess(
    (v) => {
      if (v === "" || v === null || v === undefined) return undefined;
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? n : undefined;
    },
    z.number().positive("Value must be greater than zero.")
  );

  function validateBusinessLoanStep(stepIndex, data) {
    const errors = {};

    if (stepIndex === 0) {
      const firstRes = zodRequiredTextMin3("First name must be at least 3 characters.").safeParse(data.firstName);
      if (!firstRes.success) errors.firstName = firstRes.error.issues[0].message;

      const lastRes = zodRequiredTextMin3("Last name must be at least 3 characters.").safeParse(data.lastName);
      if (!lastRes.success) errors.lastName = lastRes.error.issues[0].message;

      const motherRes = zodRequiredTextMin3("Mother name must be at least 3 characters.").safeParse(data.motherName);
      if (!motherRes.success) errors.motherName = motherRes.error.issues[0].message;

      const panRes = panSchema.safeParse(data.panNumber);
      if (!panRes.success) errors.panNumber = panRes.error.issues[0].message;

      const phoneRes = phoneSchema.safeParse(data.phone);
      if (!phoneRes.success) errors.phone = phoneRes.error.issues[0].message;

      const emailRes = emailSchema.safeParse(data.email);
      if (!emailRes.success) errors.email = emailRes.error.issues[0].message;

      if (!data.gender) errors.gender = "Gender is required.";
      if (!data.maritalStatus) errors.maritalStatus = "Marital status is required.";

      if (data.maritalStatus === "married") {
        const spouseRes = zodRequiredTextMin3("Spouse name must be at least 3 characters.").safeParse(data.SpouseName);
        if (!spouseRes.success) errors.SpouseName = spouseRes.error.issues[0].message;
      }
    }

    if (stepIndex === 1) {
      if (!data.currentAddress) errors.currentAddress = "Current address is required.";

      const pinRes = pinSchema.safeParse(data.currentAddressPincode);
      if (!pinRes.success) errors.currentAddressPincode = pinRes.error.issues[0].message;

      if (!data.currentAddressOwnRented) errors.currentAddressOwnRented = "Ownership status is required.";
      if (!data.currentAddressStability) errors.currentAddressStability = "Address stability is required.";

      if (!data.permanentAddress) errors.permanentAddress = "Permanent address is required.";

      const pPinRes = pinSchema.safeParse(data.permanentAddressPincode);
      if (!pPinRes.success) errors.permanentAddressPincode = pPinRes.error.issues[0].message;

      if (!data.permanentAddressOwnRented) errors.permanentAddressOwnRented = "Ownership status is required.";
      if (!data.permanentAddressStability) errors.permanentAddressStability = "Address stability is required.";
    }

    if (stepIndex === 2) {
      const loanRes = positiveNumberSchema.safeParse(data.loanAmount);
      if (!loanRes.success) errors.loanAmount = "Loan amount must be greater than zero.";

      const businessNameRes = zodRequiredTextMin3("Business name must be at least 3 characters.").safeParse(data.businessName);
      if (!businessNameRes.success) errors.businessName = businessNameRes.error.issues[0].message;

      const vintageRes = positiveNumberSchema.safeParse(data.businessVintage);
      if (!vintageRes.success) errors.businessVintage = "Business vintage must be greater than zero.";

      if (!data.businessAddress) errors.businessAddress = "Business address is required.";

      const turnoverRes = positiveNumberSchema.safeParse(data.annualTurnover);
      if (!turnoverRes.success) errors.annualTurnover = "Annual turnover must be greater than zero.";
    }

    if (stepIndex === 3) {
      const aFrontRes = zodFileRequired("Aadhar Front is required.").safeParse(data.aadharFront);
      if (!aFrontRes.success) errors.aadharFront = aFrontRes.error.issues[0].message;

      const aBackRes = zodFileRequired("Aadhar Back is required.").safeParse(data.aadharBack);
      if (!aBackRes.success) errors.aadharBack = aBackRes.error.issues[0].message;

      const panCardRes = zodFileRequired("PAN Card is required.").safeParse(data.panCard);
      if (!panCardRes.success) errors.panCard = panCardRes.error.issues[0].message;

      const selfieRes = zodFileRequired("Applicant photo is required.").safeParse(data.selfie);
      if (!selfieRes.success) errors.selfie = selfieRes.error.issues[0].message;

      if (data.gender === "female") {
        const coaFrontRes = zodFileRequired("Co-applicant Aadhar Front is required.").safeParse(data.coApplicantAadharFront);
        if (!coaFrontRes.success) errors.coApplicantAadharFront = coaFrontRes.error.issues[0].message;

        const coaBackRes = zodFileRequired("Co-applicant Aadhar Back is required.").safeParse(data.coApplicantAadharBack);
        if (!coaBackRes.success) errors.coApplicantAadharBack = coaBackRes.error.issues[0].message;

        const coaPanRes = zodFileRequired("Co-applicant PAN is required.").safeParse(data.coApplicantPan);
        if (!coaPanRes.success) errors.coApplicantPan = coaPanRes.error.issues[0].message;

        const coMobileRes = phoneSchema.safeParse(data.coApplicantMobile);
        if (!coMobileRes.success) errors.coApplicantMobile = coMobileRes.error.issues[0].message;

        const coaSelfieRes = zodFileRequired("Co-applicant selfie is required.").safeParse(data.coApplicantSelfie);
        if (!coaSelfieRes.success) errors.coApplicantSelfie = coaSelfieRes.error.issues[0].message;
      }

      if (!data.shopAct) errors.shopAct = "Shop Act is required.";
      if (!data.udhyamAadhar) errors.udhyamAadhar = "Udhyam Aadhar is required.";
      if (!data.itr) errors.itr = "ITR is required.";
      if (!data.shopPhoto) errors.shopPhoto = "Shop Photo is required.";
      if (!data.bankStatementFile1) errors.bankStatementFile1 = "Bank Statement File 1 is required.";
    }

    if (stepIndex === 4) {
      if (!data.reference1Name) errors.reference1Name = "Reference 1 name is required.";

      const r1PhoneRes = phoneSchema.safeParse(data.reference1Contact);
      if (!r1PhoneRes.success) errors.reference1Contact = r1PhoneRes.error.issues[0].message;

      if (!data.reference2Name) errors.reference2Name = "Reference 2 name is required.";

      const r2PhoneRes = phoneSchema.safeParse(data.reference2Contact);
      if (!r2PhoneRes.success) errors.reference2Contact = r2PhoneRes.error.issues[0].message;

      if (
        data.reference1Contact &&
        data.reference2Contact &&
        data.reference1Contact === data.reference2Contact
      ) {
        errors.reference2Contact = "Reference 2 contact cannot be the same as Reference 1.";
      }
    }

    return errors;
  }

  function validateBusinessLoanAll(data) {
    const allErrors = {};
    for (let i = 0; i <= 4; i++) {
      const e = validateBusinessLoanStep(i, data);
      Object.assign(allErrors, e);
    }
    return allErrors;
  }

  function scrollToFirstError(errorMap) {
    const keys = Object.keys(errorMap || {});
    if (keys.length === 0) return;
    const firstKey = keys[0];
    const el = document.querySelector(`[name="${firstKey}"]`);
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      if (typeof el.focus === "function") el.focus();
    }
  }

  // const handleInputChange = (e) => {
  //     const { name, value } = e.target;
  //     setFormData((prev) => ({
  //       ...prev,
  //       [name]: value,
  //     }));
  //   };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));

    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: name === "loanAmount" ? parseInt(value, 10) || 0 : value,
      };
      if (showClientValidation) {
        setValidationErrors(validateBusinessLoanStep(currentStep, next));
      }
      return next;
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    if (name.startsWith("newAddressProofs.")) {
      const proofType = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        newAddressProofs: {
          ...prev.newAddressProofs,
          [proofType]: files[0],
        },
      }));
    } else {
      setFormData((prev) => {
        const next = { ...prev, [name]: files[0] };
        if (showClientValidation) {
          setValidationErrors(validateBusinessLoanStep(currentStep, next));
        }
        return next;
      });
    }
  };

  const handleFileRemove = (fieldName) => {
    if (fieldName.startsWith("newAddressProofs.")) {
      const proofType = fieldName.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        newAddressProofs: {
          ...prev.newAddressProofs,
          [proofType]: null,
        },
      }));
      const fileInput = document.querySelector(
        `input[name="newAddressProofs.${proofType}"]`
      );
      if (fileInput) fileInput.value = "";
    } else {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: null,
      }));
      const fileInput = document.querySelector(`input[name="${fieldName}"]`);
      if (fileInput) fileInput.value = "";
    }
  };

  const handleProofCheckboxChange = (fieldName, checked) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: checked,
    }));
    if (!checked) {
      const fileField = fieldName.replace("Selected", "");
      setFormData((prev) => ({
        ...prev,
        [fileField]: null,
      }));
      const fileInput = document.querySelector(`input[name="${fileField}"]`);
      if (fileInput) fileInput.value = "";
    }
  };

  const handleSameAddressChange = (e) => {
    setSameAddress(e.target.checked);
    if (e.target.checked) {
      setFormData((prev) => ({
        ...prev,
        permanentAddress: prev.currentAddress,
        permanentAddressPincode: prev.currentAddressPincode,
        permanentAddressOwnRented: prev.currentAddressOwnRented,
        permanentAddressStability: prev.currentAddressStability,
        permanentAddressLandmark: prev.currentAddressLandmark,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        permanentAddress: "",
        permanentAddressPincode: "",
        permanentAddressOwnRented: "",
        permanentAddressStability: "",
        permanentAddressLandmark: "",
      }));
    }
  };

 

 
function validateForm(formData) {
  const errors = {};

  if (!formData.firstName) errors.firstName = "First name is required.";
  if (!formData.lastName) errors.lastName = "Last name is required.";
  if (!formData.motherName) errors.motherName = "Mother name is required.";
  if (!formData.panNumber) errors.panNumber = "PAN Number is required.";
  if (!formData.phone) {
    errors.phone = "Phone number is required.";
  } else if (!/^\d{10}$/.test(formData.phone)) {
    errors.phone = "Phone number must be exactly 10 digits.";
  }

  if (!formData.email) errors.email = "Email is required.";
  if (!formData.gender) errors.gender = "Gender is required.";
  if (!formData.maritalStatus) errors.maritalStatus = "Marital status is required.";


  // Address Information........
  if (!formData.currentAddress) errors.currentAddress = "current Address is required.";

  if (!formData.currentAddressPincode) errors.currentAddressPincode = "Pincode is required.";

  if (!formData.currentAddressOwnRented) errors.currentAddressOwnRented = " Own Rented is required.";

  if (!formData.currentAddressStability) errors.currentAddressStability = "Address Stability is required.";

  // Permanent Address Info....
  if (!formData.permanentAddress) errors.permanentAddress = "permanent Address is required.";

  if (!formData.permanentAddressPincode) errors.permanentAddressPincode = "Pincode is required.";

  if (!formData.permanentAddressOwnRented) errors.permanentAddressOwnRented = "own/ Rented is required.";

  if (!formData.permanentAddressStability) errors.permanentAddressStability = " Address Stability is required.";



  // Loan Deatils..........

  if (!formData.loanAmount) errors.loanAmount = "loan Amount is required.";
  else if (Number(formData.loanAmount) <= 0) {
    errors.loanAmount = "Loan amount must be greater than zero.";
  }

  // Personal Documents.......

  if (!formData.aadharFront) errors.aadharFront = "Aadhar Front is required.";

  if (!formData.aadharBack) errors.aadharBack = "Aadhar Back is required.";
  
  if (!formData.panCard) errors.panCard = "PAN Card is required.";

  if (!formData.selfie && !formData.passportPhoto) {
    errors.selfie = "Applicant photo is required.";
  }

  // Co-applicant Information (only for female applicants)
  if (formData.gender === "female") {
    if (!formData.coApplicantAadharFront) errors.coApplicantAadharFront = "Aadhar Front is required.";
    if (!formData.coApplicantAadharBack) errors.coApplicantAadharBack = "Aadhar Back is required.";
    if (!formData.coApplicantPan) errors.coApplicantPan = "PAN  is required.";
    if (!formData.coApplicantMobile) errors.coApplicantMobile = "Contact is required.";
    if (!formData.coApplicantSelfie) errors.coApplicantSelfie = "Selfie is required.";
  }


  // Business Information...

  if (!formData.businessName) errors.businessName = "Business Name is required.";

  if (!formData.businessVintage) errors.businessVintage = "Business Vintage is required.";

  if (!formData.businessAddress) errors.businessAddress = "Business Address is required.";

  if (!formData.annualTurnover) errors.annualTurnover = "Annual Turnover is required.";

  // Business Documents...

  if (!formData.shopAct) errors.shopAct = "Shop Act is required.";

  if (!formData.udhyamAadhar) errors.udhyamAadhar = "Udhyam Aadhar is required.";

  if (!formData.itr) errors.itr = "ITR is required.";

  if (!formData.shopPhoto) errors.shopPhoto = "Shop Photo is required.";

  // Financial Documents....

  if (!formData.bankStatementFile1) errors.bankStatementFile1 = "Bank Statement File 1 is required.";

   // References
   if (!formData.reference1Name) errors.reference1Name = "Reference 1 name is required.";
   if (!formData.reference1Contact) {
     errors.reference1Contact = "Reference 1 contact is required.";
   } else if (!/^\d{10}$/.test(formData.reference1Contact)) {
     errors.reference1Contact = "Reference 1 contact must be exactly 10 digits.";
   }

   if (!formData.reference2Name) errors.reference2Name = "Reference 2 name is required.";
   if (!formData.reference2Contact) {
     errors.reference2Contact = "Reference 2 contact is required.";
   } else if (!/^\d{10}$/.test(formData.reference2Contact)) {
     errors.reference2Contact = "Reference 2 contact must be exactly 10 digits.";
   }

  return errors;
}


const handleSubmit = async () => {
  if (loading) return;
  console.log("working");

  setLoading(true);
  setError("");
  setValidationErrors({});
  setSuccessMessage("");
  setSavedApplication(null);

  try {
    // 1) Validate form
    const errors = validateBusinessLoanAll(formData);
    if (Object.keys(errors).length > 0) {
      console.warn("Validation errors:", errors);
      setValidationErrors(errors);
      setTouchedFields(Object.fromEntries(Object.keys(errors).map((k) => [k, true])));
      setShowClientValidation(true);
      setError("Please correct the highlighted fields to submit your application.");
      scrollToFirstError(errors);
      setLoading(false);
      return;
    }

    // 2) Build payload
    const applicationData = {
      loanType: "BUSINESS",
      partnerReferralCode: isPartnerLoggedIn
        ? undefined
        : formData.partnerReferralCode?.trim() || undefined,
      customer: {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        mothersName: formData.motherName,
        phone: formData.phone,
        alternatePhone: formData.alternateContact,
        email: formData.email,
        panNumber: formData.panNumber,
        gender: formData.gender,
        maritalStatus: formData.maritalStatus,
        spouseName: formData.SpouseName,
        dateOfBirth: formData.dob,
        currentAddress: formData.currentAddress,
        currentAddressPinCode: formData.currentAddressPincode,
        currentAddressHouseStatus: formData.currentAddressOwnRented,
        currentAddressLandmark: formData.currentAddressLandmark,
        stabilityOfResidency: formData.currentAddressStability,
        permanentAddress: formData.permanentAddress,
        permanentAddressPinCode: formData.permanentAddressPincode,
        permanentAddressHouseStatus: formData.permanentAddressOwnRented,
        permanentAddressLandmark: formData.permanentAddressLandmark,
        permanentAddressStability: formData.permanentAddressStability,
        loanAmount: formData.loanAmount || 0,
      },
      product: {
        businessName: formData.businessName,
        businessAddress: formData.businessAddress,
        businessLandmark: formData.businessLandmark,
        businessVintage: formData.businessVintage,
        annualTurnover: formData.annualTurnover,
        gstNumber: formData.gstNumber,
      },
      references: [
        { name: formData.reference1Name, phone: formData.reference1Contact },
        { name: formData.reference2Name, phone: formData.reference2Contact },
      ],
      docs: [],
    };

    // 3) Build FormData with files
    const formDataToSend = new FormData();
    formDataToSend.append("data", JSON.stringify(applicationData));

    const applicantPhoto = formData.passportPhoto || formData.selfie;
    const docsQueue = [
      { file: formData.aadharFront, type: "AADHAR_FRONT" },
      { file: formData.aadharBack, type: "AADHAR_BACK" },
      { file: formData.otherDocs, type: "OTHER_DOCS" },
      { file: formData.panCard, type: "PAN" },
      { file: applicantPhoto, type: "PHOTO" },
      { file: formData.addressProof, type: "ADDRESS_PROOF" },
      { file: formData.lightBill, type: "LIGHT_BILL" },
      { file: formData.utilityBill, type: "UTILITY_BILL" },
      { file: formData.rentAgreement, type: "RENT_AGREEMENT" },
      { file: formData.shopPhoto, type: "SHOP_PHOTO" },
      { file: formData.shopAct, type: "SHOP_ACT" },
      { file: formData.udhyamAadhar, type: "UDHYAM_AADHAR" },
      { file: formData.itr, type: "ITR" },
      { file: formData.gstDoc, type: "GST_DOC" },
      { file: formData.bankStatementFile1, type: "BANK_STATEMENT_1" },
      { file: formData.bankStatementFile2, type: "BANK_STATEMENT_2" },
      { file: formData.businessOtherDocs, type: "BUSINESS_OTHER_DOCS" },
      // Co-applicant docs (if any)
      { file: formData.coApplicantAadharFront, type: "CO_APPLICANT_AADHAR_FRONT" },
      { file: formData.coApplicantAadharBack, type: "CO_APPLICANT_AADHAR_BACK" },
      { file: formData.coApplicantPan, type: "CO_APPLICANT_PAN" },
      { file: formData.coApplicantSelfie, type: "CO_APPLICANT_SELFIE" },
    ];

    docsQueue.forEach(({ file, type }) => {
      if (file) {
        formDataToSend.append("docs", file);
        formDataToSend.append("docTypes", type);
      }
    });

    if (!checkFileSize(docsQueue)) {
      setLoading(false);
      return;
    }

    // 4) Send to backend
    const endpoint = isPartnerLoggedIn
      ? `${backendurl}/partner/create-applications`
      : `${backendurl}/partner/public/create-application`;

    const headers = isPartnerLoggedIn
      ? {
          Authorization: `Bearer ${partnerToken}`,
          "Content-Type": "multipart/form-data",
        }
      : { "Content-Type": "multipart/form-data" };

    // Create AbortController for request cancellation
    abortControllerRef.current = new AbortController();

    const response = await axios.post(endpoint, formDataToSend, {
      headers,
      timeout: 120000, // 120 seconds timeout for file uploads
      maxContentLength: 100 * 1024 * 1024, // 100MB max content length
      maxBodyLength: 100 * 1024 * 1024, // 100MB max body length
      signal: abortControllerRef.current.signal,
      onUploadProgress: (progressEvent) => {
        // Optional: You can add progress tracking here if needed
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          // console.log(`Upload progress: ${percentCompleted}%`);
        }
      },
    });
    const data = response.data;

    setApplicationId(data.id);
    setSavedApplication(data);
    setSuccessMessage(
      data.message || "Application saved successfully. Submitting now."
    );
    await handleApplyNow(data.id);
  } catch (err) {
    // Handle different error types
    if (axios.isCancel(err)) {
      setError("Request was cancelled. Please try again.");
    } else if (err.code === "ECONNABORTED") {
      setError("Request timeout. Please check your connection and try again.");
    } else if (err.response) {
      const backendMessage = err.response?.data?.message;
      const backendError = err.response?.data?.error || "";

      // Friendly messages for duplicate keys (email / phone)
      if (typeof backendError === "string" && backendError.includes("E11000")) {
        if (backendError.includes("email_1")) {
          setError(
            "An account with this email already exists. Please login or use a different email."
          );
        } else if (backendError.includes("phone_1")) {
          setError(
            "An account with this mobile number already exists. Please login or use a different number."
          );
        } else {
          setError(
            "A record with these details already exists. Please login or use different details."
          );
        }
      } else {
        // Generic server-side validation / error
        setError(
          backendMessage || err.message || "Failed to save application. Try again."
        );
        setValidationErrors(err.response?.data?.errors || []);
      }
    } else if (err.request) {
      // Request was made but no response received
      setError("Network error. Please check your connection and try again.");
    } else {
      // Something else happened
      setError("An unexpected error occurred. Please try again.");
    }
  } finally {
    setLoading(false);
    abortControllerRef.current = null;
  }
};

  const handleApplyNow = async (forcedApplicationId) => {
    if (loading) return;
    const targetApplicationId = forcedApplicationId || applicationId;
    if (!targetApplicationId) return;
    setLoading(true);
    setError("");
    try {
      const { partnerToken } = getAuthData();
      if (!partnerToken) {
        setSuccessMessage("Application submitted successfully.");
        resetFields();
        return;
      }
      // Create AbortController for request cancellation
      abortControllerRef.current = new AbortController();

      await axios.post(
        `${backendurl}/partner/applications/${targetApplicationId}/submit`,
        {},
        {
          headers: {
            Authorization: `Bearer ${partnerToken}`,
          },
          timeout: 30000, // 30 seconds timeout
          signal: abortControllerRef.current.signal,
        }
      );
      setSuccessMessage("Application submitted successfully.");
      resetFields();
    } catch (err) {
      // Handle different error types
      if (axios.isCancel(err)) {
        setError("Request was cancelled. Please try again.");
      } else if (err.code === 'ECONNABORTED') {
        setError("Request timeout. Please check your connection and try again.");
      } else if (err.response) {
        setError(
          err.response?.data?.message || err.message || "Something went wrong."
        );
        setValidationErrors(err.response?.data?.errors || []);
      } else if (err.request) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };



  const resetFields=()=>{
    setFormData({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    alternateContact: "",
    email: "",
    gender: "",
    motherName: "",
    maritalStatus: "",
    SpouseName: "",
    panNumber: "",

    // Address Information
    currentAddress: "",
    currentAddressPincode: "",
    currentAddressOwnRented: "",
    currentAddressStability: "",
    currentAddressLandmark: "",
    permanentAddress: "",
    permanentAddressPincode: "",
    permanentAddressOwnRented: "",
    permanentAddressStability: "",
    permanentAddressLandmark: "",

    // Business Information
    businessName: "",
    businessAddress: "",
    businessLandmark: "",
    businessVintage: "",

    // Documents
    aadharFront: null,
    aadharBack: null,
    panCard: null,
    addressProof: null,
    lightBill: null,
    utilityBill: null,
    rentAgreement: null,

    // Address Proof Checkboxes
    lightBillSelected: false,
    utilityBillSelected: false,
    rentAgreementSelected: false,
    shopPhoto: null,
    shopAct: null,
    udhyamAadhar: null,
    itr: null,
    gstNumber: "",
    gstDoc: null,
    bankStatementFile1: null,
    bankStatementFile2: null,
    businessOtherDocs: null,
    selfie: null,

    // Co-applicant (for female applicants)
    coApplicantAadharFront: null,
    coApplicantAadharBack: null,
    coApplicantPan: null,
    coApplicantMobile: "",
    coApplicantSelfie: null,

    // Legacy fields (keeping for compatibility)
    password: "",
    confirmPassword: "",
    fullName: "",
    dob: "",
    shopName: "",
    reference1Name: "",
    reference1Contact: "",
    reference2Name: "",
    reference2Contact: "",
    otherDocs: null,
    annualTurnover: "",
    })
    setCurrentStep(0);
    setMaxStep(0);
    setTouchedFields({});
    setShowClientValidation(false);
    setValidationErrors({});
    setError("");
    try {
      localStorage.removeItem(loanDraftStorageKey);
    } catch (e) {
      // ignore
    }
  }




  const checkFileSize = (files) => {
    const maxSize = 20 * 1024 * 1024; // 20 MB
  
    for (let fileObj of files) {
      if (fileObj?.file && fileObj.file.size > maxSize) {
        const type = fileObj.type;
        setError(`${type} file is too large. Maximum allowed size is 20MB.`);
        return false; // Return the type of the file that exceeded size
      }
    }
  
    return true; // All files are valid
  };

  const renderError = (field) => {
    return showClientValidation && touchedFields[field] && validationErrors[field] ? (
      <p className="text-red-500 text-sm mt-1">{validationErrors[field]}</p>
    ) : null;
  };
  const stepErrorCounts = steps.map((_, idx) =>
    idx <= 4 ? Object.keys(validateBusinessLoanStep(idx, formData)).length : 0
  );
  


  return (
    <div
      className={
        embed
          ? "py-4 px-0 sm:px-2"
          : "min-h-screen py-8 px-4"
      }
      style={{ backgroundColor: embed ? "transparent" : "#F8FAFC" }}
    >
      <DocumentPreviewModal
        url={documentModel}
        onClose={() => {
          if (documentModel && documentModel.startsWith("blob:")) {
            URL.revokeObjectURL(documentModel);
          }
          setdocumentModel(null);
        }}
      />
      <style>{`
        input[aria-invalid="true"], select[aria-invalid="true"], textarea[aria-invalid="true"] {
          border-color: #EF4444 !important;
        }
      `}</style>
      <div className="max-w-4xl mx-auto">
        {successMessage && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{successMessage}</p>
                {savedApplication?.appNo && (
                  <p className="text-sm mt-1">
                    Application ID: {savedApplication.appNo}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="text-sm underline"
                onClick={() => setSuccessMessage("")}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            <p className="font-semibold">
              {error}
            </p>
            {(() => {
              const messages = Array.isArray(validationErrors)
                ? validationErrors
                : Object.values(validationErrors || {});
              return messages.length > 0 ? (
                <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                  {messages.map((msg, idx) => (
                    <li key={idx}>{msg}</li>
                  ))}
                </ul>
              ) : null;
            })()}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div
            className="px-8 py-6 text-white"
            style={{ backgroundColor: "var(--color-brand-primary)" }}
          >
            <h1 className="text-3xl font-bold text-center">
              Business Loan Application
            </h1>
            <p className="text-center mt-2 opacity-90">
              Complete all fields to process your business loan application
            </p>
          </div>

          <div className="p-6 space-y-6">
            <LoanStepper
              steps={steps}
              currentStep={currentStep}
              maxStep={maxStep}
              loading={loading}
              stepErrorCounts={stepErrorCounts}
              helperText="Complete step-by-step. Your progress is saved on this device."
              onStepClick={(idx) => {
                setShowClientValidation(false);
                setError("");
                setCurrentStep(idx);
              }}
            />

            {/* Personal Information */}
            <section hidden={currentStep !== 0} id="loan-business-step-personal">
              <h2
                className="text-2xl font-semibold mb-6 flex items-center gap-3"
                style={{ color: "#111827" }}
              >
                <User className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                    placeholder="Enter your first name"
                    required
                    aria-invalid={
                      showClientValidation &&
                      touchedFields.firstName &&
                      validationErrors.firstName
                        ? "true"
                        : undefined
                    }
                  />
                   {renderError("firstName")}
                </div>
                {/* Middle Name */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                    placeholder="Enter your middle name"
                  />
                </div>
                {/* Last Name */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                    placeholder="Enter your last name"
                    required
                    aria-invalid={
                      showClientValidation &&
                      touchedFields.lastName &&
                      validationErrors.lastName
                        ? "true"
                        : undefined
                    }
                  />
                  {renderError("lastName")}
                </div>
                {/* Mother Name */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Mother Name *
                  </label>
                  <input
                    type="text"
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                    placeholder="Enter your mother's name"
                    required
                    aria-invalid={
                      showClientValidation &&
                      touchedFields.motherName &&
                      validationErrors.motherName
                        ? "true"
                        : undefined
                    }
                  />
                  {renderError("motherName")}
                </div>
                {/* PAN Number */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    PAN Number *
                  </label>
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                    placeholder="Enter your PAN number"
                    required
                    aria-invalid={
                      showClientValidation &&
                      touchedFields.panNumber &&
                      validationErrors.panNumber
                        ? "true"
                        : undefined
                    }
                  />
                   { renderError("panNumber")}
                </div>
                {/* Gender */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                    required
                    aria-invalid={
                      showClientValidation &&
                      touchedFields.gender &&
                      validationErrors.gender
                        ? "true"
                        : undefined
                    }
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {renderError("gender")}
                </div>
                {/* Marital Status */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Marital Status *
                  </label>
                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                    required
                    aria-invalid={
                      showClientValidation &&
                      touchedFields.maritalStatus &&
                      validationErrors.maritalStatus
                        ? "true"
                        : undefined
                    }
                  >
                    <option value="">Select Status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="other">Other</option>
                  </select>
                  {renderError("maritalStatus")}
                </div>
                {/* Password fields removed as not required here */}
                {/* Contact Number */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Contact Number *
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                      style={{ color: "var(--color-brand-primary)" }}
                    />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter your contact number"
                      required
                      aria-invalid={
                        showClientValidation &&
                        touchedFields.phone &&
                        validationErrors.phone
                          ? "true"
                          : undefined
                      }
                    />
                     {renderError("phone")}
                  </div>
                </div>
                {/* Alternate Contact */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Alternate Contact
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                      style={{ color: "var(--color-brand-primary)" }}
                    />
                    <input
                      type="tel"
                      name="alternateContact"
                      value={formData.alternateContact}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter alternate contact number"
                    />
                  </div>
                </div>
                {/* Email ID */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Email ID *
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                      style={{ color: "var(--color-brand-primary)" }}
                    />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter your email address"
                      required
                      aria-invalid={
                        showClientValidation &&
                        touchedFields.email &&
                        validationErrors.email
                          ? "true"
                          : undefined
                      }
                    />
                     { renderError("email")}
                  </div>
                </div>
                {/* Referral moved to end */}
                {/* Wife Name (conditional for married) */}
                {formData.maritalStatus === "married" && (
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Spouse Name *
                    </label>
                    <input
                      type="text"
                      name="SpouseName"
                      value={formData.SpouseName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter Spouse's name"
                      required
                      aria-invalid={
                        showClientValidation &&
                        touchedFields.SpouseName &&
                        validationErrors.SpouseName
                          ? "true"
                          : undefined
                      }
                    />
                    {renderError("SpouseName")}
                  </div>
                )}
              </div>
            </section>

            {/* Address Information */}

            <section hidden={currentStep !== 1} id="loan-business-step-address">
              <h2
                className="text-2xl font-semibold mb-6 flex items-center gap-3"
                style={{ color: "#111827" }}
              >
                <MapPin className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
                Address Information
              </h2>
              <div className="space-y-6">
                {/* Current Address */}
                <div
                  className="p-6 rounded-lg border-2"
                  style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
                >
                  <h3
                    className="text-lg font-semibold mb-4"
                    style={{ color: "#F59E0B" }}
                  >
                    Current Address
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Current Address *
                      </label>
                      <textarea
                        name="currentAddress"
                        value={formData.currentAddress}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors resize-none"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "white",
                        }}
                        rows="3"
                        placeholder="Enter your current address"
                        required
                      />
                       {formData.currentAddress ? "" : renderError("currentAddress")}
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Pincode *
                      </label>
                      <input
                        type="text"
                        name="currentAddressPincode"
                        value={formData.currentAddressPincode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "white",
                        }}
                        placeholder="Enter pincode"
                        required
                      />
                       {renderError("currentAddressPincode")}
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Own/Rented *
                      </label>
                      <select
                        name="currentAddressOwnRented"
                        value={formData.currentAddressOwnRented}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "white",
                        }}
                        required
                      >
                        <option value="">Select</option>
                        <option value="own">Own</option>
                        <option value="rented">Rented</option>
                      </select>
                      {formData.currentAddressOwnRented ? "" : renderError("currentAddressOwnRented")}
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Address Stability *
                      </label>
                      <input
                        type="text"
                        name="currentAddressStability"
                        value={formData.currentAddressStability}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "white",
                        }}
                        placeholder="e.g., 2 years"
                        required
                      />
                        {formData.currentAddressStability ? "" : renderError("currentAddressStability")}
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Landmark
                      </label>
                      <input
                        type="text"
                        name="currentAddressLandmark"
                        value={formData.currentAddressLandmark}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "white",
                        }}
                        placeholder="Enter nearby landmark"
                      />
                    </div>
                  </div>
                </div>

                {/* Same Address Checkbox */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="sameAddress"
                    checked={sameAddress}
                    onChange={handleSameAddressChange}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: "var(--color-brand-primary)" }}
                  />
                  <label
                    htmlFor="sameAddress"
                    className="text-sm font-medium"
                    style={{ color: "#111827" }}
                  >
                    Permanent address is same as current address
                  </label>
                </div>

                {/* Permanent Address */}
                <div
                  className="p-6 rounded-lg border-2"
                  style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
                >
                  <h3
                    className="text-lg font-semibold mb-4"
                    style={{ color: "#F59E0B" }}
                  >
                    Permanent Address
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Permanent Address *
                      </label>
                      <textarea
                        name="permanentAddress"
                        value={formData.permanentAddress}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors resize-none"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "white",
                        }}
                        rows="3"
                        placeholder="Enter your permanent address"
                        disabled={sameAddress}
                        required
                      />
                       { formData.permanentAddress ? "" : renderError("permanentAddress")}
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Pincode *
                      </label>
                      <input
                        type="text"
                        name="permanentAddressPincode"
                        value={formData.permanentAddressPincode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "white",
                        }}
                        placeholder="Enter pincode"
                        disabled={sameAddress}
                        required
                      />
                      {renderError("permanentAddressPincode")}
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Own/Rented *
                      </label>
                      <select
                        name="permanentAddressOwnRented"
                        value={formData.permanentAddressOwnRented}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "white",
                        }}
                        disabled={sameAddress}
                        required
                      >
                        <option value="">Select</option>
                        <option value="own">Own</option>
                        <option value="rented">Rented</option>
                      </select>
                      {formData.permanentAddressOwnRented ? "" : renderError("permanentAddressOwnRented")}
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Address Stability *
                      </label>
                      <input
                        type="text"
                        name="permanentAddressStability"
                        value={formData.permanentAddressStability}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "white",
                        }}
                        placeholder="e.g., 5 years"
                        disabled={sameAddress}
                        required
                      />
                       {formData.permanentAddressStability ? "" : renderError("permanentAddressStability")}
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Landmark
                      </label>
                      <input
                        type="text"
                        name="permanentAddressLandmark"
                        value={formData.permanentAddressLandmark}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "white",
                        }}
                        placeholder="Enter nearby landmark"
                        disabled={sameAddress}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section hidden={currentStep !== 2} id="loan-business-step-loan">
              <h2
                className="text-2xl font-semibold mb-6 flex items-center gap-3"
                style={{ color: "#111827" }}
              >
                <FileText className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
                Loan Amount Details
              </h2>
              <div className="space-y-6">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Requested Loan Amount (₹) *
                  </label>
                  <input
                    type="number"
                    name="loanAmount"
                    value={formData?.loanAmount ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        loanAmount: val === "" ? "" : parseInt(val, 10), // ensures integer
                      }));
                    }}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                    placeholder="Enter loan amount"
                    min="0"
                    required
                  />
                  {formData?.loanAmount ? "" : renderError("loanAmount")}
                </div>
              </div>
            </section>

            {/* Address Proof Selection */}
            <section hidden={currentStep !== 3} id="loan-business-step-documents">
              <h2
                className="text-2xl font-semibold mb-6 flex items-center gap-3"
                style={{ color: "#111827" }}
              >
                <FileText className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
                4.1 Address Proof Documents
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Accepted files: PDF, JPG, JPEG, PNG. Preview appears after upload.
              </p>
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-3 mb-2">
                    <input
                      type="checkbox"
                      name="lightBillSelected"
                      checked={formData.lightBillSelected}
                      onChange={(e) =>
                        handleProofCheckboxChange(
                          "lightBillSelected",
                          e.target.checked
                        )
                      }
                      className="w-5 h-5 rounded"
                      style={{ accentColor: "var(--color-brand-primary)" }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "#111827" }}
                    >
                      Light Bill
                    </span>
                  </label>
                  {formData.lightBillSelected && (
                    <>
                      <input
                        type="file"
                        name="lightBill"
                        onChange={handleFileChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      {renderPreviewLink("lightBill")}
                    </>
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-3 mb-2">
                    <input
                      type="checkbox"
                      name="utilityBillSelected"
                      checked={formData.utilityBillSelected}
                      onChange={(e) =>
                        handleProofCheckboxChange(
                          "utilityBillSelected",
                          e.target.checked
                        )
                      }
                      className="w-5 h-5 rounded"
                      style={{ accentColor: "var(--color-brand-primary)" }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "#111827" }}
                    >
                      Water / Gas / WiFi Bill
                    </span>
                  </label>
                  {formData.utilityBillSelected && (
                    <>
                      <input
                        type="file"
                        name="utilityBill"
                        onChange={handleFileChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      {renderPreviewLink("utilityBill")}
                    </>
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-3 mb-2">
                    <input
                      type="checkbox"
                      name="rentAgreementSelected"
                      checked={formData.rentAgreementSelected}
                      onChange={(e) =>
                        handleProofCheckboxChange(
                          "rentAgreementSelected",
                          e.target.checked
                        )
                      }
                      className="w-5 h-5 rounded"
                      style={{ accentColor: "var(--color-brand-primary)" }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "#111827" }}
                    >
                      Rent Agreement
                    </span>
                  </label>
                  {formData.rentAgreementSelected && (
                    <>
                      <input
                        type="file"
                        name="rentAgreement"
                        onChange={handleFileChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      {renderPreviewLink("rentAgreement")}
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Personal Document Upload */}
            <section hidden={currentStep !== 3} id="loan-business-step-documents-2">
              <h2
                className="text-2xl font-semibold mb-6 flex items-center gap-3"
                style={{ color: "#111827" }}
              >
                <FileText className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
                4.2 Personal Identity Documents
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Upload in order: Aadhaar Front, Aadhaar Back, PAN, Applicant Photo.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: "aadharFront", label: "Aadhar Front *", required: true },
                  { name: "aadharBack", label: "Aadhar Back *", required: true },
                  { name: "otherDocs", label: "Other Docs", required: false },
                  { name: "panCard", label: "PAN Card *", required: true },
                  { name: "selfie", label: "Upload Selfie *", required: true, accept: ".jpg,.jpeg,.png" },
                ].map((doc) => (
                  <DocumentUploadCard
                    key={doc.name}
                    name={doc.name}
                    label={doc.label}
                    file={formData[doc.name]}
                    accept={doc.accept || ".pdf,.jpg,.jpeg,.png"}
                    required={doc.required}
                    onChange={handleFileChange}
                    onRemove={handleFileRemove}
                    error={renderError(doc.name)}
                    onPreview={() => openDocumentPreview(formData[doc.name])}
                  />
                ))}
              </div>
            </section>

            {/* Co-applicant Section (for female applicants) */}
              {formData.gender === "female" && currentStep === 3 && (
                <section>
                <h2
                  className="text-2xl font-semibold mb-6 flex items-center gap-3"
                  style={{ color: "#111827" }}
                >
                  <Users className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
                  Co-applicant Information
                </h2>
                <div
                  className="p-6 rounded-lg border-2"
                  style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Co-applicant Aadhar Front *
                      </label>
                      <input
                        type="file"
                        name="coApplicantAadharFront"
                        onChange={handleFileChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "white",
                        }}
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                      />
                      { formData.coApplicantAadharFront ? "" : renderError("coApplicantAadharFront")}
                      {renderPreviewLink("coApplicantAadharFront")}
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Co-applicant Aadhar Back *
                      </label>
                      <input
                        type="file"
                        name="coApplicantAadharBack"
                        onChange={handleFileChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "white",
                        }}
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                      />
                           { formData.coApplicantAadharBack ? "" : renderError("coApplicantAadharBack")}
                      {renderPreviewLink("coApplicantAadharBack")}
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Co-applicant PAN Card *
                      </label>
                      <input
                        type="file"
                        name="coApplicantPan"
                        onChange={handleFileChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "white",
                        }}
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                      />
                        { formData.coApplicantPan ? "" : renderError("coApplicantPan")}
                      {renderPreviewLink("coApplicantPan")}
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Co-applicant Mobile Number *
                      </label>
                      <div className="relative">
                        <Phone
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                          style={{ color: "var(--color-brand-primary)" }}
                        />
                        <input
                          type="tel"
                          name="coApplicantMobile"
                          value={formData.coApplicantMobile}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                          style={{
                            borderColor: "var(--color-brand-primary)",
                            backgroundColor: "white",
                          }}
                          placeholder="Enter co-applicant mobile number"
                          required
                        />
                         { renderError("coApplicantMobile")}
                      </div>
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Co-applicant Selfie *
                      </label>
                      <input
                        type="file"
                        name="coApplicantSelfie"
                        onChange={handleFileChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "white",
                        }}
                        accept=".jpg,.jpeg,.png"
                        required
                      />
                        { formData.coApplicantSelfie ? "" : renderError("coApplicantSelfie")}
                      {renderPreviewLink("coApplicantSelfie")}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Business Information */}
            <section hidden={currentStep !== 2} id="loan-business-step-business">
              <h2
                className="text-2xl font-semibold mb-6 flex items-center gap-3"
                style={{ color: "#111827" }}
              >
                <Store className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
                Business Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Business Name *
                  </label>
                  <div className="relative">
                    <Building
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                      style={{ color: "var(--color-brand-primary)" }}
                    />
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter your business name"
                      required
                    />
                      {formData.businessName ? "" : renderError("businessName")}
                  </div>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Business Vintage (in years) *
                  </label>
                  <input
                    type="number"
                    name="businessVintage"
                    value={formData.businessVintage}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                    placeholder="Enter business vintage in years"
                    min="0"
                    required
                  />
                    { formData.businessVintage ? "" : renderError("businessVintage")}
                </div>
                <div className="md:col-span-2">
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Business Address *
                  </label>
                  <textarea
                    name="businessAddress"
                    value={formData.businessAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors resize-none"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                    rows="3"
                    placeholder="Enter your business address"
                    required
                  />
                    {formData.businessAddress ? "" : renderError("businessAddress")}
                </div>
                <div className="md:col-span-2">
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Business Landmark
                  </label>
                  <input
                    type="text"
                    name="businessLandmark"
                    value={formData.businessLandmark}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                    placeholder="Enter business landmark"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    GST Number{" "}
                    <span className="text-sm font-normal opacity-70">
                      (Optional)
                    </span>
                  </label>
                  <div className="relative">
                    <Receipt
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                      style={{ color: "var(--color-brand-primary)" }}
                    />
                    <input
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter GST number (if applicable)"
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Annual Turnover *
                  </label>
                  <div className="relative">
                    <span
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg"
                      style={{ color: "var(--color-brand-primary)" }}
                    >
                      ₹
                    </span>
                    <input
                      type="number"
                      name="annualTurnover"
                      value={formData.annualTurnover || ""}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter annual turnover in INR"
                      required
                    />
                      {formData.annualTurnover ? "" : renderError("annualTurnover")}
                  </div>
                </div>
              </div>
            </section>

            {/* Business Documents */}
            <section hidden={currentStep !== 3} id="loan-business-step-business-docs">
              <h2
                className="text-2xl font-semibold mb-6 flex items-center gap-3"
                style={{ color: "#111827" }}
              >
                <Shield className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
                4.3 Business Documents
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Keep business registrations and tax files clear and readable.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Shops and Establishment Act/Gumasta License *
                  </label>
                  <input
                    type="file"
                    name="shopAct"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                  />
                    {formData.shopAct ? "" : renderError("shopAct")}
                  {renderPreviewLink("shopAct")}
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Udhyam Aadhar *
                  </label>
                  <input
                    type="file"
                    name="udhyamAadhar"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                  />
                     { formData.udhyamAadhar ?  "" : renderError("udhyamAadhar")}
                  {renderPreviewLink("udhyamAadhar")}
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    ITR (Income Tax Return) *
                  </label>
                  <input
                    type="file"
                    name="itr"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                  />
                    { formData.itr ? "" : renderError("itr")}
                  {renderPreviewLink("itr")}
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    GST Document
                  </label>
                  <input
                    type="file"
                    name="gstDoc"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {renderPreviewLink("gstDoc")}
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Shop Photo *
                  </label>
                  <div className="relative">
                    <Camera
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                      style={{ color: "var(--color-brand-primary)" }}
                    />
                    <input
                      type="file"
                      name="shopPhoto"
                      onChange={handleFileChange}
                      className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      accept=".jpg,.jpeg,.png"
                      required
                    />
                       {formData.shopPhoto ? "" : renderError("shopPhoto")}
                  {renderPreviewLink("shopPhoto")}
                  </div>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Other Business Docs
                  </label>
                  <input
                    type="file"
                    name="businessOtherDocs"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {renderPreviewLink("businessOtherDocs")}
                </div>
              </div>
            </section>

            {/* Financial Documents */}
            <section hidden={currentStep !== 3} id="loan-business-step-fin-docs">
              <h2
                className="text-2xl font-semibold mb-6 flex items-center gap-3"
                style={{ color: "#111827" }}
              >
                <FileText className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
                4.4 Bank Documents
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Upload statements in sequence: Bank Statement 1, then Bank Statement 2.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Bank Statement (File 1) *
                  </label>
                  <input
                    type="file"
                    name="bankStatementFile1"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                  />
                  <p
                    className="text-sm mt-2"
                    style={{ color: "#111827", opacity: 0.7 }}
                  >
                    Upload last 12 months bank statement
                  </p>
                  { formData.bankStatementFile1 ? "" : renderError("bankStatementFile1")}
                  {renderPreviewLink("bankStatementFile1")}
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Bank Statement (File 2)
                  </label>
                  <input
                    type="file"
                    name="bankStatementFile2"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {renderPreviewLink("bankStatementFile2")}
                </div>
              </div>
            </section>

            {/* References */}
            <section hidden={currentStep !== 4} id="loan-business-step-references">
              <h2
                className="text-2xl font-semibold mb-6 flex items-center gap-3"
                style={{ color: "#111827" }}
              >
                <Users className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
                References
              </h2>
              <div className="space-y-6">
                <div
                  className="p-6 rounded-lg border-2"
                  style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
                >
                  <h3
                    className="text-lg font-semibold mb-4"
                    style={{ color: "#F59E0B" }}
                  >
                    Reference 1
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Name *
                      </label>
                      <input
                        type="text"
                        name="reference1Name"
                        value={formData.reference1Name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "white",
                        }}
                        placeholder="Enter reference name"
                        required
                      />
                      { formData.reference1Name ? "" : renderError("reference1Name")}
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Contact Number *
                      </label>
                      <div className="relative">
                        <Phone
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                          style={{ color: "var(--color-brand-primary)" }}
                        />
                        <input
                          type="tel"
                          name="reference1Contact"
                          value={formData.reference1Contact}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                          style={{
                            borderColor: "var(--color-brand-primary)",
                            backgroundColor: "white",
                          }}
                          placeholder="Enter contact number"
                          required
                        />
                        {renderError("reference1Contact")}
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="p-6 rounded-lg border-2"
                  style={{ borderColor: "var(--color-brand-primary)", backgroundColor: "#F8FAFC" }}
                >
                  <h3
                    className="text-lg font-semibold mb-4"
                    style={{ color: "#F59E0B" }}
                  >
                    Reference 2
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Name *
                      </label>
                      <input
                        type="text"
                        name="reference2Name"
                        value={formData.reference2Name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "white",
                        }}
                        placeholder="Enter reference name"
                        required
                      />
                           {formData.reference2Name ? "" : renderError("reference2Name")}
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Contact Number *
                      </label>
                      <div className="relative">
                        <Phone
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                          style={{ color: "var(--color-brand-primary)" }}
                        />
                        <input
                          type="tel"
                          name="reference2Contact"
                          value={formData.reference2Contact}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                          style={{
                            borderColor: "var(--color-brand-primary)",
                            backgroundColor: "white",
                          }}
                          placeholder="Enter contact number"
                          required
                        />
                         {renderError("reference2Contact")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Partner Referral — public applicants only; section kept for step anchor */}
            <section hidden={currentStep !== 5} id="loan-business-step-review">
              {!isPartnerLoggedIn && (
                <>
                  <h2
                    className="text-2xl font-semibold mb-6 flex items-center gap-3"
                    style={{ color: "#111827" }}
                  >
                    <FileText className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
                    Partner Referral
                  </h2>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: "#111827" }}
                      >
                        Partner Referral Code (optional) - use {defaultReferralCode} if you don&apos;t have a partner code
                      </label>
                      <input
                        type="text"
                        name="partnerReferralCode"
                        value={formData.partnerReferralCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        placeholder="Enter partner code"
                      />
                    </div>
                  </div>
                </>
              )}
            </section>

            {/* Submit + Wizard Navigation */}
            <div className="pt-8">
              {currentStep === steps.length - 1 && successMessage && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
                  <p className="font-semibold">{successMessage}</p>
                  {savedApplication?.appNo && (
                    <p className="text-sm mt-1">
                      Application ID: {savedApplication.appNo}
                    </p>
                  )}
                </div>
              )}

              {currentStep === steps.length - 1 && error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
                  <p className="font-semibold">{error}</p>
                  {validationErrors &&
                    typeof validationErrors === "object" &&
                    !Array.isArray(validationErrors) &&
                    Object.keys(validationErrors).length > 0 && (
                      <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                        {Object.values(validationErrors).map((msg, idx) => (
                          <li key={idx}>{msg}</li>
                        ))}
                      </ul>
                    )}
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === 0) return;
                    setShowClientValidation(false);
                    setError("");
                    const next = currentStep - 1;
                    setCurrentStep(next);
                    requestAnimationFrame(() => {
                      const el = document.querySelector(`[name="${stepFirstFieldName[next]}"]`);
                      if (el && typeof el.focus === "function") el.focus();
                    });
                  }}
                  className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                  disabled={loading || currentStep === 0}
                >
                  Back
                </button>

                {currentStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowClientValidation(true);
                      setError("");
                      const stepErrors = validateBusinessLoanStep(currentStep, formData);
                      setValidationErrors(stepErrors);
                      setTouchedFields(Object.fromEntries(Object.keys(stepErrors).map((k) => [k, true])));

                      if (Object.keys(stepErrors).length > 0) {
                        setError("Please fix the highlighted fields to continue.");
                        scrollToFirstError(stepErrors);
                        return;
                      }

                      const nextStep = currentStep + 1;
                      setCurrentStep(nextStep);
                      setMaxStep((m) => Math.max(m, nextStep));
                      requestAnimationFrame(() => {
                        const el = document.querySelector(`[name="${stepFirstFieldName[nextStep]}"]`);
                        if (el && typeof el.focus === "function") el.focus();
                      });
                    }}
                    className="px-8 py-3 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.01] transition-all duration-200"
                    style={{ backgroundColor: "var(--color-brand-primary)" }}
                    disabled={loading}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-12 py-4 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.01] transition-all duration-200"
                    style={{ backgroundColor: "var(--color-brand-primary)" }}
                    disabled={loading || Object.keys(validateBusinessLoanAll(formData)).length > 0}
                  >
                    {loading ? "Saving..." : "Submit Loan"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
