import React, { useState, useEffect } from "react";
import { Search, X, Users, UserPlus, Shield, Briefcase, Phone, Mail, Loader2, Sparkles } from "lucide-react";
import { chatService } from "./chatService";

const ROLE_BADGES = {
  SUPER_ADMIN: { label: "Admin", bg: "bg-purple-100 text-purple-700 border-purple-200" },
  ASM: { label: "ASM", bg: "bg-blue-100 text-blue-700 border-blue-200" },
  RSM: { label: "RSM", bg: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  RM: { label: "RM", bg: "bg-amber-100 text-amber-700 border-amber-200" },
};

export default function NewChatModal({ isOpen, onClose, onSelectContact, onlineUserIds = [] }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL"); // ALL | TEAM | SUPER_ADMIN | ASM | RSM | RM

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setRoleFilter("ALL");
      return;
    }
    loadContacts();
  }, [isOpen]);

  const loadContacts = async (search = "") => {
    setLoading(true);
    try {
      const data = await chatService.getContacts(search);
      setContacts(data.contacts || []);
    } catch (err) {
      console.error("Failed to load staff contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    loadContacts(val);
  };

  if (!isOpen) return null;

  const filteredContacts = contacts.filter((c) => {
    if (roleFilter === "TEAM") return c.isMyTeam;
    if (roleFilter !== "ALL") return c.role === roleFilter;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                Start a New Chat
              </h3>
              <p className="text-xs text-slate-500">
                Select a colleague from Admin, ASM, RSM, or RM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              className="w-full pl-9 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
              placeholder="Search by name, employee code, mobile..."
              value={searchTerm}
              onChange={handleSearch}
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  loadContacts("");
                }}
                className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Role Filters */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            {[
              { id: "ALL", label: "All Staff" },
              { id: "TEAM", label: "My Reporting Line" },
              { id: "SUPER_ADMIN", label: "Admin" },
              { id: "ASM", label: "ASM" },
              { id: "RSM", label: "RSM" },
              { id: "RM", label: "RM" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  roleFilter === tab.id
                    ? "bg-teal-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-slate-50">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              <span className="text-xs">Loading staff directory...</span>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">
              No staff members found matching criteria.
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const isOnline = onlineUserIds.some(
                (id) => String(id) === String(contact._id)
              );
              const badge = ROLE_BADGES[contact.role] || {
                label: contact.role,
                bg: "bg-slate-100 text-slate-600 border-slate-200",
              };
              const initials = `${contact.firstName?.[0] || ""}${contact.lastName?.[0] || ""}`.toUpperCase() || "DS";

              return (
                <div
                  key={contact._id}
                  onClick={() => {
                    onSelectContact(contact);
                    onClose();
                  }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-teal-50/60 cursor-pointer transition-all border border-transparent hover:border-teal-100 group"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-teal-500 to-emerald-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
                        {initials}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          isOnline ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                        title={isOnline ? "Online" : "Offline"}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900 text-sm truncate">
                          {contact.fullName}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${badge.bg}`}
                        >
                          {contact.role === "RSM" && contact.rsmType
                            ? `RSM (${contact.rsmType})`
                            : badge.label}
                        </span>
                        {contact.isMyTeam && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full font-medium flex items-center">
                            <Sparkles className="w-2.5 h-2.5 mr-0.5 text-emerald-600" /> Team
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-500 mt-0.5">
                        {contact.employeeId && (
                          <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-1 rounded">
                            {contact.employeeId}
                          </span>
                        )}
                        {contact.phone && (
                          <span className="truncate">{contact.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 text-xs font-medium text-teal-600 bg-white border border-teal-200 group-hover:bg-teal-600 group-hover:text-white px-3 py-1.5 rounded-lg transition-colors ml-2"
                  >
                    Chat
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
