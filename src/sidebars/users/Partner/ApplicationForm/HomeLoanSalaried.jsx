import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  Building,
  Briefcase,
  Users,
  Home,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

import axios from "axios";
import toast from "react-hot-toast";
import { z } from "zod";

import { getAuthData } from "../../../../utils/localStorage";
import { backendurl } from "../../../../feature/urldata";
import LoanStepper from "../../../../components/loan/LoanStepper";
import DocumentUploadCard from "../../../../components/loan/DocumentUploadCard";
import DocumentPreviewModal from "../../../../components/loan/DocumentPreviewModal";

export default function HomeLoanSalaried() {
  const [documentModel, setdocumentModel] = useState(null);

  const defaultReferralCode = 'PT-D4CTD8B2'
  const { partnerToken } = getAuthData();
  const isPartnerLoggedIn = Boolean(partnerToken);

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    officialEmail: "",
    stabilityOfResidency: "",
    currentHouseStatus: "",
    currentLandmark: "",
    permanentHouseStatus: "",
    permanentLandmark: "",
    permanentStability: "",
    currentAddressPinCode: "",
    permanentAddressPinCode: "",
    maritalStatus: "",
    wifeName: "",
    motherName: "",

    selfie: "",
    contactNo: "",
    email: "",
    dob: "",
    pan: "",
    currentAddress: "",
    permanentAddress: "",
    addressProofType: "",
    addressProof: "",
    utilityBill: "",
    rentAgreement: "",
    otherDocument: "",
    aadhar: "",
    companyName: "",
    designation: "",
    companyAddress: "",
    monthlySalary: "",

    // Employeement information
    totalExperience: "",
    currentExperience: "",
    salaryInHand: "",
    companyIdCard: "",
    salarySlip1: "",
    salarySlip2: "",
    salarySlip3: "",
    form16_26as: "",


    salarySlip: "",
    bankStatement: "",
    photoCopy: "",
    propertyType: "",
    reference1Name: "",
    reference1Contact: "",
    reference2Name: "",
    reference2Contact: "",
    loanAmount: "",

    // New property documents
    allotmentLetter: "",
    newPropertyPaymentReceipts: "",

    // Resale property documents
    titleDeeds: "",
    resalePaymentReceipts: "",
    agreementCopy: "",

    // Document
    aadharFront: "",
    aadharBack: "",
    panCard: "",
    passportPhoto: "",


    bankStatement1: "",
    bankStatement2: "",
    bankStatement3: "",

    // New address proofs
    newAddressProofs: "",

    password: "",
    confirmPassword: "",
    partnerReferralCode: "",
  });

  const [sameAddress, setSameAddress] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [savedApplication, setSavedApplication] = useState(null);
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });
  const abortControllerRef = useRef(null);
  const objectUrlsRef = useRef([]); // Store all created object URLs

  const loanDraftStorageKey = "trustline.homeLoanSalariedDraft.v1";
  const steps = ["Personal", "Address", "Loan & Employment", "Documents", "References", "Review"];
  const [currentStep, setCurrentStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);

  const stepFirstFieldName = [
    "firstName",
    "currentAddress",
    "loanAmount",
    "aadharFront",
    "reference1Name",
    "partnerReferralCode",
  ];

  // Cleanup function to cancel pending requests and revoke object URLs
  useEffect(() => {
    return () => {
      // Cancel pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Revoke all object URLs to prevent memory leaks
      objectUrlsRef.current.forEach(url => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
      objectUrlsRef.current = [];
      // Close document modal if open
      if (documentModel) {
        setdocumentModel(null);
      }
    };
  }, []);

  useEffect(() => {
    if (successMessage) toast.success(successMessage);
  }, [successMessage]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const serializeDraftFormData = (data) => {
    const copy = { ...data };
    for (const key of Object.keys(copy)) {
      const v = copy[key];
      if (v instanceof File) copy[key] = null;
    }
    return copy;
  };

  // Load draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(loanDraftStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.formData) setFormData((prev) => ({ ...prev, ...parsed.formData }));
      if (typeof parsed?.currentStep === "number") {
        setCurrentStep(Math.max(0, Math.min(parsed.currentStep, steps.length - 1)));
      }
      if (typeof parsed?.maxStep === "number") {
        setMaxStep(Math.max(0, Math.min(parsed.maxStep, steps.length - 1)));
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist draft
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
        // ignore
      }
    }, 400);
    return () => clearTimeout(t);
  }, [currentStep, maxStep, formData]);

  const scrollToFirstError = (errorMap) => {
    const keys = Object.keys(errorMap || {});
    if (keys.length === 0) return;
    const firstKey = keys[0];
    const el = document.querySelector(`[name="${firstKey}"]`);
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      if (typeof el.focus === "function") el.focus();
    }
  };

  const phoneSchema = z.string().trim().regex(/^\d{10}$/, "Phone number must be exactly 10 digits.");
  const emailSchema = z.string().trim().email("Invalid email format.");
  const pinSchema = z.string().trim().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code.");
  const panSchema = z
    .string()
    .trim()
    .regex(/^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/, "Enter a valid PAN card number (e.g., ABCDE1234F).")
    .transform((s) => s.toUpperCase());

  const min3 = (msg) => z.string().trim().min(3, msg);

  function validateHomeLoanSalariedStep(stepIndex) {
    const fullErrors = validateRegistrationForm(formData, sameAddress);

    const stepFields = (() => {
      if (stepIndex === 0) {
        return ["firstName", "middleName", "lastName", "motherName", "gender", "maritalStatus", "password", "confirmPassword", "contactNo", "email", "dob", "pan"];
      }
      if (stepIndex === 1) {
        return ["currentAddress", "stabilityOfResidency", "currentLandmark", "currentHouseStatus", "currentAddressPinCode", "permanentAddress", "permanentStability", "permanentLandmark", "permanentHouseStatus", "permanentAddressPinCode"];
      }
      if (stepIndex === 2) {
        return ["loanAmount", "companyName", "designation", "companyAddress", "monthlySalary", "totalExperience", "currentExperience", "salaryInHand", "companyIdCard", "salarySlip1", "salarySlip2", "salarySlip3", "form16_26as"];
      }
      if (stepIndex === 3) {
        return ["aadharFront", "aadharBack", "panCard", "passportPhoto", "selfie", "newAddressProofs", "bankStatement1", "bankStatement2"];
      }
      if (stepIndex === 4) {
        return ["reference1Name", "reference1Contact", "reference2Name", "reference2Contact"];
      }
      return [];
    })();

    const errors = {};
    for (const key of stepFields) {
      if (fullErrors[key]) errors[key] = fullErrors[key];
    }

    // Zod overlays for fintech-level niceties (names + patterns)
    if (stepIndex === 0) {
      const rFirst = min3("First name must be at least 3 characters.").safeParse(formData.firstName);
      if (!rFirst.success) errors.firstName = rFirst.error.issues[0].message;

      const rLast = min3("Last name must be at least 3 characters.").safeParse(formData.lastName);
      if (!rLast.success) errors.lastName = rLast.error.issues[0].message;

      const rMother = min3("Mother name must be at least 3 characters.").safeParse(formData.motherName);
      if (!rMother.success) errors.motherName = rMother.error.issues[0].message;

      const rPhone = phoneSchema.safeParse(formData.contactNo);
      if (!rPhone.success) errors.contactNo = rPhone.error.issues[0].message;

      const rEmail = emailSchema.safeParse(formData.email);
      if (!rEmail.success) errors.email = rEmail.error.issues[0].message;

      const rPan = panSchema.safeParse(formData.pan);
      if (!rPan.success) errors.pan = rPan.error.issues[0].message;
    }

    if (stepIndex === 1) {
      const rPin = pinSchema.safeParse(formData.currentAddressPinCode);
      if (!rPin.success) errors.currentAddressPinCode = rPin.error.issues[0].message;
      const rPermPin = pinSchema.safeParse(formData.permanentAddressPinCode);
      if (!rPermPin.success) errors.permanentAddressPinCode = rPermPin.error.issues[0].message;
    }

    return errors;
  }
  const stepErrorCounts = steps.map((_, idx) =>
    idx <= 4 ? Object.keys(validateHomeLoanSalariedStep(idx)).length : 0
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
  
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "loanAmount"
          ? value === ""      // if empty, keep empty string
            ? ""
            : parseInt(value, 10)
          : value,
    }));
  
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };
  

  const handleFileChange = (e) => {
    const { name, files } = e.target;
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
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    }
  };

  // const handleFileChangeAddressProofs = (e) => {
  //   const { name, files } = e.target;
  //   if (files && files.length > 0) {
  //     setFormData((prev) => ({
  //       ...prev,
  //       [name]: files[0], // now this updates newAddressProofs
  //     }));
  //   }
  // };

  const handleFileChangeAddressProofs = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setFormData((prev) => ({
      ...prev,
      newAddressProofs: file,   // <-- FIXED
    }));

    // OPTIONAL: clear validation error
    setError((prev) => ({
      ...prev,
      newAddressProofs: "",
    }));
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


  const handleSameAddressChange = (e) => {
    const checked = e.target.checked;
    setSameAddress(checked);

    if (checked) {
      setFormData((prev) => ({
        ...prev,
        permanentAddress: prev.currentAddress,
        permanentHouseStatus: prev.currentHouseStatus,
        permanentLandmark: prev.currentLandmark,
        permanentAddressPinCode: prev.currentAddressPinCode,
        permanentStability: prev.stabilityOfResidency,
      }));

      // ✅ Clear previous permanent field errors
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.permanentAddress;
        delete newErrors.permanentHouseStatus;
        delete newErrors.permanentLandmark;
        delete newErrors.permanentAddressPinCode;
        delete newErrors.permanentStability;
        return newErrors;
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        permanentAddress: "",
        permanentHouseStatus: "",
        permanentLandmark: "",
        permanentAddressPinCode: "",
        permanentStability: "",
      }));
    }
  };


  const renderError = (field) =>
    fieldErrors[field] ? (
      <p className="text-xs text-red-600 mt-1">{fieldErrors[field]}</p>
    ) : null;

  function validateRegistrationForm(formData, sameAddress) {
    const errors = {};

    // Personal fields
    if (!formData.firstName) errors.firstName = "First name is required.";
    if (!formData.middleName) errors.middleName = "Middle name is required";
    if (!formData.lastName) errors.lastName = "Last name is required.";
    if (!formData.motherName) errors.motherName = "Mother's name is required.";
    // if (!formData.pan) errors.pan = "PAN number is required.";
    if (!formData.gender) errors.gender = "Gender is required.";
    if (!formData.maritalStatus) errors.maritalStatus = "Marital status is required.";

    if (!formData.password) errors.password = "Password is required.";
    if (!formData.confirmPassword) errors.confirmPassword = "Confirm Password is required.";
    if (
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      errors.confirmPassword = "Passwords do not match.";
    }

    // Contact info
    if (!formData.contactNo) {
      errors.contactNo = "Contact number is required.";
    } else if (!/^\d{10}$/.test(formData.contactNo)) {
      errors.contactNo = "Contact number must be exactly 10 digits.";
    }

    if (!formData.email) {
      errors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = "Invalid email format.";
    }

    if (!formData.dob) {
      errors.dob = "Date of Birth is required.";
    } else if (getAgeFromDOB(formData.dob) < 18) {
      errors.dob = "You must be at least 18 years old to proceed.";
    }

    // Address Validation
    if (!formData.currentAddress)
      errors.currentAddress = "Current address is required.";

    if (!formData.stabilityOfResidency)
      errors.stabilityOfResidency = "Stability of residency is required.";

    if (!formData.currentLandmark)
      errors.currentLandmark = "Current landmark is required.";

    if (!formData.currentHouseStatus)
      errors.currentHouseStatus = "Current house status is required.";

    // Current Address Pin Code Validation

    const pin = formData.currentAddressPinCode?.trim();

    if (!pin) {
      errors.currentAddressPinCode = "Current Address Pin is required.";
    } else if (!/^[1-9][0-9]{5}$/.test(pin)) {
      errors.currentAddressPinCode = "Enter a valid 6-digit PIN code.";
    }

    // Permanent Address — YOU WANT THESE ALWAYS VALIDATED
    if (!sameAddress) {
      if (!formData.permanentAddress)
        errors.permanentAddress = "Permanent address is required.";

      if (!formData.permanentStability)
        errors.permanentStability = "Permanent stability of residency is required.";

      if (!formData.permanentLandmark)
        errors.permanentLandmark = "Permanent landmark is required.";

      if (!formData.permanentHouseStatus)
        errors.permanentHouseStatus = "Permanent house status is required.";

      // Permanent Address Pin Code Validation
      const permanentPin = formData.permanentAddressPinCode?.trim();

      if (!permanentPin) {
        errors.permanentAddressPinCode = "Permanent Address Pin is required.";
      } else if (!/^[1-9][0-9]{5}$/.test(permanentPin)) {
        errors.permanentAddressPinCode = "Enter a valid 6-digit PIN code.";
      }

    }
    // Document

    if (!formData.aadharFront) errors.aadharFront = "Aadhar Front is required";
    if (!formData.aadharBack) errors.aadharBack = "Aadhar Back is required";

    // PAN Card validation
    if (!formData.pan) {
      errors.pan = "PAN Card is required";
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(formData.pan).toUpperCase())) {
      errors.pan = "Enter a valid PAN Card number (e.g., ABCDE1234F)";
    }

    if (!formData.passportPhoto && !formData.selfie) {
      errors.passportPhoto = "Applicant photo is required";
    }

    // New Address Proof Validation
    if (!formData.newAddressProofs) {
      errors.newAddressProofs = "At least one address proof document is required.";
    }


    // Employment
    if (!formData.companyName) errors.companyName = "Company name is required.";
    if (!formData.designation) errors.designation = "Designation is required.";
    if (!formData.companyAddress) errors.companyAddress = "Company address is required.";
    if (!formData.monthlySalary) errors.monthlySalary = "Monthly salary is required.";
    if (!formData.totalExperience) errors.totalExperience = "Total Experience is required";
    if (!formData.currentExperience) errors.currentExperience = "Current Experience is required";
    if (!formData.salaryInHand) errors.salaryInHand = "Salary in hand is required";
    if (!formData.companyIdCard) errors.companyIdCard = "Company Id card is required";
    if (!formData.salarySlip1) errors.salarySlip1 = "Salary slip 1 is required";
    if (!formData.salarySlip2) errors.salarySlip2 = "Salary slip 2 is required";
    if (!formData.salarySlip3) errors.salarySlip3 = "Salary slip 3 is required";
    if (!formData.form16_26as) errors.form16_26as = "Form 16 / 26AS is required";

    // Reference 1
    if (!formData.reference1Name)
      errors.reference1Name = "Reference 1 name is required.";

    if (!formData.reference1Contact) {
      errors.reference1Contact = "Reference 1 contact is required.";
    } else if (!/^\d{10}$/.test(formData.reference1Contact)) {
      errors.reference1Contact = "Reference 1 contact must be exactly 10 digits.";
    }

    // Reference 2
    if (!formData.reference2Name)
      errors.reference2Name = "Reference 2 name is required.";

    if (!formData.reference2Contact) {
      errors.reference2Contact = "Reference 2 contact is required.";
    } else if (!/^\d{10}$/.test(formData.reference2Contact)) {
      errors.reference2Contact = "Reference 2 contact must be exactly 10 digits.";
    }

    if (
      formData.reference1Contact &&
      formData.reference2Contact &&
      formData.reference1Contact === formData.reference2Contact
    ) {
      errors.reference2Contact = "Reference 2 contact cannot be same as Reference 1 contact.";
    }

    if (!formData.loanAmount || formData.loanAmount < 5000 || formData.loanAmount > 5000000) {
      errors.loanAmount = "Loan amount must be between ₹5,000 and ₹50,00,000.";
    }
    

    if (!formData.bankStatement1) errors.bankStatement1 = "Bank Statement 1 is required.";
    if (!formData.bankStatement2) errors.bankStatement2 = "Bank Statement 2 is required.";

    return errors;
  }

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    setFieldErrors({});
    setValidationErrors([]);
    setSuccessMessage("");
    setSavedApplication(null);

    try {
      const errors = validateRegistrationForm(formData);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setValidationErrors(Object.values(errors));
        setLoading(false);
        return;
      }

      // ✅ Prepare JSON structure
      const applicationData = {
        loanType: "HOME_LOAN_SALARIED",
        partnerReferralCode: isPartnerLoggedIn
          ? undefined
          : formData.partnerReferralCode?.trim() || undefined,
        customer: {
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName || formData.surname,
          email: formData.email,
          officialEmail: formData.officialEmail,
          phone: formData.contactNo,
          mothersName: formData.motherName,
          panNumber: formData.pan,
          dateOfBirth: formData.dob,
          gender: formData.gender,
          maritalStatus: formData.maritalStatus,
          spouseName: formData.wifeName,
          currentAddress: formData.currentAddress,
          currentAddressLandmark: formData.currentLandmark,
          currentAddressPinCode: formData.currentAddressPinCode,
          currentAddressHouseStatus: formData.currentHouseStatus,
          permanentAddress: formData.permanentAddress,
          permanentAddressLandmark: formData.permanentLandmark,
          permanentAddressPinCode: formData.permanentAddressPinCode,
          permanentAddressHouseStatus: formData.permanentHouseStatus,
          stabilityOfResidency: formData.stabilityOfResidency,
          permanentAddressStability: formData.permanentStability,
          loanAmount: formData.loanAmount || 0,
          password: formData.password,
        },
        product: {
          companyName: formData.companyName,
          designation: formData.designation,
          companyAddress: formData.companyAddress,
          monthlySalary: formData.monthlySalary,
          totalExperience: formData.totalExperience,
          currentExperience: formData.currentExperience,
          salaryInHand: formData.salaryInHand,
        },
        references: [
          { name: formData.reference1Name, phone: formData.reference1Contact },
          { name: formData.reference2Name, phone: formData.reference2Contact },
        ],
        docs: [], // files will be appended separately
        propertyType: formData.propertyType,
      };

      // ✅ Prepare FormData
      const formDataToSend = new FormData();
      formDataToSend.append("data", JSON.stringify(applicationData));

      // Append files
      const applicantPhoto = formData.passportPhoto || formData.selfie;
      const docsQueue = [
        { file: formData.aadharFront, type: "AADHAR_FRONT" },
        { file: formData.aadharBack, type: "AADHAR_BACK" },
        { file: formData.panCard, type: "PAN" },
        { file: applicantPhoto, type: "PHOTO" },
        { file: formData.addressProof, type: "ADDRESS_PROOF" },
        {
          file: formData.otherDocument || formData.utilityBill || formData.rentAgreement,
          type: "OTHER_DOCS",
        },
        { file: formData.companyIdCard, type: "COMPANY_ID_CARD" },
        { file: formData.salarySlip1, type: "SALARY_SLIP_1" },
        { file: formData.salarySlip2, type: "SALARY_SLIP_2" },
        { file: formData.salarySlip3, type: "SALARY_SLIP_3" },
        { file: formData.form16_26as, type: "FORM_16_26AS" },
        { file: formData.bankStatement1, type: "BANK_STATEMENT_1" },
        { file: formData.bankStatement2, type: "BANK_STATEMENT_2" },
        { file: formData.allotmentLetter, type: "ALLOTMENT_LETTER" },
        {
          file: formData.newPropertyPaymentReceipts,
          type: "NEW_PROPERTY_PAYMENT_RECEIPTS",
        },
        { file: formData.titleDeeds, type: "TITLE_DEEDS" },
        {
          file: formData.resalePaymentReceipts,
          type: "RESALE_PAYMENT_RECEIPTS",
        },
        { file: formData.agreementCopy, type: "AGREEMENT_COPY" },
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

      // ✅ Send FormData to backend
      const endpoint = isPartnerLoggedIn
        ? `${backendurl}/partner/create-applications`
        : `${backendurl}/partner/public/create-application`;

      const headers = isPartnerLoggedIn
        ? {
          Authorization: `Bearer ${partnerToken}`,
          "Content-Type": "multipart/form-data",
        }
        : {
          "Content-Type": "multipart/form-data",
        };

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
    } catch (error) {
      console.error(error);
      
      // Handle different error types
      if (axios.isCancel(error)) {
        setError("Request was cancelled. Please try again.");
      } else if (error.code === "ECONNABORTED") {
        setError("Request timeout. Please check your connection and try again.");
      } else if (error.response) {
        const backendMessage = error.response?.data?.message;
        const backendError = error.response?.data?.error || "";

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
          // Server responded with error status
          setError(
            backendMessage || "Failed to save application. Try again."
          );
          setValidationErrors(error.response?.data?.errors || []);
        }
      } else if (error.request) {
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

  function getAgeFromDOB(dobString) {
    if (!dobString) return null; // handle empty or invalid input

    const dob = new Date(dobString);
    if (isNaN(dob)) return null; // handle invalid date format

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const dayDiff = today.getDate() - dob.getDate();

    // If birthday hasn't occurred yet this year, subtract one
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    return age;
  }

  const resetFields = () => {
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      gender: "",
      officialEmail: "",
      stabilityOfResidency: "",
      currentHouseStatus: "",
      currentLandmark: "",
      permanentHouseStatus: "",
      permanentLandmark: "",
      permanentStability: "",
      currentAddressPinCode: "",
      permanentAddressPinCode: "",
      maritalStatus: "",
      wifeName: "",
      motherName: "",
      companyIdCard: "",
      selfie: "",
      contactNo: "",
      email: "",
      dob: "",
      pan: "",
      currentAddress: "",
      permanentAddress: "",
      addressProofType: "",
      addressProof: "",
      utilityBill: "",
      rentAgreement: "",
      otherDocument: "",
      aadhar: "",
      companyName: "",
      designation: "",
      companyAddress: "",
      monthlySalary: "",
      totalExperience: "",
      currentExperience: "",
      salarySlip: "",
      bankStatement: "",
      photoCopy: "",
      propertyType: "",
      reference1Name: "",
      reference1Contact: "",
      reference2Name: "",
      reference2Contact: "",
      loanAmount: "",

      // New property documents
      allotmentLetter: "",
      newPropertyPaymentReceipts: "",

      // Resale property documents
      titleDeeds: "",
      resalePaymentReceipts: "",
      agreementCopy: "",
      aadharFront: "",
      aadharBack: "",
      panCard: "",
      salarySlip1: "",
      salarySlip2: "",
      salarySlip3: "",
      salaryInHand: "",
      bankStatement1: "",
      bankStatement2: "",
      bankStatement3: "",

      // New address proofs
      newAddressProofs: "",

      password: "",
      confirmPassword: "",
    });
    setCurrentStep(0);
    setMaxStep(0);
    setFieldErrors({});
    setValidationErrors([]);
    setError("");
    try {
      localStorage.removeItem(loanDraftStorageKey);
    } catch (e) {
      // ignore
    }
  };

  const checkFileSize = (files) => {
    const maxSize = 20 * 1024 * 1024; // 20 MB

    for (let fileObj of files) {
      if (fileObj?.file && fileObj.file.size > maxSize) {
        const type = fileObj.type;
        setError(
          `${type} file is too large. Maximum allowed size is 20MB.`
        );
        return false; // Return the type of the file that exceeded size
      }
    }

    return true; // All files are valid
  };

  return (
    <>
      <DocumentPreviewModal
        url={documentModel}
        onClose={() => {
          if (documentModel && documentModel.startsWith("blob:")) {
            URL.revokeObjectURL(documentModel);
            objectUrlsRef.current = objectUrlsRef.current.filter(
              (url) => url !== documentModel
            );
          }
          setdocumentModel(null);
        }}
      />

      <div
        className="min-h-screen py-8 px-0 sm:px-4"
        style={{ backgroundColor: "#F8FAFC" }}
      >
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

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div
              className="px-8 py-6 text-white"
              style={{ backgroundColor: "var(--color-brand-primary)" }}
            >
              <h1 className="text-3xl font-bold text-center">
                Home Loan Application (Salaried)
              </h1>
              <p className="text-center mt-2 opacity-90">
                Complete all fields to process your loan application
              </p>
            </div>

            <div className="p-6 space-y-6">
              <LoanStepper
                steps={steps}
                currentStep={currentStep}
                maxStep={maxStep}
                loading={loading}
                stepErrorCounts={stepErrorCounts}
                helperText="Step-by-step wizard. Draft is saved locally (text fields only)."
                onStepClick={(idx) => {
                  setCurrentStep(idx);
                }}
              />

              {/* Personal Information */}
              <section hidden={currentStep !== 0}>
                <h2
                  className="text-2xl font-semibold mb-6 flex items-center gap-3"
                  style={{ color: "#111827" }}
                >
                  <User className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* name */}
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
                    />
                    {renderError("firstName")}
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Middle Name *
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
                      required
                    />
                    {renderError("middleName")}
                  </div>
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
                    />
                    {renderError("lastName")}
                  </div>
                  {/* name end */}
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
                        name="contactNo"
                        value={formData.contactNo}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        placeholder="Enter your contact number"
                        required
                      />
                    </div>
                    {renderError("contactNo")}
                  </div>
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
                      />
                    </div>
                    {renderError("email")}
                  </div>
                  {/* Referral moved to end */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      PAN NO *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="pan"
                        value={formData.pan}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        placeholder="Enter pan number"
                        required
                      />


                    </div>
                    {formData.pan ? "" : renderError("pan")}
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Date of Birth *
                    </label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                        style={{ color: "var(--color-brand-primary)" }}
                      />
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        required
                      />
                    </div>
                    {renderError("dob")}
                  </div>
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
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>

                    {renderError("gender")}
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Official Email (Company)
                    </label>
                    <input
                      type="email"
                      name="officialEmail"
                      value={formData.officialEmail}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter your official email"
                      required
                    />
                  </div>

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
                    >
                      <option value="">Select status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                    </select>

                    {renderError("maritalStatus")}
                  </div>
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
                        name="wifeName"
                        value={formData.wifeName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        placeholder="Enter spouse name"
                        required
                      />
                    </div>
                  )}
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
                      placeholder="Enter mother name"
                      required
                    />
                    {renderError("motherName")}
                  </div>
                </div>
              </section>

              {/* Address Information */}
              <section hidden={currentStep !== 1}>
                <h2
                  className="text-2xl font-semibold mb-6 flex items-center gap-3"
                  style={{ color: "#111827" }}
                >
                  <MapPin className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
                  Address Information
                </h2>
                <div className="space-y-6">
                  <div>
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
                        backgroundColor: "#F8FAFC",
                      }}
                      rows="3"
                      placeholder="Enter your current address"
                      required
                    />
                    {renderError("currentAddress")}
                  </div>

                  <div className="flex flex-wrap -mx-2">
                    {/* Left Column */}
                    <div className="w-full md:w-1/2 px-2">
                      <div className="mb-4">
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: "#111827" }}
                        >
                          Stability of Residency *
                        </label>
                        <input
                          type="text"
                          name="stabilityOfResidency"
                          value={formData.stabilityOfResidency}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                          style={{
                            borderColor: "var(--color-brand-primary)",
                            backgroundColor: "#F8FAFC",
                          }}
                          placeholder="Enter stability of residency"
                          required
                        />
                        {renderError("stabilityOfResidency")}
                      </div>

                      <div className="mb-4">
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: "#111827" }}
                        >
                          Current House Status (Rented/Own) *
                        </label>
                        <select
                          name="currentHouseStatus"
                          value={formData.currentHouseStatus}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                          style={{
                            borderColor: "var(--color-brand-primary)",
                            backgroundColor: "#F8FAFC",
                          }}
                          required
                        >
                          <option value="">Select status</option>
                          <option value="rented">Rented</option>
                          <option value="own">Own</option>
                        </select>

                        {renderError("currentHouseStatus")}
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="w-full md:w-1/2 px-2">
                      <div className="mb-4">
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: "#111827" }}
                        >
                          Landmark (Current Address) *
                        </label>
                        <input
                          type="text"
                          name="currentLandmark"
                          value={formData.currentLandmark}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                          style={{
                            borderColor: "var(--color-brand-primary)",
                            backgroundColor: "#F8FAFC",
                          }}
                          placeholder="Enter landmark for current address"
                          required
                        />

                        {renderError("currentLandmark")}
                      </div>

                      <div className="mb-4">
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: "#111827" }}
                        >
                          Pin code *
                        </label>
                        <input
                          type="number"
                          name="currentAddressPinCode"
                          value={formData.currentAddressPinCode}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                          style={{
                            borderColor: "var(--color-brand-primary)",
                            backgroundColor: "#F8FAFC",
                          }}
                          placeholder="Enter pin code"
                          required
                        />

                        {renderError("currentAddressPinCode")}
                      </div>
                    </div>
                  </div>

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
                  <div>
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
                        backgroundColor: "#F8FAFC",
                      }}
                      rows="3"
                      placeholder="Enter your permanent address"
                      readOnly={sameAddress}
                      required
                    />
                    {renderError("permanentAddress")}
                  </div>

                  <div className="flex flex-wrap -mx-2">
                    {/* Left Column */}
                    <div className="w-full md:w-1/2 px-2">
                      <div className="mb-4">
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: "#111827" }}
                        >
                          Permanent House Status (Rented/Own) *
                        </label>
                        <select
                          name="permanentHouseStatus"
                          value={formData.permanentHouseStatus}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                          style={{
                            borderColor: "var(--color-brand-primary)",
                            backgroundColor: "#F8FAFC",
                          }}
                          required
                        >
                          <option value="">Select status</option>
                          <option value="rented">Rented</option>
                          <option value="own">Own</option>
                        </select>

                        {renderError("permanentHouseStatus")}
                      </div>

                      <div className="mb-4">
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: "#111827" }}
                        >
                          Landmark (Permanent Address) *
                        </label>
                        <input
                          type="text"
                          name="permanentLandmark"
                          value={formData.permanentLandmark}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                          style={{
                            borderColor: "var(--color-brand-primary)",
                            backgroundColor: "#F8FAFC",
                          }}
                          placeholder="Enter landmark for permanent address"
                          required
                        />
                        {renderError('permanentLandmark')}
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="w-full md:w-1/2 px-2">
                      <div className="mb-4">
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: "#111827" }}
                        >
                          Stability (Permanent Address) *
                        </label>
                        <input
                          type="text"
                          name="permanentStability"
                          value={formData.permanentStability}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                          style={{
                            borderColor: "var(--color-brand-primary)",
                            backgroundColor: "#F8FAFC",
                          }}
                          placeholder="Enter stability for permanent address"
                          required
                        />
                        {renderError('permanentStability')}
                      </div>

                      <div className="mb-4">
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: "#111827" }}
                        >
                          Pin code *
                        </label>
                        <input
                          type="number"
                          name="permanentAddressPinCode"
                          value={formData?.permanentAddressPinCode}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                          style={{
                            borderColor: "var(--color-brand-primary)",
                            backgroundColor: "#F8FAFC",
                          }}
                          placeholder="Enter pin code"
                          required
                        />

                        {renderError('permanentAddressPinCode')}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section hidden={currentStep !== 2}>
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

                    {renderError("loanAmount")}
                  </div>
                </div>
              </section>

              {/* Document Upload */}
              <section hidden={currentStep !== 3}>
                <h2
                  className="text-2xl font-semibold mb-6 flex items-center gap-3"
                  style={{ color: "#111827" }}
                >
                  <FileText className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
                  4.1 Identity & Core Documents
                </h2>
                <p className="text-sm text-slate-600 mb-4">
                  Accepted files: PDF, JPG, JPEG, PNG. Preview appears after upload.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { name: "aadharFront", label: "Aadhar Card (Front) *", required: true },
                    { name: "aadharBack", label: "Aadhar Card (Back) *", required: true },
                    { name: "panCard", label: "PAN Card *", required: true },
                    {
                      name: "passportPhoto",
                      label: "Passport Photo *",
                      required: true,
                      accept: ".jpg,.jpeg,.png",
                    },
                    { name: "otherDocument", label: "Other Document", required: false },
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
                      onPreview={() => {
                        let url = "";
                        if (formData[doc.name]?.preview) {
                          url = formData[doc.name].preview;
                        } else if (formData[doc.name] instanceof File) {
                          url = URL.createObjectURL(formData[doc.name]);
                          objectUrlsRef.current.push(url);
                        }
                        setdocumentModel(url);
                      }}
                    />
                  ))}
                </div>
              </section>

              {/* Employment Information */}
              <section hidden={currentStep !== 2}>
                <h2
                  className="text-2xl font-semibold mb-6 flex items-center gap-3"
                  style={{ color: "#111827" }}
                >
                  <Building className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
                  Employment Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter your company name"
                      required
                    />
                    {renderError("companyName")}
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Designation *
                    </label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter your designation"
                      required
                    />
                    {renderError("designation")}
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Company Address *
                    </label>
                    <textarea
                      name="companyAddress"
                      value={formData.companyAddress}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors resize-none"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      rows="2"
                      placeholder="Enter your company address"
                      required
                    />
                    {renderError("companyAddress")}
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Monthly Salary (₹) *
                    </label>
                    <input
                      type="number"
                      name="monthlySalary"
                      value={formData.monthlySalary}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter your monthly salary"
                      min="0"
                      required
                    />

                    {renderError('monthlySalary')}
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Total Experience (in years) *
                    </label>
                    <div className="relative">
                      <Briefcase
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                        style={{ color: "var(--color-brand-primary)" }}
                      />
                      <input
                        type="number"
                        name="totalExperience"
                        value={formData.totalExperience}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        placeholder="0"
                        min="0"
                        required
                      />

                      {renderError('totalExperience')}
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Current Experience (in years) *
                    </label>
                    <input
                      type="number"
                      name="currentExperience"
                      value={formData.currentExperience}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="0"
                      min="0"
                      required
                    />

                    {renderError('currentExperience')}
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Salary in Hand (₹) *
                    </label>
                    <input
                      type="number"
                      name="salaryInHand"
                      value={formData.salaryInHand}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "var(--color-brand-primary)",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter your salary in hand"
                      min="0"
                      required
                    />
                    {renderError('salaryInHand')}
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Company ID Card *
                    </label>
                    <div className="relative flex items-center gap-2">
                      {/* File Input */}
                      <input
                        type="file"
                        name="companyIdCard"
                        onChange={handleFileChange}
                        className="flex-1 px-4 py-2 border-2 rounded-lg focus:outline-none transition-colors file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                      />

                      {/* Action Buttons */}
                      {formData.companyIdCard && (
                        <div className="flex items-center gap-1">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => {
                              let url = "";
                              if (formData.companyIdCard.preview) {
                                url = formData.companyIdCard.preview;
                              } else if (formData.companyIdCard instanceof File) {
                                url = URL.createObjectURL(formData.companyIdCard);
                                objectUrlsRef.current.push(url);
                              }
                              setdocumentModel(url);
                            }}
                            className="p-1 rounded-full hover:bg-blue-100 transition-colors"
                            style={{ color: "#2563EB" }}
                            title="View file"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => handleFileRemove("companyIdCard")}
                            className="p-1 rounded-full hover:bg-red-100 transition-colors"
                            style={{ color: "#EF4444" }}
                            title="Remove file"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* File Name */}
                    {formData.companyIdCard && (
                      <p className="text-xs mt-1 text-green-600 flex items-center gap-1">
                        <span>✓</span> {formData.companyIdCard.name}
                      </p>
                    )}

                    {formData.companyIdCard ? "" : renderError('companyIdCard')}
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Salary Slip 1 *
                    </label>
                    <div className="relative flex items-center gap-2">
                      {/* File Input */}
                      <input
                        type="file"
                        name="salarySlip1"
                        onChange={handleFileChange}
                        className="flex-1 px-4 py-2 border-2 rounded-lg focus:outline-none transition-colors file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                      />

                      {/* Action Buttons */}
                      {formData.salarySlip1 && (
                        <div className="flex items-center gap-1">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => {
                              let url = "";
                              if (formData.salarySlip1.preview) {
                                url = formData.salarySlip1.preview;
                              } else if (formData.salarySlip1 instanceof File) {
                                url = URL.createObjectURL(formData.salarySlip1);
                                objectUrlsRef.current.push(url);
                              }
                              setdocumentModel(url);
                            }}
                            className="p-1 rounded-full hover:bg-blue-100 transition-colors"
                            style={{ color: "#2563EB" }}
                            title="View file"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => handleFileRemove("salarySlip1")}
                            className="p-1 rounded-full hover:bg-red-100 transition-colors"
                            style={{ color: "#EF4444" }}
                            title="Remove file"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* File Name */}
                    {formData.salarySlip1 && (
                      <p className="text-xs mt-1 text-green-600 flex items-center gap-1">
                        <span>✓</span> {formData.salarySlip1.name}
                      </p>
                    )}

                    {formData.salarySlip1 ? " " : renderError('salarySlip1')}
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Salary Slip 2 *
                    </label>
                    <div className="relative flex items-center gap-2">
                      {/* File Input */}
                      <input
                        type="file"
                        name="salarySlip2"
                        onChange={handleFileChange}
                        className="flex-1 px-4 py-2 border-2 rounded-lg focus:outline-none transition-colors file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                      />

                      {/* Action Buttons */}
                      {formData.salarySlip2 && (
                        <div className="flex items-center gap-1">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => {
                              let url = "";
                              if (formData.salarySlip2.preview) {
                                url = formData.salarySlip2.preview;
                              } else if (formData.salarySlip2 instanceof File) {
                                url = URL.createObjectURL(formData.salarySlip2);
                                objectUrlsRef.current.push(url);
                              }
                              setdocumentModel(url);
                            }}
                            className="p-1 rounded-full hover:bg-blue-100 transition-colors"
                            style={{ color: "#2563EB" }}
                            title="View file"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => handleFileRemove("salarySlip2")}
                            className="p-1 rounded-full hover:bg-red-100 transition-colors"
                            style={{ color: "#EF4444" }}
                            title="Remove file"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* File Name */}
                    {formData.salarySlip2 && (
                      <p className="text-xs mt-1 text-green-600 flex items-center gap-1">
                        <span>✓</span> {formData.salarySlip2.name}
                      </p>
                    )}

                    {formData.salarySlip2 ? " " : renderError('salarySlip2')}
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Salary Slip 3 *
                    </label>
                    <div className="relative flex items-center gap-2">
                      {/* File Input */}
                      <input
                        type="file"
                        name="salarySlip3"
                        onChange={handleFileChange}
                        className="flex-1 px-4 py-2 border-2 rounded-lg focus:outline-none transition-colors file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                      />

                      {/* Action Buttons */}
                      {formData.salarySlip3 && (
                        <div className="flex items-center gap-1">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => {
                              let url = "";
                              if (formData.salarySlip3.preview) {
                                url = formData.salarySlip3.preview;
                              } else if (formData.salarySlip3 instanceof File) {
                                url = URL.createObjectURL(formData.salarySlip3);
                                objectUrlsRef.current.push(url);
                              }
                              setdocumentModel(url);
                            }}
                            className="p-1 rounded-full hover:bg-blue-100 transition-colors"
                            style={{ color: "#2563EB" }}
                            title="View file"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => handleFileRemove("salarySlip3")}
                            className="p-1 rounded-full hover:bg-red-100 transition-colors"
                            style={{ color: "#EF4444" }}
                            title="Remove file"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* File Name */}
                    {formData.salarySlip3 && (
                      <p className="text-xs mt-1 text-green-600 flex items-center gap-1">
                        <span>✓</span> {formData.salarySlip3.name}
                      </p>
                    )}

                    {formData.salarySlip3 ? " " : renderError('salarySlip3')}
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Form 16 / 26AS
                    </label>
                    <div className="relative flex items-center gap-2">
                      {/* File Input */}
                      <input
                        type="file"
                        name="form16_26as"
                        onChange={handleFileChange}
                        className="flex-1 px-4 py-2 border-2 rounded-lg focus:outline-none transition-colors file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />

                      {/* Action Buttons */}
                      {formData.form16_26as && (
                        <div className="flex items-center gap-1">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => {
                              let url = "";
                              if (formData.form16_26as?.preview) {
                                url = formData.form16_26as.preview;
                              } else if (formData.form16_26as instanceof File) {
                                url = URL.createObjectURL(formData.form16_26as);
                                objectUrlsRef.current.push(url);
                              }
                              setdocumentModel(url);
                            }}
                            className="p-1 rounded-full hover:bg-blue-100 transition-colors"
                            style={{ color: "#2563EB" }}
                            title="View file"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => handleFileRemove("form16_26as")}
                            className="p-1 rounded-full hover:bg-red-100 transition-colors"
                            style={{ color: "#EF4444" }}
                            title="Remove file"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* File Name */}
                    {formData.form16_26as && (
                      <p className="text-xs mt-1 text-green-600 flex items-center gap-1">
                        <span>✓</span> {formData.form16_26as.name}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Bank Details Section */}
              <section hidden={currentStep !== 3}>
                <h2
                  className="text-2xl font-semibold mb-6 flex items-center gap-3"
                  style={{ color: "#111827" }}
                >
                  <FileText className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
                  4.2 Bank Statements
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
                      Bank Statement 1 *
                    </label>
                    <div className="relative flex items-center gap-2">
                      {/* File Input */}
                      <input
                        type="file"
                        name="bankStatement1"
                        onChange={handleFileChange}
                        className="flex-1 px-4 py-2 border-2 rounded-lg focus:outline-none transition-colors file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                      />

                      {/* Action Buttons */}
                      {formData.bankStatement1 && (
                        <div className="flex items-center gap-1">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => {
                              let url = "";
                              if (formData.bankStatement1?.preview) {
                                url = formData.bankStatement1.preview;
                              } else if (formData.bankStatement1 instanceof File) {
                                url = URL.createObjectURL(formData.bankStatement1);
                                objectUrlsRef.current.push(url);
                              }
                              setdocumentModel(url);
                            }}
                            className="p-1 rounded-full hover:bg-blue-100 transition-colors"
                            style={{ color: "#2563EB" }}
                            title="View file"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => handleFileRemove("bankStatement1")}
                            className="p-1 rounded-full hover:bg-red-100 transition-colors"
                            style={{ color: "#EF4444" }}
                            title="Remove file"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* File Name */}
                    {formData.bankStatement1 && (
                      <p className="text-xs mt-1 text-green-600 flex items-center gap-1">
                        <span>✓</span> {formData.bankStatement1.name}
                      </p>
                    )}

                    {formData.bankStatement1 ? " " : renderError('bankStatement1')}
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Bank Statement 2
                    </label>
                    <div className="relative flex items-center gap-2">
                      {/* File Input */}
                      <input
                        type="file"
                        name="bankStatement2"
                        onChange={handleFileChange}
                        className="flex-1 px-4 py-2 border-2 rounded-lg focus:outline-none transition-colors file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "#F8FAFC",
                        }}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />

                      {/* Action Buttons */}
                      {formData.bankStatement2 && (
                        <div className="flex items-center gap-1">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => {
                              let url = "";
                              if (formData.bankStatement2?.preview) {
                                url = formData.bankStatement2.preview;
                              } else if (formData.bankStatement2 instanceof File) {
                                url = URL.createObjectURL(formData.bankStatement2);
                                objectUrlsRef.current.push(url);
                              }
                              setdocumentModel(url);
                            }}
                            className="p-1 rounded-full hover:bg-blue-100 transition-colors"
                            style={{ color: "#2563EB" }}
                            title="View file"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => handleFileRemove("bankStatement2")}
                            className="p-1 rounded-full hover:bg-red-100 transition-colors"
                            style={{ color: "#EF4444" }}
                            title="Remove file"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* File Name */}
                    {formData.bankStatement2 && (
                      <p className="text-xs mt-1 text-green-600 flex items-center gap-1">
                        <span>✓</span> {formData.bankStatement2.name}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section hidden={currentStep !== 3}>
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-gray-900">
                  <FileText className="w-6 h-6 text-teal-500" />
                  4.3 Address Proof Document
                </h2>

                <label className="block text-sm font-medium mb-2 text-gray-900">
                  Select one document to submit as address proof (e.g.,
                  Lightbill, Wifi, Water, Gas Bill, or Rent Agreement) *
                </label>

                <input
                  type="file"
                  name="newAddressProofs" // <--- store in newAddressProofs
                  onChange={handleFileChangeAddressProofs}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-teal-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-500 file:text-white hover:file:bg-teal-600"
                />

                {formData.newAddressProofs ? "" : renderError("newAddressProofs")}   {/* <-- KEEP ONLY THIS */}

                {formData.newAddressProofs && (
                  <div className="mt-2 text-sm text-gray-700">
                    {formData.newAddressProofs.type?.includes("image") ? (
                      <button
                        type="button"
                        className="text-blue-600 underline"
                        onClick={() => {
                          const url = URL.createObjectURL(formData.newAddressProofs);
                          objectUrlsRef.current.push(url);
                          setdocumentModel(url);
                        }}
                      >
                        🖼️ {formData.newAddressProofs.name} (Preview)
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-blue-600 underline"
                        onClick={() => {
                          const url = URL.createObjectURL(formData.newAddressProofs);
                          objectUrlsRef.current.push(url);
                          setdocumentModel(url);
                        }}
                      >
                        📄 {formData.newAddressProofs.name} (Preview)
                      </button>
                    )}
                  </div>
                )}

              </section>

              {/* References */}
              <section hidden={currentStep !== 4}>
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
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
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

                        {renderError('reference1Name')}
                      </div>
                      <div>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: "#111827" }}
                        >
                          Contact Number *
                        </label>
                        <input
                          type="tel"
                          name="reference1Contact"
                          value={formData.reference1Contact}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                          style={{
                            borderColor: "var(--color-brand-primary)",
                            backgroundColor: "white",
                          }}
                          placeholder="Enter contact number"
                          required
                        />

                        {renderError('reference1Contact')}
                      </div>
                    </div>
                  </div>
                  <div
                    className="p-6 rounded-lg border-2"
                    style={{
                      borderColor: "var(--color-brand-primary)",
                      backgroundColor: "#F8FAFC",
                    }}
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

                        {renderError('reference2Name')}
                      </div>
                      <div>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: "#111827" }}
                        >
                          Contact Number *
                        </label>
                        <input
                          type="tel"
                          name="reference2Contact"
                          value={formData.reference2Contact}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                          style={{
                            borderColor: "var(--color-brand-primary)",
                            backgroundColor: "white",
                          }}
                          placeholder="Enter contact number"
                          required
                        />
                        {renderError('reference2Contact')}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Password Section */}
              <section hidden={currentStep !== 5}>
                <h2
                  className="text-2xl font-semibold mb-6 flex items-center gap-3"
                  style={{ color: "#111827" }}
                >
                  Password Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.password ? "text" : "password"}
                        name="password"
                        value={formData.password || ""}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 pr-12 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "white",
                        }}
                        placeholder="Enter password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((prev) => ({
                            ...prev,
                            password: !prev.password,
                          }))
                        }
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword.password ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {renderError('password')}
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "#111827" }}
                    >
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.confirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword || ""}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 pr-12 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                        style={{
                          borderColor: "var(--color-brand-primary)",
                          backgroundColor: "white",
                        }}
                        placeholder="Re-enter password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((prev) => ({
                            ...prev,
                            confirmPassword: !prev.confirmPassword,
                          }))
                        }
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword.confirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {renderError('confirmPassword')}
                  </div>
                </div>
              </section>

              {/* Partner Referral */}
              <section>
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
                      Partner Referral Code (optional) - use {defaultReferralCode} if you don't have a partner code
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
              </section>

            {/* Submit + Wizard Navigation */}
            <div className="pt-8">
              {currentStep === steps.length - 1 && error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
                  <p className="font-semibold">{error}</p>
                  {Array.isArray(validationErrors) && validationErrors.length > 0 && (
                    <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                      {validationErrors.map((msg, idx) => (
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
                    setError("");
                    setFieldErrors({});
                    setValidationErrors([]);
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
                      setError("");
                      const stepErrors = validateHomeLoanSalariedStep(currentStep);
                      setFieldErrors(stepErrors);
                      setValidationErrors(Object.values(stepErrors));

                      if (Object.keys(stepErrors).length > 0) {
                        setError("Please fix the highlighted fields to continue.");
                        scrollToFirstError(stepErrors);
                        return;
                      }

                      const nextStep = currentStep + 1;
                      setCurrentStep(nextStep);
                      setMaxStep((m) => Math.max(m, nextStep));
                      setFieldErrors({});
                      setValidationErrors([]);
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
                    disabled={loading}
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
    </>
  );
}
