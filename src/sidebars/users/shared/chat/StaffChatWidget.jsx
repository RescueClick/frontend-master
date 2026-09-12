import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  Plus,
  Send,
  Paperclip,
  FileText,
  Search,
  ArrowLeft,
  Phone,
  Check,
  CheckCheck,
  Download,
  ExternalLink,
  Loader2,
  Sparkles,
  Maximize2,
  Minimize2,
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
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function StaffChatWidget({ currentRole = "SUPER_ADMIN" }) {
  const currentUser = getStaffUser();
  const currentUserIdStr = currentUser?._id?.toString() || "";

  // Widget Open / View states
  const [isOpen, setIsOpen] = useState(false);
  const [isDockedPanel, setIsDockedPanel] = useState(false); // false = bottom-right floating modal, true = full height right-side panel

  // Conversations & active chat
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  // Modals & attachments
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

  const { socket, subscribe, unsubscribe } = useSocket();

  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Fetch unread count & conversations
  const loadUnreadCount = async () => {
    try {
      const data = await chatService.getUnreadCount();
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      // silent catch
    }
  };

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const data = await chatService.getConversations();
      const list = data.conversations || [];
      setConversations(list);
      const totalUnread = list.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      setUnreadCount(totalUnread);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Initial load on mount
  useEffect(() => {
    loadUnreadCount();
    const timer = setInterval(loadUnreadCount, 20000);
    return () => clearInterval(timer);
  }, []);

  // When widget opens, refresh conversations
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  // Socket event subscriptions
  useEffect(() => {
    if (!socket) return;

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
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        scrollToBottom();

        if (
          message.recipient?._id === currentUserIdStr ||
          message.recipient === currentUserIdStr
        ) {
          chatService.markAsRead(conversationId);
        }
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (c._id === conversationId) {
            const isCurrentlyViewing =
              isOpen && activeConversation?._id === conversationId;
            return {
              ...c,
              lastMessage: {
                text:
                  message.text ||
                  (message.attachments?.length ? "📎 Attachment" : "Message"),
                sender: message.sender?._id || message.sender,
                senderName: `${message.sender?.firstName || ""} ${
                  message.sender?.lastName || ""
                }`.trim(),
                createdAt: message.createdAt || new Date(),
              },
              unreadCount: isCurrentlyViewing ? 0 : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        })
      );

      if (!isOpen || activeConversation?._id !== conversationId) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    // Incoming message from outside active chat
    const handleIncomingMessage = ({ message, conversationId, conversation }) => {
      if (!activeConversation || activeConversation._id !== conversationId) {
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
            loadConversations();
            return prev;
          }
        });
        setUnreadCount((prev) => prev + 1);
      }
    };

    // Read receipt
    const handleMessagesRead = ({ conversationId }) => {
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

    // Typing
    const handleUserTyping = ({ conversationId }) => {
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
  }, [socket, activeConversation, currentUserIdStr, isOpen, subscribe, unsubscribe]);

  // Load messages when selecting a conversation
  useEffect(() => {
    if (!activeConversation) return;

    if (socket) {
      socket.emit("chat:join_conversation", {
        conversationId: activeConversation._id,
      });
    }

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const data = await chatService.getMessages(activeConversation._id, 1, 50);
        setMessages(data.messages || []);

        // Decrement unread
        const currentUnreadForThis = activeConversation.unreadCount || 0;
        setConversations((prev) =>
          prev.map((c) =>
            c._id === activeConversation._id ? { ...c, unreadCount: 0 } : c
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - currentUnreadForThis));

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
        socket.emit("chat:leave_conversation", {
          conversationId: activeConversation._id,
        });
      }
    };
  }, [activeConversation?._id]);

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
      alert("Failed to upload file(s). Max 20MB (JPG, PNG, PDF).");
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectContact = async (contact) => {
    try {
      const res = await chatService.createOrGetConversation(contact._id);
      if (res.conversation) {
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

  const filteredConversations = conversations.filter((c) => {
    const other = c.otherParticipant;
    if (!other) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        other.fullName?.toLowerCase().includes(term) ||
        other.role?.toLowerCase().includes(term) ||
        other.employeeId?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <>
      {/* =====================================================================
          FLOATING LAUNCHER BUTTON (Bottom-Right of the Screen)
      ====================================================================== */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center space-x-2">
        {!isOpen && (
          <div
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-slate-200/80 shadow-md cursor-pointer hover:bg-white transition-all text-xs font-semibold text-slate-700 hover:text-teal-700"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Staff Chat</span>
          </div>
        )}

        <button
          onClick={() => {
            setIsOpen((prev) => !prev);
          }}
          className={`relative flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300 transform active:scale-95 cursor-pointer ${
            isOpen
              ? "bg-slate-800 text-white hover:bg-slate-900 rotate-90"
              : "bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:shadow-2xl hover:scale-105"
          }`}
          title="Internal Staff Chat (Admin, ASM, RSM, RM)"
          aria-label="Toggle Staff Chat"
        >
          {isOpen ? (
            <X className="w-6 h-6 transition-transform" />
          ) : (
            <MessageSquare className="w-6 h-6" />
          )}

          {/* Unread badge */}
          {unreadCount > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 flex items-center justify-center text-xs font-bold text-white bg-rose-500 rounded-full border-2 border-white shadow-md animate-bounce">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* =====================================================================
          RIGHT SIDE PANEL / MODAL POPUP (Not Full Screen!)
      ====================================================================== */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white shadow-2xl border border-slate-200 flex flex-col transition-all duration-300 overflow-hidden ${
            isDockedPanel
              ? "top-0 right-0 h-full w-full sm:w-[440px] md:w-[480px] rounded-none border-l animate-in slide-in-from-right"
              : "bottom-22 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] md:w-[450px] h-[640px] max-h-[82vh] rounded-2xl animate-in fade-in zoom-in-95"
          }`}
        >
          {/* Top Header of Chat Panel */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center space-x-2.5 min-w-0">
              {activeConversation ? (
                <button
                  onClick={() => setActiveConversation(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors"
                  title="Back to conversations list"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
              )}

              <div className="min-w-0">
                {activeConversation ? (
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className="font-semibold text-sm truncate">
                      {activeConversation.otherParticipant?.fullName}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                        ROLE_CONFIG[activeConversation.otherParticipant?.role]?.badge ||
                        "bg-white/20 text-white"
                      }`}
                    >
                      {activeConversation.otherParticipant?.role === "RSM" &&
                      activeConversation.otherParticipant?.rsmType
                        ? `RSM (${activeConversation.otherParticipant?.rsmType})`
                        : activeConversation.otherParticipant?.role}
                    </span>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold text-sm flex items-center">
                      Staff Chat
                      <span className="ml-2 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-teal-500/30 text-teal-300">
                        RSM • ASM • RM • Admin
                      </span>
                    </h3>
                  </div>
                )}

                {activeConversation && (
                  <p className="text-[11px] text-slate-300 flex items-center">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                        onlineUserIds.includes(
                          activeConversation.otherParticipant?._id
                        )
                          ? "bg-emerald-400"
                          : "bg-slate-400"
                      }`}
                    />
                    {onlineUserIds.includes(
                      activeConversation.otherParticipant?._id
                    )
                      ? "Online"
                      : "Offline"}
                    {activeConversation.otherParticipant?.employeeId && (
                      <span className="ml-2 font-mono text-[10px] opacity-80">
                        {activeConversation.otherParticipant?.employeeId}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Right Header Buttons */}
            <div className="flex items-center space-x-1">
              {/* Call button if phone available */}
              {activeConversation?.otherParticipant?.phone && (
                <a
                  href={`tel:${activeConversation.otherParticipant.phone}`}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                  title={`Call ${activeConversation.otherParticipant.phone}`}
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}

              {/* Toggle right-docked drawer vs bottom-right popup */}
              <button
                onClick={() => setIsDockedPanel((prev) => !prev)}
                className="hidden sm:inline-flex p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                title={isDockedPanel ? "Floating window mode" : "Dock to right side panel"}
              >
                {isDockedPanel ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>

              {/* Close Widget */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                title="Minimize chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ===================================================================
              VIEW 1: CONVERSATION LIST (When no active conversation)
          ==================================================================== */}
          {!activeConversation && (
            <div className="flex-1 flex flex-col bg-slate-50 min-h-0 overflow-hidden">
              {/* Search Bar + New Chat Button */}
              <div className="p-3 bg-white border-b border-slate-100 flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search staff chats..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setIsNewChatOpen(true)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Chat</span>
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {loadingConversations ? (
                  <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                    <span className="text-xs">Loading staff chats...</span>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="py-16 px-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 mx-auto flex items-center justify-center mb-2">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">No chats found</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                      Start chatting with any Admin, ASM, RSM, or RM colleague.
                    </p>
                    <button
                      onClick={() => setIsNewChatOpen(true)}
                      className="mt-3 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                    >
                      + Start First Chat
                    </button>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const other = conv.otherParticipant;
                    if (!other) return null;

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
                        className="flex items-center space-x-3 p-3 bg-white hover:bg-teal-50/60 cursor-pointer transition-colors"
                      >
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-teal-500 to-emerald-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
                            {initials}
                          </div>
                          <span
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                              isOnline ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-semibold text-slate-900 text-xs truncate">
                              {other.fullName}
                            </span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap ml-1">
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
                              <span className="text-[10px] font-mono text-slate-500 truncate">
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
          )}

          {/* ===================================================================
              VIEW 2: ACTIVE CONVERSATION MESSAGES & INPUT
          ==================================================================== */}
          {activeConversation && (
            <div className="flex-1 flex flex-col bg-slate-50 min-h-0 overflow-hidden">
              {/* Optional Loan Attached Banner */}
              {activeConversation.loanRef?.applicationNumber && (
                <div className="bg-teal-50 border-b border-teal-100 px-3 py-1.5 flex items-center justify-between text-xs shrink-0">
                  <div className="flex items-center space-x-1.5 truncate">
                    <FileText className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span className="font-mono font-semibold text-teal-900 truncate">
                      {activeConversation.loanRef.applicationNumber}
                    </span>
                    <span className="text-slate-500 truncate text-[11px]">
                      ({activeConversation.loanRef.applicantName})
                    </span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-white border border-teal-200 text-teal-800 shrink-0 ml-1">
                    {activeConversation.loanRef.status}
                  </span>
                </div>
              )}

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {loadingMessages ? (
                  <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                    <span className="text-xs">Loading conversation...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-500">
                    <Sparkles className="w-6 h-6 text-teal-500 mx-auto mb-2 opacity-80" />
                    Say hello to {activeConversation.otherParticipant?.fullName}!
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe =
                      msg.sender?._id === currentUserIdStr ||
                      msg.sender === currentUserIdStr;
                    const prevMsg = messages[idx - 1];
                    const showDateDivider =
                      !prevMsg ||
                      new Date(msg.createdAt).toDateString() !==
                        new Date(prevMsg.createdAt).toDateString();

                    return (
                      <React.Fragment key={msg._id || idx}>
                        {showDateDivider && (
                          <div className="flex items-center justify-center my-2">
                            <span className="bg-slate-200/80 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
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
                            className={`max-w-[85%] rounded-2xl p-2.5 shadow-2xs text-xs ${
                              isMe
                                ? "bg-gradient-to-br from-teal-600 to-emerald-600 text-white rounded-tr-xs"
                                : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs"
                            }`}
                          >
                            {/* Embedded loan tag */}
                            {msg.loanRef?.applicationNumber && (
                              <div
                                className={`mb-1.5 p-2 rounded-lg border text-[11px] ${
                                  isMe
                                    ? "bg-teal-700/60 border-teal-400/30 text-teal-50"
                                    : "bg-teal-50/80 border-teal-200 text-slate-800"
                                }`}
                              >
                                <div className="flex items-center justify-between font-semibold">
                                  <span>{msg.loanRef.applicationNumber}</span>
                                  <span className="text-[9px] uppercase">
                                    {msg.loanRef.status}
                                  </span>
                                </div>
                                <div className="text-[10px] opacity-90">
                                  {msg.loanRef.applicantName} • ₹
                                  {Number(msg.loanRef.amount || 0).toLocaleString("en-IN")}
                                </div>
                              </div>
                            )}

                            {/* Message text */}
                            {msg.text && (
                              <p className="whitespace-pre-wrap leading-relaxed break-words">
                                {msg.text}
                              </p>
                            )}

                            {/* Attachments */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-1.5 space-y-1">
                                {msg.attachments.map((att, aIdx) => {
                                  const isImg =
                                    att.mimeType?.startsWith("image/") ||
                                    /\.(jpe?g|png|webp)$/i.test(att.url);
                                  if (isImg) {
                                    return (
                                      <a
                                        key={aIdx}
                                        href={att.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block overflow-hidden rounded-lg border border-black/10 hover:opacity-95"
                                      >
                                        <img
                                          src={att.url}
                                          alt="Attachment"
                                          className="max-h-48 w-full object-cover"
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
                                      className={`flex items-center space-x-1.5 p-1.5 rounded-lg border text-[11px] ${
                                        isMe
                                          ? "bg-teal-700/60 border-teal-400/30 text-teal-50"
                                          : "bg-slate-50 border-slate-200 text-slate-800"
                                      }`}
                                    >
                                      <FileText className="w-3.5 h-3.5 shrink-0 text-red-400" />
                                      <span className="truncate flex-1">
                                        {att.name || "Document.pdf"}
                                      </span>
                                      <Download className="w-3 h-3 shrink-0" />
                                    </a>
                                  );
                                })}
                              </div>
                            )}

                            {/* Time & status tick */}
                            <div
                              className={`flex items-center justify-end space-x-1 mt-1 text-[9px] ${
                                isMe ? "text-teal-100/90" : "text-slate-400"
                              }`}
                            >
                              <span>{formatMessageTime(msg.createdAt)}</span>
                              {isMe && (
                                <span>
                                  {msg.status === "READ" ? (
                                    <CheckCheck className="w-3 h-3 text-sky-200" />
                                  ) : msg.status === "DELIVERED" ? (
                                    <CheckCheck className="w-3 h-3 opacity-70" />
                                  ) : (
                                    <Check className="w-3 h-3 opacity-70" />
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
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500 italic">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                    <span className="text-[11px]">typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Attachments / Loan tray */}
              {(selectedLoan || pendingAttachments.length > 0 || uploadingFiles) && (
                <div className="bg-white border-t border-slate-200 px-3 py-1.5 flex flex-wrap gap-1.5 items-center shrink-0">
                  {uploadingFiles && (
                    <div className="flex items-center space-x-1 text-[11px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  )}
                  {selectedLoan && (
                    <div className="flex items-center space-x-1 bg-teal-50 border border-teal-200 text-teal-800 text-[11px] px-2 py-0.5 rounded">
                      <FileText className="w-3 h-3" />
                      <span className="font-semibold">{selectedLoan.applicationNumber}</span>
                      <button
                        onClick={() => setSelectedLoan(null)}
                        className="ml-1 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {pendingAttachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-1 bg-slate-100 border border-slate-200 text-slate-800 text-[11px] px-2 py-0.5 rounded"
                    >
                      <Paperclip className="w-3 h-3" />
                      <span className="truncate max-w-[90px]">{att.name}</span>
                      <button
                        onClick={() =>
                          setPendingAttachments((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                        className="ml-1 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div className="bg-white border-t border-slate-200 p-2.5 shrink-0">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center space-x-1.5"
                >
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
                    className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Attach file (PDF/Image)"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsLoanPickerOpen(true)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Attach loan application"
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    placeholder="Type message... (Enter to send)"
                    className="flex-1 py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    value={messageText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                  />

                  <button
                    type="submit"
                    disabled={
                      !messageText.trim() &&
                      pendingAttachments.length === 0 &&
                      !selectedLoan
                    }
                    className="p-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Start New Chat Modal */}
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
    </>
  );
}
