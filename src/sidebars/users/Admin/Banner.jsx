import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteBanner,
  fetchBanners,
  uploadBanners,
} from "../../../feature/thunks/adminThunks";

export default function Banner() {
  const dispatch = useDispatch();

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
    const newBanners = Array.from(files).map((file) => ({
      id: Date.now() + Math.random(),
      file: file, // ✅ Store the actual file
      imageUrl: URL.createObjectURL(file), // for preview only
    }));
    setBanners((prev) => [...prev, ...newBanners]);
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

    const maxSize = 2 * 1024 * 1024; // 2 MB
    const formData = new FormData();

    for (let banner of banners) {
      if (banner?.file) {
        if (banner.file.size > maxSize) {
          alert(
            `${banner.file.name} is too large. Maximum allowed size is 2MB.`
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
      <div className="w-full max-w-7xl space-y-10">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800">
            Banner Management
          </h1>

          <span className="text-sm text-gray-500">
            {banners.length} selected
          </span>
        </div>

        {/* UPLOAD SECTION */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">

          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Upload New Banners
          </h2>

          {/* Upload Box */}
          <div
            onClick={() => fileInputRef.current.click()}
            className="border-2 border-dashed border-gray-300 hover:border-teal-500 
            transition rounded-xl p-10 flex flex-col items-center justify-center 
            cursor-pointer text-gray-500 hover:text-teal-500"
          >
            <Plus size={40} />
            <p className="mt-3 font-medium">Click to upload banners</p>
            <p className="text-sm text-gray-400">
              PNG, JPG up to 2MB
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
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

              <AnimatePresence>
                {banners.map((banner) => (
                  <motion.div
                    key={banner.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition"
                  >
                    <div className="aspect-[16/9] w-full overflow-hidden">
                      <img
                        src={banner.imageUrl}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    </div>

                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBanner(banner.id);
                      }}
                      className="absolute top-3 right-3 bg-black/60 hover:bg-red-500 
                      text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={18} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

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
                  <div className="aspect-[16/9] overflow-hidden">
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
    </div>
  );
}
