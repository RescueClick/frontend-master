/**
 * Universal Analytics Thunks
 * Single source of truth for all analytics API calls
 * Uses the universal /api/analytics/:id endpoint
 */

import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { backendurl } from "../urldata";
import { getAuthData } from "../../utils/localStorage";

/**
 * Universal Analytics Fetch
 * Works for all roles: Admin, ASM, RSM, RM, Partner
 * The backend handles hierarchical access control automatically
 */
export const fetchUniversalAnalytics = createAsyncThunk(
  "analytics/fetchUniversal",
  async ({ id }, { rejectWithValue }) => {
    try {
      // Get the appropriate token based on current user role
      const authData = getAuthData();
      let token = null;

      // Determine which token to use based on available tokens
      if (authData.adminToken) {
        token = authData.adminToken;
      } else if (authData.asmToken) {
        token = authData.asmToken;
      } else if (authData.rsmToken) {
        token = authData.rsmToken;
      } else if (authData.rmToken) {
        token = authData.rmToken;
      } else if (authData.partnerToken) {
        token = authData.partnerToken;
      } else {
        return rejectWithValue("No authentication token found");
      }

      const response = await axios.get(`${backendurl}/analytics/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Backend returns: { data: { profile, analytics } }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch analytics"
      );
    }
  }
);

/**
 * Proper KPI analytics (funnel, conversion, SLA, financials).
 * GET /api/analytics/:id/kpis
 */
export const fetchAnalyticsKpis = createAsyncThunk(
  "analytics/fetchKpis",
  async ({ id, start, end, loanType }, { rejectWithValue }) => {
    try {
      const authData = getAuthData();
      const token =
        authData.adminToken ||
        authData.asmToken ||
        authData.rsmToken ||
        authData.rmToken ||
        authData.partnerToken ||
        null;

      if (!token) return rejectWithValue("No authentication token found");

      const response = await axios.get(`${backendurl}/analytics/${id}/kpis`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          ...(start ? { start } : {}),
          ...(end ? { end } : {}),
          ...(loanType ? { loanType } : {}),
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch analytics KPIs"
      );
    }
  }
);

/**
 * Fetch Analytics for Admin (can view any user)
 */
export const fetchAdminAnalytics = createAsyncThunk(
  "admin/fetchAnalytics",
  async ({ id, year }, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();

      if (!adminToken) {
        return rejectWithValue("Admin token not found");
      }

      const response = await axios.get(`${backendurl}/analytics/${id}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        params: year ? { year } : undefined,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch analytics"
      );
    }
  }
);

/**
 * Fetch Analytics for ASM (can only view RSM)
 */
export const fetchAsmAnalytics = createAsyncThunk(
  "asm/fetchAnalytics",
  async ({ rsmId }, { rejectWithValue }) => {
    try {
      const { asmToken } = getAuthData();

      if (!asmToken) {
        return rejectWithValue("ASM token not found");
      }

      const response = await axios.get(`${backendurl}/analytics/${rsmId}`, {
        headers: {
          Authorization: `Bearer ${asmToken}`,
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch RSM analytics"
      );
    }
  }
);

/**
 * Fetch Analytics for RSM (can only view RM)
 */
export const fetchRsmAnalytics = createAsyncThunk(
  "rsm/fetchAnalytics",
  async ({ rmId }, { rejectWithValue }) => {
    try {
      const { rsmToken } = getAuthData();

      if (!rsmToken) {
        return rejectWithValue("RSM token not found");
      }

      const response = await axios.get(`${backendurl}/analytics/${rmId}`, {
        headers: {
          Authorization: `Bearer ${rsmToken}`,
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch RM analytics"
      );
    }
  }
);

/**
 * Fetch Analytics for RM (can only view Partner)
 */
export const fetchRmAnalytics = createAsyncThunk(
  "rm/fetchAnalytics",
  async ({ partnerId }, { rejectWithValue }) => {
    try {
      const { rmToken } = getAuthData();

      if (!rmToken) {
        return rejectWithValue("RM token not found");
      }

      const response = await axios.get(`${backendurl}/analytics/${partnerId}`, {
        headers: {
          Authorization: `Bearer ${rmToken}`,
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch Partner analytics"
      );
    }
  }
);

/**
 * Fetch Analytics for Partner (can only view own analytics)
 */
export const fetchPartnerAnalytics = createAsyncThunk(
  "partner/fetchAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const { partnerToken, partnerUser } = getAuthData();

      if (!partnerToken || !partnerUser) {
        return rejectWithValue("Partner token or user not found");
      }

      const partnerId = partnerUser._id || partnerUser.id;

      const response = await axios.get(`${backendurl}/analytics/${partnerId}`, {
        headers: {
          Authorization: `Bearer ${partnerToken}`,
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch analytics"
      );
    }
  }
);

