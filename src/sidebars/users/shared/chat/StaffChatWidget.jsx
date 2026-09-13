import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
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
  Loader2,
  Sparkles,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { chatService, getStaffUser, sameId } from "./chatService";
import { useSocket } from "../../../../hooks/useSocket";
import NewChatModal from "./NewChatModal";
import LoanPickerModal from "./LoanPickerModal";
import { TypingBubble } from "./TypingBubble";
import ChatMediaAttachment from "./ChatMediaAttachment";
import ChatLoanCard, { getLoanNavigation } from "./ChatLoanCard";
import { useNavigate } from "react-router-dom";

const ROLE_CONFIG = {
  SUPER_ADMIN: { label: "Admin", badge: "bg-purple-500/20 text-purple-100 border-purple-300/30" },
  ASM: { label: "ASM", badge: "bg-sky-500/20 text-sky-100 border-sky-300/30" },
  RSM: { label: "RSM", badge: "bg-emerald-500/20 text-emerald-100 border-emerald-300/30" },
  RM: { label: "RM", badge: "bg-amber-500/20 text-amber-100 border-amber-300/30" },
};

function formatMessageTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

const isUserOnline = (onlineUserIds, userId) =>
  onlineUserIds.some((id) => sameId(id, userId));

export default function StaffChatWidget({ currentRole = "SUPER_ADMIN" }) {
  const navigate = useNavigate();
  const currentUser = getStaffUser();
  const currentUserIdStr = currentUser?._id?.toString() || "";

  const [isOpen, setIsOpen] = useState(false);
  const [isDockedPanel, setIsDockedPanel] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isLoanPickerOpen, setIsLoanPickerOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [presenceReady, setPresenceReady] = useState(false);

  const typingTimeoutRef = useRef(null);
  const remoteTypingClearRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const activeConversationRef = useRef(null);
  const isOpenRef = useRef(false);
  const shouldStickToBottomRef = useRef(true);

  const { socket, isConnected, subscribe, unsubscribe, ensureConnected } = useSocket();

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const scrollToBottom = (behavior = "smooth") => {
    const el = messagesContainerRef.current;
    if (el) {
      if (behavior === "auto") {
        el.scrollTop = el.scrollHeight;
      } else {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }
    }
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  };

  // Keep view pinned to latest messages
  useLayoutEffect(() => {
    if (!activeConversation) return;
    if (shouldStickToBottomRef.current) {
      scrollToBottom("auto");
    }
  }, [messages, isOtherUserTyping, activeConversation?._id]);

  const appendMessage = (message, conversationId) => {
    if (!message) return;
    const active = activeConversationRef.current;
    if (!active || !sameId(active._id, conversationId)) return;

    shouldStickToBottomRef.current = true;
    setMessages((prev) => {
      if (prev.some((m) => sameId(m._id, message._id))) return prev;
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

    if (sameId(message.recipient, currentUserIdStr)) {
      chatService.markAsRead(conversationId).catch(() => {});
    }
  };

  const loadUnreadCount = async () => {
    try {
      const data = await chatService.getUnreadCount();
      setUnreadCount(data.unreadCount || 0);
    } catch (_) {}
  };

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const data = await chatService.getConversations();
      const list = data.conversations || [];
      setConversations(list);
      setUnreadCount(list.reduce((sum, c) => sum + (c.unreadCount || 0), 0));
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    ensureConnected?.();
    loadUnreadCount();
    const timer = setInterval(loadUnreadCount, 20000);
    return () => clearInterval(timer);
  }, []);

  const syncOnlineFromApi = async () => {
    try {
      // Heartbeat marks ME online; response includes full online list
      const data = await chatService.sendHeartbeat();
      setPresenceReady(true);
      if (Array.isArray(data?.onlineUserIds)) {
        setOnlineUserIds(data.onlineUserIds.map(String));
        return;
      }
      const list = await chatService.getOnlineStaff();
      if (Array.isArray(list?.onlineUserIds)) {
        setOnlineUserIds(list.onlineUserIds.map(String));
      }
    } catch (_) {
      // silent — socket presence may still work
    }
  };

  // Presence while staff sidebar is loaded (chat available)
  useEffect(() => {
    ensureConnected?.();
    syncOnlineFromApi();
    const beat = setInterval(syncOnlineFromApi, 8000);
    return () => clearInterval(beat);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    ensureConnected?.();
    loadConversations();
    syncOnlineFromApi();
  }, [isOpen]);

  const refreshOnlineStaff = () => {
    // Prefer REST (reliable). Also ask socket when connected.
    syncOnlineFromApi();
    const sock = socket;
    if (!sock?.connected) return;
    sock.emit("chat:get_online_staff", (res) => {
      if (res?.onlineUserIds) {
        setOnlineUserIds((prev) => {
          const merged = new Set([...(prev || []).map(String), ...res.onlineUserIds.map(String)]);
          return Array.from(merged);
        });
      }
    });
  };

  // Socket subscriptions
  useEffect(() => {
    ensureConnected?.();
    if (!socket) return;

    refreshOnlineStaff();

    const handlePresence = ({ userId, isOnline }) => {
      const uid = String(userId);
      setOnlineUserIds((prev) => {
        if (isOnline) return prev.some((id) => sameId(id, uid)) ? prev : [...prev, uid];
        return prev.filter((id) => !sameId(id, uid));
      });
    };

    const handleOnlineStaffList = ({ onlineUserIds: ids }) => {
      if (Array.isArray(ids)) setOnlineUserIds(ids.map(String));
    };

    const handleNewMessage = ({ message, conversationId }) => {
      const active = activeConversationRef.current;
      const open = isOpenRef.current;
      appendMessage(message, conversationId);

      setConversations((prev) =>
        prev.map((c) => {
          if (!sameId(c._id, conversationId)) return c;
          const viewing = open && active && sameId(active._id, conversationId);
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
              : (c.unreadCount || 0) + (sameId(message?.sender, currentUserIdStr) ? 0 : 1),
          };
        })
      );

      if ((!open || !active || !sameId(active._id, conversationId)) && !sameId(message?.sender, currentUserIdStr)) {
        setUnreadCount((n) => n + 1);
      }
    };

    const handleIncomingMessage = ({ message, conversationId, conversation }) => {
      appendMessage(message, conversationId);
      const active = activeConversationRef.current;
      if (active && sameId(active._id, conversationId)) return;

      setConversations((prev) => {
        const exists = prev.some((c) => sameId(c._id, conversationId));
        if (!exists) {
          loadConversations();
          return prev;
        }
        return prev.map((c) =>
          sameId(c._id, conversationId)
            ? {
                ...c,
                lastMessage: conversation?.lastMessage || c.lastMessage,
                unreadCount: (c.unreadCount || 0) + 1,
              }
            : c
        );
      });
      setUnreadCount((n) => n + 1);
    };

    const handleMessageSent = ({ message, conversationId }) => {
      appendMessage(message, conversationId);
    };

    const handleMessagesRead = ({ conversationId }) => {
      const active = activeConversationRef.current;
      if (!active || !sameId(active._id, conversationId)) return;
      setMessages((prev) =>
        prev.map((m) => (sameId(m.sender, currentUserIdStr) ? { ...m, status: "READ" } : m))
      );
    };

    const handleUserTyping = ({ conversationId, userId }) => {
      const active = activeConversationRef.current;
      if (!active || !sameId(active._id, conversationId)) return;
      if (sameId(userId, currentUserIdStr)) return;
      shouldStickToBottomRef.current = true;
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
      if (active?._id) {
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

    // Keep online list fresh while chat is open
    const presencePulse = setInterval(refreshOnlineStaff, 5000);

    return () => {
      clearInterval(presencePulse);
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

  // Load messages + soft poll
  useEffect(() => {
    if (!activeConversation) {
      setIsOtherUserTyping(false);
      return;
    }

    const conversationId = String(activeConversation._id);
    shouldStickToBottomRef.current = true;
    ensureConnected?.();

    if (socket?.connected) {
      socket.emit("chat:join_conversation", { conversationId });
    }

    const loadMessages = async ({ silent = false } = {}) => {
      if (!silent) {
        setLoadingMessages(true);
        setIsOtherUserTyping(false);
      }
      try {
        const data = await chatService.getMessages(conversationId, 1, 80);
        const next = data.messages || [];
        setMessages((prev) => {
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

        const wasUnread = activeConversation.unreadCount || 0;
        setConversations((prev) =>
          prev.map((c) => (sameId(c._id, conversationId) ? { ...c, unreadCount: 0 } : c))
        );
        if (!silent && wasUnread) {
          setUnreadCount((n) => Math.max(0, n - wasUnread));
        }
      } catch (err) {
        console.error("Error loading chat messages:", err);
      } finally {
        if (!silent) setLoadingMessages(false);
      }
    };

    loadMessages();
    const poll = setInterval(() => loadMessages({ silent: true }), isConnected ? 6000 : 2500);

    return () => {
      clearInterval(poll);
      if (socket?.connected) {
        socket.emit("chat:leave_conversation", { conversationId });
      }
    };
  }, [activeConversation?._id, socket, isConnected]);

  const handleInputChange = (e) => {
    setMessageText(e.target.value);
    if (!socket?.connected || !activeConversation) return;

    socket.emit("chat:typing", {
      conversationId: String(activeConversation._id),
      recipientId: String(activeConversation.otherParticipant?._id || ""),
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("chat:stop_typing", {
        conversationId: String(activeConversation._id),
        recipientId: String(activeConversation.otherParticipant?._id || ""),
      });
    }, 1000);
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadingFiles(true);
    try {
      const data = await chatService.uploadFiles(files);
      if (data.attachments) setPendingAttachments((prev) => [...prev, ...data.attachments]);
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
    shouldStickToBottomRef.current = true;

    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        _id: tempId,
        sender: { _id: currentUserIdStr },
        text: trimmed,
        attachments: payload.attachments,
        loanRef: payload.loanRef,
        status: "SENT",
        createdAt: new Date().toISOString(),
        pending: true,
      },
    ]);

    if (socket?.connected) {
      socket.emit("chat:stop_typing", {
        conversationId: String(activeConversation._id),
        recipientId: String(activeConversation.otherParticipant?._id || ""),
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
        setConversations((prev) =>
          prev.map((c) =>
            sameId(c._id, activeConversation._id)
              ? {
                  ...c,
                  lastMessage: {
                    text: data.message.text || "Message",
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
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleOpenLoan = (loanRef) => {
    const nav = getLoanNavigation(currentRole, loanRef);
    if (!nav?.path) return;
    navigate(nav.path, { state: nav.state });
    setIsOpen(false);
  };

  const handleSelectContact = async (contact) => {
    try {
      const res = await chatService.createOrGetConversation(contact._id);
      if (res.conversation) {
        setConversations((prev) => {
          if (prev.some((c) => sameId(c._id, res.conversation._id))) return prev;
          return [res.conversation, ...prev];
        });
        setActiveConversation(res.conversation);
        setIsNewChatOpen(false);
      }
    } catch (err) {
      console.error("Failed to start chat:", err);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const other = c.otherParticipant;
    if (!other) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      other.fullName?.toLowerCase().includes(term) ||
      other.role?.toLowerCase().includes(term) ||
      other.employeeId?.toLowerCase().includes(term)
    );
  });

  const other = activeConversation?.otherParticipant;
  const otherOnline = other ? isUserOnline(onlineUserIds, other._id) : false;
  const otherInitials =
    `${other?.firstName?.[0] || ""}${other?.lastName?.[0] || ""}`.toUpperCase() || "DS";

  const onMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldStickToBottomRef.current = distanceFromBottom < 80;
  };

  return (
    <>
      {/* Launcher */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-md text-xs font-semibold text-slate-700 hover:text-teal-700"
          >
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-400 animate-pulse"}`} />
            Staff Chat
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className={`relative flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all active:scale-95 ${
            isOpen
              ? "bg-slate-800 text-white"
              : "bg-gradient-to-br from-teal-500 to-emerald-600 text-white hover:scale-105"
          }`}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
          {unreadCount > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 flex items-center justify-center text-[11px] font-bold text-white bg-rose-500 rounded-full border-2 border-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {isOpen && (
        <div
          className={`fixed z-50 bg-[#efeae2] shadow-2xl border border-slate-200 flex flex-col overflow-hidden ${
            isDockedPanel
              ? "top-0 right-0 h-full w-full sm:w-[440px] md:w-[480px] rounded-none border-l"
              : "bottom-22 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] md:w-[460px] h-[680px] max-h-[85vh] rounded-2xl"
          }`}
        >
          {/* Header */}
          <div className="px-3 py-2.5 bg-[#075e54] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {activeConversation ? (
                <button type="button" onClick={() => setActiveConversation(null)} className="p-1 rounded-full hover:bg-white/10">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                  <MessageSquare className="w-4.5 h-4.5" />
                </div>
              )}

              {activeConversation ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-300 to-emerald-500 text-[#075e54] font-bold text-sm flex items-center justify-center">
                      {otherInitials}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#075e54] ${
                        otherOnline ? "bg-emerald-400" : "bg-slate-400"
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-[15px] truncate">{other?.fullName}</h3>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${ROLE_CONFIG[other?.role]?.badge || "bg-white/15"}`}>
                        {ROLE_CONFIG[other?.role]?.label || other?.role}
                      </span>
                    </div>
                    <p className="text-[12px] text-emerald-100/90 flex items-center gap-1.5">
                      {isOtherUserTyping ? (
                        <span className="text-emerald-200 font-medium italic">typing…</span>
                      ) : (
                        <>
                          <span className={`w-1.5 h-1.5 rounded-full ${otherOnline ? "bg-emerald-300" : "bg-white/40"}`} />
                          <span className={otherOnline ? "text-emerald-100 font-medium" : "text-white/70"}>
                            {otherOnline ? "Online" : "Offline"}
                          </span>
                        </>
                      )}
                      <span className="text-white/40">·</span>
                      <span className={(isConnected || presenceReady) ? "text-emerald-200" : "text-amber-200"}>
                        {(isConnected || presenceReady) ? "Live" : "Connecting…"}
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold text-[15px]">Staff Chat</h3>
                  <p className="text-[11px] text-emerald-100/80">
                    {(isConnected || presenceReady) ? "Connected · realtime" : "Connecting…"}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-0.5">
              {other?.phone && (
                <a href={`tel:${other.phone}`} className="p-2 rounded-full hover:bg-white/10 text-white/90">
                  <Phone className="w-4 h-4" />
                </a>
              )}
              <button type="button" onClick={() => setIsDockedPanel((v) => !v)} className="hidden sm:inline-flex p-2 rounded-full hover:bg-white/10">
                {isDockedPanel ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button type="button" onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation list */}
          {!activeConversation && (
            <div className="flex-1 flex flex-col bg-white min-h-0">
              <div className="p-3 border-b border-slate-100 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search chats…"
                    className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewChatOpen(true)}
                  className="flex items-center gap-1 px-3 py-2 bg-[#128c7e] text-white text-xs font-semibold rounded-xl hover:bg-[#0f7a6e]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loadingConversations ? (
                  <div className="py-16 flex flex-col items-center text-slate-400 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                    <span className="text-xs">Loading chats…</span>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="py-16 px-4 text-center">
                    <Sparkles className="w-8 h-8 text-teal-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No chats yet</p>
                    <p className="text-xs text-slate-500 mt-1">Start a conversation with Admin, ASM, RSM or RM.</p>
                    <button
                      type="button"
                      onClick={() => setIsNewChatOpen(true)}
                      className="mt-3 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg"
                    >
                      + Start chat
                    </button>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const p = conv.otherParticipant;
                    if (!p) return null;
                    const online = isUserOnline(onlineUserIds, p._id);
                    const initials = `${p.firstName?.[0] || ""}${p.lastName?.[0] || ""}`.toUpperCase() || "DS";
                    return (
                      <button
                        key={conv._id}
                        type="button"
                        onClick={() => setActiveConversation(conv)}
                        className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-slate-50 border-b border-slate-50"
                      >
                        <div className="relative shrink-0">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-semibold text-xs flex items-center justify-center">
                            {initials}
                          </div>
                          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${online ? "bg-emerald-500" : "bg-slate-300"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-900 text-sm truncate">{p.fullName}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {conv.lastMessage?.createdAt ? formatMessageTime(conv.lastMessage.createdAt) : ""}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p className="text-xs text-slate-500 truncate">
                              {online ? <span className="text-emerald-600 font-medium">Online · </span> : null}
                              {conv.lastMessage?.text || "No messages yet"}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="shrink-0 bg-[#25d366] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Active chat */}
          {activeConversation && (
            <div className="flex-1 flex flex-col min-h-0">
              <div
                ref={messagesContainerRef}
                onScroll={onMessagesScroll}
                className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35) 0, transparent 40%), radial-gradient(circle at 80% 0%, rgba(7,94,84,0.06) 0, transparent 35%)",
                }}
              >
                {loadingMessages ? (
                  <div className="py-20 flex flex-col items-center text-slate-500 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-teal-700" />
                    <span className="text-xs">Loading messages…</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="inline-block bg-white/90 px-4 py-2 rounded-xl shadow-sm text-xs text-slate-600">
                      Say hello to {other?.firstName} 👋
                    </div>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = sameId(msg.sender, currentUserIdStr);
                    const prevMsg = messages[idx - 1];
                    const showDate =
                      !prevMsg ||
                      new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

                    return (
                      <React.Fragment key={msg._id || idx}>
                        {showDate && (
                          <div className="flex justify-center my-2">
                            <span className="bg-white/90 text-slate-600 text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm">
                              {formatDateDivider(msg.createdAt)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[82%] rounded-xl px-2.5 py-1.5 shadow-sm text-[13px] leading-snug ${
                              isMe
                                ? "bg-[#d9fdd3] text-slate-900 rounded-br-sm"
                                : "bg-white text-slate-900 rounded-bl-sm"
                            } ${msg.pending ? "opacity-70" : ""}`}
                          >
                            {(msg.loanRef?.applicationId ||
                              (msg.loanRef?.applicationNumber &&
                                msg.loanRef.applicationNumber !== "N/A") ||
                              msg.loanRef?.applicantName) && (
                              <ChatLoanCard
                                loanRef={msg.loanRef}
                                compact
                                onOpen={handleOpenLoan}
                              />
                            )}

                            {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}

                            {msg.attachments?.length > 0 && (
                              <div className="mt-1.5 space-y-1.5">
                                {msg.attachments.map((att, aIdx) => (
                                  <ChatMediaAttachment key={aIdx} att={att} compact />
                                ))}
                              </div>
                            )}

                            <div className="flex items-center justify-end gap-1 mt-0.5">
                              <span className="text-[10px] text-slate-500">{formatMessageTime(msg.createdAt)}</span>
                              {isMe && (
                                msg.status === "READ" ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                                ) : (
                                  <Check className={`w-3.5 h-3.5 ${msg.pending ? "text-slate-400" : "text-slate-500"}`} />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}

                {isOtherUserTyping && <TypingBubble name={other?.firstName} />}
                <div ref={messagesEndRef} />
              </div>

              {(selectedLoan || pendingAttachments.length > 0 || uploadingFiles) && (
                <div className="bg-white border-t border-slate-200 px-3 py-2 flex flex-wrap gap-1.5">
                  {uploadingFiles && (
                    <span className="text-xs text-teal-700 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
                    </span>
                  )}
                  {selectedLoan && (
                    <span className="inline-flex items-center gap-1 text-[11px] bg-teal-50 text-teal-800 border border-teal-200 px-2 py-1 rounded-lg">
                      <FileText className="w-3 h-3" />
                      {selectedLoan.applicationNumber}
                      <button type="button" onClick={() => setSelectedLoan(null)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {pendingAttachments.map((att, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">
                      <Paperclip className="w-3 h-3" />
                      <span className="max-w-[100px] truncate">{att.name}</span>
                      <button type="button" onClick={() => setPendingAttachments((p) => p.filter((_, i) => i !== idx))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Composer */}
              <form onSubmit={handleSendMessage} className="bg-[#f0f2f5] border-t border-slate-200 p-2 flex items-end gap-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-full text-slate-500 hover:bg-white">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => setIsLoanPickerOpen(true)} className="p-2.5 rounded-full text-slate-500 hover:bg-white">
                  <FileText className="w-5 h-5" />
                </button>
                <textarea
                  rows={1}
                  placeholder="Type a message"
                  className="flex-1 resize-none py-2.5 px-3.5 text-sm bg-white border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 max-h-28 shadow-sm"
                  value={messageText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="submit"
                  disabled={!messageText.trim() && pendingAttachments.length === 0 && !selectedLoan}
                  className="p-2.5 rounded-full bg-[#128c7e] text-white disabled:opacity-40 hover:bg-[#0f7a6e] shadow-sm"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onSelectContact={handleSelectContact}
        onlineUserIds={onlineUserIds}
      />
      <LoanPickerModal
        isOpen={isLoanPickerOpen}
        onClose={() => setIsLoanPickerOpen(false)}
        onSelectLoan={(loan) => setSelectedLoan(loan)}
        peerUserId={activeConversation?.otherParticipant?._id || null}
        peerName={
          activeConversation?.otherParticipant?.fullName ||
          [
            activeConversation?.otherParticipant?.firstName,
            activeConversation?.otherParticipant?.lastName,
          ]
            .filter(Boolean)
            .join(" ")
        }
      />
    </>
  );
}
