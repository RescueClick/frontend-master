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
    total: 0,
  });

  const loadCounts = async () => {
    try {
      const token = getAuthToken();
      if (!token || !backendurl) return;

      const response = await axios.get(`${backendurl}/notifications/sidebar-counts`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      if (response.data) {
        const payout = response.data.payout || 0;
        const partner = response.data.partner || 0;
        const application = response.data.application || 0;
        const delete_request = response.data.delete_request || 0;
        const incentive = response.data.incentive || 0;

        setCounts({
          payout,
          partner,
          application,
          delete_request,
          incentive,
          total: payout + partner + application + delete_request + incentive,
        });
      }
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

    return () => {
      unsubscribe("applicationUpdated", handleUpdate);
      unsubscribe("documentStatusChanged", handleUpdate);
      unsubscribe("partnerStatusChanged", handleUpdate);
      unsubscribe("payoutStatusChanged", handleUpdate);
      unsubscribe("newPartnerRegistered", handleUpdate);
      unsubscribe("newCustomerRegistered", handleUpdate);
    };
  }, [subscribe, unsubscribe, isConnected]);

  return counts;
};
