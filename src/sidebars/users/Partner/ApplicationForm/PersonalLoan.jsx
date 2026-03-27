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

import { getAuthData } from "../../../../utils/localStorage";
import { backendurl } from "../../../../feature/urldata";
import LoanStepper from "../../../../components/loan/LoanStepper";
import DocumentUploadCard from "../../../../components/loan/DocumentUploadCard";
import DocumentPreviewModal from "../../../../components/loan/DocumentPreviewModal";

export default function PersonalLoan() {
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

    aadharFront: "",
    aadharBack: "",
    panCard: "",
    passportPhoto: "",
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

  // Multi-step wizard state
  const steps = [
    "Personal",
    "Address",
    "Loan & Employment",
    "Documents",
    "References",
    "Review",
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const stepAnchorIds = [
    "loan-personal-step",
    "loan-address-step",
    "loan-loan-step",
    "loan-docs-step",
    "loan-references-step",
    "loan-review-step",
  ];
  const loanDraftStorageKey = "personalLoanDraft_v1";

  const stepFirstFieldName = [
    "firstName",
    "currentAddress",
    "loanAmount",
    "aadharFront",
    "reference1Name",
    "partnerReferralCode",
  ];

  const abortControllerRef = useRef(null);

  const fileLike = (v) =>
    v &&
    typeof v === "object" &&
    (v instanceof File ||
      (typeof v.name === "string" &&
        typeof v.size === "number" &&
        typeof v.type === "string"));

  const serializeDraftFormData = (data) => {
    const serialized = {};
    for (const [k, v] of Object.entries(data || {})) {
      // Do not persist password data in localStorage
      if (k === "password" || k === "confirmPassword") {
        serialized[k] = "";
        continue;
      }

      if (fileLike(v)) {
        serialized[k] = null;
        continue;
      }

      // Handle nested file object for address proofs
      if (k === "newAddressProofs" && v && typeof v === "object") {
        serialized[k] = {};
        for (const [nk, nv] of Object.entries(v)) {
          serialized[k][nk] = fileLike(nv) ? null : nv;
        }
        continue;
      }

      serialized[k] = v;
    }
    return serialized;
  };

  const scrollToStep = (idx) => {
    const stepId = stepAnchorIds[idx];
    if (!stepId) return;
    const el = document.getElementById(stepId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToFirstError = (errorMap) => {
    if (!errorMap || typeof errorMap !== "object") return;
    const firstField = Object.keys(errorMap)[0];
    if (!firstField) return;
    const el = document.querySelector(`[name="${firstField}"]`);
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (el && typeof el.focus === "function") {
      try {
        el.focus();
      } catch (e) {
        // ignore focus errors
      }
    }
  };

  // Load draft (best-effort). Files can't be persisted, but scalar progress can.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(loanDraftStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.formData && typeof parsed.formData === "object") {
        setFormData((prev) => ({
          ...prev,
          ...parsed.formData,
          loanAmount:
            parsed.formData.loanAmount === "" || parsed.formData.loanAmount == null
              ? prev.loanAmount
              : parsed.formData.loanAmount,
        }));
      }
      if (typeof parsed?.currentStep === "number") {
        setCurrentStep(
          Math.max(0, Math.min(parsed.currentStep, steps.length - 1))
        );
      }
      if (typeof parsed?.maxStep === "number") {
        setMaxStep(Math.max(0, Math.min(parsed.maxStep, steps.length - 1)));
      }
    } catch (e) {
      // ignore draft load errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist draft with throttling (so typing doesn't spam localStorage).
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
        // ignore storage errors
      }
    }, 600);
    return () => clearTimeout(t);
  }, [formData, currentStep, maxStep]);

  // Cleanup function to cancel pending requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (successMessage) toast.success(successMessage);
  }, [successMessage]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "loanAmount" ? parseInt(value, 10) || 0 : value,
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

  const handleFileChangeAddressProofs = (e) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0], // now this updates newAddressProofs
      }));
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

  const renderError = (field) =>
    fieldErrors[field] ? (
      <p className="text-xs text-red-600 mt-1">{fieldErrors[field]}</p>
    ) : null;

  const handleSameAddressChange = (e) => {
    setSameAddress(e.target.checked);
    if (e.target.checked) {
      setFormData((prev) => ({
        ...prev,
        permanentAddress: prev.currentAddress,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        permanentAddress: "",
      }));
    }
  };

  function validateRegistrationForm(formData) {
    const errors = {};

    // Personal fields
    if (!formData.firstName) errors.firstName = "First name is required.";
    if (!formData.middleName) errors.middleName = "Middle name is required.";
    if (!formData.lastName) errors.lastName = "Last name is required.";
    if (!formData.motherName) errors.motherName = "Mother's name is required.";
    if (!formData.pan) errors.pan = "PAN number is required.";
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

    // Address
    if (!formData.currentAddress) errors.currentAddress = "Current address is required.";
    if (!formData.permanentAddress) errors.permanentAddress = "Permanent address is required.";
    if (!formData.stabilityOfResidency) errors.stabilityOfResidency = "Stability of Residency is required.";
    if (!formData.currentHouseStatus) errors.currentHouseStatus = "Current House Status is required.";
    if (!formData.currentLandmark) errors.currentLandmark = "Landmark is required.";
    if (!formData.currentAddressPinCode) errors.currentAddressPinCode = "Pin Code is required.";
    if (!formData.permanentHouseStatus) errors.permanentHouseStatus = "Permanent House Status is required.";
    if (!formData.permanentLandmark) errors.permanentLandmark = "Landmark is required.";
    if (!formData.permanentStability) errors.permanentStability = "Stability is required.";
    if (!formData.permanentAddressPinCode) errors.permanentAddressPinCode = "Pincode is required.";


    // Employment
    if (!formData.companyName) errors.companyName = "Company name is required.";
    if (!formData.designation) errors.designation = "Designation is required.";
    if (!formData.companyAddress) errors.companyAddress = "Company address is required.";
    if (!formData.monthlySalary) errors.monthlySalary = "Monthly salary is required.";
    if (!formData.totalExperience) errors.totalExperience = "Total Experience is required.";
    if (!formData.currentExperience) errors.currentExperience = "Current Experience is required.";
    if (!formData.salaryInHand) errors.salaryInHand = "salary In Hand is required.";
    if (!formData.companyIdCard) errors.companyIdCard = "Company Id Card is required.";
    if (!formData.salarySlip1) errors.salarySlip1 = "salarySlip1 is required.";
    if (!formData.salarySlip2) errors.salarySlip2 = "salarySlip2 is required.";
    if (!formData.salarySlip3) errors.salarySlip3 = "salarySlip3 is required.";
    if (!formData.form16_26as) errors.form16_26as = "Form 16 / 26AS is required.";

    // Bank Statement
    if (!formData.bankStatement1) errors.bankStatement1 = "Bank Statement 1 is required.";
    if (!formData.bankStatement2) errors.bankStatement2 = "Bank Statement 2 is required.";

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

    // Loan
    if (formData.loanAmount === "" || formData.loanAmount === null || formData.loanAmount === undefined) {
      errors.loanAmount = "Loan amount is required.";
    } else if (Number(formData.loanAmount) <= 0) {
      errors.loanAmount = "Loan amount must be greater than zero.";
    }


    // Mandatory document validation
    if (!formData.aadharFront) errors.aadharFront = "Aadhar front is required.";
    if (!formData.aadharBack) errors.aadharBack = "Aadhar back is required.";
    if (!formData.panCard) errors.panCard = "PAN card is required.";
    if (!formData.passportPhoto && !formData.selfie) {
      errors.passportPhoto = "Applicant photo is required.";
    }

    return errors;
  }

  const stepFieldKeys = [
    // 0: Personal
    [
      "firstName",
      "middleName",
      "lastName",
      "motherName",
      "pan",
      "gender",
      "maritalStatus",
      "contactNo",
      "email",
      "dob",
    ],
    // 1: Address
    [
      "currentAddress",
      "permanentAddress",
      "stabilityOfResidency",
      "currentHouseStatus",
      "currentLandmark",
      "currentAddressPinCode",
      "permanentHouseStatus",
      "permanentLandmark",
      "permanentStability",
      "permanentAddressPinCode",
    ],
    // 2: Loan & Employment
    [
      "loanAmount",
      "companyName",
      "designation",
      "companyAddress",
      "monthlySalary",
      "totalExperience",
      "currentExperience",
      "salaryInHand",
      "companyIdCard",
      "salarySlip1",
      "salarySlip2",
      "salarySlip3",
      "form16_26as",
    ],
    // 3: Documents
    [
      "aadharFront",
      "aadharBack",
      "panCard",
      "passportPhoto",
      "selfie",
      "bankStatement1",
      "bankStatement2",
      "newAddressProofs",
    ],
    // 4: References
    ["reference1Name", "reference1Contact", "reference2Name", "reference2Contact"],
    // 5: Review
    ["password", "confirmPassword"],
  ];

  const validateStep = (stepIdx) => {
    const errors = validateRegistrationForm(formData);
    const keys = stepFieldKeys[stepIdx] || [];
    return keys.reduce((acc, key) => {
      if (errors[key]) acc[key] = errors[key];
      return acc;
    }, {});
  };

  const canSubmit = useMemo(
    () => Object.keys(validateRegistrationForm(formData)).length === 0,
    [formData]
  );
  const stepErrorCounts = useMemo(
    () => steps.map((_, idx) => Object.keys(validateStep(idx)).length),
    [formData]
  );

  const handleNext = () => {
    if (loading) return;
    setError("");
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setError("Please fix the highlighted fields to continue.");
      setFieldErrors(stepErrors);
      setValidationErrors(Object.values(stepErrors));
      scrollToFirstError(stepErrors);
      return;
    }

    setFieldErrors({});
    setValidationErrors([]);
    const nextIdx = Math.min(currentStep + 1, steps.length - 1);
    setCurrentStep(nextIdx);
    setMaxStep((m) => Math.max(m, nextIdx));
    scrollToStep(nextIdx);
    requestAnimationFrame(() => {
      const el = document.querySelector(`[name="${stepFirstFieldName[nextIdx]}"]`);
      if (el && typeof el.focus === "function") el.focus();
    });
  };

  const handleBack = () => {
    if (loading) return;
    if (currentStep === 0) return;
    setError("");
    setFieldErrors({});
    setValidationErrors([]);
    const prevIdx = Math.max(0, currentStep - 1);
    setCurrentStep(prevIdx);
    scrollToStep(prevIdx);
    requestAnimationFrame(() => {
      const el = document.querySelector(`[name="${stepFirstFieldName[prevIdx]}"]`);
      if (el && typeof el.focus === "function") el.focus();
    });
  };

  const handleSubmit = async () => {
    if (loading) return;
    console.log("working");
    
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
        loanType: "PERSONAL",
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
          // Generic server-side validation / error
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
    setError("");
    setFieldErrors({});
    setValidationErrors([]);
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
        onClose={() => setdocumentModel(null)}
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

          {currentStep === steps.length - 1 && error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
              <p className="font-semibold">
                {error}
              </p>
              {Array.isArray(validationErrors) && validationErrors.length > 0 && (
                <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                  {validationErrors.map((msg, idx) => (
                    <li key={idx}>{msg}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div
              className="px-8 py-6 text-white"
              style={{ backgroundColor: "var(--color-brand-primary)" }}
            >
              <h1 className="text-3xl font-bold text-center">
                Personal Loan Application
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
                  setError("");
                  setFieldErrors({});
                  setValidationErrors([]);
                  setCurrentStep(idx);
                  requestAnimationFrame(() => {
                    const el = document.querySelector(`[name="${stepFirstFieldName[idx]}"]`);
                    if (el && typeof el.focus === "function") el.focus();
                  });
                }}
              />

              {/* Personal Information */}
              <section id="loan-personal-step" hidden={currentStep !== 0}>
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
                    {renderError("pan")}
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
              <section id="loan-address-step" hidden={currentStep !== 1}>
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
                      disabled={sameAddress}
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
                        {renderError("permanentLandmark")}
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
                        {renderError("permanentStability")}
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
                        {renderError("permanentAddressPinCode")}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section id="loan-loan-step" hidden={currentStep !== 2}>
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


                    {formData.loanAmount ? "" : renderError("loanAmount")}
                  </div>
                </div>
              </section>

              {/* Document Upload */}
              <section id="loan-docs-step" hidden={currentStep !== 3}>
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
                      onPreview={() =>
                        setdocumentModel(
                          formData[doc.name]?.preview
                            ? formData[doc.name].preview
                            : formData[doc.name] instanceof File
                            ? URL.createObjectURL(formData[doc.name])
                            : ""
                        )
                      }
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
                    {renderError("monthlySalary")}
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
                      {renderError("totalExperience")}
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
                    {renderError("currentExperience")}
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
                    {renderError("salaryInHand")}
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
                      {formData.companyIdCard ? "" : renderError("companyIdCard")}

                      {/* Action Buttons */}
                      {formData.companyIdCard && (
                        <div className="flex items-center gap-1">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() =>
                              setdocumentModel(
                                formData.companyIdCard.preview
                                  ? formData.companyIdCard.preview
                                  : formData.companyIdCard instanceof File
                                    ? URL.createObjectURL(formData.companyIdCard)
                                    : ""
                              )
                            }
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
                      { formData.salarySlip1 ? "" : renderError("salarySlip1")}

                      {/* Action Buttons */}
                      {formData.salarySlip1 && (
                        <div className="flex items-center gap-1">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() =>
                              setdocumentModel(
                                formData.salarySlip1.preview
                                  ? formData.salarySlip1.preview
                                  : formData.salarySlip1 instanceof File
                                    ? URL.createObjectURL(formData.salarySlip1)
                                    : ""
                              )
                            }
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
                        { formData.salarySlip2 ? "" : renderError("salarySlip2")}
                      {/* Action Buttons */}
                      {formData.salarySlip2 && (
                        <div className="flex items-center gap-1">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() =>
                              setdocumentModel(
                                formData.salarySlip2.preview
                                  ? formData.salarySlip2.preview
                                  : formData.salarySlip2 instanceof File
                                    ? URL.createObjectURL(formData.salarySlip2)
                                    : ""
                              )
                            }
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
                     { formData.salarySlip3 ? "" : renderError("salarySlip3")}

                      {/* Action Buttons */}
                      {formData.salarySlip3 && (
                        <div className="flex items-center gap-1">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() =>
                              setdocumentModel(
                                formData.salarySlip3.preview
                                  ? formData.salarySlip3.preview
                                  : formData.salarySlip3 instanceof File
                                    ? URL.createObjectURL(formData.salarySlip3)
                                    : ""
                              )
                            }
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
                            onClick={() =>
                              setdocumentModel(
                                formData.form16_26as.preview
                                  ? formData.form16_26as.preview
                                  : formData.form16_26as instanceof File
                                    ? URL.createObjectURL(formData.form16_26as)
                                    : ""
                              )
                            }
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
                      {formData.bankStatement1 ? "" : renderError("bankStatement1")}
                      {/* Action Buttons */}
                      {formData.bankStatement1 && (
                        <div className="flex items-center gap-1">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() =>
                              setdocumentModel(
                                formData.bankStatement1.preview
                                  ? formData.bankStatement1.preview
                                  : formData.bankStatement1 instanceof File
                                    ? URL.createObjectURL(formData.bankStatement1)
                                    : ""
                              )
                            }
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
                            onClick={() =>
                              setdocumentModel(
                                formData.bankStatement2.preview
                                  ? formData.bankStatement2.preview
                                  : formData.bankStatement2 instanceof File
                                    ? URL.createObjectURL(formData.bankStatement2)
                                    : ""
                              )
                            }
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
                  Lightbill, Wifi, Water, Gas Bill, or Rent Agreement)
                </label>

                <input
                  type="file"
                  name="addressProof" // <--- store in newAddressProofs
                  onChange={handleFileChangeAddressProofs}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-teal-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-500 file:text-white hover:file:bg-teal-600"
                />

                {formData.newAddressProofs && (
                  <div className="mt-2 text-sm text-gray-700">
                    {formData.newAddressProofs.type.includes("image") ? (
                      <button
                        type="button"
                        className="text-blue-600 underline"
                        onClick={() =>
                          setdocumentModel(URL.createObjectURL(formData.newAddressProofs))
                        }
                      >
                        🖼️ {formData.newAddressProofs.name} (Preview)
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-blue-600 underline"
                        onClick={() =>
                          setdocumentModel(URL.createObjectURL(formData.newAddressProofs))
                        }
                      >
                        📄 {formData.newAddressProofs.name} (Preview)
                      </button>
                    )}
                  </div>
                )}
              </section>

              {/* References */}
              <section id="loan-references-step" hidden={currentStep !== 4}>
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
                        {renderError("reference1Name")}
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
                        {renderError("reference1Contact")}
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
                        {renderError("reference2Name")}
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
                        {renderError("reference2Contact")}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Password Section */}
              <section id="loan-review-step" hidden={currentStep !== 5}>
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
                    {renderError("password")}
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
                    {renderError("confirmPassword")}
                  </div>
                </div>
              </section>

              {/* Partner Referral */}
              <section hidden={currentStep !== 5}>
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
                  onClick={handleBack}
                  className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                  disabled={loading || currentStep === 0}
                >
                  Back
                </button>

                {currentStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
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
