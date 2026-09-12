import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Send,
  Paperclip,
  FileText,
  X,
  Phone,
  Mail,
  Check,
  CheckCheck,
  Smile,
  ArrowLeft,
  MessageSquare,
  Sparkles,
  Download,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { chatService, getStaffUser } from "./chatService";
import { useSocket } from "../../../../hooks/useSocket";
import NewChatModal from "./NewChatModal";
import LoanPickerModal from "./LoanPickerModal";

const ROLE_CONFIG = {
  SUPER_ADMIN: { label: "Admin", badge: "bg-purple-100 text-purple-700 border-purple-200" },
  ASM: { label: "ASM", badge: "bg-blue-100 text-blue-700 border-blue-200" },
  RSM: { label: "RSM", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  RM: { label: "RM", badge: "bg-amber-100 text-amber-700 border-amber-200" },
};

function formatMessageTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateDivider(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ChatDashboard({ currentRole = "SUPER_ADMIN" }) {
  const navigate = useNavigate();
  const currentUser = getStaffUser();
  const currentUserIdStr = currentUser?._id?.toString() || "";

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState("ALL"); // ALL | TEAM | UNREAD

  // Modals & Attachments
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isLoanPickerOpen, setIsLoanPickerOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Real-time state
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const { socket, isConnected, subscribe, unsubscribe } = useSocket();

  // Scroll messages to bottom smoothly
  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const data = await chatService.getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Socket room joining and event listeners
  useEffect(() => {
    if (!socket) return;

    // Ask server for list of currently online staff
    socket.emit("chat:get_online_staff", (res) => {
      if (res?.onlineUserIds) {
        setOnlineUserIds(res.onlineUserIds);
      }
    });

    const handlePresence = ({ userId, isOnline }) => {
      setOnlineUserIds((prev) => {
        if (isOnline) {
          return prev.includes(userId) ? prev : [...prev, userId];
        } else {
          return prev.filter((id) => id !== userId);
        }
      });
    };

    const handleOnlineStaffList = ({ onlineUserIds }) => {
      if (Array.isArray(onlineUserIds)) {
        setOnlineUserIds(onlineUserIds);
      }
    };

    // When someone sends a message in current conversation
    const handleNewMessage = ({ message, conversationId }) => {
      if (activeConversation && activeConversation._id === conversationId) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        scrollToBottom();

        // Mark as read immediately if current user is the recipient
        if (message.recipient?._id === currentUserIdStr || message.recipient === currentUserIdStr) {
          chatService.markAsRead(conversationId);
        }
      }

      // Update conversations list preview
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id === conversationId) {
            return {
              ...c,
              lastMessage: {
                text: message.text || (message.attachments?.length ? "📎 Attachment" : "Message"),
                sender: message.sender?._id || message.sender,
                senderName: `${message.sender?.firstName || ""} ${message.sender?.lastName || ""}`.trim(),
                createdAt: message.createdAt || new Date(),
              },
              unreadCount:
                activeConversation?._id === conversationId
                  ? 0
                  : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        })
      );
    };

    // When an incoming message arrives from anywhere
    const handleIncomingMessage = ({ message, conversationId, conversation }) => {
      if (!activeConversation || activeConversation._id !== conversationId) {
        // Update list
        setConversations((prev) => {
          const exists = prev.some((c) => c._id === conversationId);
          if (exists) {
            return prev.map((c) =>
              c._id === conversationId
                ? {
                    ...c,
                    lastMessage: conversation.lastMessage,
                    unreadCount: (c.unreadCount || 0) + 1,
                  }
                : c
            );
          } else {
            // New conversation started by another user
            loadConversations();
            return prev;
          }
        });
      }
    };

    // When other user reads our messages
    const handleMessagesRead = ({ conversationId, readBy }) => {
      if (activeConversation && activeConversation._id === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender?._id === currentUserIdStr || m.sender === currentUserIdStr
              ? { ...m, status: "READ" }
              : m
          )
        );
      }
    };

    // Typing indicators
    const handleUserTyping = ({ conversationId, name }) => {
      if (activeConversation && activeConversation._id === conversationId) {
        setIsOtherUserTyping(true);
      }
    };

    const handleUserStopTyping = ({ conversationId }) => {
      if (activeConversation && activeConversation._id === conversationId) {
        setIsOtherUserTyping(false);
      }
    };

    subscribe("chat:presence", handlePresence);
    subscribe("chat:online_staff_list", handleOnlineStaffList);
    subscribe("chat:new_message", handleNewMessage);
    subscribe("chat:incoming_message", handleIncomingMessage);
    subscribe("chat:messages_read", handleMessagesRead);
    subscribe("chat:user_typing", handleUserTyping);
    subscribe("chat:user_stop_typing", handleUserStopTyping);

    return () => {
      unsubscribe("chat:presence", handlePresence);
      unsubscribe("chat:online_staff_list", handleOnlineStaffList);
      unsubscribe("chat:new_message", handleNewMessage);
      unsubscribe("chat:incoming_message", handleIncomingMessage);
      unsubscribe("chat:messages_read", handleMessagesRead);
      unsubscribe("chat:user_typing", handleUserTyping);
      unsubscribe("chat:user_stop_typing", handleUserStopTyping);
    };
  }, [socket, activeConversation, currentUserIdStr, subscribe, unsubscribe]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversation) return;

    // Join conversation room in socket
    if (socket) {
      socket.emit("chat:join_conversation", { conversationId: activeConversation._id });
    }

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const data = await chatService.getMessages(activeConversation._id, 1, 60);
        setMessages(data.messages || []);
        // Reset unread count locally
        setConversations((prev) =>
          prev.map((c) =>
            c._id === activeConversation._id ? { ...c, unreadCount: 0 } : c
          )
        );
        setTimeout(() => scrollToBottom("auto"), 100);
      } catch (err) {
        console.error("Error loading chat messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();

    return () => {
      if (socket) {
        socket.emit("chat:leave_conversation", { conversationId: activeConversation._id });
      }
    };
  }, [activeConversation?._id]);

  // Handle typing debounce
  const handleInputChange = (e) => {
    setMessageText(e.target.value);

    if (socket && activeConversation) {
      socket.emit("chat:typing", {
        conversationId: activeConversation._id,
        recipientId: activeConversation.otherParticipant?._id,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("chat:stop_typing", {
          conversationId: activeConversation._id,
          recipientId: activeConversation.otherParticipant?._id,
        });
      }, 1500);
    }
  };

  // Handle file selection
  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    try {
      const data = await chatService.uploadFiles(files);
      if (data.attachments) {
        setPendingAttachments((prev) => [...prev, ...data.attachments]);
      }
    } catch (err) {
      console.error("File upload failed:", err);
      alert("Failed to upload file(s). Please ensure files are JPG, PNG, or PDF under 20MB.");
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!activeConversation) return;

    const trimmed = messageText.trim();
    if (!trimmed && pendingAttachments.length === 0 && !selectedLoan) return;

    const payload = {
      text: trimmed,
      attachments: pendingAttachments,
      loanRef: selectedLoan,
    };

    // Clear input fields immediately for responsive feel
    setMessageText("");
    setPendingAttachments([]);
    setSelectedLoan(null);

    try {
      const data = await chatService.sendMessage(activeConversation._id, payload);
      if (data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });
        scrollToBottom();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message. Please try again.");
    }
  };

  // Keydown helper for Enter to send
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Start chat with contact from modal
  const handleSelectContact = async (contact) => {
    try {
      const res = await chatService.createOrGetConversation(contact._id);
      if (res.conversation) {
        // Add to list if not present
        setConversations((prev) => {
          const exists = prev.find((c) => c._id === res.conversation._id);
          if (exists) return prev;
          return [res.conversation, ...prev];
        });
        setActiveConversation(res.conversation);
      }
    } catch (err) {
      console.error("Failed to start chat with contact:", err);
    }
  };

  // Smart loan navigation based on current user role
  const handleNavigateToLoan = (applicationId) => {
    if (!applicationId) return;
    if (currentRole === "SUPER_ADMIN" || currentRole === "ADMIN") {
      navigate(`/admin/customer`);
    } else if (currentRole === "ASM") {
      navigate(`/asm/applications`);
    } else if (currentRole === "RSM") {
      navigate(`/rsm/applications`);
    } else if (currentRole === "RM") {
      navigate(`/rm/Rm-Application`);
    } else {
      navigate(`/`);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const other = c.otherParticipant;
    if (!other) return false;

    if (filterTab === "UNREAD" && (!c.unreadCount || c.unreadCount <= 0)) {
      return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = other.fullName?.toLowerCase().includes(term);
      const matchRole = other.role?.toLowerCase().includes(term);
      const matchEmp = other.employeeId?.toLowerCase().includes(term);
      return matchName || matchRole || matchEmp;
    }

    return true;
  });

  return (
    <div className="flex h-[calc(100vh-68px)] md:h-[calc(100vh-76px)] bg-slate-50 overflow-hidden">
      {/* =========================================================================
          LEFT PANE: CONVERSATION LIST
      ========================================================================== */}
      <div
        className={`${
          activeConversation ? "hidden md:flex" : "flex"
        } w-full md:w-80 lg:w-96 flex-col border-r border-slate-200 bg-white shrink-0`}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center">
              Internal Chat
              <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                Staff Only
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct messaging with Admin, ASM, RSM & RM
            </p>
          </div>
          <button
            onClick={() => setIsNewChatOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-md hover:from-emerald-600 hover:to-teal-700 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search & Filter Tabs */}
        <div className="p-3 border-b border-slate-100 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1.5">
            {[
              { id: "ALL", label: "All Chats" },
              { id: "UNREAD", label: "Unread" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                  filterTab === tab.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {loadingConversations ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              <span className="text-xs">Loading conversations...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No chats found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Start a conversation with an RSM, ASM, RM, or Admin colleague.
              </p>
              <button
                onClick={() => setIsNewChatOpen(true)}
                className="mt-4 inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Start Chat</span>
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const other = conv.otherParticipant;
              if (!other) return null;

              const isSelected = activeConversation?._id === conv._id;
              const isOnline = onlineUserIds.includes(other._id);
              const badge = ROLE_CONFIG[other.role] || {
                label: other.role,
                badge: "bg-slate-100 text-slate-600 border-slate-200",
              };
              const initials = `${other.firstName?.[0] || ""}${other.lastName?.[0] || ""}`.toUpperCase() || "DS";

              return (
                <div
                  key={conv._id}
                  onClick={() => setActiveConversation(conv)}
                  className={`flex items-center space-x-3 p-3.5 cursor-pointer transition-all border-l-4 ${
                    isSelected
                      ? "bg-teal-50/70 border-l-teal-600"
                      : "border-l-transparent hover:bg-slate-50/80"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-linear-to-br from-teal-500 to-emerald-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
                      {initials}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        isOnline ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-slate-900 text-sm truncate">
                        {other.fullName}
                      </span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                        {conv.lastMessage?.createdAt
                          ? formatMessageTime(conv.lastMessage.createdAt)
                          : ""}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 mb-1">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${badge.badge}`}
                      >
                        {other.role === "RSM" && other.rsmType
                          ? `RSM (${other.rsmType})`
                          : badge.label}
                      </span>
                      {other.employeeId && (
                        <span className="text-[10px] font-mono text-slate-500">
                          {other.employeeId}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 truncate min-w-0 pr-2">
                        {conv.lastMessage?.text || "No messages yet"}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="shrink-0 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* =========================================================================
          RIGHT PANE: ACTIVE CHAT CONVERSATION OR EMPTY STATE
      ========================================================================== */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col bg-slate-100/60 h-full overflow-hidden">
          {/* Active Chat Top Header */}
          <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-3 min-w-0">
              <button
                onClick={() => setActiveConversation(null)}
                className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-teal-500 to-emerald-600 text-white font-semibold text-xs flex items-center justify-center">
                  {`${activeConversation.otherParticipant?.firstName?.[0] || ""}${
                    activeConversation.otherParticipant?.lastName?.[0] || ""
                  }`.toUpperCase() || "DS"}
                </div>
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    onlineUserIds.includes(activeConversation.otherParticipant?._id)
                      ? "bg-emerald-500"
                      : "bg-slate-300"
                  }`}
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h2 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                    {activeConversation.otherParticipant?.fullName}
                  </h2>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                      ROLE_CONFIG[activeConversation.otherParticipant?.role]?.badge ||
                      "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {activeConversation.otherParticipant?.role === "RSM" &&
                    activeConversation.otherParticipant?.rsmType
                      ? `RSM (${activeConversation.otherParticipant?.rsmType})`
                      : activeConversation.otherParticipant?.role}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-500">
                  <span
                    className={`flex items-center font-medium ${
                      onlineUserIds.includes(activeConversation.otherParticipant?._id)
                        ? "text-emerald-600"
                        : "text-slate-400"
                    }`}
                  >
                    ●{" "}
                    {onlineUserIds.includes(activeConversation.otherParticipant?._id)
                      ? "Online"
                      : "Offline"}
                  </span>
                  {activeConversation.otherParticipant?.employeeId && (
                    <span className="font-mono text-slate-500">
                      ID: {activeConversation.otherParticipant?.employeeId}
                    </span>
                  )}
                  {activeConversation.otherParticipant?.phone && (
                    <a
                      href={`tel:${activeConversation.otherParticipant?.phone}`}
                      className="hidden sm:flex items-center text-teal-600 hover:underline"
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      {activeConversation.otherParticipant?.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsLoanPickerOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors cursor-pointer"
                title="Attach a loan application for discussion"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Attach Loan</span>
              </button>
            </div>
          </div>

          {/* Active Loan Reference Banner (if attached to conversation) */}
          {activeConversation.loanRef?.applicationNumber && (
            <div className="bg-teal-50 border-b border-teal-100 px-4 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 truncate">
                <FileText className="w-4 h-4 text-teal-700 shrink-0" />
                <span className="text-teal-900 font-medium">Discussion Subject:</span>
                <span className="font-mono font-semibold text-teal-800">
                  {activeConversation.loanRef.applicationNumber}
                </span>
                <span className="text-slate-600 truncate">
                  ({activeConversation.loanRef.applicantName} - {activeConversation.loanRef.loanType})
                </span>
              </div>
              <button
                onClick={() =>
                  handleNavigateToLoan(activeConversation.loanRef.applicationId)
                }
                className="shrink-0 flex items-center text-teal-700 font-semibold hover:text-teal-900 hover:underline ml-2"
              >
                <span>Open File</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </button>
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingMessages ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                <span className="text-xs">Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 mx-auto flex items-center justify-center mb-2">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Say Hello to {activeConversation.otherParticipant?.fullName}!
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  You can discuss credit approvals, file documentation, disbursement queries, or targets here.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe =
                  msg.sender?._id === currentUserIdStr || msg.sender === currentUserIdStr;
                const prevMsg = messages[idx - 1];
                const showDateDivider =
                  !prevMsg ||
                  new Date(msg.createdAt).toDateString() !==
                    new Date(prevMsg.createdAt).toDateString();

                return (
                  <React.Fragment key={msg._id || idx}>
                    {showDateDivider && (
                      <div className="flex items-center justify-center my-3">
                        <span className="bg-slate-200/80 text-slate-600 text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-2xs">
                          {formatDateDivider(msg.createdAt)}
                        </span>
                      </div>
                    )}

                    <div
                      className={`flex flex-col ${
                        isMe ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-md lg:max-w-lg rounded-2xl p-3 shadow-xs transition-all ${
                          isMe
                            ? "bg-linear-to-br from-teal-600 to-emerald-600 text-white rounded-tr-xs"
                            : "bg-white text-slate-800 border border-slate-200/70 rounded-tl-xs"
                        }`}
                      >
                        {/* Linked Loan Card Preview inside message */}
                        {msg.loanRef?.applicationNumber && (
                          <div
                            className={`mb-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                              isMe
                                ? "bg-teal-700/60 border-teal-400/40 text-teal-50 hover:bg-teal-700"
                                : "bg-teal-50/70 border-teal-200 text-slate-800 hover:bg-teal-100/70"
                            }`}
                            onClick={() =>
                              handleNavigateToLoan(msg.loanRef.applicationId)
                            }
                          >
                            <div className="flex items-center justify-between font-semibold mb-1">
                              <span className="flex items-center">
                                <FileText className="w-3.5 h-3.5 mr-1" />
                                {msg.loanRef.applicationNumber}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                  isMe
                                    ? "bg-teal-800 text-teal-100"
                                    : "bg-white text-teal-800 border border-teal-200"
                                }`}
                              >
                                {msg.loanRef.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] opacity-90">
                              <span>{msg.loanRef.applicantName}</span>
                              {msg.loanRef.amount ? (
                                <span className="font-semibold">
                                  ₹{Number(msg.loanRef.amount).toLocaleString("en-IN")}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        )}

                        {/* Text */}
                        {msg.text && (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">
                            {msg.text}
                          </p>
                        )}

                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            {msg.attachments.map((att, aIdx) => {
                              const isImage =
                                att.mimeType?.startsWith("image/") ||
                                /\.(jpe?g|png|webp)$/i.test(att.url);

                              if (isImage) {
                                return (
                                  <a
                                    key={aIdx}
                                    href={att.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block overflow-hidden rounded-xl border border-black/10 hover:opacity-95"
                                  >
                                    <img
                                      src={att.url}
                                      alt="Attachment"
                                      className="max-h-60 w-full object-cover"
                                    />
                                  </a>
                                );
                              }

                              return (
                                <a
                                  key={aIdx}
                                  href={att.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`flex items-center space-x-2 p-2 rounded-xl border text-xs transition-colors ${
                                    isMe
                                      ? "bg-teal-700/60 border-teal-400/40 text-teal-50 hover:bg-teal-700"
                                      : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                                  }`}
                                >
                                  <FileText className="w-4 h-4 shrink-0 text-red-400" />
                                  <span className="truncate flex-1 font-medium">
                                    {att.name || "Document.pdf"}
                                  </span>
                                  <Download className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                </a>
                              );
                            })}
                          </div>
                        )}

                        {/* Timestamp & Status tick */}
                        <div
                          className={`flex items-center justify-end space-x-1 mt-1 text-[10px] ${
                            isMe ? "text-teal-100/90" : "text-slate-400"
                          }`}
                        >
                          <span>{formatMessageTime(msg.createdAt)}</span>
                          {isMe && (
                            <span>
                              {msg.status === "READ" ? (
                                <CheckCheck className="w-3.5 h-3.5 text-sky-200" />
                              ) : msg.status === "DELIVERED" ? (
                                <CheckCheck className="w-3.5 h-3.5 opacity-70" />
                              ) : (
                                <Check className="w-3.5 h-3.5 opacity-70" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}

            {/* Typing indicator */}
            {isOtherUserTyping && (
              <div className="flex items-center space-x-2 text-xs text-slate-500 italic">
                <div className="flex space-x-1 items-center bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" />
                </div>
                <span>
                  {activeConversation.otherParticipant?.firstName} is typing...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Selected Loan & Attachments Tray */}
          {(selectedLoan || pendingAttachments.length > 0 || uploadingFiles) && (
            <div className="bg-white border-t border-slate-200 px-4 py-2 flex flex-wrap gap-2 items-center">
              {uploadingFiles && (
                <div className="flex items-center space-x-1.5 text-xs text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading files...</span>
                </div>
              )}

              {selectedLoan && (
                <div className="flex items-center space-x-1.5 bg-teal-50 border border-teal-200 text-teal-800 text-xs px-2.5 py-1 rounded-lg">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  <span className="font-semibold">{selectedLoan.applicationNumber}</span>
                  <span className="text-slate-500">({selectedLoan.applicantName})</span>
                  <button
                    onClick={() => setSelectedLoan(null)}
                    className="ml-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {pendingAttachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-1.5 bg-slate-100 border border-slate-200 text-slate-800 text-xs px-2.5 py-1 rounded-lg"
                >
                  <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate max-w-[120px]">{att.name}</span>
                  <button
                    onClick={() =>
                      setPendingAttachments((prev) =>
                        prev.filter((_, i) => i !== idx)
                      )
                    }
                    className="ml-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Message Input Bar */}
          <div className="bg-white border-t border-slate-200 p-3">
            <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
              {/* File Attachment Button */}
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                title="Attach Images or PDFs"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Loan Reference Button */}
              <button
                type="button"
                onClick={() => setIsLoanPickerOpen(true)}
                className="p-2.5 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                title="Attach Loan Application"
              >
                <FileText className="w-5 h-5" />
              </button>

              {/* Text Input */}
              <div className="flex-1 relative">
                <textarea
                  rows={1}
                  placeholder={`Message ${activeConversation.otherParticipant?.fullName}... (Press Enter to send)`}
                  className="w-full resize-none py-2.5 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all max-h-32"
                  value={messageText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={
                  !messageText.trim() &&
                  pendingAttachments.length === 0 &&
                  !selectedLoan
                }
                className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs hover:shadow-md hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Empty State when no conversation selected on desktop */
        <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 bg-slate-50 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/10 to-emerald-500/20 border border-teal-200/50 flex items-center justify-center text-teal-600 mb-4 shadow-sm">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            DhanSource Staff Messaging
          </h2>
          <p className="text-sm text-slate-500 max-w-md mt-1 mb-6">
            Real-time collaboration across RSM, ASM, RM, and Admin. Discuss customer loan files, credit status, documents, and disbursements in real time.
          </p>
          <button
            onClick={() => setIsNewChatOpen(true)}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold rounded-xl shadow-md hover:from-emerald-600 hover:to-teal-700 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Start a New Chat</span>
          </button>
        </div>
      )}

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onSelectContact={handleSelectContact}
        onlineUserIds={onlineUserIds}
      />

      {/* Loan Picker Modal */}
      <LoanPickerModal
        isOpen={isLoanPickerOpen}
        onClose={() => setIsLoanPickerOpen(false)}
        onSelectLoan={(loan) => setSelectedLoan(loan)}
      />
    </div>
  );
}
