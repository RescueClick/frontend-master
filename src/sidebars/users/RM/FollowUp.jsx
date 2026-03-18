import React, { useEffect, useState } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  Download,
  ChevronDown,
  User,
  Hash,
  Phone,
  MessageSquare,
  Save,
  X,
  Calendar,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPartnersWithFollowUp, updateFollowUp } from "../../../feature/thunks/rmThunks";


const FollowUp = () => {

    // ✅ Add this
  const [formData, setFormData] = useState({
    partnerName: "",
    partnerId: "",
    employeeId :"",
    partnerContact: "",
    status: "",
    remarks: "",
    lastCall: "",
  });
  // follow up
  const dispatch = useDispatch();
  const { data, loading, error, success } = useSelector(
    (state) => state.rm.partnersWithFollowUp
  );

  useEffect(() => {
    dispatch(fetchPartnersWithFollowUp());
  }, [dispatch]);
  // directly map Redux API data into followUps for display

  const followUps = (data || []).map((item, index) => ({
    id: index + 1,
    partnerName: item.name,
    partnerId: item.partnerId,
    employeeId: item.employeeId,
    partnerContact: item.phone,
    status: item.status,
    remarks: item.remarks,
    lastCall: item.lastCall,
  }));

  const statusOptions = [
    {
      value: "Ringing",
      label: "Ringing",
      color: "bg-amber-500",
      textColor: "text-amber-700",
      bgColor: "bg-amber-100",
    },
    {
      value: "Connected",
      label: "Connected",
      color: "bg-emerald-500",
      textColor: "text-emerald-700",
      bgColor: "bg-emerald-100",
    },
    {
      value: "Switch Off",
      label: "Switch Off",
      color: "bg-red-500",
      textColor: "text-red-700",
      bgColor: "bg-red-100",
    },
     {
      value: "Not Reachable",
      label: "Not Reachable",
      color: "bg-gray-500",
      textColor: "text-gray-700",
      bgColor: "bg-gray-100",
    },
  ];

  const getStatusStyle = (status) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return (
      option || {
        color: "bg-gray-500",
        textColor: "text-gray-700",
        bgColor: "bg-gray-100",
      }
    );
  };






  const formatDate = (isoDate) => {
  if (!isoDate) return "";

  const date = new Date(isoDate);

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).replace(",", ""); 
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  const formattedLastCall = formatDate(formData.lastCall || new Date().toISOString());

  const handleSubmit = () => {
    if (editingId) {
      dispatch(
        updateFollowUp({
          partnerId: formData.partnerId,
          employeeId:formData.employeeId,
          status: formData.status,
          remarks: formData.remarks,
          lastCall:formattedLastCall ,
        })
      );
    }
    resetForm();
  };

  const handleEdit = (followUp) => {
    setFormData({
      partnerName: followUp.partnerName,
      partnerId: followUp.partnerId,
      employeeId:followUp.employeeId,
      partnerContact: followUp.partnerContact,
      status: followUp.status,
      remarks: followUp.remarks,
    });
    setEditingId(followUp.id);
    setShowModal(true);
  };

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");



  // No hard delete for partners from follow-up screen; RM only manages follow-ups here.

  const resetForm = () => {
    setFormData({
      partnerName: "",
      partnerId: "",
      employeeId:"",
      partnerContact: "",
      status: "",
      remarks: "",
    });
    setEditingId(null);
    setShowModal(false);
  };

  const filteredFollowUps = followUps.filter((followUp) => {
    const matchesSearch =
      followUp.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.partnerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.partnerContact.includes(searchTerm);
    const matchesStatus =
      statusFilter === "" || followUp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-amber-400/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-br from-amber-400/10 to-emerald-400/10 rounded-full blur-xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        {/* <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Follow Up Management
              </h1>
              <p className="text-gray-600">
                Track and manage partner communications
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => setShowModal(true)}
                className=" text-black px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform flex items-center border-2 border-gray-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Follow Up
              </button>
            </div>
          </div>
        </div> */}

        {/* Controls */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-emerald-100">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, ID, or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl   transition-all duration-200"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3 pr-10  transition-all duration-200"
              >
                <option value="">All Status</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>

            {/* Export Button */}
            <button className="bg-white border-2 border-gray-200  text-gray-700 px-6 py-3 rounded-xl font-semibold flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-emerald-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead
                className="text-white"
                style={{ backgroundColor: "#12B99C" }}
              >
                <tr>
                  <th className="px-2 py-4 text-left font-semibold">
                    Partner Name
                  </th>
                  <th className="px-2 py-4 text-left font-semibold">
                    Partner ID
                  </th>
                  <th className="px-2 py-4 text-left font-semibold">Contact</th>
                  <th className="px-2 py-4 text-left font-semibold">Status</th>
                  <th className="px-2 py-4 text-left font-semibold">Remarks</th>
                  <th className="px-2 py-4 text-center font-semibold">
                    Actions
                  </th>
                  <th className="px-2 py-4 text-center font-semibold">
                    Last Call
                  </th>{" "}
                  {/* ✅ Added */}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFollowUps.map((followUp, index) => {
                  const statusStyle = getStatusStyle(followUp.status);
                  return (
                    <tr
                      key={followUp.id}
                      className={`hover:bg-gray-50 transition-colors duration-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="px-2 py-2 text-sm">
                        <div className="flex items-center">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold mr-3"
                            style={{ backgroundColor: "#12B99C" }}
                          >
                            {followUp.partnerName.charAt(0)}
                          </div>
                          <span className="font-semibold text-gray-800 text-sm">
                            {followUp.partnerName}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-sm">
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-mono">
                          {followUp.employeeId}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-sm text-gray-700">
                        {followUp.partnerContact}
                      </td>
                      <td className="px-2 py-2 text-sm">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${statusStyle.bgColor} ${statusStyle.textColor}`}
                        >
                          {statusOptions.find(
                            (opt) => opt.value === followUp.status
                          )?.label || "N/A"}
                        </span>
                      </td>

                      <td
                        className="px-2 py-2 text-sm text-gray-700 max-w-xs truncate"
                        title={followUp.remarks}
                      >
                        {followUp.remarks}
                      </td>
                      <td className="px-2 py-2 text-sm">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(followUp)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-colors duration-200"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-sm text-center text-gray-700">
                        {followUp.lastCall
                          ? new Date(followUp.lastCall).toLocaleString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              }
                            )
                          : "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredFollowUps.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">No follow-ups found</div>
              <p className="text-gray-500 mt-2">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/25 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-3xl border-b border-gray-100 px-6 py-2">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingId ? "Edit Follow Up" : "Add New Follow Up"}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center text-gray-800 font-semibold mb-3">
                    <User
                      className="w-5 h-5 mr-2"
                      style={{ color: "#12B99C" }}
                    />
                    Partner Name
                  </label>
                  <input
                    type="text"
                    name="partnerName"
                    value={formData.partnerName}
                    onChange={handleInputChange}
                    placeholder="Enter partner name"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl "
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center text-gray-800 font-semibold mb-3">
                    <Hash
                      className="w-5 h-5 mr-2"
                      style={{ color: "#12B99C" }}
                    />
                    Partner ID
                  </label>
                  <input
                    type="text"
                    name="partnerId"
                    value={formData.partnerId}
                    onChange={handleInputChange}
                    placeholder="Enter partner ID"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl "
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center text-gray-800 font-semibold mb-3">
                    <Phone
                      className="w-5 h-5 mr-2"
                      style={{ color: "#12B99C" }}
                    />
                    Partner Contact
                  </label>
                  <input
                    type="tel"
                    name="partnerContact"
                    value={formData.partnerContact}
                    onChange={handleInputChange}
                    placeholder="Enter contact number"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl f"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center text-gray-800 font-semibold mb-3">
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${
                        getStatusStyle(formData.status).color || "bg-gray-300"
                      }`}
                    ></div>
                    Status
                  </label>
                  <div className="relative">
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl  appearance-none cursor-pointer pr-12"
                      required
                    >
                      <option value="">Select status</option>
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center text-gray-800 font-semibold mb-3">
                  <MessageSquare
                    className="w-5 h-5 mr-2"
                    style={{ color: "#12B99C" }}
                  />
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="Enter any additional notes or remarks..."
                  rows={1}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl resize-vertical"
                />
              </div>
              <div>
                <label className="flex items-center text-gray-800 font-semibold mb-3">
                  <Calendar
                    className="w-5 h-5 mr-2"
                    style={{ color: "#12B99C" }}
                  />
                  Last Call
                </label>
                <input
                  type="datetime-local"
                  name="lastCall"
                  value={formData.lastCall}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white rounded-b-3xl border-t border-gray-100 px-6 py-4">
              <div className="flex gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={
                    !formData.partnerName ||
                    !formData.partnerId ||
                    !formData.partnerContact ||
                    !formData.status
                  }
                  className="flex-1 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center disabled:transform-none disabled:shadow-none"
                  style={{ backgroundColor: "#12B99C" }}
                >
                  <Save className="w-5 h-5 mr-2" />
                  {editingId ? "Update Follow Up" : "Save Follow Up"}
                </button>

                <button
                  onClick={resetForm}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-xl border-2 border-gray-200 hover:border-emerald-500 flex items-center justify-center"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUp;
