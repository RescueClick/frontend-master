import React, { useState, useEffect, useRef } from "react";
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
  Home,
  X,
  Eye,
  EyeOff,
  Share2,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { z } from "zod";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAuthData } from "../../../../utils/localStorage";
import { backendurl } from "../../../../feature/urldata";
import {
  fetchPublicDefaultPartnerReferralCode,
  fetchPublicPartnerInfo,
  PUBLIC_LOAN_REFERRAL_FALLBACK,
} from "../../../../feature/publicLoanReferral";
import { canonicalPartnerReferralCode } from "../../../../config/branding";
import LoanStepper from "../../../../components/loan/LoanStepper";
import DocumentUploadCard from "../../../../components/loan/DocumentUploadCard";
import LoanAddressProofBlock from "../../../../components/loan/LoanAddressProofBlock";
import DocumentPreviewModal from "../../../../components/loan/DocumentPreviewModal";
import PublicLoanPartnerTrustBanner from "../../../../components/loan/PublicLoanPartnerTrustBanner";
import ShareLoanModal from "../../../../components/loan/ShareLoanModal";
import {
  findOversizeInLoanDocsQueue,
  formatLoanDocOversizeError,
} from "../../../../utils/docUploadLimits";
import {
  validateLoanDocumentUpload,
  loanDocumentFieldHint,
} from "../../../../utils/loanDocumentUpload";
import { OPTIONAL_EXTRA_DOC_CAPTION } from "../../../../utils/loanAddressProofCopy";
import LoanApplicantFinancialFields from "../../../../components/loan/LoanApplicantFinancialFields";
import { captureLeadOnStep1Next } from "../../../../utils/captureLeadStep1";
import {
  useRmLoanFormResume,
  rmCompleteLoanFormUrl,
} from "../../../../utils/rmLoanForm";

