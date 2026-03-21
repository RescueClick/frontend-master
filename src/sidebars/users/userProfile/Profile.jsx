import React, { useEffect } from "react";
import { Mail, Phone, Calendar, Home, Briefcase, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminProfile } from "../../../feature/thunks/adminThunks";
import { fetchAsmProfile } from "../../../feature/thunks/asmThunks";
import { getAuthData } from "../../../utils/localStorage";
 
export default function Profile({ setProfileOpen, data }) {

 
  const navigate = useNavigate();
 
  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setProfileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setProfileOpen]);
 
  return (
    <div className="h-full w-full bg-white shadow-lg z-50 flex flex-col">
      <div className="p-6 overflow-y-auto flex-1">
        {/* Avatar */}
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-brand-primary flex items-center justify-center text-white text-3xl font-bold shadow-md">
            {data?.fullName?.charAt(0) || "U"}
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-gray-800">
            {data?.fullName || "N/A"}
          </h2>
          <p className="text-gray-500">
            Employee ID: {data?.employeeId || "N/A"}
          </p>
        </div>
 
        {/* Info */}
        <div className="mt-6 space-y-4 text-gray-700">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-brand-primary" />
            <div>
              <p className="text-sm font-semibold text-gray-500">Email</p>
              <p>{data?.email || "N/A"}</p>
            </div>
          </div>
 
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-brand-primary" />
            <div>
              <p className="text-sm font-semibold text-gray-500">Phone</p>
              <p>{data?.phone || "N/A"}</p>
            </div>
          </div>
 
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-brand-primary" />
            <div>
              <p className="text-sm font-semibold text-gray-500">
                Date of Birth
              </p>
              <p>{data?.dob || "N/A"}</p>
            </div>
          </div>
 
          <div className="flex items-center gap-3">
            <Home className="w-5 h-5 text-brand-primary" />
            <div>
              <p className="text-sm font-semibold text-gray-500">Address</p>
              <p>{data?.address || "N/A"}</p>
            </div>
          </div>
 
          <div className="flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-brand-primary" />
            <div>
              <p className="text-sm font-semibold text-gray-500">Experience</p>
              <p>{data?.experience || "N/A"}</p>
            </div>
          </div>
 
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-brand-primary" />
            <div>
              <p className="text-sm font-semibold text-gray-500">Region</p>
              <p>{data?.region || "N/A"}</p>
            </div>
          </div>
        </div>
 
        {/* Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => {
              setProfileOpen(false);
 
              if (data?.userType === "ASM") {
 
              navigate("/asm/EditProfile", {
                  state: { userType:data?.userType }, // 👈 wrapping it inside state
                });
              }
            }}
            className="px-6 py-2 bg-brand-primary text-white rounded-lg shadow hover:bg-[#0ea789] transition"
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}