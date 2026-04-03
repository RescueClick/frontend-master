import { useState } from "react";
import {
  User,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  UserCheck,
  TrendingUp,
  Bell,
  Calendar,
  Phone,
  Mail,
  AlertTriangle,
  Clock,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Eye,
  FileText,
  Target,
  Activity,
  CheckCircle,
} from "lucide-react";
import LoanStatusBadge from "../../../components/shared/LoanStatusBadge";

const RevenueGenerated = () => {

     const leadsData = [
    {
      name: "Rajesh Kumar",
      company: "Kumar Industries Pvt Ltd",
      status: "disburse",
      date: "2024-08-22",
      value: "₹12,50,000",
      stage: "Qualified",
    },
    {
      name: "Priya Sharma",
      company: "Sharma Textiles Group",
      status: "disburse",
      date: "2024-08-23",
      value: "₹8,75,000",
      stage: "Negotiation",
    },
    {
      name: "Amit Patel",
      company: "Patel Constructions Ltd",
      status: "disburse",
      date: "2024-08-21",
      value: "₹15,20,000",
      stage: "Initial Contact",
    },
    {
      name: "Sneha Reddy",
      company: "Reddy Electronics Corp",
      status: "disburse",
      date: "2024-08-24",
      value: "₹6,30,000",
      stage: "Qualification",
    },
  ];

  return (
    <>
      <div className="lg:col-span-1 bg-white rounded-2xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className="text-lg font-semibold"
                  style={{ color: "#111827" }}
                >
                  Revenue Generated
                </h3>
                <p className="text-sm text-gray-600">
                  Active leads requiring attention
                </p>
              </div>
              <Calendar className="text-gray-400" size={20} />
            </div>
            <div className="space-y-4">
              {leadsData.map((lead, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {lead.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p
                          className="font-semibold text-sm"
                          style={{ color: "#111827" }}
                        >
                          {lead.name}
                        </p>
                        <p className="text-xs text-gray-500">{lead.company}</p>
                        <p className="text-xs text-gray-400">{lead.stage}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <LoanStatusBadge status={lead.status} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <p
                        className="text-sm font-bold"
                        style={{ color: "var(--color-brand-primary)" }}
                      >
                        {lead.value}
                      </p>
                      {/* <span className="text-xs text-gray-400">
                        Due: {lead.date}
                      </span> */}
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <Phone size={12} className="inline mr-1" />
                        Call
                      </button>
                      <button className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <Mail size={12} className="inline mr-1" />
                        Email
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
    </>
  )
}

export default RevenueGenerated;