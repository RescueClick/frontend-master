import React, { useEffect, useState, useCallback } from "react";

import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Download,
  Settings,
  Lock,
  Edit,
  LogOut,
  Save,
  X,
  Link2 as LinkIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchPartnerProfile } from "../feature/thunks/partnerThunks";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthData, getAuthData } from "../utils/localStorage";
import { useRealtimeData } from "../utils/useRealtimeData";
import { backendurl } from "../feature/urldata";

import axios from "axios"



const PartnerProfile = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("password");
  const [profileImage, setProfileImage] = useState(null);
  const { data } = useSelector((state) => state.partner.profile);
  

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Real-time profile updates with 60 second polling
  useRealtimeData(fetchPartnerProfile, {
    interval: 60000, // 60 seconds for profile (less frequent)
    enabled: true,
  });



  const [settingsForm, setSettingsForm] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });

  const handleDownload =  (document) => {
    console.log(`Downloading ${document}...`);
    alert(`${document} download initiated!`);
  };

  const handleSettingsSubmit = useCallback(async (type) => {
    try {
      const { partnerToken } = getAuthData();
      
      await axios.post(
        `${backendurl}/auth/change-password`,
        {
          oldPassword: settingsForm.currentPassword,
          newPassword: settingsForm.password,
          confirmPassword: settingsForm.confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${partnerToken}`,
          },
        }
      );

      alert(`${type} updated successfully!`);
      
      // Reset form
      setSettingsForm({
        currentPassword: "",
        password: "",
        confirmPassword: "",
      });
      
      // Optionally close modal
      setIsSettingsOpen(false);
    } catch (err) {
      console.error("API error:", err.response?.data || err);
      alert(err.response?.data?.message || "Failed to update password");
    }
  }, [settingsForm, setIsSettingsOpen]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setProfileImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };


    // Logout function for admin
    const handleLogout = () => {

      clearAuthData();
  
      navigate('/');
    };



  return (
    <div className="min-h-screen bg-slate-50">
      <div className=" w-full ">
        {/* Profile Content (always visible) */}

        <div className="bg-white rounded-xl shadow-2xl border border-gray-200">
          {/* Profile Image + Name Section */}

          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between ">
              <h3 className="text-lg font-semibold text-gray-800">
                Profile Picture
              </h3>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors flex items-center space-x-2 text-sm"
                >
                  <Settings className="w-4 h-4" />
                  <span>Setting</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2 text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              {/* Profile Image */}

              <div className="relative flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-teal-500 flex items-center justify-center overflow-hidden">
                  {data?.profilePic ? (
                    <img
                      src={data?.profilePic}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-white" />
                  )}
                </div>

              
              </div>

              {/* First, Middle & Last Name fields beside profile */}

              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h1 className="block text-sm font-medium text-gray-700 mb-1">
                    {data?.firstName} {data?.middleName} {data?.lastName}
                  </h1>
                  <p className="mt-3 text-sm font-medium text-gray-700">
                  Partner ID: {data?.employeeId}
                </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}

          <div className="p-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Contact Information
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-teal-100 p-2 rounded-lg">
                  <Phone className="w-4 h-4 text-teal-500" />
                </div>

                <div>
                  <p className="text-gray-600 text-xs">Mobile</p>

                  <p className="text-gray-800 font-medium text-sm">
                    {data?.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-teal-100 p-2 rounded-lg">
                  <Mail className="w-4 h-4 text-teal-500" />
                </div>

                <div>
                  <p className="text-gray-600 text-xs">Email</p>

                  <p className="text-gray-800 font-medium text-sm">
                    {data?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-teal-100 p-2 rounded-lg">
                  <Calendar className="w-4 h-4 text-teal-500" />
                </div>

                <div>
                  <p className="text-gray-600 text-xs">Date of Birth</p>

                  <p className="text-gray-800 font-medium text-sm">
                    {new Date(data?.dob).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-teal-100 p-2 rounded-lg">
                  <Calendar className="w-4 h-4 text-teal-500" />
                </div>

                <div>
                  <p className="text-gray-600 text-xs">Partnership Date</p>

                  <p className="text-gray-800 font-medium text-sm">
                    {new Date(data?.partnershipDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Address & Referral Link */}

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {/* Address */}

              <div className="flex items-start space-x-3">
                <div className="bg-teal-100 p-2 rounded-lg">
                  <MapPin className="w-4 h-4 text-teal-500" />
                </div>

                <div>
                  <p className="text-gray-600 text-xs">Address</p>

                  <p className="text-gray-800 font-medium text-sm">
                    {data?.address}
                  </p>
                </div>
              </div>

              {/* Referral Link */}

              <div className="flex items-start space-x-3">
                <div className="bg-teal-100 p-2 rounded-lg">
                  <LinkIcon className="w-4 h-4 text-teal-500" />
                </div>

                <div>
                  <p className="text-gray-600 text-xs">Referral Link</p>

                  <a
                    href={data?.referralLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 font-medium text-sm break-all hover:underline"
                  >
                    {data?.referralLink}
                  </a>
                </div>
              </div>
            </div>

            {/* RM Details */}

            <div className="mt-6">
              <h4 className="text-md font-semibold text-gray-700 mb-3">
                Relationship Manager Details
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-teal-500" />

                    <span className="text-gray-500 text-sm">Name:</span>

                    <span className="text-gray-800 font-semibold text-sm">
                      {data?.rmName}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-teal-500" />

                    <span className="text-gray-500 text-sm">Contact:</span>

                    <span className="text-gray-800 font-semibold text-sm">
                      {data?.rmPhone}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-3">
                    <Lock className="w-4 h-4 text-teal-500" />

                    <span className="text-gray-500 text-sm">Id:</span>

                    <span className="text-gray-800 font-semibold text-sm">
                      {data?.rmEmployeeId}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-teal-500" />

                    <span className="text-gray-500 text-sm">Mail:</span>

                    <span className="text-gray-800 font-semibold text-sm">
                      {data?.rmEmail}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Documents Section (kept original) */}

          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Documents
            </h3>


            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  navigate("/IdCard", {
                    state: {
                      employeeData: {
                        name: `${data?.firstName} ${data?.lastName}`,
                        designation: "Partner",
                        id: `${data?.employeeId}`,
                        location: `${data?.address}`,
                        initials: `${data?.firstName[0]}${data?.lastName[0]}`,
                        photo: `${data?.profilePic}`,
                      },
                    },
                  });
                }}
                className="bg-teal-500 text-white px-4 py-3 rounded-lg hover:bg-teal-600 transition-colors flex items-center justify-center space-x-2 text-sm"
              >
                <Download className="w-4 h-4" />

                <span>ID Card</span>
              </button>

              <button
                onClick={() => {
                  navigate("/AuthLetter", {
                    state: {
                      name: ` ${data?.firstName} ${data?.middleName} ${data?.lastName} `,
                    },
                  });
                }}
                className="bg-amber-500 text-white px-4 py-3 rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2 text-sm"
              >
                <Download className="w-4 h-4" />

                <span>AuthLetter</span>
              </button>

              <button
                onClick={() => {
                  navigate("/Agreement" ,
                    {
                    state: {
                      employeeData: {
                        name: `${data?.firstName} ${data?.lastName}`,
                        IDNo : `${data?.employeeId}`,
                        Aadhar_Number : `${data?.aadharNumber}`,
                        PAN_Number :`${data?.panNumber}`,    
                        address : `${ data?.address }` 
                      },
                    },
                  }
                  );
                }}
                className="bg-gray-700 text-white px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2 text-sm"
              >
                <Download className="w-4 h-4" />

                <span>Agreement</span>
              </button>
            </div>
          </div>
        </div>

        {/* Settings Modal */}

        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto">
              {/* Modal Header */}

              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-2xl font-semibold text-gray-800">
                  Account Settings
                </h3>

                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Settings Tabs */}

              <div className="flex border-b">
                <button
                  onClick={() => setActiveSettingsTab("password")}
                  className={`px-6 py-4 font-medium transition-colors ${
                    activeSettingsTab === "password"
                      ? "text-teal-500 border-b-2 border-teal-500"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <Lock className="w-5 h-5 inline mr-2" />
                  Change Password
                </button>
              </div>

              {/* Settings Content */}

              <div className="p-6">
                {activeSettingsTab === "password" && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                      Change Password
                    </h4>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>

                      <input
                        type="password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        value={settingsForm.currentPassword}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,

                            currentPassword: e.target.value,
                          })
                        }
                        placeholder="Enter current password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>

                      <input
                        type="password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        value={settingsForm.password}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,

                            password: e.target.value,
                          })
                        }
                        placeholder="Enter new password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>

                      <input
                        type="password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        value={settingsForm.confirmPassword}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,

                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="Confirm new password"
                      />
                    </div>

                    <button
                      onClick={() => handleSettingsSubmit("Password")}
                      className="bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 transition-colors flex items-center space-x-2"
                    >
                      <Save className="w-5 h-5" />

                      <span>Update Password</span>
                    </button>
                  </div>
                )}

             
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerProfile;
