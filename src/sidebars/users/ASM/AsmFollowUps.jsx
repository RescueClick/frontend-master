import React, { useState, useEffect } from "react";
import {
  Search,
  Phone,
  Calendar,
  MessageSquare,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Download,
  Edit3,
} from "lucide-react";
import { fetchRsmFollowUps, recordRsmFollowUp } from "../../../feature/thunks/asmThunks";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { sortNewestFirst } from "../../../utils/sortNewestFirst";

const AsmFollowUps = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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

  const getStatusStyle = (s) => {
    const option = statusOptions.find((opt) => opt.value === s);
    return (
      option || {
        color: "bg-gray-500",
        textColor: "text-gray-700",
        bgColor: "bg-gray-100",
      }
    );
  };

  const getStatusIcon = (s) => {
    switch (s) {
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

  const formatDate = (date) => {
    if (!date) return "Never";
    const d = new Date(date);
    return d
      .toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(",", "");
  };

  const filteredFollowUps = followUps.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.rsm?.name?.toLowerCase().includes(term) ||
      item.rsm?.employeeId?.toLowerCase().includes(term) ||
      item.rsm?.email?.toLowerCase().includes(term);

    const itemStatus = item.followUp?.status || "";
    const matchesStatus =
      statusFilter === "" || itemStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedFilteredFollowUps = sortNewestFirst(
    filteredFollowUps.map((item) => ({
      ...item,
      lastCallSort: item.followUp?.lastCall || item.followUp?.createdAt || item.rsm?.createdAt,
    })),
    { dateKeys: ["lastCallSort"] }
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header & controls styled like RM */}

      <div className="bg-white rounded-2xl p-6 mb-6 border border-emerald-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by RSM name, ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-200"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 transition-all duration-200"
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
          <button className="bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold flex items-center">
            <Download className="w-5 h-5 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Table layout like RM */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-emerald-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead
              className="text-white"
              style={{ backgroundColor: "#12B99C" }}
            >
              <tr>
                <th className="px-2 py-4 text-left font-semibold">
                  RSM Name
                </th>
                <th className="px-2 py-4 text-left font-semibold">
                  Employee ID
                </th>
                <th className="px-2 py-4 text-left font-semibold">Email</th>
                <th className="px-2 py-4 text-left font-semibold">Phone</th>
                <th className="px-2 py-4 text-left font-semibold">Status</th>
                <th className="px-2 py-4 text-left font-semibold">Remarks</th>
                <th className="px-2 py-4 text-center font-semibold">
                  Actions
                </th>
                <th className="px-2 py-4 text-center font-semibold">
                  Last Call
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Loading follow-ups...
                  </td>
                </tr>
              ) : sortedFilteredFollowUps.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No RSM follow-ups found
                  </td>
                </tr>
              ) : (
                sortedFilteredFollowUps.map((item, index) => {
                  const s = item.followUp?.status || "";
                  const statusStyle = getStatusStyle(s);
                  return (
                    <tr
                      key={item.rsm.id}
                      className={`hover:bg-gray-50 transition-colors duration-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        }`}
                    >
                      <td className="px-2 py-2 text-sm">
                        <div className="flex items-center">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold mr-3"
                            style={{ backgroundColor: "#12B99C" }}
                          >
                            {item.rsm.name?.charAt(0)}
                          </div>
                          <span className="font-semibold text-gray-800 text-sm">
                            {item.rsm.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-sm">
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-mono">
                          {item.rsm.employeeId}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-sm text-gray-700">
                        {item.rsm.email}
                      </td>
                      <td className="px-2 py-2 text-sm text-gray-700">
                        {item.rsm.phone}
                      </td>
                      <td className="px-2 py-2 text-sm">
                        {s ? (
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${statusStyle.bgColor} ${statusStyle.textColor}`}
                          >
                            {/* {getStatusIcon(s)} */}
                            <span className="ml-1">
                              {
                                statusOptions.find(
                                  (opt) => opt.value === s
                                )?.label
                              }
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            No follow-up
                          </span>
                        )}
                      </td>
                      <td
                        className="px-2 py-2 text-sm text-gray-700 max-w-xs truncate"
                        title={item.followUp?.remarks || ""}
                      >
                        {item.followUp?.remarks || "-"}
                      </td>
                      <td className="px-2 py-2 text-sm">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedRsm(item);
                              setShowFollowUpModal(true);
                            }}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-colors duration-200"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-sm text-center text-gray-700">
                        {item.followUp?.lastCall
                          ? formatDate(item.followUp.lastCall)
                          : "N/A"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Follow-up Modal */}
      {showFollowUpModal && selectedRsm && (
        <div className="fixed inset-0 bg-black/25 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Record Follow-up
              </h2>
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
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm">
                <div className="grid grid-cols-[140px_1fr] py-1">
                  <span className="font-medium text-gray-600">RSM</span>
                  <span className="text-gray-900">{selectedRsm.rsm.name}</span>
                </div>

                <div className="grid grid-cols-[140px_1fr] py-1">
                  <span className="font-medium text-gray-600">Employee ID</span>
                  <span className="text-gray-900">{selectedRsm.rsm.employeeId}</span>
                </div>
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

