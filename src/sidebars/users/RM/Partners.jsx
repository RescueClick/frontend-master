import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  Star,
  TrendingUp,
  DollarSign,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  Target,
  Activity,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit,
  Building2,
  Handshake,
  BarChart3,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Upload,
  Briefcase,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { activatePartner, assignCustomerToPartner, fetchPartners } from "../../../feature/thunks/rmThunks";
import { useRealtimeData, useRefetch } from "../../../utils/useRealtimeData";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import axios from "axios";
import { getAuthData, saveAuthData } from "../../../utils/localStorage";
import { backendurl } from "../../../feature/urldata";


const colors = {
  primary: "#12B99C",
  secondary: "#1E3A8A",
  background: "#F8FAFC",
  accent: "#F59E0B",
  text: "#111827",
};

const Partners = () => {


  const [ActivateModel, setActivateModel] = useState(null)

  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const [PartnerProfile, setPartnerProfile] = useState(null);


  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [newPartnerId, setNewPartnerId] = useState(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading, error, data } = useSelector((state) => state.rm.partner);

  // Real-time data fetching with 30 second polling
  const { refetch } = useRealtimeData(fetchPartners, {
    interval: 30000, // 30 seconds
    enabled: true,
  });

  // Manual refetch function
  const refetchPartners = useRefetch(fetchPartners);

  const otherPartners = useMemo(
    () => data?.filter((p) => p.id !== selectedPartner?.id) || [],
    [data, selectedPartner?.id]
  );

  const partnerStats = {
    totalPartners: 48,
    activePartners: 42,
    newThisMonth: 6,
    totalRevenue: 12500000,
    avgPartnerRating: 4.7,
    topPerformer: "Alpha Financial Services",
  };


  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return "text-green-700 bg-green-100 border-green-200";
      case "inactive":
        return "text-red-700 bg-red-100 border-red-200";
      case "under review":
        return "text-yellow-700 bg-yellow-100 border-yellow-200";
      case "suspended":
        return "text-red-700 bg-red-100 border-red-200";
      default:
        return "text-gray-700 bg-gray-100 border-gray-200";
    }
  };

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      // 1 Crore = 1,00,00,000
      return `₹${(amount / 10000000).toFixed(2)}C`;
    } else if (amount >= 100000) {
      // 1 Lakh = 1,00,000
      return `₹${(amount / 100000).toFixed(2)}L`;
    } else if (amount >= 1000) {
      // 1 Thousand = 1,000
      return `₹${(amount / 1000).toFixed(2)}K`;
    } else {
      return `₹${amount}`;
    }
  };
  
  const filteredPartners = useMemo(() => {
    if (!data) return [];
    
    return data.filter((partner) => {
      const matchesSearch =
        partner.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.type?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        selectedFilter === "all" ||
        partner.status?.toLowerCase() === selectedFilter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [data, searchTerm, selectedFilter]);


  const toggleActivation = (partner) => {
    if (partner.status === "ACTIVE") {
      setSelectedPartner(partner);
      setModalOpen(true);
    } else {
      // Optionally handle re-activation here
    }
  };

  const handleCancelDeactivation = () => {
    setModalOpen(false);
    setSelectedPartner(null);
  };


  const handleConfirmDeactivation = useCallback(async () => {
    try {
      await dispatch(
        assignCustomerToPartner({
          oldPartnerId: selectedPartner.id,
        })
      ).unwrap();
      
      // Refetch partners after deactivation
      refetchPartners();
      
      setModalOpen(false);
      setSelectedPartner(null);
    } catch (error) {
      console.error("Deactivation error:", error);
    }
  }, [dispatch, selectedPartner, refetchPartners]);

  const handlePartnerActive = useCallback(async () => {
    try {
      await dispatch(activatePartner({ partnerId: selectedPartner.id })).unwrap();
      
      // Refetch partners after activation
      refetchPartners();
      
      setActivateModel(null);
      setSelectedPartner(null);
    } catch (error) {
      console.error("Activation error:", error);
    }
  }, [dispatch, selectedPartner, refetchPartners]);


  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("No data available to export");
      return;
    }
  
    // Create new object with easy-to-read column names
    const formattedData = data.map((item) => ({
      "Partner ID": item.id,
      "RM ID": item.rmId,
      "RM Name": item.rmName,
      "ASM ID": item.asmId,
      "ASM Name": item.asmName,
      "Partner Name": item.name,
      "Email": item.email,
      "Phone": item.phone,
      "Status": item.status,
      "Rating": item.rating,
      "Deals This Month": item.dealsThisMonth,
      "Revenue Generated": item.totalDisbursed,
      "Success Rate": item.successRate,
      "Total Disbursed": item.totalDisbursed,
      "Assigned Target": item.assignedTarget,
      "Performance": item.performance,
      
    }));
  
    // Convert JSON to worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
  
    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Partners");
  
    // Write workbook and save as Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  
    const blobData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  
    saveAs(blobData, "partners.xlsx");
  };

  
  const loginAsUser = async (userId, navigate) => {
    try {
      const { rmToken } = getAuthData();
      if (!rmToken) throw new Error("Admin not authenticated");
  
      const res = await axios.post(
        `${backendurl}/auth/login-as/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${rmToken}` } }
      );
  
      const { token, user } = res.data;
  
      // Save impersonated token without removing admin token
      saveAuthData(token, user, true);
  
      // Navigate to role
      switch (user.role) {
        case "ASM": navigate("/asm"); break;
        case "RM": navigate("/rm"); break;
        case "PARTNER": navigate("/partner"); break;
        case "CUSTOMER": navigate("/customer"); break;
        default: navigate("/"); break;
      }
    } catch (err) {
      console.error("Login as user failed:", err.response?.data || err.message);
      alert(err.response?.data?.message || err.message || "Login as user failed");
    }
  };
  
 // Usage in component
