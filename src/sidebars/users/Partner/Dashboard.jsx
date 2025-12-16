import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone } from "@fortawesome/free-solid-svg-icons";
// import { faWhatsapp } from "@fortawesome/free-solid-svg-icons";

import { faFileAlt } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";

import {
  Bell,
  FileText,
  Users,
  TrendingUp,
  Phone,
  Menu,
  BarChart3,
  CheckCircle,
  Target,
  File,
  Files,
  FileCheck,
  FileX,
  Clock,
  Mail,
  Badge,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
} from "lucide-react";
import { getAuthData } from "../../../utils/localStorage";

import { useDispatch, useSelector } from "react-redux";
import { fetchPartnerDashboard } from "../../../feature/thunks/partnerThunks";
import { useRealtimeData } from "../../../utils/useRealtimeData";
import { backendurl } from "../../../feature/urldata";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const dispatch = useDispatch();

  // Select dashboard state
  const { data } = useSelector((state) => state.partner.dashboard);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        const { partnerToken } = getAuthData();

        // Run both requests at the same time
        const dashboardPromise = dispatch(fetchPartnerDashboard());

        const bannersPromise = axios.get(`${backendurl}/partner/banners`, {
          headers: { Authorization: `Bearer ${partnerToken}` },
        });

        const [dashboardResult, bannersResult] = await Promise.all([
          dashboardPromise,
          bannersPromise,
        ]);

        setBanners(bannersResult.data?.banners || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    
    // Fetch banners every 5 minutes
    const bannerInterval = setInterval(async () => {
      try {
        const { partnerToken } = getAuthData();
        const bannersResult = await axios.get(`${backendurl}/partner/banners`, {
          headers: { Authorization: `Bearer ${partnerToken}` },
        });
        setBanners(bannersResult.data?.banners || []);
      } catch (err) {
        console.error("Error fetching banners:", err);
      }
    }, 300000);
    
    return () => clearInterval(bannerInterval);
  }, [dispatch]);

  // Real-time dashboard updates with 30 second polling (only after initial load)
  useRealtimeData(fetchPartnerDashboard, {
    interval: 30000, // 30 seconds
    enabled: !loading, // Only enable after initial load completes
  });

  const goToPrevious = () => {
    setIsAutoPlaying(false); // Pause auto-play when manually navigating
    setCurrentIndex(currentIndex === 0 ? banners.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setIsAutoPlaying(false); // Pause auto-play when manually navigating
    setCurrentIndex(currentIndex === banners.length - 1 ? 0 : currentIndex + 1);
  };

  const goToSlide = (index) => {
    setIsAutoPlaying(false); // Pause auto-play when manually navigating
    setCurrentIndex(index);
  };


  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-600 font-medium">Error: {error}</p>
      </div>
    );
  }

  const targetVsAchievement = useMemo(() => {
    return Object.entries(data?.monthlyTargets || {}).map(
      ([month, stats]) => {
        const achievement = stats?.achieved || 0; // fallback to 0
        const target = stats?.target || 0; // fallback to 0
        let percentage =
          target > 0 ? Math.round((achievement / target) * 100) : 0;

        // Cap percentage at 100% and add "+" if exceeded
        if (percentage > 100) {
          percentage = "100" + "+";
        } else {
          percentage = percentage + "%";
        }

        return {
          month,
          target,
          achievement,
          percentage,
        };
      }
    );
  }, [data?.monthlyTargets]);

  const currentDate = new Date();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handleCallPartner = (phone) => {
    const phoneNumber = phone; // replace with your partner's number
    window.location.href = `tel:${phoneNumber}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
      

        {/* Top Section - New Application Button and Banner */}
        <div className="mb-4 sm:mb-6">
        {/* Mobile: Stack vertically, Desktop: Side by side */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch">
          {/* Left Side - Total Files Card and New Application Button */}
          <div className="flex-shrink-0">
            {/* New Application Button - Full width on mobile */}
            <button
              className="w-full lg:w-60 flex items-center justify-center gap-2 px-4 py-3 mb-4 rounded-lg text-white text-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: "#12B99C" }}
              onClick={() => {
                navigate("/partner/get-loan");
                console.log("Navigate to new application");
              }}
            >
              <Plus size={18} /> New Application
            </button>

            {/* Total Files Card - Full width on mobile, fixed width on desktop */}
            <div className="bg-white rounded-xl shadow-sm border-l-4 border-blue-500 p-4 sm:p-5 w-full lg:w-60">
              <div className="flex items-center lg:flex-col lg:items-start">
                {/* Icon - smaller on mobile */}
                <div className="flex-shrink-0 mr-4 lg:mr-0 lg:mb-3">
                  <FileText 
                    size={60} 
                    className="text-yellow-400 sm:hidden"
                  />
                  <FileText 
                    size={100} 
                    className="text-yellow-400 hidden sm:block"
                  />
                </div>
                
                {/* Stats */}
                <div className="flex-1 lg:w-full">
                  <div className="text-2xl sm:text-3xl lg:text-5xl font-bold text-gray-900 lg:pl-5 lg:mt-2">
                    {data?.totalFiles}
                  </div>
                  <h3 className="text-sm sm:text-lg font-medium text-gray-600 lg:pl-5">
                    Total Files
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Banner Carousel */}
          {banners.length > 0 && (
            <div className="flex-1 min-w-0">
              <div
                className="relative w-full overflow-hidden rounded-lg shadow-md bg-white"
                style={{ height: "200px", minHeight: "300px" }}
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
              >
                {/* Carousel Track */}
                <div
                  className="flex transition-transform duration-500 ease-in-out h-full"
                  style={{
                    transform: `translateX(-${currentIndex * 100}%)`,
                  }}
                >
                  {banners.map((banner, index) => (
                    <div
                      key={banner._id}
                      className="w-full h-full flex-shrink-0 relative"
                    >
                      <img
                        src={banner.imageUrl}
                        alt={banner.title || `Banner ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          console.error(`Failed to load image: ${banner.imageUrl}`);
                          e.target.style.display = "none";
                        }}
                      />

                      {/* Title Overlay */}
                      {banner.title && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 sm:p-4 rounded-b-lg">
                          <h4 className="text-white text-sm sm:text-lg font-semibold">
                            {banner.title}
                          </h4>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Navigation Arrows - Hidden on very small screens */}
                {banners.length > 1 && (
                  <>
                    <button
                      onClick={goToPrevious}
                      className="absolute left-2 sm:left-6 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white rounded-full shadow-md z-10 p-1 sm:p-2"
                    >
                      <ChevronLeft size={20} className="text-gray-700" />
                    </button>

                    <button
                      onClick={goToNext}
                      className="absolute right-2 sm:right-6 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white rounded-full shadow-md z-10 p-1 sm:p-2"
                    >
                      <ChevronRight size={20} className="text-gray-700" />
                    </button>
                  </>
                )}
              </div>

              {/* Dots Indicator */}
              {banners.length > 1 && (
                <div className="flex justify-center gap-2 mt-3">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        currentIndex === index
                          ? "bg-blue-600 w-6"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* banneer end */}

      {/* Process Cards Grid - Responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {/* Total Payout */}
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-cyan-500 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex flex-col items-start">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-cyan-600 rounded-lg flex items-center justify-center mb-2 sm:mb-4">
              <FileText size={16} className="text-cyan-100 sm:w-6 sm:h-6" />
            </div>
            <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              {data?.totalPayout}
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-600">
              Total Payout
            </div>
          </div>
        </div>

        {/* In-Process Files */}
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-amber-500 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex flex-col items-start">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-amber-600 rounded-lg flex items-center justify-center mb-2 sm:mb-4">
              <Clock size={16} className="text-amber-100 sm:w-6 sm:h-6" />
            </div>
            <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              {data?.inProcessFiles}
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-600">In-Process</div>
          </div>
        </div>

        {/* Docs Incomplete */}
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-purple-500 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex flex-col items-start">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-2 sm:mb-4">
              <FileText size={16} className="text-purple-100 sm:w-6 sm:h-6" />
            </div>
            <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              {data?.docsIncomplete}
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-600">
              Docs-Incomplete
            </div>
          </div>
        </div>

        {/* Approved Files */}
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-emerald-500 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex flex-col items-start">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-emerald-600 rounded-lg flex items-center justify-center mb-2 sm:mb-4">
              <FileCheck size={16} className="text-emerald-100 sm:w-6 sm:h-6" />
            </div>
            <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              {data?.approvedFiles}
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-600">Approved</div>
          </div>
        </div>

        {/* Total Disbursed */}
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-teal-500 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex flex-col items-start">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-teal-600 rounded-lg flex items-center justify-center mb-2 sm:mb-4">
              <Files size={16} className="text-teal-100 sm:w-6 sm:h-6" />
            </div>
            <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              {data?.totalDisburseAmount}
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-600">
              Total Disbursed
            </div>
          </div>
        </div>

        {/* Rejected Files */}
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-red-500 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex flex-col items-start">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-red-600 rounded-lg flex items-center justify-center mb-2 sm:mb-4">
              <FileX size={16} className="text-red-100 sm:w-6 sm:h-6" />
            </div>
            <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              {data?.rejectedFiles}
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-600">Rejected</div>
          </div>
        </div>
      </div>



      {/* Current Month Progress */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-gray-200 mb-4 sm:mb-6">
        <div className="space-y-4">
          {targetVsAchievement?.map((item, index) => (
            item.month === monthNames[currentDate.getMonth()] && (
              <div key={index} className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700">
                      {item.month}
                    </span>
                    <div className="flex items-center space-x-2">
                      {item.percentage >= 100 ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <Target size={16} className="text-orange-500" />
                      )}
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          item.achievement / item.target >= 1
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {Math.min(
                          ((item.achievement / item.target) * 100).toFixed(1),
                          100
                        )}%
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {item.achievement}K / {item.target}K
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="h-4 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        (item.achievement / item.target) * 100,
                        100
                      )}%`,
                      backgroundColor:
                        item.achievement >= item.target ? "#10B981" : "#F59E0B",
                    }}
                  ></div>
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Bottom Section - Relationship Manager & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Relationship Manager */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-start text-left">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Users className="w-5 h-5 mr-2 text-emerald-600" />
            Relationship Manager
          </h2>

          <div className="space-y-4 mb-6 w-full">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <div className="font-medium text-gray-900">
                  {data?.rm?.name}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Badge className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">RM ID</div>
                <div className="font-medium text-gray-900">
                  {data?.rm?.employeeId ? data.rm.employeeId : "NA"}{" "}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Contact</div>
                <div className="font-medium text-gray-900">
                  {data?.rm?.contact}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium text-gray-900">
                  {data?.rm?.email}
                </div>
              </div>
            </div>
          </div>

          {/* Call RM Button */}
          <div className="flex gap-4">
            {/* Call button */}
            <button
              onClick={() => {
                handleCallPartner(data?.rm?.contact);
              }}
              className="text-white font-lg py-5 px-8 w-48 h-14 rounded-lg flex items-center justify-center space-x-2 transition-colors text-base"
              style={{ backgroundColor: "#12B99C" }}
            >
              <FontAwesomeIcon icon={faPhone} className="w-5 h-5" />
              <span>Call RM</span>
            </button>

            {/* WhatsApp button */}
            {/* <button
              className="text-white font-lg py-5 px-8 w-48 h-14 rounded-lg flex items-center justify-center space-x-2 transition-colors text-base"
              style={{ backgroundColor: "#25D366" }} // WhatsApp green
            >
              <FontAwesomeIcon icon={faWhatsapp} className="w-5 h-5" />
              <span>WhatsApp RM</span>
            </button> */}
          </div>
        </div>

        {/* Monthly Performance */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Performance Analytics
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Monthly target vs achievement comparison
              </p>
            </div>
            <BarChart3 className="text-gray-400" size={20} />
          </div>

          <div className="space-y-4">
            {targetVsAchievement?.map((item, index) => (
              <>
                {item.target != 0 && (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-700 w-8">
                          {item.month}
                        </span>
                        <div className="flex items-center space-x-2 ml-9">
                          {item.percentage >= 100 ? (
                            <CheckCircle size={16} className="text-green-500" />
                          ) : (
                            <Target size={16} className="text-orange-500" />
                          )}

                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              item.achievement / item.target >= 1
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {Math.min(
                              ((item.achievement / item.target) * 100).toFixed(
                                1
                              ),
                              100
                            )}
                            %
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {item.achievement}K / {item.target}K
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            (item.achievement / item.target) * 100,
                            100
                          )}%`,
                          backgroundColor:
                            item.achievement >= item.target
                              ? "#10B981"
                              : "#F59E0B",
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  );


};

export default Dashboard;
