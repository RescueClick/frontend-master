import React, { useState, useEffect } from "react";
import { Search, Phone, Calendar, MessageSquare, User, CheckCircle, XCircle, Clock } from "lucide-react";
import { fetchRsmFollowUps, recordRsmFollowUp } from "../../../feature/thunks/asmThunks";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

const AsmFollowUps = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedRsm, setSelectedRsm] = useState(null);
  const [status, setStatus] = useState("Connected");
  const [remarks, setRemarks] = useState("");

  const dispatch = useDispatch();

  const { data, loading } = useSelector(
    (state) => state.asm.followUps || { data: [], loading: false }
  );

  useEffect(() => {
    dispatch(fetchRsmFollowUps());
  }, [dispatch]);

  const handleRecordFollowUp = async () => {
    if (!selectedRsm || !status) {
      toast.error("Please select RSM and status");
      return;
    }

    try {
      await dispatch(recordRsmFollowUp({
        rsmId: selectedRsm.rsm.id,
        status,
        remarks,
      })).unwrap();
      toast.success("Follow-up recorded successfully");
      setShowFollowUpModal(false);
      setSelectedRsm(null);
      setStatus("Connected");
      setRemarks("");
      dispatch(fetchRsmFollowUps());
    } catch (error) {
      toast.error(error || "Failed to record follow-up");
    }
  };

  const followUps = Array.isArray(data) ? data : [];

  const filteredFollowUps = followUps.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.rsm?.name?.toLowerCase().includes(term) ||
      item.rsm?.employeeId?.toLowerCase().includes(term) ||
      item.rsm?.email?.toLowerCase().includes(term)
    );
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "Connected":
        return <CheckCircle size={16} className="text-green-600" />;
      case "Ringing":
        return <Clock size={16} className="text-blue-600" />;
      case "Switch Off":
      case "Not Reachable":
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <Phone size={16} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Connected":
        return "bg-green-100 text-green-800";
      case "Ringing":
        return "bg-blue-100 text-blue-800";
      case "Switch Off":
        return "bg-orange-100 text-orange-800";
      case "Not Reachable":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date) => {
    if (!date) return "Never";
    const d = new Date(date);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">RSM Follow-ups</h1>
        <p className="text-gray-600 mt-1">Track and manage follow-ups with Regional Sales Managers</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by RSM name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#12B99C] focus:border-transparent"
          />
        </div>
      </div>

      {/* Follow-ups List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-500">Loading follow-ups...</div>
        ) : filteredFollowUps.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">No RSM follow-ups found</div>
        ) : (
          filteredFollowUps.map((item) => (
            <div
              key={item.rsm.id}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#12B99C] rounded-full text-white">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.rsm.name}</h3>
                    <p className="text-xs text-gray-500">{item.rsm.employeeId}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm font-medium text-gray-900">{item.rsm.email}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Phone:</span>
                  <span className="text-sm font-medium text-gray-900">{item.rsm.phone}</span>
                </div>

                {item.followUp ? (
                  <>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Last Follow-up:</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                            item.followUp.status
                          )}`}
                        >
                          {getStatusIcon(item.followUp.status)}
                          {item.followUp.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <Calendar size={14} />
                        {formatDate(item.followUp.lastCall)}
                      </div>
                      {item.followUp.remarks && (
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <div className="flex items-start gap-2">
                            <MessageSquare size={14} className="text-gray-400 mt-0.5" />
                            <p className="text-xs text-gray-700">{item.followUp.remarks}</p>
                          </div>
                        </div>
                      )}
                      {item.followUp.updatedBy && (
                        <p className="text-xs text-gray-500 mt-2">
                          Updated by: {item.followUp.updatedBy.name} ({item.followUp.updatedBy.employeeId})
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="border-t pt-3 mt-3">
                    <p className="text-sm text-gray-500 text-center">No follow-up recorded yet</p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setSelectedRsm(item);
                    setShowFollowUpModal(true);
                  }}
                  className="w-full bg-[#12B99C] text-white px-4 py-2 rounded-lg hover:bg-[#0fa085] transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Phone size={16} />
                  Record Follow-up
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Follow-up Modal */}
      {showFollowUpModal && selectedRsm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Record Follow-up</h2>
              <button
                onClick={() => {
                  setShowFollowUpModal(false);
                  setSelectedRsm(null);
                  setStatus("Connected");
                  setRemarks("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm text-gray-600">
                  <strong>RSM:</strong> {selectedRsm.rsm.name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Employee ID:</strong> {selectedRsm.rsm.employeeId}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#12B99C]"
                >
                  <option value="Connected">Connected</option>
                  <option value="Ringing">Ringing</option>
                  <option value="Switch Off">Switch Off</option>
                  <option value="Not Reachable">Not Reachable</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks (Optional)
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#12B99C]"
                  placeholder="Add any remarks about the follow-up..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleRecordFollowUp}
                  className="flex-1 bg-[#12B99C] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#0fa085] transition-colors"
                >
                  Record Follow-up
                </button>
                <button
                  onClick={() => {
                    setShowFollowUpModal(false);
                    setSelectedRsm(null);
                    setStatus("Connected");
                    setRemarks("");
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
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

export default AsmFollowUps;

