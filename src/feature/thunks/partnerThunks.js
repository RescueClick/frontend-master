import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { backendurl } from "../urldata";
import { getAuthData } from "../../utils/localStorage";

export const fetchPartnerProfile = createAsyncThunk(
  "partner/fetchProfile",
  async (_,{ rejectWithValue }) => {
    const { partnerToken } = getAuthData();
    try {
      const response = await axios.get(`${backendurl}/partner/profile`, {
        headers: {
          Authorization: `Bearer ${partnerToken}`,
        },
      });
   
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch Partner profile"
      );
    }
  }
);

export const updatePartnerProfile = createAsyncThunk(
  "partner/updateProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const { partnerToken } = getAuthData();
      const res = await axios.patch(
        `${backendurl}/partner/profile/update`,
        profileData,
        {
          headers: {
            Authorization: `Bearer ${partnerToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      const p = res.data.partner || res.data.profile || res.data;
      return {
        ...p,
        emailChangePending: !!res.data.emailChangePending,
        emailChangeMessage: res.data.message,
      };
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

export const uploadPartnerAvatar = createAsyncThunk(
  "partner/uploadAvatar",
  async (file, { rejectWithValue }) => {
    try {
      const { partnerToken } = getAuthData();
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await axios.patch(`${backendurl}/partner/profile/avatar`, formData, {
        headers: {
          Authorization: `Bearer ${partnerToken}`,
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data?.partner || res.data;
    } catch (err) {
      const data = err.response?.data;
      const msg =
        (typeof data === "string" && data) ||
        data?.message ||
        err.message ||
        "Failed to upload avatar";
      return rejectWithValue(msg);
    }
  }
);

// Fetch Partner Dashboard
export const fetchPartnerDashboard = createAsyncThunk(
  "partner/fetchDashboard",
  async ({ year, month, start, end } = {}, { rejectWithValue }) => {
    try {
      const { partnerToken } = getAuthData();

      // Build query params dynamically
      const params = {};
      if (year && month) {
        params.year = year;
        params.month = month;
      } else if (start && end) {
        params.start = start;
        params.end = end;
      }

      const res = await axios.get(`${backendurl}/partner/dashboard`, {
        headers: {
          Authorization: `Bearer ${partnerToken}`,
        },
        params, // pass filters to backend
      });

      return res.data; // full dashboard response
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);



// Partner Signup Thunk
export const signupPartner = createAsyncThunk(
  "partner/signup",
  async ( formDataToSend , { rejectWithValue }) => {

 
    

    try {
      const res = await axios.post(`${backendurl}/partner/signup-partner`, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return res.data; // response from backend
    } catch (err) {
      if (err.response?.status === 413) {
        return rejectWithValue(
          "This file is larger than 5MB. Please upload a smaller JPG, PNG, or PDF."
        );
      }
      const data = err.response?.data;
      const msg =
        (typeof data === "string" && data.trim()) ||
        data?.message ||
        err.message ||
        "Registration failed. Please try again.";
      return rejectWithValue(msg);
    }
  }
);

// Fetch Partner's Own Target (Partner role)
export const fetchMyTarget = createAsyncThunk(
  "partner/fetchMyTarget",
  async ({ year, month }, { rejectWithValue }) => {
    try {
      const { partnerToken } = getAuthData();
      const params = new URLSearchParams();
      if (year) params.append("year", year);
      if (month) params.append("month", month);
      
      const response = await axios.get(
        `${backendurl}/partner/my-target?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${partnerToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch my target"
      );
    }
  }
);

 
