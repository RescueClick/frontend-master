import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { backendurl } from "../urldata";
import { getAuthData } from "../../utils/localStorage";

// Fetch RSM Profile
export const fetchRsmProfile = createAsyncThunk(
  "rsm/fetchProfile",
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${backendurl}/rsm/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch RSM profile"
      );
    }
  }
);

export const updateRsmProfile = createAsyncThunk(
  "rsm/updateProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const { rsmToken } = getAuthData();
      const res = await axios.patch(
        `${backendurl}/rsm/profile/update`,
        profileData,
        {
          headers: {
            Authorization: `Bearer ${rsmToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return res.data.profile || res.data;
    } catch (err) {
      const data = err.response?.data;
      const msg =
        (typeof data === "string" && data) ||
        data?.message ||
        err.message ||
        "Failed to update profile";
      return rejectWithValue(msg);
    }
  }
);

// Fetch RSM Dashboard
export const fetchRsmDashboard = createAsyncThunk(
  "rsm/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const { rsmToken } = getAuthData();
      const response = await axios.get(`${backendurl}/rsm/dashboard`, {
        headers: {
          Authorization: `Bearer ${rsmToken}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch RSM dashboard"
      );
    }
  }
);

// Fetch RSM's RMs
export const fetchRsmRms = createAsyncThunk(
  "rsm/fetchRms",
  async (_, { rejectWithValue }) => {
    try {
      const { rsmToken } = getAuthData();
      const response = await axios.get(`${backendurl}/rsm/my-rms`, {
        headers: {
          Authorization: `Bearer ${rsmToken}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch RMs"
      );
    }
  }
);

// Fetch RSM Applications
export const fetchRsmApplications = createAsyncThunk(
  "rsm/fetchApplications",
  async ({ status }, { rejectWithValue }) => {
    try {
      const { rsmToken } = getAuthData();
      const url = status
        ? `${backendurl}/rsm/applications?status=${status}`
        : `${backendurl}/rsm/applications`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${rsmToken}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch applications"
      );
    }
  }
);

// Fetch Single RSM Application
export const fetchRsmApplication = createAsyncThunk(
  "rsm/fetchApplication",
  async (applicationId, { rejectWithValue }) => {
    try {
      const { rsmToken } = getAuthData();
      const response = await axios.get(
        `${backendurl}/rsm/applications/${applicationId}`,
        {
          headers: {
            Authorization: `Bearer ${rsmToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch application"
      );
    }
  }
);

// Transition Application Status (RSM)
export const transitionRsmApplication = createAsyncThunk(
  "rsm/transitionApplication",
  async ({ applicationId, to, note, approvedLoanAmount }, { rejectWithValue }) => {
    try {
      const { rsmToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/rsm/applications/${applicationId}/transition`,
        { to, note, approvedLoanAmount },
        {
          headers: {
            Authorization: `Bearer ${rsmToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to transition application"
      );
    }
  }
);

// Create RM (RSM)
export const createRmByRsm = createAsyncThunk(
  "rsm/createRm",
  async (rmData, { rejectWithValue }) => {
    try {
      const { rsmToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/rsm/create-rm`,
        rmData,
        {
          headers: {
            Authorization: `Bearer ${rsmToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create RM"
      );
    }
  }
);

// Thunk to activate RM (RSM role)
export const activateRM = createAsyncThunk(
  "rsm/activateRM",
  async (rmId, { rejectWithValue }) => {
    try {
      const { rsmToken } = getAuthData();

      const response = await axios.post(
        `${backendurl}/rsm/rm/activate`,
        { rmId },
        {
          headers: {
            Authorization: `Bearer ${rsmToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.message;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to activate RM");
    }
  }
);

// Thunk to deactivate RM (RSM role)
export const deactivateRM = createAsyncThunk(
  "rsm/deactivateRM",
  async (rmId, { rejectWithValue }) => {
    try {
      const { rsmToken } = getAuthData();

      const response = await axios.post(
        `${backendurl}/rsm/rm/deactivate`,
        { rmId },
        {
          headers: {
            Authorization: `Bearer ${rsmToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.message;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to deactivate RM");
    }
  }
);

// Fetch RM Analytics (RSM role)
// Now uses universal analytics endpoint
export const fetchRmAnalytics = createAsyncThunk(
  "rsm/fetchRmAnalytics",
  async (rmId, { rejectWithValue }) => {
    try {
      const { rsmToken } = getAuthData();

      // Use universal analytics endpoint
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

// Record RM Follow-up (RSM role)
export const recordRmFollowUp = createAsyncThunk(
  "rsm/recordRmFollowUp",
  async ({ rmId, status, remarks }, { rejectWithValue }) => {
    try {
      const { rsmToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/rsm/rm/${rmId}/follow-up`,
        { status, remarks },
        {
          headers: {
            Authorization: `Bearer ${rsmToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to record follow-up"
      );
    }
  }
);

// Fetch RM Follow-ups (RSM role)
export const fetchRmFollowUps = createAsyncThunk(
  "rsm/fetchRmFollowUps",
  async (_, { rejectWithValue }) => {
    try {
      const { rsmToken } = getAuthData();
      const response = await axios.get(`${backendurl}/rsm/rms/follow-ups`, {
        headers: {
          Authorization: `Bearer ${rsmToken}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch RM follow-ups"
      );
    }
  }
);

// Fetch Partner Targets (RSM role) - View only
export const fetchRsmPartnerTargets = createAsyncThunk(
  "rsm/fetchPartnerTargets",
  async ({ year, month }, { rejectWithValue }) => {
    try {
      const { rsmToken } = getAuthData();
      const params = new URLSearchParams();
      if (year) params.append("year", year);
      if (month) params.append("month", month);

      const response = await axios.get(
        `${backendurl}/rsm/partners/targets?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${rsmToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch partner targets"
      );
    }
  }
);

// get bank details

export const fetchBanks = createAsyncThunk("rsm/fetchBanks", async (_, { rejectWithValue}) => {
  try {

    const { rsmToken } = getAuthData();
    const response = await axios.get(`${backendurl}/rsm/banks`, {
      headers: {
        Authorization: `Bearer ${rsmToken}`,
      }
    })

    return response.data;
  }
  catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch banks");
  }
})



