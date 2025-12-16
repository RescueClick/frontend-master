//updTED CODE

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
  X,
} from "lucide-react";
import Modal from "../../../../components/Modal"; // Assume you have or will create a Modal component
import axios from "axios";
import { getAuthData } from "../../../../utils/localStorage";
import { backendurl } from "../../../../feature/urldata";

export default function HomeLoanSelfEmployee() {
  const defaultReferralCode = "PT-D4CTD8B2"
  const { partnerToken } = getAuthData();
  const isPartnerLoggedIn = Boolean(partnerToken);

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
  const [modalOpen, setModalOpen] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [savedApplication, setSavedApplication] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const abortControllerRef = useRef(null);

  // Cleanup function to cancel pending requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // const handleInputChange = (e) => {
  //     const { name, value } = e.target;
  //     setFormData((prev) => ({
  //       ...prev,
  //       [name]: value,
  //     }));
  //   };


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

  const renderError = (field) =>
    fieldErrors[field] ? (
      <p className="text-xs text-red-600 mt-1">{fieldErrors[field]}</p>
    ) : null;



  function validateForm(formData, sameAddress) {
    const errors = {};

    // Personal info
    if (!formData.firstName) errors.firstName = "First name is required.";
    if (!formData.lastName) errors.lastName = "Last name is required.";
    if (!formData.motherName) errors.motherName = "Mother name is required.";

    if (!formData.gender) errors.gender = "Gender is required.";
    if (!formData.maritalStatus) errors.maritalStatus = "Marital status is required.";
    // Spouse name required if married
    if (formData.maritalStatus === "married" && !formData.SpouseName) {
      errors.SpouseName = "Spouse name is required for married applicants.";
    }


    if (!formData.phone) {
      errors.phone = "Phone number is required.";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      errors.phone = "Phone number must be 10 digits.";
    }

    if (!formData.email) {
      errors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = "Invalid email format.";
    }
    // if (!formData.panNumber) errors.panNumber = "Pan Card Number is required."

    if (!formData.panNumber) {
      errors.panNumber = "PAN Card Number is required";
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.toUpperCase())) {
      errors.panNumber = "Enter a valid PAN Card number (e.g., ABCDE1234F)";
    }


    // Current address
    if (!formData.currentAddress)
      errors.currentAddress = "Current address is required.";

    // if (!formData.currentAddressPincode)
    //   errors.currentAddressPincode = "Pincode is required.";

    const pin = formData.currentAddressPincode?.trim();

    if (!pin) {
      errors.currentAddressPincode = "Current Address Pin is required.";
    } else if (!/^[1-9][0-9]{5}$/.test(pin)) {
      errors.currentAddressPincode = "Enter a valid 6-digit PIN code.";
    }


    if (!formData.currentAddressOwnRented)
      errors.currentAddressOwnRented = "Ownership status is required.";
    if (!formData.currentAddressStability)
      errors.currentAddressStability = "Stability is required.";

    // Permanent address if not same
    if (!sameAddress) {
      if (!formData.permanentAddress)
        errors.permanentAddress = "Permanent address is required.";

      // if (!formData.permanentAddressPincode)
      //   errors.permanentAddressPincode = "Pincode is required.";

      const permanentPin = formData.permanentAddressPincode?.trim();

      if (!permanentPin) {
        errors.permanentAddressPincode = "Permanent Address Pin is required.";
      } else if (!/^[1-9][0-9]{5}$/.test(permanentPin)) {
        errors.permanentAddressPincode = "Enter a valid 6-digit PIN code.";
      }


      if (!formData.permanentAddressOwnRented)
        errors.permanentAddressOwnRented = "Ownership status is required.";
      if (!formData.permanentAddressStability)
        errors.permanentAddressStability = "Stability is required.";
    }


    if (!formData.loanAmount || formData.loanAmount < 5000 || formData.loanAmount > 10000000) {
      errors.loanAmount = "Loan amount must be between ₹5,000 and ₹1,00,00,000.";
    }


    // At least one address proof
    if (!formData.lightBill && !formData.utilityBill && !formData.rentAgreement) {
      errors.addressProof = "At least one address proof is required.";
    }

    
    if (!formData.aadharFront) errors.aadharFront = "Aadhar Front is required";
    if (!formData.aadharBack) errors.aadharBack = "Aadhar Back is required";
    if (!formData.panCard) errors.panCard = "Pan card number is required.";
    if (!formData.selfie) errors.selfie = "Upload selfie is required."


    // Business info
    if (!formData.businessName)
      errors.businessName = "Business name is required.";
    if (!formData.businessAddress)
      errors.businessAddress = "Business address is required.";
    if (!formData.businessVintage)
      errors.businessVintage = "Business vintage is required.";
    if (!formData.annualTurnover)
      errors.annualTurnover = "Annual Turnover is required. "


    // Female applicant requires co-applicant docs
    if (formData.gender === "female") {
      if (!formData.coApplicantAadharFront)
        errors.coApplicantAadharFront = "Co-applicant Aadhar front is required.";
      if (!formData.coApplicantAadharBack)
        errors.coApplicantAadharBack = "Co-applicant Aadhar back is required.";
      if (!formData.coApplicantPan)
        errors.coApplicantPan = "Co-applicant PAN is required.";
      if (!formData.coApplicantMobile)
        errors.coApplicantMobile = "Co-applicant mobile is required.";
      else if (!/^\d{10}$/.test(formData.coApplicantMobile)) {
        errors.coApplicantMobile = "Mobile must be 10 digits.";
      }
      if (!formData.coApplicantSelfie)
        errors.coApplicantSelfie = "Co-applicant selfie is required.";
    }

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


    if (!formData.bankStatementFile1) errors.bankStatementFile1 = "Bank Statement is required.";

    // business document

    //  shopPhoto: null,
    // shopAct: null,
    // udhyamAadhar: null,
    // itr: null,

    if (!formData.shopPhoto)
      errors.shopPhoto = "Shop Photo is required.";

    if (!formData.shopAct)
      errors.shopAct = "Shop and Establishment Act/ Gumasta License is required.";

    if (!formData.itr)
      errors.itr = "ITR is required.";

    if (!formData.udhyamAadhar)
      errors.udhyamAadhar = "Udhyam Aadhar is required."



    return errors;
  }



  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setValidationErrors([]);
    setSuccessMessage("");
    setSavedApplication(null);
    try {
      const errors = validateForm(formData, sameAddress);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setLoading(false);
        return;
      }
      if (error) {
        setValidationErrors([error]);
        setLoading(false);
        return;
      }

      // Build nested JSON structure
      const applicationData = {
        partnerReferralCode: isPartnerLoggedIn
          ? undefined
          : formData.partnerReferralCode?.trim() || undefined,
        customer: {
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          alternatePhone: formData.alternateContact,
          gender: formData.gender,
          motherName: formData.motherName,
          maritalStatus: formData.maritalStatus,
          SpouseName: formData.SpouseName,
          panNumber: formData.panNumber,
          loanAmount: formData.loanAmount || 0,
          currentAddress: formData.currentAddress,
          currentAddressPincode: formData.currentAddressPincode,
          currentAddressOwnRented: formData.currentAddressOwnRented,
          currentAddressStability: formData.currentAddressStability,
          currentAddressLandmark: formData.currentAddressLandmark,
          permanentAddress: formData.permanentAddress,
          permanentAddressPincode: formData.permanentAddressPincode,
          permanentAddressOwnRented: formData.permanentAddressOwnRented,
          permanentAddressStability: formData.permanentAddressStability,
          permanentAddressLandmark: formData.permanentAddressLandmark,
        },
        product: {
          businessName: formData.businessName,
          businessAddress: formData.businessAddress,
          businessLandmark: formData.businessLandmark,
          businessVintage: formData.businessVintage,
          gstNumber: formData.gstNumber,
          annualTurnoverInINR: formData.annualTurnover,
        },
        loanType: "HOME_LOAN_SELF_EMPLOYED",
        references: [
          {
            name: formData.reference1Name,
            relation: "Reference 1",
            phone: formData.reference1Contact,
          },
          {
            name: formData.reference2Name,
            relation: "Reference 2",
            phone: formData.reference2Contact,
          },
        ],
        coApplicant:
          formData.gender === "female"
            ? {
              aadharFront: formData.coApplicantAadharFront,
              aadharBack: formData.coApplicantAadharBack,
              panCard: formData.coApplicantPan,
              phone: formData.coApplicantMobile,
              selfie: formData.coApplicantSelfie,
            }
            : undefined,
      };

      // Prepare FormData with ordered docs/docTypes
      const formDataToSend = new FormData();
      formDataToSend.append("data", JSON.stringify(applicationData));

      const docsQueue = [];
      if (formData.aadharFront)
        docsQueue.push({ file: formData.aadharFront, type: "AADHAR_FRONT" });
      if (formData.aadharBack)
        docsQueue.push({ file: formData.aadharBack, type: "AADHAR_BACK" });
      if (formData.panCard)
        docsQueue.push({ file: formData.panCard, type: "PAN" });
      if (formData.lightBill)
        docsQueue.push({ file: formData.lightBill, type: "LIGHT_BILL" });
      if (formData.utilityBill)
        docsQueue.push({ file: formData.utilityBill, type: "UTILITY_BILL" });
      if (formData.rentAgreement)
        docsQueue.push({
          file: formData.rentAgreement,
          type: "RENT_AGREEMENT",
        });
      if (formData.shopAct)
        docsQueue.push({ file: formData.shopAct, type: "SHOP_ACT" });
      if (formData.udhyamAadhar)
        docsQueue.push({ file: formData.udhyamAadhar, type: "UDHYAM_AADHAR" });
      if (formData.itr) docsQueue.push({ file: formData.itr, type: "ITR" });
      if (formData.gstDoc)
        docsQueue.push({ file: formData.gstDoc, type: "GST" });
      if (formData.businessOtherDocs)
        docsQueue.push({
          file: formData.businessOtherDocs,
          type: "BUSINESS_OTHER_DOCS",
        });
      if (formData.shopPhoto)
        docsQueue.push({ file: formData.shopPhoto, type: "SHOP_PHOTO" });
      if (formData.bankStatementFile1)
        docsQueue.push({
          file: formData.bankStatementFile1,
          type: "BANK_STATEMENT_1",
        });
      if (formData.bankStatementFile2)
        docsQueue.push({
          file: formData.bankStatementFile2,
          type: "BANK_STATEMENT_2",
        });
      if (formData.selfie)
        docsQueue.push({ file: formData.selfie, type: "SELFIE" });

      // Co-applicant documents for female applicants
      if (formData.gender === "female") {
        if (formData.coApplicantAadharFront)
          docsQueue.push({
            file: formData.coApplicantAadharFront,
            type: "CO_APPLICANT_AADHAR_FRONT",
          });
        if (formData.coApplicantAadharBack)
          docsQueue.push({
            file: formData.coApplicantAadharBack,
            type: "CO_APPLICANT_AADHAR_BACK",
          });
        if (formData.coApplicantPan)
          docsQueue.push({
            file: formData.coApplicantPan,
            type: "CO_APPLICANT_PAN",
          });
        if (formData.coApplicantSelfie)
          docsQueue.push({
            file: formData.coApplicantSelfie,
            type: "CO_APPLICANT_SELFIE",
          });
      }

      docsQueue.forEach(({ file, type }) => {
        formDataToSend.append("docs", file);
        formDataToSend.append("docTypes", type);
      });


      if (!checkFileSize(docsQueue)) {
        setLoading(false);
        return;
      }
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
        data.message || "Application saved successfully. You can submit now."
      );
      setModalOpen(true);
    } catch (err) {
      // Handle different error types
      if (axios.isCancel(err)) {
        setError("Request was cancelled. Please try again.");
      } else if (err.code === 'ECONNABORTED') {
        setError("Request timeout. Please check your connection and try again.");
      } else if (err.response) {
        // Server responded with error status
        setError(
          err.response?.data?.message || err.message || "Something went wrong."
        );
        setValidationErrors(err.response?.data?.errors || []);
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

  const handleApplyNow = async () => {
    if (!applicationId) return;
    setLoading(true);
    setError("");
    try {
      const { partnerToken } = getAuthData();
      if (!partnerToken) {
        setModalOpen(false);
        return;
      }
      // Create AbortController for request cancellation
      abortControllerRef.current = new AbortController();

      await axios.post(
        `${backendurl}/partner/applications/${applicationId}/submit`,
        {},
        {
          headers: {
            Authorization: `Bearer ${partnerToken}`,
          },
          timeout: 30000, // 30 seconds timeout
          signal: abortControllerRef.current.signal,
        }
      );
      setModalOpen(false);
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



  const resetFields = () => {
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

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: "#F8FAFC" }}
    >
      <div className="max-w-4xl mx-auto">
        {successMessage && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
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
            style={{ backgroundColor: "#12B99C" }}
          >
            <h1 className="text-3xl font-bold text-center">
              Home Loan Application (Self Employed)
            </h1>
            <p className="text-center mt-2 opacity-90">
              Complete all fields to process your business loan application
            </p>
          </div>

          <div className="p-8 space-y-8">
            {/* Personal Information */}
            <section>
              <h2
                className="text-2xl font-semibold mb-6 flex items-center gap-3"
                style={{ color: "#111827" }}
              >
                <User className="w-6 h-6" style={{ color: "#12B99C" }} />
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
                      borderColor: "#12B99C",
                      backgroundColor: "#F8FAFC",
                    }}
                    placeholder="Enter your first name"
                    required
                  />

                  {formData.firstName ? " " : renderError('firstName')}

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
                      borderColor: "#12B99C",
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
                      borderColor: "#12B99C",
                      backgroundColor: "#F8FAFC",
                    }}
                    placeholder="Enter your last name"
                    required
                  />

                  {formData.lastName ? "" : renderError('lastName')}
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
                      borderColor: "#12B99C",
                      backgroundColor: "#F8FAFC",
                    }}
                    placeholder="Enter your mother's name"
                    required
                  />

                  {formData.motherName ? "" : renderError('motherName')}
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
                      borderColor: "#12B99C",
                      backgroundColor: "#F8FAFC",
                    }}
                    placeholder="Enter your PAN number"
                    required
                  />

                  {renderError('panNumber')}
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
                      borderColor: "#12B99C",
                      backgroundColor: "#F8FAFC",
                    }}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>

                  {formData.gender ? "" : renderError('gender')}
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
                      borderColor: "#12B99C",
                      backgroundColor: "#F8FAFC",
                    }}
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="other">Other</option>
                  </select>

                  {formData.maritalStatus ? "" : renderError('maritalStatus')}
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
                      style={{ color: "#12B99C" }}
                    />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "#12B99C",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter your contact number"
                      required
                    />

                    {formData.phone ? "" : renderError('phone')}
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
                      style={{ color: "#12B99C" }}
                    />
                    <input
                      type="tel"
                      name="alternateContact"
                      value={formData.alternateContact}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "#12B99C",
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
                      style={{ color: "#12B99C" }}
                    />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "#12B99C",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter your email address"
                      required
                    />

                    {renderError("email")}
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
                        borderColor: "#12B99C",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter Spouse's name"
                      required
                    />

                    {renderError('SpouseName')}

                  </div>
                )}
              </div>
            </section>

            {/* Address Information */}

            <section>
              <h2
                className="text-2xl font-semibold mb-6 flex items-center gap-3"
                style={{ color: "#111827" }}
              >
                <MapPin className="w-6 h-6" style={{ color: "#12B99C" }} />
                Address Information
              </h2>
              <div className="space-y-6">
                {/* Current Address */}
                <div
                  className="p-6 rounded-lg border-2"
                  style={{ borderColor: "#12B99C", backgroundColor: "#F8FAFC" }}
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
                          borderColor: "#12B99C",
                          backgroundColor: "white",
                        }}
                        rows="3"
                        placeholder="Enter your current address"
                        required
                      />

                      {formData.currentAddress ? "" : renderError('currentAddress')}
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
                          borderColor: "#12B99C",
                          backgroundColor: "white",
                        }}
                        placeholder="Enter pincode"
                        required
                      />

                      {renderError('currentAddressPincode')}
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
                          borderColor: "#12B99C",
                          backgroundColor: "white",
                        }}
                        required
                      >
                        <option value="">Select</option>
                        <option value="own">Own</option>
                        <option value="rented">Rented</option>
                      </select>

                      {formData.currentAddressOwnRented ? "" : renderError('currentAddressOwnRented')}
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
                          borderColor: "#12B99C",
                          backgroundColor: "white",
                        }}
                        placeholder="e.g., 2 years"
                        required
                      />

                      {formData.currentAddressStability ? "" : renderError('currentAddressStability')}
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
                          borderColor: "#12B99C",
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
                    style={{ accentColor: "#12B99C" }}
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
                  style={{ borderColor: "#12B99C", backgroundColor: "#F8FAFC" }}
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
                          borderColor: "#12B99C",
                          backgroundColor: "white",
                        }}
                        rows="3"
                        placeholder="Enter your permanent address"
                        disabled={sameAddress}
                        required
                      />

                      {formData.permanentAddress ? "" : renderError('permanentAddress')}
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
                          borderColor: "#12B99C",
                          backgroundColor: "white",
                        }}
                        placeholder="Enter pincode"
                        disabled={sameAddress}
                        required
                      />

                      {renderError('permanentAddressPincode')}
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
                          borderColor: "#12B99C",
                          backgroundColor: "white",
                        }}
                        disabled={sameAddress}
                        required
                      >
                        <option value="">Select</option>
                        <option value="own">Own</option>
                        <option value="rented">Rented</option>
                      </select>

                      {formData.permanentAddressOwnRented ? "" : renderError('permanentAddressOwnRented')}
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
                          borderColor: "#12B99C",
                          backgroundColor: "white",
                        }}
                        placeholder="e.g., 5 years"
                        disabled={sameAddress}
                        required
                      />

                      {formData.permanentAddressStability ? "" : renderError('permanentAddressStability')}
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
                          borderColor: "#12B99C",
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

            <section>
              <h2
                className="text-2xl font-semibold mb-6 flex items-center gap-3"
                style={{ color: "#111827" }}
              >
                <FileText className="w-6 h-6" style={{ color: "#12B99C" }} />
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
                      borderColor: "#12B99C",
                      backgroundColor: "#F8FAFC",
                    }}
                    placeholder="Enter loan amount"
                    // min="0"
                    required
                  />

                  {renderError('loanAmount')}
                </div>
              </div>
            </section>

            {/* Address Proof Selection */}
            <section>
              <h2
                className="text-2xl font-semibold mb-6 flex items-center gap-3"
                style={{ color: "#111827" }}
              >
                <FileText className="w-6 h-6" style={{ color: "#12B99C" }} />
                Address Proof Documents
              </h2>
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
                      style={{ accentColor: "#12B99C" }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "#111827" }}
                    >
                      Light Bill
                    </span>
                  </label>
                  {formData.lightBillSelected && (
                    <input
                      type="file"
                      name="lightBill"
                      onChange={handleFileChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                      style={{
                        borderColor: "#12B99C",
                        backgroundColor: "#F8FAFC",
                      }}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
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
                      style={{ accentColor: "#12B99C" }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "#111827" }}
                    >
                      Water / Gas / WiFi Bill
                    </span>
                  </label>
                  {formData.utilityBillSelected && (
                    <input
                      type="file"
                      name="utilityBill"
                      onChange={handleFileChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                      style={{
                        borderColor: "#12B99C",
                        backgroundColor: "#F8FAFC",
                      }}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
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
                      style={{ accentColor: "#12B99C" }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "#111827" }}
                    >
                      Rent Agreement
                    </span>
                  </label>
                  {formData.rentAgreementSelected && (
                    <input
                      type="file"
                      name="rentAgreement"
                      onChange={handleFileChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                      style={{
                        borderColor: "#12B99C",
                        backgroundColor: "#F8FAFC",
                      }}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  )}
                </div>

                {/* Error message */}
                {!formData.lightBill &&
                  !formData.utilityBill &&
                  !formData.rentAgreement &&
                  fieldErrors.addressProof && (
                    <p className="text-red-500 text-sm">{fieldErrors.addressProof}</p>
                  )}

              </div>
            </section>

            {/* Personal Document Upload */}
            <section>
              <h2
                className="text-2xl font-semibold mb-6 flex items-center gap-3"
                style={{ color: "#111827" }}
              >
                <FileText className="w-6 h-6" style={{ color: "#12B99C" }} />
                Personal Documents
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Aadhar Front */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Aadhar Front *
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      name="aadharFront"
                      onChange={handleFileChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                      style={{
                        borderColor: "#12B99C",
                        backgroundColor: "#F8FAFC",
                      }}
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                    />
                    {formData.aadharFront && (
                      <button
                        type="button"
                        onClick={() => handleFileRemove("aadharFront")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-red-100 transition-colors"
                        style={{ color: "#EF4444" }}
                        title="Remove file"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {formData.aadharFront && (
                    <p className="text-xs mt-1 text-green-600 flex items-center gap-1">
                      <span>✓</span> {formData.aadharFront.name}
                    </p>
                  )}
                    {formData.aadharFront?"": renderError('aadharFront')}
                </div>
                {/* Aadhar Back */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Aadhar Back *
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      name="aadharBack"
                      onChange={handleFileChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                      style={{
                        borderColor: "#12B99C",
                        backgroundColor: "#F8FAFC",
                      }}
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                    />
                    {formData.aadharBack && (
                      <button
                        type="button"
                        onClick={() => handleFileRemove("aadharBack")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-red-100 transition-colors"
                        style={{ color: "#EF4444" }}
                        title="Remove file"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {formData.aadharBack && (
                    <p className="text-xs mt-1 text-green-600 flex items-center gap-1">
                      <span>✓</span> {formData.aadharBack.name}
                    </p>
                  )}

                  {formData.aadharBack?"": renderError('aadharBack')}
                </div>
                {/* Other Docs */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Other Docs
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      name="otherDocs"
                      onChange={handleFileChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                      style={{
                        borderColor: "#12B99C",
                        backgroundColor: "#F8FAFC",
                      }}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    {formData.otherDocs && (
                      <button
                        type="button"
                        onClick={() => handleFileRemove("otherDocs")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-red-100 transition-colors"
                        style={{ color: "#EF4444" }}
                        title="Remove file"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {formData.otherDocs && (
                    <p className="text-xs mt-1 text-green-600 flex items-center gap-1">
                      <span>✓</span> {formData.otherDocs.name}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    PAN Card *
                  </label>
                  <input
                    type="file"
                    name="panCard"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                    style={{
                      borderColor: "#12B99C",
                      backgroundColor: "#F8FAFC",
                    }}
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                  />

                  {formData.panCard ? "" : renderError('panCard')}
                </div>
                {/* Selfie Upload */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#111827" }}
                  >
                    Upload Selfie *
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      name="selfie"
                      onChange={handleFileChange}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                      style={{
                        borderColor: "#12B99C",
                        backgroundColor: "#F8FAFC",
                      }}
                      accept=".jpg,.jpeg,.png"
                      required
                    />
                    {formData.selfie && (
                      <button
                        type="button"
                        onClick={() => handleFileRemove("selfie")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-red-100 transition-colors"
                        style={{ color: "#EF4444" }}
                        title="Remove file"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {formData.selfie && (
                    <p className="text-xs mt-1 text-green-600 flex items-center gap-1">
                      <span>✓</span> {formData.selfie.name}
                    </p>
                  )}

                  {formData.selfie ? "" : renderError('selfie')}
                </div>
              </div>
            </section>

            {/* Co-applicant Section (for female applicants) */}
            {formData.gender === "female" && (
              <section>
                <h2
                  className="text-2xl font-semibold mb-6 flex items-center gap-3"
                  style={{ color: "#111827" }}
                >
                  <Users className="w-6 h-6" style={{ color: "#12B99C" }} />
                  Co-applicant Information
                </h2>
                <div
                  className="p-6 rounded-lg border-2"
                  style={{ borderColor: "#12B99C", backgroundColor: "#F8FAFC" }}
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
                          borderColor: "#12B99C",
                          backgroundColor: "white",
                        }}
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                      />
                      {renderError('coApplicantAadharFront')}
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
                          borderColor: "#12B99C",
                          backgroundColor: "white",
                        }}
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                      />

                      {renderError('coApplicantAadharBack')}
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
                          borderColor: "#12B99C",
                          backgroundColor: "white",
                        }}
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                      />

                      {renderError('coApplicantPan')}
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
                          style={{ color: "#12B99C" }}
                        />
                        <input
                          type="tel"
                          name="coApplicantMobile"
                          value={formData.coApplicantMobile}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                          style={{
                            borderColor: "#12B99C",
                            backgroundColor: "white",
                          }}
                          placeholder="Enter co-applicant mobile number"
                          required
                        />

                        {renderError('coApplicantMobile')}
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
                          borderColor: "#12B99C",
                          backgroundColor: "white",
                        }}
                        accept=".jpg,.jpeg,.png"
                        required
                      />
                      {renderError('coApplicantSelfie')}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Business Information */}
            <section>
              <h2
                className="text-2xl font-semibold mb-6 flex items-center gap-3"
                style={{ color: "#111827" }}
              >
                <Store className="w-6 h-6" style={{ color: "#12B99C" }} />
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
                      style={{ color: "#12B99C" }}
                    />
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "#12B99C",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter your business name"
                      required
                    />
                    {formData.businessName ? "" : renderError('businessName')}
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
                      borderColor: "#12B99C",
                      backgroundColor: "#F8FAFC",
                    }}
                    placeholder="Enter business vintage in years"
                    min="0"
                    required
                  />
                  {formData.businessVintage ? "" : renderError('businessVintage')}
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
                      borderColor: "#12B99C",
                      backgroundColor: "#F8FAFC",
                    }}
                    rows="3"
                    placeholder="Enter your business address"
                    required
                  />

                  {formData.businessAddress ? "" : renderError('businessAddress')}
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
                      borderColor: "#12B99C",
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
                      style={{ color: "#12B99C" }}
                    />
                    <input
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                      style={{
                        borderColor: "#12B99C",
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
                      style={{ color: "#12B99C" }}
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
                        borderColor: "#12B99C",
                        backgroundColor: "#F8FAFC",
                      }}
                      placeholder="Enter annual turnover in INR"
                      required
                    />

                    {formData.annualTurnover ? " " : renderError('annualTurnover')}
                  </div>
                </div>
              </div>
            </section>

            {/* Business Documents */}
            <section>
              <h2
                className="text-2xl font-semibold mb-6 flex items-center gap-3"
                style={{ color: "#111827" }}
              >
                <Shield className="w-6 h-6" style={{ color: "#12B99C" }} />
                Business Documents
              </h2>
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
                      borderColor: "#12B99C",
                      backgroundColor: "#F8FAFC",
                    }}
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                  />
                  {formData.shopAct ? " " : renderError('shopAct')}
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
                      borderColor: "#12B99C",
                      backgroundColor: "#F8FAFC",
                    }}
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                  />
                  {formData.udhyamAadhar ? "" : renderError('udhyamAadhar')}
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
                      borderColor: "#12B99C",
                      backgroundColor: "#F8FAFC",
                    }}
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                  />

                  {formData.itr ? "" : renderError('itr')}
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
                      borderColor: "#12B99C",
                      backgroundColor: "#F8FAFC",
                    }}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
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
                      style={{ color: "#12B99C" }}
                    />
                    <input
                      type="file"
                      name="shopPhoto"
                      onChange={handleFileChange}
                      className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                      style={{
                        borderColor: "#12B99C",
                        backgroundColor: "#F8FAFC",
                      }}
                      accept=".jpg,.jpeg,.png"
                      required
                    />

                    {formData.shopPhoto ? "" : renderError('shopPhoto')}
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
                      borderColor: "#12B99C",
                      backgroundColor: "#F8FAFC",
                    }}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </div>
              </div>
            </section>

            {/* Financial Documents */}
            <section>
              <h2
                className="text-2xl font-semibold mb-6 flex items-center gap-3"
                style={{ color: "#111827" }}
              >
                <FileText className="w-6 h-6" style={{ color: "#12B99C" }} />
                Financial Documents
              </h2>
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
                      borderColor: "#12B99C",
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

                  {formData.bankStatementFile1 ? "" : renderError('bankStatementFile1')}
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
                      borderColor: "#12B99C",
                      backgroundColor: "#F8FAFC",
                    }}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </div>
              </div>
            </section>

            {/* References */}
            <section>
              <h2
                className="text-2xl font-semibold mb-6 flex items-center gap-3"
                style={{ color: "#111827" }}
              >
                <Users className="w-6 h-6" style={{ color: "#12B99C" }} />
                References
              </h2>
              <div className="space-y-6">
                <div
                  className="p-6 rounded-lg border-2"
                  style={{ borderColor: "#12B99C", backgroundColor: "#F8FAFC" }}
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
                          borderColor: "#12B99C",
                          backgroundColor: "white",
                        }}
                        placeholder="Enter reference name"
                        required
                      />

                      {formData.reference1Name ? "" : renderError('reference1Name')}
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
                          style={{ color: "#12B99C" }}
                        />
                        <input
                          type="tel"
                          name="reference1Contact"
                          value={formData.reference1Contact}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                          style={{
                            borderColor: "#12B99C",
                            backgroundColor: "white",
                          }}
                          placeholder="Enter contact number"
                          required
                        />

                        {renderError('reference1Contact')}
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="p-6 rounded-lg border-2"
                  style={{ borderColor: "#12B99C", backgroundColor: "#F8FAFC" }}
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
                          borderColor: "#12B99C",
                          backgroundColor: "white",
                        }}
                        placeholder="Enter reference name"
                        required
                      />

                      {formData.reference2Name ? "" : renderError('reference2Name')}
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
                          style={{ color: "#12B99C" }}
                        />
                        <input
                          type="tel"
                          name="reference2Contact"
                          value={formData.reference2Contact}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:border-opacity-50 transition-colors"
                          style={{
                            borderColor: "#12B99C",
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
              </div>
            </section>

            {/* Partner Referral */}
            <section>
              <h2
                className="text-2xl font-semibold mb-6 flex items-center gap-3"
                style={{ color: "#111827" }}
              >
                <FileText className="w-6 h-6" style={{ color: "#12B99C" }} />
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
                      borderColor: "#12B99C",
                      backgroundColor: "#F8FAFC",
                    }}
                    placeholder="Enter partner code"
                  />
                </div>
              </div>
            </section>

            {/* Submit Button */}
            <div className="flex justify-center pt-8">
              <button
                type="button"
                onClick={handleSubmit}
                className="px-12 py-4 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                style={{ backgroundColor: "#12B99C" }}
                disabled={loading}
              >
                {loading ? "Saving..." : "Submit Loan"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)}>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Your application has been saved.
            </h2>
            <p className="mb-4">Do you want to submit it?</p>
            {error && <div className="text-red-500 mb-2">{error}</div>}
            <button
              className="px-6 py-2 bg-green-600 text-white rounded-lg mr-4"
              onClick={handleApplyNow}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Apply Now"}
            </button>
            <button
              className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg"
              onClick={() => setModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