export default function LapLoanSelfEmployee({ embed = false, actorRole = "auto" } = {}) {
  const navigate = useNavigate();
  const { partnerToken, partnerUser, rmToken } = getAuthData();
  const isRmMode = actorRole === "rm" || (actorRole === "auto" && Boolean(rmToken) && !partnerToken);
  const isPartnerLoggedIn = Boolean(partnerToken) && !isRmMode;
  const profileState = useSelector((state) => state?.partner?.profile?.data);

  const currentPartnerCode =
    canonicalPartnerReferralCode(
      profileState?.partnerCode,
      profileState?.referralCode
    ) ||
    canonicalPartnerReferralCode(
      partnerUser?.partnerCode,
      partnerUser?.referralCode
    ) ||
    "";

  const currentPartnerName =
    profileState?.fullName ||
    [profileState?.firstName, profileState?.middleName, profileState?.lastName]
      .filter(Boolean)
      .join(" ") ||
    [partnerUser?.firstName, partnerUser?.lastName].filter(Boolean).join(" ") ||
    "Authorized Partner";

  const [partnerInfo, setPartnerInfo] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [defaultReferralCode, setDefaultReferralCode] = useState(
    PUBLIC_LOAN_REFERRAL_FALLBACK
  );

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    alternateContact: "",
    email: "",
    gender: "",
    dob: "",
    motherName: "",
    maritalStatus: "",
    SpouseName: "",
    panNumber: "",

    // Address
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

    // Loan Amount
    loanAmount: "",

    // Business Information
    businessName: "",
    businessAddress: "",
    businessLandmark: "",
    businessVintage: "",
    gstNumber: "",
    annualTurnover: "",

    // Collateral Property Information
    propertyType: "RESIDENTIAL",
    propertyValue: "",
    propertyAddress: "",

    // Documents
    aadharFront: null,
    aadharBack: null,
    panCard: null,
    addressProof: null,
    shopPhoto: null,
    shopAct: null,
    udhyamAadhar: null,
    itr: null,
    gstDoc: null,
    bankStatementFile1: null,
    bankStatementFile2: null,
    businessOtherDocs: null,
    selfie: null,
    passportPhoto: null,
    otherDocs: null,

    // LAP Collateral Property Documents
    titleDeeds: null,
    sanctionedPlan: null,
    propertyTaxReceipt: null,
    agreementCopy: null,
    allotmentLetter: null,

    // Female co-applicant
    coApplicantAadharFront: null,
    coApplicantAadharBack: null,
    coApplicantPan: null,
    coApplicantMobile: "",
    coApplicantSelfie: null,

    // References
    reference1Name: "",
    reference1Contact: "",
    reference2Name: "",
    reference2Contact: "",

    // Security
    password: "",
    confirmPassword: "",
    bankStatementPassword: "",
    partnerReferralCode: "",
    hasRunningLoan: "NO",
    monthlyEmiPaying: "",
    loanPurpose: "",
  });

  const [applicationId, setApplicationId] = useState(null);
  const [sameAddress, setSameAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [savedApplication, setSavedApplication] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const objectUrlsRef = useRef([]);
  const abortControllerRef = useRef(null);

  const { resumeMeta, loadingResume, resumeError } = useRmLoanFormResume({
    enabled: isRmMode,
    setFormData,
    setApplicationId,
  });
  useEffect(() => {
    if (resumeError) setError(resumeError);
  }, [resumeError]);

  const steps = [
    { label: "Personal", id: "personal" },
    { label: "Address", id: "address" },
    { label: "Business & Property", id: "business" },
    { label: "Documents", id: "documents" },
    { label: "References", id: "references" },
    { label: "Review & Security", id: "review" },
  ];

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          // ignore
        }
      });
      objectUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (isPartnerLoggedIn) return;
    let cancelled = false;
    (async () => {
      const code = await fetchPublicDefaultPartnerReferralCode();
      if (!cancelled && code) {
        setDefaultReferralCode(code);
        setFormData((prev) => {
          const existing = String(prev.partnerReferralCode ?? "").trim();
          if (existing) return prev;
          return { ...prev, partnerReferralCode: code };
        });

        const info = await fetchPublicPartnerInfo(code);
        if (!cancelled && info) {
          setPartnerInfo(info);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isPartnerLoggedIn]);

  const phoneSchema = z.string().trim().regex(/^\d{10}$/, "Phone number must be exactly 10 digits.");
  const emailSchema = z.string().trim().email("Invalid email format.");
  const pinSchema = z.string().trim().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code.");
  const panSchema = z
    .string()
    .trim()
    .regex(/^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/, "Enter a valid PAN card number (e.g., ABCDE1234F).")
    .transform((s) => s.toUpperCase());

  const min3 = (msg) => z.string().trim().min(3, msg);

  function validateLapSelfEmployedStep(stepIndex) {
    const fullErrors = validateForm(formData, sameAddress);

    const stepFields = (() => {
      if (stepIndex === 0) {
        return [
          "firstName",
          "middleName",
          "lastName",
          "motherName",
          "gender",
          "maritalStatus",
          "password",
          "confirmPassword",
          "phone",
          "email",
          "dob",
          "panNumber",
          "SpouseName",
          "coApplicantMobile",
          "hasRunningLoan",
          "loanPurpose",
        ];
      }
      if (stepIndex === 1) {
        return [
          "currentAddress",
          "currentAddressStability",
          "currentAddressLandmark",
          "currentAddressOwnRented",
          "currentAddressPincode",
          "permanentAddress",
          "permanentAddressStability",
          "permanentAddressLandmark",
          "permanentAddressOwnRented",
          "permanentAddressPincode",
        ];
      }
      if (stepIndex === 2) {
        return [
          "loanAmount",
          "businessName",
          "businessAddress",
          "businessVintage",
          "annualTurnover",
          "propertyType",
          "propertyValue",
          "propertyAddress",
        ];
      }
      if (stepIndex === 3) {
        return [
          "aadharFront",
          "aadharBack",
          "panCard",
          "selfie",
          "passportPhoto",
          "addressProof",
          "bankStatementFile1",
          "shopPhoto",
          "shopAct",
          "udhyamAadhar",
          "itr",
        ];
      }
      if (stepIndex === 4) {
        return [
          "reference1Name",
          "reference1Contact",
          "reference2Name",
          "reference2Contact",
        ];
      }
      return [];
    })();

    const errors = {};
    for (const key of stepFields) {
      if (fullErrors[key]) errors[key] = fullErrors[key];
    }

    if (stepIndex === 0) {
      const rFirst = min3("First name must be at least 3 characters.").safeParse(formData.firstName);
      if (!rFirst.success) errors.firstName = rFirst.error.issues[0].message;

      const rLast = min3("Last name must be at least 3 characters.").safeParse(formData.lastName);
      if (!rLast.success) errors.lastName = rLast.error.issues[0].message;

      const rMother = min3("Mother name must be at least 3 characters.").safeParse(formData.motherName);
      if (!rMother.success) errors.motherName = rMother.error.issues[0].message;

      const rPhone = phoneSchema.safeParse(formData.phone);
      if (!rPhone.success) errors.phone = rPhone.error.issues[0].message;

      const rEmail = emailSchema.safeParse(formData.email);
      if (!rEmail.success) errors.email = rEmail.error.issues[0].message;

      const rPan = panSchema.safeParse(formData.panNumber);
      if (!rPan.success) errors.panNumber = rPan.error.issues[0].message;
    }

    if (stepIndex === 1) {
      const rPin = pinSchema.safeParse(formData.currentAddressPincode);
      if (!rPin.success) errors.currentAddressPincode = rPin.error.issues[0].message;
      const rPermPin = pinSchema.safeParse(formData.permanentAddressPincode);
      if (!rPermPin.success) errors.permanentAddressPincode = rPermPin.error.issues[0].message;
    }

    return errors;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "loanAmount"
          ? value === ""
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
    const file = files[0];
    if (file) {
      const err = validateLoanDocumentUpload(file, name);
      if (err) {
        toast.error(err);
        return;
      }
      setFormData((prev) => ({
        ...prev,
        [name]: file,
      }));
    }
  };

  const handleFileRemove = (fieldName) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
  };

  function validateForm(data, isSameAddress = sameAddress) {
    const errors = {};

    if (!data.firstName) errors.firstName = "First name is required.";
    if (!data.lastName) errors.lastName = "Last name is required.";
    if (!data.motherName) errors.motherName = "Mother name is required.";
    if (!data.gender) errors.gender = "Gender is required.";
    if (!data.maritalStatus) errors.maritalStatus = "Marital status is required.";
    if (data.maritalStatus === "Married" && !data.SpouseName) {
      errors.SpouseName = "Spouse name is required for married applicants.";
    }

    if (!data.loanPurpose) {
      errors.loanPurpose = "Loan purpose is required.";
    }
    if (data.hasRunningLoan === "YES" && (!data.monthlyEmiPaying || Number(data.monthlyEmiPaying) <= 0)) {
      errors.monthlyEmiPaying = "Monthly EMI is required when running loan is Yes.";
    }

    if (!data.phone) {
      errors.phone = "Phone number is required.";
    } else if (!/^\d{10}$/.test(data.phone)) {
      errors.phone = "Phone number must be 10 digits.";
    }

    if (!data.email) {
      errors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(data.email)) {
      errors.email = "Invalid email format.";
    }

    if (!data.panNumber) {
      errors.panNumber = "PAN Card Number is required.";
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(data.panNumber).toUpperCase())) {
      errors.panNumber = "Enter a valid PAN Card number (e.g., ABCDE1234F).";
    }

    if (!data.currentAddress) errors.currentAddress = "Current address is required.";
    const pin = data.currentAddressPincode?.trim();
    if (!pin) {
      errors.currentAddressPincode = "Current Address Pin is required.";
    } else if (!/^[1-9][0-9]{5}$/.test(pin)) {
      errors.currentAddressPincode = "Enter a valid 6-digit PIN code.";
    }
    if (!data.currentAddressOwnRented) errors.currentAddressOwnRented = "Ownership status is required.";
    if (!data.currentAddressStability) errors.currentAddressStability = "Stability is required.";

    if (!isSameAddress) {
      if (!data.permanentAddress) errors.permanentAddress = "Permanent address is required.";
      const permanentPin = data.permanentAddressPincode?.trim();
      if (!permanentPin) {
        errors.permanentAddressPincode = "Permanent Address Pin is required.";
      } else if (!/^[1-9][0-9]{5}$/.test(permanentPin)) {
        errors.permanentAddressPincode = "Enter a valid 6-digit PIN code.";
      }
      if (!data.permanentAddressOwnRented) errors.permanentAddressOwnRented = "Ownership status is required.";
      if (!data.permanentAddressStability) errors.permanentAddressStability = "Stability is required.";
    }

    if (!data.loanAmount || data.loanAmount <= 0) {
      errors.loanAmount = "Valid loan amount is required.";
    }

    if (!data.addressProof) errors.addressProof = "Address proof is required.";
    if (!data.aadharFront) errors.aadharFront = "Aadhar Front is required.";
    if (!data.aadharBack) errors.aadharBack = "Aadhar Back is required.";
    if (!data.panCard) errors.panCard = "Pan card document is required.";
    if (!data.selfie && !data.passportPhoto) errors.selfie = "Applicant photo is required.";

    // Business info
    if (!data.businessName) errors.businessName = "Business name is required.";
    if (!data.businessAddress) errors.businessAddress = "Business address is required.";
    if (!data.businessVintage) errors.businessVintage = "Business vintage is required.";
    if (!data.annualTurnover) errors.annualTurnover = "Annual Turnover is required.";

    // Collateral Property info
    if (!data.propertyType) errors.propertyType = "Property type is required.";
    if (!data.propertyValue) errors.propertyValue = "Property estimated value is required.";
    if (!data.propertyAddress) errors.propertyAddress = "Property address is required.";

    if (data.gender === "Female") {
      if (!data.coApplicantAadharFront) errors.coApplicantAadharFront = "Co-applicant Aadhar front is required.";
      if (!data.coApplicantAadharBack) errors.coApplicantAadharBack = "Co-applicant Aadhar back is required.";
      if (!data.coApplicantPan) errors.coApplicantPan = "Co-applicant PAN is required.";
      if (!data.coApplicantMobile) {
        errors.coApplicantMobile = "Co-applicant mobile is required.";
      } else if (!/^\d{10}$/.test(data.coApplicantMobile)) {
        errors.coApplicantMobile = "Mobile must be 10 digits.";
      }
      if (!data.coApplicantSelfie) errors.coApplicantSelfie = "Co-applicant selfie is required.";
    }

    if (!data.reference1Name) errors.reference1Name = "Reference 1 name is required.";
    if (!data.reference1Contact) {
      errors.reference1Contact = "Reference 1 contact is required.";
    } else if (!/^\d{10}$/.test(data.reference1Contact)) {
      errors.reference1Contact = "Reference 1 contact must be exactly 10 digits.";
    }

    if (!data.reference2Name) errors.reference2Name = "Reference 2 name is required.";
    if (!data.reference2Contact) {
      errors.reference2Contact = "Reference 2 contact is required.";
    } else if (!/^\d{10}$/.test(data.reference2Contact)) {
      errors.reference2Contact = "Reference 2 contact must be exactly 10 digits.";
    }

    return errors;
  }

  const renderError = (field) => {
    return fieldErrors[field] ? (
      <p className="text-red-500 text-xs mt-1">{fieldErrors[field]}</p>
    ) : null;
  };

  const handleNextStep = () => {
    const errs = validateLapSelfEmployedStep(currentStep);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      toast.error("Please fill in all required fields before proceeding.");
      return;
    }
    // Automatically capture Step 1 as a Lead in the system
    if (currentStep === 0 && !isRmMode) {
      captureLeadOnStep1Next({
        loanType: "LAP_SELF_EMPLOYED",
        formData,
        isPartnerLoggedIn,
        partnerToken,
        partnerReferralCode: currentPartnerCode,
        applicationId,
      }).then((res) => {
        if (res?.applicationId && !applicationId) {
          setApplicationId(res.applicationId);
        }
      }).catch((err) => console.warn("Step 1 lead capture non-fatal:", err));
    }

    const next = currentStep + 1;
    setCurrentStep(next);
    if (next > maxStep) setMaxStep(next);
  };

  const handlePrevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    setFieldErrors({});
    setValidationErrors([]);
    setSuccessMessage("");
    setSavedApplication(null);

    try {
      const errors = validateForm(formData);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setValidationErrors(Object.values(errors));
        setLoading(false);
        return;
      }

      const applicationData = {
        loanType: "LAP_SELF_EMPLOYED",
        partnerReferralCode: isPartnerLoggedIn
          ? undefined
          : formData.partnerReferralCode?.trim() || undefined,
        customer: {
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          alternateContact: formData.alternateContact,
          gender: formData.gender,
          motherName: formData.motherName,
          maritalStatus: formData.maritalStatus,
          spouseName: formData.SpouseName,
          panNumber: formData.panNumber,
          loanAmount: formData.loanAmount ? Number(formData.loanAmount) : 0,
          currentAddress: formData.currentAddress,
          currentAddressPincode: formData.currentAddressPincode,
          currentAddressOwnRented: formData.currentAddressOwnRented,
          currentAddressStability: formData.currentAddressStability,
          currentAddressLandmark: formData.currentAddressLandmark,
          permanentAddress: sameAddress ? formData.currentAddress : formData.permanentAddress,
          permanentAddressPincode: sameAddress ? formData.currentAddressPincode : formData.permanentAddressPincode,
          permanentAddressOwnRented: sameAddress ? formData.currentAddressOwnRented : formData.permanentAddressOwnRented,
          permanentAddressStability: sameAddress ? formData.currentAddressStability : formData.permanentAddressStability,
          permanentAddressLandmark: sameAddress ? formData.currentAddressLandmark : formData.permanentAddressLandmark,
          password: formData.password,
          bankStatementPassword: formData.bankStatementPassword,
          hasRunningLoan: formData.hasRunningLoan,
          monthlyEmiPaying: formData.hasRunningLoan === "YES" ? Number(formData.monthlyEmiPaying) || 0 : 0,
          loanPurpose: formData.loanPurpose,
        },
        hasRunningLoan: formData.hasRunningLoan,
        monthlyEmiPaying: formData.hasRunningLoan === "YES" ? Number(formData.monthlyEmiPaying) || 0 : 0,
        loanPurpose: formData.loanPurpose,
        product: {
          businessName: formData.businessName,
          businessAddress: formData.businessAddress,
          businessLandmark: formData.businessLandmark,
          businessVintage: formData.businessVintage,
          gstNumber: formData.gstNumber,
          annualTurnoverInINR: formData.annualTurnover,
          propertyType: formData.propertyType,
          propertyValue: formData.propertyValue ? Number(formData.propertyValue) : undefined,
          propertyAddress: formData.propertyAddress,
        },
        propertyType: formData.propertyType,
        propertyValue: formData.propertyValue ? Number(formData.propertyValue) : undefined,
        propertyAddress: formData.propertyAddress,
        references: [
          { name: formData.reference1Name, phone: formData.reference1Contact },
          { name: formData.reference2Name, phone: formData.reference2Contact },
        ],
        coApplicant:
          formData.gender === "Female"
            ? {
                aadharFront: formData.coApplicantAadharFront,
                aadharBack: formData.coApplicantAadharBack,
                panCard: formData.coApplicantPan,
                phone: formData.coApplicantMobile,
                selfie: formData.coApplicantSelfie,
              }
            : undefined,
      };

      const formDataToSend = new FormData();
      formDataToSend.append("data", JSON.stringify(applicationData));

      const docsQueue = [];
      if (formData.aadharFront) docsQueue.push({ file: formData.aadharFront, type: "AADHAR_FRONT" });
      if (formData.aadharBack) docsQueue.push({ file: formData.aadharBack, type: "AADHAR_BACK" });
      if (formData.panCard) docsQueue.push({ file: formData.panCard, type: "PAN" });
      if (formData.addressProof) docsQueue.push({ file: formData.addressProof, type: "ADDRESS_PROOF" });
      if (formData.shopAct) docsQueue.push({ file: formData.shopAct, type: "SHOP_ACT" });
      if (formData.udhyamAadhar) docsQueue.push({ file: formData.udhyamAadhar, type: "UDHYAM_AADHAR" });
      if (formData.itr) docsQueue.push({ file: formData.itr, type: "ITR" });
      if (formData.gstDoc) docsQueue.push({ file: formData.gstDoc, type: "GST" });
      if (formData.shopPhoto) docsQueue.push({ file: formData.shopPhoto, type: "SHOP_PHOTO" });
      if (formData.bankStatementFile1) docsQueue.push({ file: formData.bankStatementFile1, type: "BANK_STATEMENT_1" });
      if (formData.bankStatementFile2) docsQueue.push({ file: formData.bankStatementFile2, type: "BANK_STATEMENT_2" });
      if (formData.passportPhoto || formData.selfie) {
        docsQueue.push({ file: formData.passportPhoto || formData.selfie, type: "PHOTO" });
      }

      // Collateral property documents
      if (formData.titleDeeds) docsQueue.push({ file: formData.titleDeeds, type: "TITLE_DEEDS" });
      if (formData.sanctionedPlan) docsQueue.push({ file: formData.sanctionedPlan, type: "SANCTIONED_PLAN" });
      if (formData.propertyTaxReceipt) docsQueue.push({ file: formData.propertyTaxReceipt, type: "PROPERTY_TAX_RECEIPT" });
      if (formData.agreementCopy) docsQueue.push({ file: formData.agreementCopy, type: "AGREEMENT_COPY" });
      if (formData.allotmentLetter) docsQueue.push({ file: formData.allotmentLetter, type: "ALLOTMENT_LETTER" });

      if (formData.gender === "Female") {
        if (formData.coApplicantAadharFront) docsQueue.push({ file: formData.coApplicantAadharFront, type: "CO_APPLICANT_AADHAR_FRONT" });
        if (formData.coApplicantAadharBack) docsQueue.push({ file: formData.coApplicantAadharBack, type: "CO_APPLICANT_AADHAR_BACK" });
        if (formData.coApplicantPan) docsQueue.push({ file: formData.coApplicantPan, type: "CO_APPLICANT_PAN" });
        if (formData.coApplicantSelfie) docsQueue.push({ file: formData.coApplicantSelfie, type: "CO_APPLICANT_SELFIE" });
      }

      const oversize = findOversizeInLoanDocsQueue(docsQueue);
      if (oversize) {
        const msg = formatLoanDocOversizeError(oversize);
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      docsQueue.forEach(({ file, type }) => {
        if (file) {
          formDataToSend.append("docs", file);
          formDataToSend.append("docTypes", type);
        }
      });

      if (isRmMode) {
        if (!applicationId) {
          setError("Missing application id. Open this form from Leads → Complete form yourself.");
          setLoading(false);
          return;
        }
        abortControllerRef.current = new AbortController();
        const response = await axios.post(
          rmCompleteLoanFormUrl(applicationId),
          formDataToSend,
          {
            headers: { Authorization: `Bearer ${rmToken}` },
            timeout: 120000,
            maxContentLength: 100 * 1024 * 1024,
            maxBodyLength: 100 * 1024 * 1024,
            signal: abortControllerRef.current.signal,
          }
        );
        const data = response.data;
        setSavedApplication(data);
        setSuccessMessage(data.message || "Application form completed successfully.");
        toast.success(data.message || "Loan form completed");
        setTimeout(() => navigate("/rm/leads"), 1200);
        return;
      }

      const endpoint = isPartnerLoggedIn
        ? `${backendurl}/partner/create-applications`
        : `${backendurl}/partner/public/create-application`;

      const headers = isPartnerLoggedIn
        ? {
            Authorization: `Bearer ${partnerToken}`,
          }
        : {};

      const response = await axios.post(endpoint, formDataToSend, { headers });

      if (response.data.success || response.data.application) {
        setSuccessMessage("LAP application submitted successfully!");
        setSavedApplication(response.data.application);
        toast.success("Application created successfully!");
      }
    } catch (err) {
      console.error("Submission error:", err);
      const msg = err.response?.data?.message || "Failed to submit application.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-5xl mx-auto ${embed ? "p-0" : "p-4 sm:p-6"}`}>
      {isRmMode && (
        <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-teal-900">
          <p className="font-semibold">
            Completing loan form as RM
            {resumeMeta?.appNo ? ` · App ${resumeMeta.appNo}` : ""}
            {resumeMeta?.status ? ` · ${resumeMeta.status}` : ""}
          </p>
          <p className="text-sm mt-1">
            Prefill any half-filled customer/partner details, finish remaining fields and documents, then submit.
          </p>
          {loadingResume && (
            <p className="text-sm mt-1 text-teal-700">Loading existing application…</p>
          )}
        </div>
      )}

      {/* Customer Trust Banner & Partner Certificate Info */}
      {!isPartnerLoggedIn && (
        <PublicLoanPartnerTrustBanner
          partner={partnerInfo || (defaultReferralCode ? { partnerCode: defaultReferralCode } : null)}
          loanTitle="LAP Loan (Self-Employed)"
        />
      )}

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white">
                <Store className="w-6 h-6" />
              </span>
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-teal-300">
                  Loan Against Property · Self-Employed
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold">
                  LAP Loan Application
                </h1>
              </div>
            </div>

            {isPartnerLoggedIn && (
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-teal-800 hover:bg-teal-50 font-bold text-xs shadow-md transition transform hover:scale-105 active:scale-95 flex-shrink-0"
                title="Share customer application link"
              >
                <Share2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Share Customer Link</span>
              </button>
            )}
          </div>
          <p className="text-sm text-teal-100 max-w-2xl">
            Loan Against Property for business owners, entrepreneurs, and self-employed professionals pledging property.
          </p>
        </div>

        {/* Stepper */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <LoanStepper
            steps={steps}
            currentStep={currentStep}
            maxStep={maxStep}
            onStepClick={(idx) => {
              if (idx <= maxStep) setCurrentStep(idx);
            }}
          />
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Step 0: Personal */}
          {currentStep === 0 && (
            <section className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("firstName")}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Middle Name *
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    placeholder="Enter middle name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("middleName")}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter last name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("lastName")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    maxLength={10}
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile number"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("phone")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="applicant@email.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("email")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    PAN Card Number *
                  </label>
                  <input
                    type="text"
                    name="panNumber"
                    maxLength={10}
                    value={formData.panNumber}
                    onChange={(e) =>
                      handleInputChange({
                        target: { name: "panNumber", value: e.target.value.toUpperCase() },
                      })
                    }
                    placeholder="ABCDE1234F"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm uppercase"
                  />
                  {renderError("panNumber")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {renderError("gender")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Marital Status *
                  </label>
                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  >
                    <option value="">Select Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                  {renderError("maritalStatus")}
                </div>

                {formData.maritalStatus === "Married" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Spouse Name
                    </label>
                    <input
                      type="text"
                      name="SpouseName"
                      value={formData.SpouseName}
                      onChange={handleInputChange}
                      placeholder="Spouse full name"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mother's Name *
                  </label>
                  <input
                    type="text"
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleInputChange}
                    placeholder="Mother's full name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("motherName")}
                </div>

                {formData.gender === "Female" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Co-Applicant Mobile (Female Applicant) *
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      name="coApplicantMobile"
                      value={formData.coApplicantMobile}
                      onChange={handleInputChange}
                      placeholder="Co-applicant phone"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                    {renderError("coApplicantMobile")}
                  </div>
                )}

                {/* Financial Details (Running Loan, Monthly EMI, Loan Purpose) */}
                <LoanApplicantFinancialFields
                  formData={formData}
                  handleInputChange={handleInputChange}
                  renderError={renderError}
                  fieldErrors={fieldErrors}
                />
              </div>
            </section>
          )}

          {/* Step 1: Address */}
          {currentStep === 1 && (
            <section className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-600" />
                Current & Permanent Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Current Address *
                  </label>
                  <textarea
                    name="currentAddress"
                    rows="2"
                    value={formData.currentAddress}
                    onChange={handleInputChange}
                    placeholder="Full residential address"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("currentAddress")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Current Landmark
                  </label>
                  <input
                    type="text"
                    name="currentAddressLandmark"
                    value={formData.currentAddressLandmark}
                    onChange={handleInputChange}
                    placeholder="Nearby landmark"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Current Pincode *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    name="currentAddressPincode"
                    value={formData.currentAddressPincode}
                    onChange={handleInputChange}
                    placeholder="6-digit PIN code"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("currentAddressPincode")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    House Ownership Status *
                  </label>
                  <select
                    name="currentAddressOwnRented"
                    value={formData.currentAddressOwnRented}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  >
                    <option value="">Select Status</option>
                    <option value="Owned">Owned</option>
                    <option value="Rented">Rented</option>
                    <option value="Parental">Parental / Family Owned</option>
                  </select>
                  {renderError("currentAddressOwnRented")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Stability (Years) *
                  </label>
                  <input
                    type="text"
                    name="currentAddressStability"
                    value={formData.currentAddressStability}
                    onChange={handleInputChange}
                    placeholder="e.g. 4 Years"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("currentAddressStability")}
                </div>

                <div className="md:col-span-2 pt-4 border-t border-slate-200">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={sameAddress}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSameAddress(checked);
                        if (checked) {
                          setFormData((p) => ({
                            ...p,
                            permanentAddress: p.currentAddress,
                            permanentAddressLandmark: p.currentAddressLandmark,
                            permanentAddressPincode: p.currentAddressPincode,
                            permanentAddressOwnRented: p.currentAddressOwnRented,
                            permanentAddressStability: p.currentAddressStability,
                          }));
                        }
                      }}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                    Permanent Address is same as Current Address
                  </label>
                </div>

                {!sameAddress && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Permanent Address *
                      </label>
                      <textarea
                        name="permanentAddress"
                        rows="2"
                        value={formData.permanentAddress}
                        onChange={handleInputChange}
                        placeholder="Permanent residential address"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                      />
                      {renderError("permanentAddress")}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Permanent Pincode *
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        name="permanentAddressPincode"
                        value={formData.permanentAddressPincode}
                        onChange={handleInputChange}
                        placeholder="6-digit PIN code"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                      />
                      {renderError("permanentAddressPincode")}
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {/* Step 2: Business, Loan & Collateral Property */}
          {currentStep === 2 && (
            <section className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-teal-600" />
                Business & Collateral Property Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Requested Loan Amount (₹) *
                  </label>
                  <input
                    type="number"
                    name="loanAmount"
                    value={formData.loanAmount}
                    onChange={handleInputChange}
                    placeholder="e.g. 5000000"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("loanAmount")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="Enterprise / enterprise name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("businessName")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Business Vintage (Years) *
                  </label>
                  <input
                    type="number"
                    name="businessVintage"
                    value={formData.businessVintage}
                    onChange={handleInputChange}
                    placeholder="Years in business"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("businessVintage")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Annual Turnover (₹) *
                  </label>
                  <input
                    type="number"
                    name="annualTurnover"
                    value={formData.annualTurnover}
                    onChange={handleInputChange}
                    placeholder="e.g. 4000000"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("annualTurnover")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    GST Number (Optional)
                  </label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    placeholder="GSTIN number"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Business Landmark
                  </label>
                  <input
                    type="text"
                    name="businessLandmark"
                    value={formData.businessLandmark}
                    onChange={handleInputChange}
                    placeholder="Near market / landmark"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Business / Shop Address *
                  </label>
                  <textarea
                    name="businessAddress"
                    rows="2"
                    value={formData.businessAddress}
                    onChange={handleInputChange}
                    placeholder="Full business office / shop address"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {renderError("businessAddress")}
                </div>

                {/* Collateral Property Details */}
                <div className="md:col-span-2 pt-6 border-t border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Building className="w-5 h-5 text-teal-600" />
                    Pledged Property (Collateral) Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Property Type *
                      </label>
                      <select
                        name="propertyType"
                        value={formData.propertyType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                      >
                        <option value="RESIDENTIAL">Residential (Flat / House / Villa)</option>
                        <option value="COMMERCIAL">Commercial (Shop / Office / Building)</option>
                        <option value="INDUSTRIAL">Industrial (Factory / Warehouse / Shed)</option>
                        <option value="PLOT">Residential / Commercial Plot</option>
                      </select>
                      {renderError("propertyType")}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Estimated Market Value (₹) *
                      </label>
                      <input
                        type="number"
                        name="propertyValue"
                        value={formData.propertyValue}
                        onChange={handleInputChange}
                        placeholder="Estimated value in ₹"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                      />
                      {renderError("propertyValue")}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Complete Property Address *
                      </label>
                      <textarea
                        name="propertyAddress"
                        rows="2"
                        value={formData.propertyAddress}
                        onChange={handleInputChange}
                        placeholder="Address of property offered as collateral"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                      />
                      {renderError("propertyAddress")}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Step 3: Documents */}
          {currentStep === 3 && (
            <section className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                Upload Documents
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                    KYC Documents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DocumentUploadCard
                      name="aadharFront"
                      label="Aadhaar Front *"
                      file={formData.aadharFront}
                      required
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                      error={renderError("aadharFront")}
                    />
                    <DocumentUploadCard
                      name="aadharBack"
                      label="Aadhaar Back *"
                      file={formData.aadharBack}
                      required
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                      error={renderError("aadharBack")}
                    />
                    <DocumentUploadCard
                      name="panCard"
                      label="PAN Card *"
                      file={formData.panCard}
                      required
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                      error={renderError("panCard")}
                    />
                    <DocumentUploadCard
                      name="selfie"
                      label="Applicant Photo / Selfie *"
                      file={formData.selfie}
                      required
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                      error={renderError("selfie")}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                    Business Documents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DocumentUploadCard
                      name="shopAct"
                      label="Shop Act / Gumasta License"
                      file={formData.shopAct}
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                    />
                    <DocumentUploadCard
                      name="udhyamAadhar"
                      label="Udyam / MSME Certificate"
                      file={formData.udhyamAadhar}
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                    />
                    <DocumentUploadCard
                      name="itr"
                      label="Income Tax Return (ITR)"
                      file={formData.itr}
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                    />
                    <DocumentUploadCard
                      name="gstDoc"
                      label="GST Certificate"
                      file={formData.gstDoc}
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                    />
                    <DocumentUploadCard
                      name="shopPhoto"
                      label="Shop / Office Photo"
                      file={formData.shopPhoto}
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                    />
                    <DocumentUploadCard
                      name="bankStatementFile1"
                      label="Bank Statement 1 (Current / Savings) *"
                      file={formData.bankStatementFile1}
                      required
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                      error={renderError("bankStatementFile1")}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                    Collateral Property Documents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DocumentUploadCard
                      name="titleDeeds"
                      label="Title Deeds / Sale Deed / Conveyance"
                      file={formData.titleDeeds}
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                    />
                    <DocumentUploadCard
                      name="sanctionedPlan"
                      label="Sanctioned Map / Building Plan"
                      file={formData.sanctionedPlan}
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                    />
                    <DocumentUploadCard
                      name="propertyTaxReceipt"
                      label="Latest Property Tax Receipt / Utility Bill"
                      file={formData.propertyTaxReceipt}
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                    />
                    <DocumentUploadCard
                      name="agreementCopy"
                      label="Prior Chain Documents / Agreement Copy"
                      file={formData.agreementCopy}
                      onChange={handleFileChange}
                      onRemove={handleFileRemove}
                    />
                  </div>
                </div>

                {formData.gender === "Female" && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                      Co-Applicant Documents (Female Applicant)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DocumentUploadCard
                        name="coApplicantAadharFront"
                        label="Co-Applicant Aadhaar Front *"
                        file={formData.coApplicantAadharFront}
                        required
                        onChange={handleFileChange}
                        onRemove={handleFileRemove}
                        error={renderError("coApplicantAadharFront")}
                      />
                      <DocumentUploadCard
                        name="coApplicantAadharBack"
                        label="Co-Applicant Aadhaar Back *"
                        file={formData.coApplicantAadharBack}
                        required
                        onChange={handleFileChange}
                        onRemove={handleFileRemove}
                        error={renderError("coApplicantAadharBack")}
                      />
                      <DocumentUploadCard
                        name="coApplicantPan"
                        label="Co-Applicant PAN Card *"
                        file={formData.coApplicantPan}
                        required
                        onChange={handleFileChange}
                        onRemove={handleFileRemove}
                        error={renderError("coApplicantPan")}
                      />
                      <DocumentUploadCard
                        name="coApplicantSelfie"
                        label="Co-Applicant Photo / Selfie *"
                        file={formData.coApplicantSelfie}
                        required
                        onChange={handleFileChange}
                        onRemove={handleFileRemove}
                        error={renderError("coApplicantSelfie")}
                      />
                    </div>
                  </div>
                )}

                <LoanAddressProofBlock
                  stepLabel="4.4"
                  file={formData.addressProof}
                  onChange={(f) => setFormData((p) => ({ ...p, addressProof: f }))}
                  renderError={renderError}
                />
              </div>
            </section>
          )}

          {/* Step 4: References */}
          {currentStep === 4 && (
            <section className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                References
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <h3 className="font-bold text-sm text-slate-800 mb-3">Reference 1</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="reference1Name"
                        value={formData.reference1Name}
                        onChange={handleInputChange}
                        placeholder="Reference full name"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                      {renderError("reference1Name")}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        name="reference1Contact"
                        value={formData.reference1Contact}
                        onChange={handleInputChange}
                        placeholder="10-digit mobile number"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                      {renderError("reference1Contact")}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <h3 className="font-bold text-sm text-slate-800 mb-3">Reference 2</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="reference2Name"
                        value={formData.reference2Name}
                        onChange={handleInputChange}
                        placeholder="Reference full name"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                      {renderError("reference2Name")}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        name="reference2Contact"
                        value={formData.reference2Contact}
                        onChange={handleInputChange}
                        placeholder="10-digit mobile number"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                      {renderError("reference2Contact")}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Step 5: Security & Review */}
          {currentStep === 5 && (
            <section className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                Security & Review
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Account Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter strong password"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {renderError("password")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Repeat password"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {renderError("confirmPassword")}
                </div>
              </div>

              {/* Review card */}
              <div className="p-6 rounded-2xl bg-teal-50/50 border border-teal-100 text-sm text-slate-700 space-y-2">
                <h3 className="font-bold text-teal-900 text-base">Application Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  <p><span className="font-semibold text-slate-500">Applicant:</span> {formData.firstName} {formData.lastName}</p>
                  <p><span className="font-semibold text-slate-500">Loan Product:</span> LAP (Self-Employed)</p>
                  <p><span className="font-semibold text-slate-500">Loan Amount:</span> ₹{Number(formData.loanAmount || 0).toLocaleString()}</p>
                  <p><span className="font-semibold text-slate-500">Business:</span> {formData.businessName}</p>
                  <p><span className="font-semibold text-slate-500">Property:</span> {formData.propertyType}</p>
                  <p><span className="font-semibold text-slate-500">Property Value:</span> ₹{Number(formData.propertyValue || 0).toLocaleString()}</p>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
                  {successMessage}
                  {savedApplication?.appNo && (
                    <span className="block font-bold mt-1">Application No: {savedApplication.appNo}</span>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 0 || loading}
              className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-8 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md transition"
              >
                Next Step
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md transition disabled:opacity-60"
              >
                {loading ? "Submitting Application..." : "Submit LAP Application"}
              </button>
            )}
          </div>
        </div>
      </div>

      {isPartnerLoggedIn && (
        <ShareLoanModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          loan={{
            id: "lap-business",
            title: "LAP (Self-Employed)",
            badge: "Upto ₹5Cr",
            route: "/partner/application/lap-loan-self-employed",
            hasSubTypes: false,
          }}
          partnerCode={currentPartnerCode}
          partnerName={currentPartnerName}
        />
      )}
    </div>
  );
}
