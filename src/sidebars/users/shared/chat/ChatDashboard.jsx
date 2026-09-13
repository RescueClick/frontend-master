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
  ExternalLink,
  Loader2,
} from "lucide-react";
import { chatService, getStaffUser, sameId } from "./chatService";
import { useSocket } from "../../../../hooks/useSocket";
import NewChatModal from "./NewChatModal";
import LoanPickerModal from "./LoanPickerModal";
import { TypingBubble, ChatConnectionPill } from "./TypingBubble";
import ChatMediaAttachment from "./ChatMediaAttachment";
import ChatLoanCard, { getLoanNavigation } from "./ChatLoanCard";

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

const isUserOnline = (onlineUserIds, userId) =>
  onlineUserIds.some((id) => sameId(id, userId));

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
  const remoteTypingClearRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const activeConversationRef = useRef(null);

  const { socket, isConnected, subscribe, unsubscribe, ensureConnected } = useSocket();

  // Keep ref in sync so socket handlers always see latest conversation
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Scroll messages to bottom smoothly
  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const appendMessage = (message, conversationId) => {
    if (!message) return;
    const active = activeConversationRef.current;
    if (!active || !sameId(active._id, conversationId)) return;

    setMessages((prev) => {
      if (prev.some((m) => sameId(m._id, message._id))) return prev;
      // Drop optimistic temp messages that match this real one
      const withoutTemp = prev.filter((m) => {
        if (!String(m._id || "").startsWith("temp-")) return true;
        return !(
          sameId(m.sender, message.sender) &&
          (m.text || "") === (message.text || "") &&
          Math.abs(new Date(m.createdAt) - new Date(message.createdAt || Date.now())) < 15000
        );
      });
      return [...withoutTemp, message];
    });
    setIsOtherUserTyping(false);
    if (remoteTypingClearRef.current) clearTimeout(remoteTypingClearRef.current);
    setTimeout(() => scrollToBottom(), 30);

    if (sameId(message.recipient, currentUserIdStr)) {
      chatService.markAsRead(conversationId).catch(() => {});
    }
  };

  const bumpConversationPreview = (message, conversationId, { forceUnread = false } = {}) => {
    const active = activeConversationRef.current;
    const viewing = active && sameId(active._id, conversationId);
    setConversations((prev) =>
      prev.map((c) => {
        if (!sameId(c._id, conversationId)) return c;
        return {
          ...c,
          lastMessage: {
            text: message?.text || (message?.attachments?.length ? "📎 Attachment" : "Message"),
            sender: message?.sender?._id || message?.sender,
            senderName: `${message?.sender?.firstName || ""} ${message?.sender?.lastName || ""}`.trim(),
            createdAt: message?.createdAt || new Date(),
          },
          unreadCount: viewing
            ? 0
            : forceUnread || !sameId(message?.sender, currentUserIdStr)
              ? (c.unreadCount || 0) + (sameId(message?.sender, currentUserIdStr) ? 0 : 1)
              : c.unreadCount || 0,
        };
      })
    );
  };

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
    ensureConnected?.();
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

  const refreshOnlineStaff = () => {
    if (!socket?.connected) return;
    socket.emit("chat:get_online_staff", (res) => {
      if (res?.onlineUserIds) {
        setOnlineUserIds(res.onlineUserIds.map(String));
      }
    });
  };

  // Socket room joining and event listeners
  useEffect(() => {
    ensureConnected?.();
    if (!socket) return;

    refreshOnlineStaff();

    const handlePresence = ({ userId, isOnline }) => {
      const uid = String(userId);
      setOnlineUserIds((prev) => {
        if (isOnline) {
          return prev.some((id) => sameId(id, uid)) ? prev : [...prev, uid];
        }
        return prev.filter((id) => !sameId(id, uid));
      });
    };

    const handleOnlineStaffList = ({ onlineUserIds: ids }) => {
      if (Array.isArray(ids)) {
        setOnlineUserIds(ids.map(String));
      }
    };

    // Primary realtime path — also emitted to each user's personal room
    const handleNewMessage = ({ message, conversationId }) => {
      appendMessage(message, conversationId);
      bumpConversationPreview(message, conversationId);
    };

    // Fallback path for list/unread (also appends if chat is open)
    const handleIncomingMessage = ({ message, conversationId, conversation }) => {
      appendMessage(message, conversationId);

      const active = activeConversationRef.current;
      if (active && sameId(active._id, conversationId)) return;

      setConversations((prev) => {
        const exists = prev.some((c) => sameId(c._id, conversationId));
        if (exists) {
          return prev.map((c) =>
            sameId(c._id, conversationId)
              ? {
                  ...c,
                  lastMessage: conversation?.lastMessage || c.lastMessage,
                  unreadCount: (c.unreadCount || 0) + 1,
                }
              : c
          );
        }
        loadConversations();
        return prev;
      });
    };

    const handleMessageSent = ({ message, conversationId }) => {
      appendMessage(message, conversationId);
      bumpConversationPreview(message, conversationId);
    };

    const handleMessagesRead = ({ conversationId }) => {
      const active = activeConversationRef.current;
      if (active && sameId(active._id, conversationId)) {
        setMessages((prev) =>
          prev.map((m) =>
            sameId(m.sender, currentUserIdStr) ? { ...m, status: "READ" } : m
          )
        );
      }
    };

    const handleUserTyping = ({ conversationId, userId }) => {
      const active = activeConversationRef.current;
      if (!active || !sameId(active._id, conversationId)) return;
      if (sameId(userId, currentUserIdStr)) return;
      setIsOtherUserTyping(true);
      if (remoteTypingClearRef.current) clearTimeout(remoteTypingClearRef.current);
      remoteTypingClearRef.current = setTimeout(() => setIsOtherUserTyping(false), 2800);
    };

    const handleUserStopTyping = ({ conversationId, userId }) => {
      const active = activeConversationRef.current;
      if (!active || !sameId(active._id, conversationId)) return;
      if (sameId(userId, currentUserIdStr)) return;
      setIsOtherUserTyping(false);
      if (remoteTypingClearRef.current) clearTimeout(remoteTypingClearRef.current);
    };

    const handleSocketConnected = () => {
      refreshOnlineStaff();
      const active = activeConversationRef.current;
      if (active?._id && socket) {
        socket.emit("chat:join_conversation", { conversationId: String(active._id) });
      }
    };

    subscribe("chat:presence", handlePresence);
    subscribe("chat:online_staff_list", handleOnlineStaffList);
    subscribe("chat:new_message", handleNewMessage);
    subscribe("chat:incoming_message", handleIncomingMessage);
    subscribe("chat:message_sent", handleMessageSent);
    subscribe("chat:messages_read", handleMessagesRead);
    subscribe("chat:user_typing", handleUserTyping);
    subscribe("chat:user_stop_typing", handleUserStopTyping);
    subscribe("socketConnected", handleSocketConnected);

    return () => {
      unsubscribe("chat:presence", handlePresence);
      unsubscribe("chat:online_staff_list", handleOnlineStaffList);
      unsubscribe("chat:new_message", handleNewMessage);
      unsubscribe("chat:incoming_message", handleIncomingMessage);
      unsubscribe("chat:message_sent", handleMessageSent);
      unsubscribe("chat:messages_read", handleMessagesRead);
      unsubscribe("chat:user_typing", handleUserTyping);
      unsubscribe("chat:user_stop_typing", handleUserStopTyping);
      unsubscribe("socketConnected", handleSocketConnected);
      if (remoteTypingClearRef.current) clearTimeout(remoteTypingClearRef.current);
    };
  }, [socket, isConnected, currentUserIdStr, subscribe, unsubscribe]);

  // Load messages when active conversation changes + soft poll while open
  useEffect(() => {
    if (!activeConversation) {
      setIsOtherUserTyping(false);
      return;
    }

    const conversationId = String(activeConversation._id);
    ensureConnected?.();

    if (socket) {
      socket.emit("chat:join_conversation", { conversationId });
    }

    const loadMessages = async ({ silent = false } = {}) => {
      if (!silent) setLoadingMessages(true);
      try {
        const data = await chatService.getMessages(conversationId, 1, 60);
        const next = data.messages || [];
        setMessages((prev) => {
          // Keep optimistic temps that aren't confirmed yet
          const temps = prev.filter((m) => String(m._id || "").startsWith("temp-"));
          if (!temps.length) return next;
          const merged = [...next];
          temps.forEach((t) => {
            const already = merged.some(
              (m) =>
                sameId(m.sender, t.sender) &&
                (m.text || "") === (t.text || "") &&
                Math.abs(new Date(m.createdAt) - new Date(t.createdAt)) < 15000
            );
            if (!already) merged.push(t);
          });
          return merged;
        });
        setConversations((prev) =>
          prev.map((c) =>
            sameId(c._id, conversationId) ? { ...c, unreadCount: 0 } : c
          )
        );
        if (!silent) setTimeout(() => scrollToBottom("auto"), 80);
      } catch (err) {
        console.error("Error loading chat messages:", err);
      } finally {
        if (!silent) setLoadingMessages(false);
      }
    };

    loadMessages();

    // Soft poll: catches anything missed if socket briefly drops
    const poll = setInterval(() => {
      loadMessages({ silent: true });
    }, isConnected ? 8000 : 3000);

    return () => {
      clearInterval(poll);
      if (socket) {
        socket.emit("chat:leave_conversation", { conversationId });
      }
    };
  }, [activeConversation?._id, socket, isConnected]);

  // Handle typing debounce
  const handleInputChange = (e) => {
    setMessageText(e.target.value);

    if (socket?.connected && activeConversation) {
      socket.emit("chat:typing", {
        conversationId: String(activeConversation._id),
        recipientId: activeConversation.otherParticipant?._id,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("chat:stop_typing", {
          conversationId: String(activeConversation._id),
          recipientId: activeConversation.otherParticipant?._id,
        });
      }, 1200);
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

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimistic = {
      _id: tempId,
      conversationId: activeConversation._id,
      sender: { _id: currentUserIdStr, firstName: currentUser?.firstName, lastName: currentUser?.lastName },
      recipient: activeConversation.otherParticipant,
      text: trimmed,
      attachments: pendingAttachments,
      loanRef: selectedLoan,
      status: "SENT",
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setMessageText("");
    setPendingAttachments([]);
    setSelectedLoan(null);
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom();

    if (socket?.connected) {
      socket.emit("chat:stop_typing", {
        conversationId: String(activeConversation._id),
        recipientId: activeConversation.otherParticipant?._id,
      });
    }

    try {
      const data = await chatService.sendMessage(activeConversation._id, payload);
      if (data.message) {
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m._id !== tempId);
          if (withoutTemp.some((m) => sameId(m._id, data.message._id))) return withoutTemp;
          return [...withoutTemp, data.message];
        });
        scrollToBottom();
        setConversations((prev) =>
          prev.map((c) =>
            sameId(c._id, activeConversation._id)
              ? {
                  ...c,
                  lastMessage: {
                    text:
                      data.message.text ||
                      (data.message.attachments?.length ? "📎 Attachment" : "Message"),
                    sender: currentUserIdStr,
                    senderName: "You",
                    createdAt: data.message.createdAt || new Date(),
                  },
                }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
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

  // Open the attached loan file in the correct role screen
  const handleNavigateToLoan = (loanRefOrId) => {
    const loanRef =
      typeof loanRefOrId === "object" && loanRefOrId !== null
        ? loanRefOrId
        : { applicationId: loanRefOrId };
    const nav = getLoanNavigation(currentRole, loanRef);
    if (!nav?.path) return;
    navigate(nav.path, { state: nav.state });
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
              const isOnline = isUserOnline(onlineUserIds, other._id);
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
                    isUserOnline(onlineUserIds, activeConversation.otherParticipant?._id)
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
                      isOtherUserTyping
                        ? "text-teal-600"
                        : isUserOnline(onlineUserIds, activeConversation.otherParticipant?._id)
                          ? "text-emerald-600"
                          : "text-slate-400"
                    }`}
                  >
                    ●{" "}
                    {isOtherUserTyping
                      ? "typing..."
                      : isUserOnline(onlineUserIds, activeConversation.otherParticipant?._id)
                        ? "Online"
                        : "Offline"}
                  </span>
                  <ChatConnectionPill isConnected={isConnected} />
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
          {activeConversation.loanRef &&
            (activeConversation.loanRef.applicationNumber ||
              activeConversation.loanRef.applicationId) && (
            <div className="bg-teal-50 border-b border-teal-100 px-4 py-2 flex items-center justify-between text-xs gap-2">
              <div className="flex items-center space-x-2 truncate min-w-0">
                <FileText className="w-4 h-4 text-teal-700 shrink-0" />
                <span className="text-teal-900 font-medium shrink-0">Discussion:</span>
                <span className="font-mono font-semibold text-teal-800">
                  {activeConversation.loanRef.applicationNumber || "Loan"}
                </span>
                <span className="text-slate-600 truncate">
                  ({activeConversation.loanRef.applicantName || "Applicant"}
                  {activeConversation.loanRef.loanType
                    ? ` · ${String(activeConversation.loanRef.loanType).replace(/_/g, " ")}`
                    : ""}
                  )
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleNavigateToLoan(activeConversation.loanRef)}
                className="shrink-0 flex items-center text-teal-700 font-semibold hover:text-teal-900 hover:underline"
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
                const isMe = sameId(msg.sender, currentUserIdStr);
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

                    {/* Own messages = right (teal), other user = left (white) */}
                    <div
                      className={`flex w-full ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-md lg:max-w-lg rounded-2xl p-3 shadow-xs transition-all ${
                          isMe
                            ? "bg-linear-to-br from-teal-600 to-emerald-600 text-white rounded-br-sm"
                            : "bg-white text-slate-800 border border-slate-200/70 rounded-bl-sm"
                        }`}
                      >
                        {/* Linked Loan Card Preview inside message */}
                        {msg.loanRef &&
                          (msg.loanRef.applicationId ||
                            (msg.loanRef.applicationNumber &&
                              msg.loanRef.applicationNumber !== "N/A") ||
                            msg.loanRef.applicantName) && (
                            <ChatLoanCard
                              loanRef={msg.loanRef}
                              onOpen={handleNavigateToLoan}
                            />
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
                            {msg.attachments.map((att, aIdx) => (
                              <ChatMediaAttachment key={aIdx} att={att} />
                            ))}
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
              <TypingBubble name={activeConversation.otherParticipant?.firstName} />
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