const handleLoginAs = (userId) => {
  console.log(userId)
loginAsUser(userId, navigate);
};

  return (
    <>

      {ActivateModel &&
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 bg-opacity-40 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Are you sure?</h3>
            <p className="text-gray-600 mb-5">Do you really want to proceed?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setActivateModel(null)
                }}
                className="cursor-pointer px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                No
              </button>
              <button
                onClick={() => {
                  handlePartnerActive()
                }}

                className=" cursor-pointer px-4 py-2 rounded-lg bg-[#12B99C] text-white "
              >
                Yes
              </button>
            </div>
          </div>
        </div>


      }

      {PartnerProfile && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-gray-200/50"
            style={{ backgroundColor: "#F8FAFC" }}
          >
            {/* Header Card */}
            <div
              className="p-4 text-white rounded-t-3xl relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, #12B99C 0%, #0EA589 50%, #0B8A73 100%)",
              }}
            >
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between">
                <div className="mt-6 md:mt-0 text-right flex items-center space-x-6 w-full">
                  <button
                    onClick={() => setPartnerProfile(null)}
                    className=" cursor-pointer ml-auto bg-white/10 hover:bg-white/20 text-white transition-all duration-200 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20 font-semibold"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Contact Information - TOP SECTION */}
            <div className="bg-white rounded-2xl shadow-xl p-4 border border-gray-200/50 mx-8 mt-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
              <div className="flex items-center space-x-3 mb-2">
                <div
                  className="p-3 rounded-xl shadow-lg"
                  style={{ backgroundColor: "#12B99C" }}
                >
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: "#111827" }}>
                  Contact Information
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Partner Name */}
                <div className=" space-y-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200/30">
                  <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">
                    Partner Name
                  </h3>
                  <p
                    className="text-md font-semibold"
                    style={{ color: "#111827" }}
                  >
                    {PartnerProfile.name}
                  </p>
                </div>

                {/* Email */}
                <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/30">
                  <h3 className="font-bold text-gray-700 text-md uppercase tracking-wider">
                    Email
                  </h3>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5" style={{ color: "#12B99C" }} />
                    <a
                      href={`mailto:${PartnerProfile.email}`}
                      className="font-semibold transition-colors hover:opacity-80"
                      style={{ color: "#12B99C" }}
                    >
                      {PartnerProfile.email}
                    </a>
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-4 p-6 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-200/30">
                  <h3 className="font-bold text-gray-700 text-md uppercase tracking-wider">
                    Phone
                  </h3>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5" style={{ color: "#12B99C" }} />
                    <a
                      href={`tel:${PartnerProfile.phone}`}
                      className="font-semibold transition-colors hover:opacity-80"
                      style={{ color: "#12B99C" }}
                    >
                      {PartnerProfile.phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-4">
              {/* Deals This Month */}
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200/50">
                <div
                  className="absolute top-0 left-0 w-full h-1"
                  style={{ backgroundColor: "#12B99C" }}
                ></div>
                <div className="flex items-center justify-between mb-6">
                  <div
                    className="p-4 rounded-2xl shadow-lg"
                    style={{ backgroundColor: "#12B99C" }}
                  >
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: "#111827" }}
                  >
                    {PartnerProfile.dealsThisMonth}
                  </span>
                </div>
                <h3
                  className="font-bold text-md mb-2"
                  style={{ color: "#111827" }}
                >
                  Deals This Month
                </h3>
              </div>

              {/* Revenue Generated */}
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200/50">
                <div
                  className="absolute top-0 left-0 w-full h-1"
                  style={{ backgroundColor: "#F59E0B" }}
                ></div>
                <div className="flex items-center justify-between mb-6">
                  <div
                    className="p-4 rounded-2xl shadow-lg"
                    style={{ backgroundColor: "#F59E0B" }}
                  >
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: "#111827" }}
                  >
                    {formatCurrency(PartnerProfile.totalDisbursed)}
                  </span>
                </div>
                <h3
                  className="font-bold text-lg mb-2"
                  style={{ color: "#111827" }}
                >
                  Revenue Generated
                </h3>
              </div>

              {/* Rating */}
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200/50">
                <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 bg-purple-500 rounded-2xl shadow-lg">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: "#111827" }}
                  >
                    {PartnerProfile.rating}
                  </span>
                </div>
                <h3
                  className="font-bold text-lg mb-2"
                  style={{ color: "#111827" }}
                >
                  Rating
                </h3>
              </div>
            </div>

            {/* Success Rate */}
            <div className="bg-white rounded-2xl shadow-xl p-4 border border-gray-200/50 mx-8 mb-8">
              <div className="flex items-center space-x-6">
                <div
                  className="p-4 rounded-2xl shadow-lg"
                  style={{ backgroundColor: "#F59E0B" }}
                >
                  <Award className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2
                    className="text-xl font-bold mb-2"
                    style={{ color: "#111827" }}
                  >
                    Success Rate
                  </h2>
                  <p className="text-lg font-medium text-gray-600">
                    Deal closure performance
                  </p>
                </div>
              </div>
              <div
                className="text-2xl font-bold my-4"
                style={{ color: "#F59E0B" }}
              >
                {PartnerProfile.successRate}%
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    backgroundColor: "#F59E0B",
                    width: `${PartnerProfile.successRate}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

{modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">


        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Suspend Partner
          </h3>
          <p className="text-gray-700 mb-6">
            Are you sure you want to <span className="font-semibold text-red-600">suspend</span> the partner{" "}
            <span className="font-semibold">{selectedPartner?.name}</span>?<br />
            This will deactivate their account and they will not be able to log in.
          </p>
          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition"
              onClick={handleCancelDeactivation}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition"
              onClick={() => {
                handleConfirmDeactivation();
                setModalOpen(false);
                setSelectedPartner(null);
              }}
            >
              Yes, Suspend
            </button>
          </div>
        </div>
         
        </div>
      )}
      <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-2">
            <div className="flex items-center justify-end">
              <div className="flex items-center space-x-3">

                <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={()=>{handleExport()}}                >
                  <Download size={16} className="inline mr-2" />
                  Export
                </button>

                <button
                  className="px-4 py-2 text-sm text-white rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#12B99C" }}
                  onClick={() => navigate("/rm/add-partner")}
                >
                  <Plus size={16} className="inline mr-2" />
                  Add Partner
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-2">
          {/* Stats Cards */}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            {/* Partner List */}
            <div className="lg:col-span-12">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                {/* Search and Filters */}
                <div className="p-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: "#111827" }}
                    >
                      Partner Directory
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <input
                          type="text"
                          placeholder="Search partners..."
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <select
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={selectedFilter}
                        onChange={(e) => setSelectedFilter(e.target.value)}
                      >
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Partner Cards */}

                {/* Partner Cards */}
                <div className="p-4 space-y-4">
                  {filteredPartners?.map((partner) => (
                    <div
                      key={partner.id}
                      className="p-4 shadow-md border border-gray-200 rounded-xl hover:shadow-lg transition-shadow bg-white"
                    >
                      {/* Top Section */}
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        {/* Left: Logo + Info */}
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-xl  flex items-center justify-center">
                           <img src={partner?.profilePic} alt="profile" className="rounded-2xl"/>
                          
                            {/* <span className="text-white font-bold text-lg">
                              {partner.logo ||
                                partner.name?.charAt(0).toUpperCase()}
                            </span> */}
                          </div>
                          <div>
                            <h4
                              className="cursor-pointer text-base font-semibold text-gray-900"
                              onClick={() => {
                                navigate("/rm/RManalytics", {
                                  state: { id: partner.id, role: "RM" },
                                });
                              }}
                            >
                              {partner.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {partner.type || "Partner"}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(
                                  partner.status
                                )}`}
                              >
                                {partner.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Stats */}
                        <div className="grid grid-cols-2 lg:flex lg:space-x-6 gap-3 lg:gap-12 w-full lg:w-auto">
                          {/* Deals */}
                          <div className="text-center">
                            <p className="text-lg font-bold text-blue-600">
                              {partner.dealsClosedThisMonth ??
                                partner.dealsThisMonth ??
                                0}
                            </p>
                            <p className="text-xs text-gray-600">Deals</p>
                          </div>

                          {/* Revenue */}
                          <div className="text-center">
                            <p className="text-lg font-bold text-green-600">
                              {formatCurrency(partner.totalDisbursed || 0)}
                            </p>
                            <p className="text-xs text-gray-600">Revenue</p>
                          </div>

                          {/* Success */}
                          <div className="text-center">
                            <p className="text-lg font-bold text-purple-600">
                              {partner.performance ?? 0}
                            </p>
                            <p className="text-xs text-gray-600">Success</p>
                          </div>

                          <button
                        className="px-2 py-1 border rounded text-xs"
                        style={{
                          borderColor: colors.secondary,
                          color: colors.secondary,
                        }}
                        onClick={()=> handleLoginAs(partner?.id)}
                      >
                        Login
                      </button>

                          <div className="flex flex-col items-center mt-2">

                            {

                              partner.status == "ACTIVE" ?
                                <button
                                  className={` cursor-pointer px-2 py-2 rounded-lg text-1xl font-semibold "bg-red-500 text-white bg-red-600`}
                                  onClick={() => {
                                    toggleActivation(partner)
                                  }}
                                >
                                  Deactivate
                                </button>

                                :

                                <button
                                  className={`cursor-pointer px-2 py-2 rounded-lg text-1xl font-semibold "bg-red-500 text-white bg-green-600`}
                                  onClick={() => {
                                    setActivateModel(true)
                                    setSelectedPartner(partner)
                                  }}
                                >
                                  Activate
                                </button>


                            }

                          </div>


                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Partners;
