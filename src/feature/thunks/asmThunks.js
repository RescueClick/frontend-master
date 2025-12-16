import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { backendurl } from "../urldata"; // adjust path if needed

import { getAuthData } from "../../utils/localStorage";

export const fetchAsmProfile = createAsyncThunk(
  "asm/fetchProfile",
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${backendurl}/asm/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.profile; // returns only profile object
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch ASM profile"
      );
    }
  }
);

export const updateAsmProfile = createAsyncThunk(
  "asm/updateProfile",
  async (profileData, { rejectWithValue }) => {
  

    try {
      const { asmToken } = getAuthData();
     

      const res = await axios.patch(
        `${backendurl}/asm/profile/update`,
        profileData,
        {
          headers: {
            Authorization: `Bearer ${asmToken}`,
            "Content-Type": "application/json",
          },
        }
      );

     
      return res.data.profile;
    } catch (err) {
      

      // If CORS, often `err.response` is undefined
      if (err.response) {
        console.error("❌ Error Response Data:", err.response.data);
        console.error("❌ Error Status:", err.response.status);
      } else {
        console.error("❌ Network/Other Error:", err.message);
      }

      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchRmList = createAsyncThunk(
  "asm/fetchRmList",
  async (_, { rejectWithValue }) => {
    const { asmToken } = getAuthData();


    try {
      const response = await axios.get(`${backendurl}/asm/get-rm`, {
        headers: {
          Authorization: `Bearer ${asmToken}`,
        },
      });

      return response.data; // directly returns the RM list
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch RM list"
      );
    }
  }
);

export const assignRMBulkTarget = createAsyncThunk(
  "asm/assignRMBulkTarget",
  async ({ month, year, totalTarget }, { rejectWithValue }) => {
    const { asmToken } = getAuthData();

    try {
      const response = await axios.post(
        `${backendurl}/asm/target/assign-rm-bulk`,
        { month, year, totalTarget },
        {
          headers: {
            Authorization: `Bearer ${asmToken}`,
          },
        }
      );

      return response.data; // contains bulk assignment info
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign bulk target"
      );
    }
  }
);

export const fetchAsmDashboard = createAsyncThunk(
  "asm/fetchDashboard",
  async (_, { rejectWithValue }) => {
    const { asmToken } = getAuthData();
    try {
      const response = await axios.get(`${backendurl}/asm/dashboard`, {
        headers: {
          Authorization: `Bearer ${asmToken}`,
        },
      });

      return response.data;
      // ✅ returns full dashboard data: { totals, targets, topPerformers }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch ASM dashboard"
      );
    }
  }
);

// ✅ Fetch ASM partners
export const fetchAsmPartners = createAsyncThunk(
  "asm/fetchPartners",
  async (_, { rejectWithValue }) => {
    const { asmToken } = getAuthData();
    try {
      const response = await axios.get(`${backendurl}/asm/get-partners`, {
        headers: {
          Authorization: `Bearer ${asmToken}`,
        },
      });

      return response.data; 
      // ✅ returns formatted partners list from backend
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch ASM partners"
      );
    }
  }
);

export const fetchAsmCustomers = createAsyncThunk(
  "asm/fetchCustomers",
  async (_, { rejectWithValue }) => {
    const { asmToken } = getAuthData();
    try {
      const response = await axios.get(`${backendurl}/asm/get-customers`, {
        headers: {
          Authorization: `Bearer ${asmToken}`,
        },
      });

      return response.data; 
      // ✅ returns formatted customers list from backend
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch ASM customers"
      );
    }
  }
);

export const fetchAsmApplications = createAsyncThunk(
  "asm/fetchApplications",
  async (_, { rejectWithValue }) => {
    const { asmToken } = getAuthData();
    try {
      const response = await axios.get(`${backendurl}/asm/get-applications`, {
        headers: {
          Authorization: `Bearer ${asmToken}`,
        },
      });

      return response.data; 
      // ✅ returns formatted customers list from backend
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch ASM customers"
      );
    }
  }
);







// Fetch Analytics + User Profile
export const getAnalytics = createAsyncThunk(
  "analytics/getAnalytics",
  async (id, { rejectWithValue }) => {
    const { asmToken } = getAuthData();

    
    

    try {
      const response = await axios.get(`${backendurl}/asm/${id}/analytics`, {
        headers: {
          Authorization: `Bearer ${asmToken}`,
          "Content-Type": "application/json",
        },
      });

      // response contains { profile, analytics }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch analytics"
      );
    }
  }
);


export const reassignPartnersAndDeactivateRM = createAsyncThunk(
  "admin/reassignPartnersAndDeactivateRM",
  async ({ oldRmId, newRmId }, { rejectWithValue }) => {
   
    try {
      const { asmToken } = getAuthData();

      const response = await axios.post(
        `${backendurl}/asm/assign-partners-rm`,
        { oldRmId, newRmId },
        {
          headers: {
            Authorization: `Bearer ${asmToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.message; // success message
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to reassign partners");
    }
  }
);


// Thunk to reassign customers from old partner to new partner & deactivate old partner
export const reassignCustomersAndDeactivatePartner = createAsyncThunk(
  "admin/reassignCustomersAndDeactivatePartner",
  async ({ oldPartnerId }, { rejectWithValue }) => {


   

    try {
      const { asmToken } = getAuthData(); // ✅ Get token from storage or context

      const response = await axios.post(
        `${backendurl}/asm/deactivate-partner`,
        { oldPartnerId },
        {
          headers: {
            Authorization: `Bearer ${asmToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.message; // ✅ Success message from backend
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to reassign customers"
      );
    }
  }
);


// Thunk to activate RM (ASM role)
export const activateRM = createAsyncThunk(
  "asm/activateRM",
  async (rmId , { rejectWithValue }) => {
  

    try {
      const { asmToken } = getAuthData(); // ✅ Get ASM token

      const response = await axios.post(
        `${backendurl}/asm/rm/activate`,
        { rmId },
        {
          headers: {
            Authorization: `Bearer ${asmToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.message; // ✅ Success message from backend
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to activate RM");
    }
  }
);

// Thunk to permanently delete an RM (ASM role) after deactivation
export const deleteRmAsm = createAsyncThunk(
  "asm/deleteRm",
  async (rmId, { rejectWithValue }) => {
    try {
      const { asmToken } = getAuthData();
      const response = await axios.delete(`${backendurl}/asm/delete/${rmId}`, {
        headers: {
          Authorization: `Bearer ${asmToken}`,
        },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete RM"
      );
    }
  }
);


// Thunk to activate Partner (ASM role)
export const activatePartner = createAsyncThunk(
  "asm/activatePartner",
  async (partnerId, { rejectWithValue }) => {
  

    try {
      const { asmToken } = getAuthData(); // ✅ Get ASM token

      const response = await axios.post(
        `${backendurl}/asm/partner/activate`,
        { partnerId },
        {
          headers: {
            Authorization: `Bearer ${asmToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.message; // ✅ Success message from backend
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to activate Partner"
      );
    }
  }
);



// Thunk to create a new RM (ASM role)
export const createRM = createAsyncThunk(
  "asm/createRM",
  async (rmData, { rejectWithValue }) => {
   
    try {
      const { asmToken } = getAuthData(); // ✅ Get ASM token

      const response = await axios.post(
        `${backendurl}/asm/create-rm`,
        rmData,
        {
          headers: {
            Authorization: `Bearer ${asmToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data; // ✅ Full response including message, rmCode, employeeId, tempPassword
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create RM"
      );
    }
  }
);