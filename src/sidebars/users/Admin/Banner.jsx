import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { X, Plus, Zap, Image as ImageIcon, Sparkles, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteBanner,
  fetchBanners,
  uploadBanners,
} from "../../../feature/thunks/adminThunks";
import MilestoneBannerEditor from "./MilestoneBannerEditor";
import AdminReferralBanners from "./AdminReferralBanners";

export default function Banner({ initialTab = "milestone" }) {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || initialTab || "milestone");

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };
  const [banners, setBanners] = useState([]);

  const { loading, error, data } = useSelector(
    (state) => state.admin.allBanners
  );

  // Extract banners array from data (handle both array and object formats)
  const bannersList = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.banners && Array.isArray(data.banners)) return data.banners;
    return [];
  }, [data]);

  useEffect(() => {
    dispatch(fetchBanners());
  }, [dispatch]);

  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFiles = (files) => {
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        setBanners((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            file: file,
            imageUrl: url,
            width: img.naturalWidth,
            height: img.naturalHeight,
            sizeKb: Math.round(file.size / 1024),
          },
        ]);
      };
      img.onerror = () => {
        setBanners((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            file: file,
            imageUrl: url,
            sizeKb: Math.round(file.size / 1024),
          },
        ]);
      };
      img.src = url;
    });
  };

  const handleFileChange = (e) => {
    handleFiles(e.target.files);
  };

  // Remove banner + free memory
  const removeBanner = (id) => {
    setBanners((prev) => {
      const bannerToRemove = prev.find((b) => b.id === id);
      if (bannerToRemove) {
        URL.revokeObjectURL(bannerToRemove.imageUrl);
      }
      return prev.filter((b) => b.id !== id);
    });
  };

  const handleUpdateBanner = async (e) => {
    if (!banners || banners.length === 0) {
      console.warn("No banners selected for upload");
      alert("Please select at least one banner to upload");
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10 MB
    const formData = new FormData();

    for (let banner of banners) {
      if (banner?.file) {
        if (banner.file.size > maxSize) {
          alert(
            `${banner.file.name} is too large. Maximum allowed size is 10MB.`
          );
          return; // Stop upload if any file is too big
        }
        formData.append("banners", banner.file);
      }
    }

    try {
      // ✅ Only send if all files are valid
      await dispatch(uploadBanners(formData)).unwrap();

      // Clear local banners after successful upload
      setBanners([]);

      // Refetch banners from backend
      dispatch(fetchBanners());
    } catch (error) {
      console.error("Failed to upload banners:", error);
      alert(error || "Failed to upload banners. Please try again.");
    }
  };

  const removeBannerFromBackend = async (bannerId) => {
    if (!bannerId) {
      console.error("No banner ID provided");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this banner?");
    if (!confirmed) return;

    try {
      await dispatch(deleteBanner(bannerId)).unwrap();
      // Refetch banners after successful delete
      dispatch(fetchBanners());
    } catch (error) {
      console.error("Failed to delete banner:", error);
      alert(error || "Failed to delete banner. Please try again.");
    }
  };

  // return (
  //   <div className="min-h-screen bg-gray-50 flex flex-col items-center p-3">
  //     <div className="w-full  bg-white shadow-lg rounded-2xl p-8 border border-teal-200">
  //       {/* Header */}
  //       <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center justify-between">
  //         Upload Banner
  //         <span className="text-sm text-teal-600">
  //           {banners.length} selected
  //         </span>
  //       </h2>

  //       {/* Banner Grid */}
  //       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
  //         <AnimatePresence>
  //           {banners.map((banner) => (
  //             <motion.div
  //               key={banner.id} // Use the unique ID as key
  //               className="relative rounded-xl shadow-md overflow-hidden group"
  //               initial={{ y: 20, opacity: 0 }}
  //               animate={{ y: 0, opacity: 1 }}
  //               exit={{ y: -20, opacity: 0 }}
  //             >
  //               {/* Banner Image */}
  //               <div className="relative w-full aspect-[14/9]">
  //                 <img
  //                   src={banner.imageUrl}
  //                   alt="Banner"
  //                   className="absolute inset-0 w-full h-full object-cover rounded-xl"
  //                 />
  //               </div>

  //               {/* Delete Button */}
  //               <button
  //                 onClick={(e) => {
  //                   e.stopPropagation(); // ✅ stop bubbling
  //                   removeBanner(banner.id);
  //                 }}
  //                 className="absolute top-3 right-3 z-20 bg-gray-800 bg-opacity-70 hover:bg-yellow-500 text-white rounded-full p-2 transition"
  //               >
  //                 <X size={20} />
  //               </button>

  //               {/* Hover Overlay */}
  //               <div
  //                 className="absolute inset-0 bg-gray-800 bg-opacity-40 opacity-0 group-hover:opacity-100 
  //                               flex items-center justify-center transition 
  //                               pointer-events-none group-hover:pointer-events-auto"
  //               >
  //                 <span className="text-white text-lg font-medium">Banner</span>
  //               </div>
  //             </motion.div>
  //           ))}
  //         </AnimatePresence>

  //         {/* Add Banner Button (inside grid) */}
  //         <div
  //           onClick={() => fileInputRef.current.click()}
  //           className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-teal-500 text-teal-500 cursor-pointer hover:bg-teal-50 transition h-60"
  //         >
  //           <Plus size={40} />
  //           <span className="mt-2 font-medium">Add Banner</span>
  //         </div>

  //         <input
  //           type="file"
  //           multiple
  //           accept="image/*"
  //           ref={fileInputRef}
  //           className="absolute inset-0 w-full h-full object-cover rounded-xl hidden"
  //           onChange={handleFileChange}
  //         />
  //       </div>
  //     </div>

  //     {/* Sticky Add Post Button */}
  //     <button
  //       onClick={() => {
  //         handleUpdateBanner();
  //       }} // replace with your logic
  //       className="fixed bottom-6 right-6 bg-teal-500 hover:bg-teal-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg transition-all flex items-center space-x-2"
  //     >
  //       <Plus size={20} />
  //       <span>Update Banner</span>
  //     </button>





  //     <div className="w-full bg-white shadow-lg rounded-2xl p-8 border border-teal-200 mt-10">
  //       {/* Header */}
  //       <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center justify-between">
  //         Banner
  //       </h2>

  //       {/* Banner Grid */}
  //       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
  //         {loading ? (
  //           <div className="col-span-full text-center py-8">
  //             <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
  //             <p className="mt-2 text-gray-600">Loading banners...</p>
  //           </div>
  //         ) : error ? (
  //           <div className="col-span-full text-center py-8">
  //             <p className="text-red-600">Error loading banners: {error}</p>
  //             <button
  //               onClick={() => dispatch(fetchBanners())}
  //               className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
  //             >
  //               Retry
  //             </button>
  //           </div>
  //         ) : bannersList.length > 0 ? (
  //           bannersList.map((banner, index) => (
  //             <div key={banner._id || index} className="relative group">
  //               <div className="relative w-full aspect-[16/9]">
  //                 <img
  //                   src={banner.imageUrl}
  //                   alt={banner.title || "Banner"}
  //                   className="absolute inset-0 w-full h-full object-cover rounded-xl"
  //                   onError={(e) => {
  //                     console.error("Failed to load banner image:", banner.imageUrl);
  //                     e.target.style.display = "none";
  //                   }}
  //                 />
  //               </div>

  //               {/* Cross Button */}
  //               <button
  //                 onClick={(e) => {
  //                   e.stopPropagation();
  //                   removeBannerFromBackend(banner?._id);
  //                 }}
  //                 className="absolute top-3 right-3 z-20 bg-gray-800 bg-opacity-70 hover:bg-red-500 text-white rounded-full p-2 transition opacity-0 group-hover:opacity-100"
  //               >
  //                 <X size={20} />
  //               </button>
  //             </div>
  //           ))
  //         ) : (
  //           <div className="col-span-full text-center py-8">
  //             <p className="text-gray-500 mb-2">No banners found</p>
  //             <p className="text-sm text-gray-400">Upload banners using the form above</p>
  //           </div>
  //         )}
  //       </div>
  //     </div>
  //   </div>
  // );



  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-32 flex justify-center">
      <div className="w-full max-w-7xl space-y-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Banner Management Hub
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage promotional banners displayed across the DhanSource partner ecosystem
            </p>
          </div>

          {activeTab === "carousel" && (
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
              {banners.length} selected for upload
            </span>
          )}
        </div>

        {/* TAB SWITCHER */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
          <button
            type="button"
            onClick={() => handleTabChange("milestone")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === "milestone"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Zap size={16} className={activeTab === "milestone" ? "fill-white" : "text-emerald-600"} />
            <span>Milestone Bonus Card (App Home Banner)</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("carousel")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === "carousel"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <ImageIcon size={16} />
            <span>Promotional Image Carousel ({bannersList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("referral")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === "referral"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Sparkles size={16} />
            <span>Referral Benefits & Banners</span>
          </button>
        </div>

        {/* TAB 1: MILESTONE BONUS BANNER CARD EDITOR */}
        {activeTab === "milestone" && (
          <MilestoneBannerEditor standalone={true} />
        )}

        {/* TAB 2: PROMOTIONAL IMAGE BANNERS */}
        {activeTab === "carousel" && (
          <div className="space-y-8">

        {/* UPLOAD SECTION */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Upload New Banners
              </h2>
              <p className="text-xs text-gray-500">
                Upload promotional banners to display on partner mobile app home carousel
              </p>
            </div>
            {banners.length > 0 && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start">
                {banners.length} banner{banners.length > 1 ? "s" : ""} selected for upload
              </span>
            )}
          </div>

          {/* BANNER SIZING & SPECIFICATIONS GUIDE */}
          <div className="mb-6 rounded-xl border border-teal-200/80 bg-gradient-to-br from-teal-50/70 via-emerald-50/40 to-slate-50 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
                <Info size={19} />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h3 className="text-sm font-bold text-slate-800">
                    Recommended Banner Dimensions & Guidelines
                  </h3>
                  <span className="text-[11px] font-semibold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded-md border border-teal-200 self-start sm:self-auto">
                    Mobile App Home Carousel
                  </span>
                </div>

                {/* Specification Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div className="rounded-lg border border-teal-200/90 bg-white p-3 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Optimal Resolution</span>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">1200 × 600 px</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Min: 800 × 400 px</p>
                  </div>

                  <div className="rounded-lg border border-teal-200/90 bg-white p-3 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Aspect Ratio</span>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">2:1 or 16:9</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Wide landscape format</p>
                  </div>

                  <div className="rounded-lg border border-teal-200/90 bg-white p-3 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Formats & Size</span>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">PNG, JPG, WEBP</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Max 2 MB per file</p>
                  </div>

                  <div className="rounded-lg border border-teal-200/90 bg-white p-3 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Text Safe Zone</span>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">Center 80%</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Leave 10% margins around edges</p>
                  </div>
                </div>

                {/* Helpful Design Tips */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs text-slate-600 bg-white/80 rounded-lg p-2.5 border border-teal-200/70">
                  <div className="flex items-center gap-1.5 font-semibold text-teal-800 shrink-0">
                    <CheckCircle2 size={15} className="text-teal-600" />
                    <span>Design Tip:</span>
                  </div>
                  <span>Keep titles, promo codes, and logos centered so mobile app card rounded corners (16px) do not clip your text.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Box */}
          <div
            onClick={() => fileInputRef.current.click()}
            className="group border-2 border-dashed border-gray-300 hover:border-teal-500 hover:bg-teal-50/20
            transition rounded-xl p-8 sm:p-10 flex flex-col items-center justify-center 
            cursor-pointer text-gray-500 hover:text-teal-600 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-teal-50 group-hover:bg-teal-100 flex items-center justify-center text-teal-600 transition mb-3">
              <Plus size={28} />
            </div>
            <p className="font-semibold text-slate-800 text-base">Click to upload promotional banners</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Recommended: <strong className="text-teal-700 font-bold">1200 × 600 px</strong> (2:1 or 16:9 Landscape) • PNG, JPG, WEBP up to 2MB
            </p>
          </div>

          <input
            type="file"
            multiple
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Preview Grid */}
          {banners.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-700">
                  Selected Banners Ready for Upload ({banners.length})
                </h3>
                <button
                  type="button"
                  onClick={handleUpdateBanner}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition"
                >
                  <Plus size={15} />
                  Upload {banners.length} Banner{banners.length > 1 ? "s" : ""} to App
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <AnimatePresence>
                  {banners.map((banner) => {
                    const ratio = banner.width && banner.height ? (banner.width / banner.height).toFixed(2) : null;
                    const isOptimalRatio = ratio && Number(ratio) >= 1.6 && Number(ratio) <= 2.3;

                    return (
                      <motion.div
                        key={banner.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition"
                      >
                        <div className="aspect-[2/1] w-full overflow-hidden bg-slate-100 relative">
                          <img
                            src={banner.imageUrl}
                            alt="Banner Preview"
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                          {/* Dimensions Badge */}
                          {banner.width && banner.height && (
                            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                              {isOptimalRatio ? (
                                <CheckCircle2 size={11} className="text-emerald-400" />
                              ) : (
                                <AlertTriangle size={11} className="text-amber-400" />
                              )}
                              <span>{banner.width} × {banner.height} px ({ratio}:1)</span>
                            </div>
                          )}
                        </div>

                        <div className="p-2.5 flex items-center justify-between text-[11px] text-gray-500 bg-gray-50 border-t border-gray-100">
                          <span className="truncate max-w-[140px] font-medium text-gray-700">
                            {banner.file?.name || "Banner image"}
                          </span>
                          {banner.sizeKb && (
                            <span className="font-semibold text-gray-600">{banner.sizeKb} KB</span>
                          )}
                        </div>

                        {/* Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBanner(banner.id);
                          }}
                          aria-label="Remove banner"
                          className="absolute top-3 right-3 bg-black/60 hover:bg-red-500 
                          text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition shadow"
                        >
                          <X size={16} />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* EXISTING BANNERS */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">

          <h2 className="text-lg font-semibold text-gray-700 mb-6">
            Existing Banners
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : bannersList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

              {bannersList.map((banner, index) => (
                <div
                  key={banner._id || index}
                  className="group relative rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition"
                >
                  <div className="aspect-[2/1] overflow-hidden">
                    <img
                      src={banner.imageUrl}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBannerFromBackend(banner._id);
                    }}
                    className="absolute top-3 right-3 bg-black/60 hover:bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}

            </div>
          ) : (
            <p className="text-center text-gray-400 py-10">
              No banners uploaded yet
            </p>
          )}
        </div>

        {/* STICKY ACTION BAR */}

        {banners.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-white border border-gray-200 shadow-xl rounded-xl px-6 py-3 flex items-center gap-4">

              <span className="text-sm text-gray-500">
                {banners.length} banner{banners.length > 1 ? "s" : ""} ready
              </span>

              <button
                onClick={handleUpdateBanner}
                className="bg-teal-500 hover:bg-teal-600 text-white font-semibold px-5 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <Plus size={16} />
                Upload
              </button>

            </div>
          </div>
        )}

          </div>
        )}

        {/* TAB 3: REFERRAL BENEFITS & BANNERS */}
        {activeTab === "referral" && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-6">
            <AdminReferralBanners embedded={true} />
          </div>
        )}

      </div>
    </div>
  );
}
