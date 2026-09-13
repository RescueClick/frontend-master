import axios from "axios";
import { backendurl } from "../../../../feature/urldata";
import { getAuthData } from "../../../../utils/localStorage";

/**
 * Normalize Mongo/user ids for reliable equality checks (string vs ObjectId)
 */
export const sameId = (a, b) => {
  if (a == null || b == null) return false;
  const left = typeof a === "object" && a._id != null ? a._id : a;
  const right = typeof b === "object" && b._id != null ? b._id : b;
  return String(left) === String(right);
};

/**
 * Returns active staff auth token (Admin, ASM, RSM, RM)
 */
export const getStaffToken = () => {
  const authData = getAuthData();
  return (
    authData?.adminToken ||
    authData?.asmToken ||
    authData?.rsmToken ||
    authData?.rmToken ||
    null
  );
};

/**
 * Returns active staff user profile
 */
export const getStaffUser = () => {
  const authData = getAuthData();
  return (
    authData?.adminUser ||
    authData?.asmUser ||
    authData?.rsmUser ||
    authData?.rmUser ||
    null
  );
};

const getHeaders = () => {
  const token = getStaffToken();
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
};

export const chatService = {
  // Fetch eligible staff contacts
  getContacts: async (search = "", scope = "") => {
    const params = {};
    if (search) params.search = search;
    if (scope) params.scope = scope;
    const res = await axios.get(`${backendurl}/chat/contacts`, {
      headers: getHeaders(),
      params,
    });
    return res.data;
  },

  // Fetch all staff conversations
  getConversations: async () => {
    const res = await axios.get(`${backendurl}/chat/conversations`, {
      headers: getHeaders(),
    });
    return res.data;
  },

  // Start or get conversation with another staff colleague
  createOrGetConversation: async (participantId, initialMessage = "", loanRef = null) => {
    const res = await axios.post(
      `${backendurl}/chat/conversations`,
      { participantId, initialMessage, loanRef },
      { headers: getHeaders()}
    );
    return res.data;
  },

  // Fetch paginated messages for a conversation
  getMessages: async (conversationId, page = 1, limit = 50) => {
    const res = await axios.get(
      `${backendurl}/chat/conversations/${conversationId}/messages`,
      {
        headers: getHeaders(),
        params: { page, limit },
      }
    );
    return res.data;
  },

  // Send a new message
  sendMessage: async (conversationId, { text = "", attachments = [], loanRef = null }) => {
    const res = await axios.post(
      `${backendurl}/chat/conversations/${conversationId}/messages`,
      { text, attachments, loanRef },
      { headers: getHeaders() }
    );
    return res.data;
  },

  // Mark conversation messages as read
  markAsRead: async (conversationId) => {
    const res = await axios.post(
      `${backendurl}/chat/conversations/${conversationId}/read`,
      {},
      { headers: getHeaders() }
    );
    return res.data;
  },

  // Upload attachments (images / PDFs)
  uploadFiles: async (files) => {
    const token = getStaffToken();
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    const res = await axios.post(`${backendurl}/chat/upload`, formData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  // Search active loans by ID / name
  searchLoans: async (q) => {
    const res = await axios.get(`${backendurl}/chat/search-loans`, {
      headers: getHeaders(),
      params: { q },
    });
    return res.data;
  },

  // Get total unread count across all conversations
  getUnreadCount: async () => {
    const res = await axios.get(`${backendurl}/chat/unread-count`, {
      headers: getHeaders(),
    });
    return res.data;
  },
};
