import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";

const CibilAuditLog = () => {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { adminToken } = getAuthData();
        if (!adminToken) {
          console.error("Error fetching CIBIL reports: missing admin token");
          setLoading(false);
          return;
        }
        const res = await axios.get(`${backendurl}/cibil/admin/all`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        setStats(res.data.stats);
        setReports(res.data.reports || []);
      } catch (err) {
        console.error("Error fetching CIBIL reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">CIBIL Checks Audit & Revenue</h2>
      <p className="text-gray-500 mb-8">Monitor all CIBIL checks performed by partners and track API revenue.</p>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Total Checks</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.successfulChecks}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Revenue Collected</h3>
            <p className="text-3xl font-bold text-emerald-600">₹{stats.totalCollected}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Partner Commission</h3>
            <p className="text-3xl font-bold text-amber-500">₹{stats.totalCommissions}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Net Profit</h3>
            <p className="text-3xl font-bold text-purple-600">₹{stats.netProfit}</p>
            <span className="text-xs text-gray-400 mt-1">(After API Costs)</span>
          </div>
        </div>
      )}

      {/* Audit Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">Security Audit Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Partner Name</th>
                <th className="px-6 py-4">Customer Phone</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">CIBIL Score</th>
                <th className="px-6 py-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map((report) => (
                <tr key={report._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {new Date(report.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-800">
                      {report.partnerId?.firstName} {report.partnerId?.lastName}
                    </span>
                    <br />
                    <span className="text-xs text-gray-400">{report.partnerId?.partnerCode}</span>
                  </td>
                  <td className="px-6 py-4 font-medium">{report.customerPhone}</td>
                  <td className="px-6 py-4">
                    {report.paymentStatus === "PAID" ? (
                      <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Paid ₹{report.feeCollected}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        {report.paymentStatus}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {report.score ? (
                      <span className={`font-bold ${
                        report.score >= 750 ? "text-emerald-600" :
                        report.score >= 650 ? "text-amber-500" : "text-red-500"
                      }`}>
                        {report.score}
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-400">
                    {report.ipAddress || "Unknown"}
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No CIBIL checks have been performed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CibilAuditLog;
