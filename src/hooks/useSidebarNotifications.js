import { useState, useEffect } from "react";
import axios from "axios";
import { getAuthData } from "../utils/localStorage";
import { backendurl } from "../feature/urldata";
import { useSocket } from "./useSocket";

const getAuthToken = () => {
  const authData = getAuthData();
  return (
    authData?.adminToken ||
    authData?.asmToken ||
    authData?.rsmToken ||
    authData?.rmToken ||
    authData?.partnerToken ||
    authData?.customerToken ||
    null
  );
};

export const useSidebarNotifications = () => {
  const { isConnected, subscribe, unsubscribe } = useSocket();
  const [counts, setCounts] = useState({
    payout: 0,
    partner: 0,
    application: 0,
    delete_request: 0,
    incentive: 0,
    chat: 0,
    total: 0,
  });

  const loadCounts = async () => {
    try {
      const token = getAuthToken();
      if (!token || !backendurl) return;

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [notifRes, chatRes] = await Promise.allSettled([
        axios.get(`${backendurl}/notifications/sidebar-counts`, {
          headers,
          timeout: 10000,
        }),
        axios.get(`${backendurl}/chat/unread-count`, {
          headers,
          timeout: 10000,
        }),
      ]);

      let payout = 0;
      let partner = 0;
      let application = 0;
      let delete_request = 0;
      let incentive = 0;
      let chat = 0;

      if (notifRes.status === "fulfilled" && notifRes.value?.data) {
        payout = notifRes.value.data.payout || 0;
        partner = notifRes.value.data.partner || 0;
        application = notifRes.value.data.application || 0;
        delete_request = notifRes.value.data.delete_request || 0;
        incentive = notifRes.value.data.incentive || 0;
      }

      if (chatRes.status === "fulfilled" && chatRes.value?.data) {
        chat = chatRes.value.data.unreadCount || 0;
      }

      setCounts({
        payout,
        partner,
        application,
        delete_request,
        incentive,
        chat,
        total: payout + partner + application + delete_request + incentive + chat,
      });
    } catch (error) {
      console.error("Error loading notification counts in sidebar:", error);
    }
  };

  useEffect(() => {
    loadCounts();

    // Polling fallback to keep counts updated if sockets miss any messages
    const interval = setInterval(loadCounts, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      // Small timeout to allow backend to finish writing to DB before fetching
      setTimeout(loadCounts, 600);
    };

    subscribe("applicationUpdated", handleUpdate);
    subscribe("documentStatusChanged", handleUpdate);
    subscribe("partnerStatusChanged", handleUpdate);
    subscribe("payoutStatusChanged", handleUpdate);
    subscribe("newPartnerRegistered", handleUpdate);
    subscribe("newCustomerRegistered", handleUpdate);
    subscribe("chat:incoming_message", handleUpdate);
    subscribe("chat:messages_read", handleUpdate);

    return () => {
      unsubscribe("applicationUpdated", handleUpdate);
      unsubscribe("documentStatusChanged", handleUpdate);
      unsubscribe("partnerStatusChanged", handleUpdate);
      unsubscribe("payoutStatusChanged", handleUpdate);
      unsubscribe("newPartnerRegistered", handleUpdate);
      unsubscribe("newCustomerRegistered", handleUpdate);
      unsubscribe("chat:incoming_message", handleUpdate);
      unsubscribe("chat:messages_read", handleUpdate);
    };
  }, [subscribe, unsubscribe, isConnected]);

  return counts;
};
