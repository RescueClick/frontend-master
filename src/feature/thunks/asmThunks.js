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

// Fetch RSMs under current ASM
export const fetchRsmList = createAsyncThunk(
  "asm/fetchRsmList",
  async (_, { rejectWithValue }) => {
    const { asmToken } = getAuthData();

    try {
      const response = await axios.get(`${backendurl}/asm/get-rsms`, {
        headers: {
          Authorization: `Bearer ${asmToken}`,
        },
      });

      return response.data; // list of RSMs
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch RSM list"
      );
    }
  }
);

// Fetch RMs under ASM (existing behavior)
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
  async (rmId, { rejectWithValue }) => {
    try {
      const { asmToken } = getAuthData();

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

      return response.data.message;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to activate RM");
    }
  }
);

// Thunk to deactivate RM (ASM role)
export const deactivateRM = createAsyncThunk(
  "asm/deactivateRM",
  async (rmId, { rejectWithValue }) => {
    try {
      const { asmToken } = getAuthData();

      const response = await axios.post(
        `${backendurl}/asm/rm/deactivate`,
        { rmId },
        {
          headers: {
            Authorization: `Bearer ${asmToken}`,
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

// Thunk to activate RSM (ASM role)
export const activateRSM = createAsyncThunk(
  "asm/activateRSM",
  async (rsmId, { rejectWithValue }) => {
    try {
      const { asmToken } = getAuthData();

      const response = await axios.post(
        `${backendurl}/rsm/activate`,
        { rsmId },
        {
          headers: {
            Authorization: `Bearer ${asmToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.message;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to activate RSM");
    }
  }
);

// Thunk to deactivate RSM (ASM role)
export const deactivateRSM = createAsyncThunk(
  "asm/deactivateRSM",
  async (rsmId, { rejectWithValue }) => {
    try {
      const { asmToken } = getAuthData();

      const response = await axios.post(
        `${backendurl}/rsm/deactivate`,
        { rsmId },
        {
          headers: {
            Authorization: `Bearer ${asmToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.message;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to deactivate RSM");
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

// Fetch RSM Analytics (ASM role)
// Now uses universal analytics endpoint
export const fetchRsmAnalytics = createAsyncThunk(
  "asm/fetchRsmAnalytics",
  async (rsmId, { rejectWithValue }) => {
    try {
      const { asmToken } = getAuthData();
      
      if (!asmToken) {
        return rejectWithValue("ASM token not found");
      }
      
      // Use universal analytics endpoint
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

// Record RSM Follow-up (ASM role)
export const recordRsmFollowUp = createAsyncThunk(
  "asm/recordRsmFollowUp",
  async ({ rsmId, status, remarks }, { rejectWithValue }) => {
    try {
      const { asmToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/asm/rsm/${rsmId}/follow-up`,
        { status, remarks },
        {
          headers: {
            Authorization: `Bearer ${asmToken}`,
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

// Fetch RSM Follow-ups (ASM role)
export const fetchRsmFollowUps = createAsyncThunk(
  "asm/fetchRsmFollowUps",
  async (_, { rejectWithValue }) => {
    try {
      const { asmToken } = getAuthData();
      const response = await axios.get(`${backendurl}/asm/rsms/follow-ups`, {
        headers: {
          Authorization: `Bearer ${asmToken}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch RSM follow-ups"
      );
    }
  }
);

// ==================== PAYOUT MANAGEMENT ====================

// Fetch Disbursed Applications (ASM role)
export const fetchDisbursedApplications = createAsyncThunk(
  "asm/fetchDisbursedApplications",
  async (_, { rejectWithValue }) => {
    try {
      const { asmToken } = getAuthData();
      const response = await axios.get(`${backendurl}/asm/disbursed-applications`, {
        headers: {
          Authorization: `Bearer ${asmToken}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch disbursed applications"
      );
    }
  }
);

// Fetch Payouts (ASM role)
// Payout Management - Pending/Done (similar to RM)
export const fetchAsmCustomersPayOutPending = createAsyncThunk(
  "asmCustomers/fetchPendingPayouts",
  async (_, { rejectWithValue }) => {
    try {
      const { asmToken } = getAuthData();

      // ASM should call its own ASM payout API (protected by ASM role)
      const response = await axios.get(`${backendurl}/asm/customers/pending-payouts`, {
        headers: { Authorization: `Bearer ${asmToken}` },
      });

      return response.data; // returns array of customer objects
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch ASM pending payout customers"
      );
    }
  }
);

export const fetchAsmCustomersPayOutDone = createAsyncThunk(
  "asmCustomers/fetchDonePayout",
  async (_, { rejectWithValue }) => {
    try {
      const { asmToken } = getAuthData();

      // ASM should call its own ASM payout API (protected by ASM role)
      const response = await axios.get(`${backendurl}/asm/customers/done-payouts`, {
        headers: { Authorization: `Bearer ${asmToken}` },
      });

      return response.data; // returns array of customer objects
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch ASM done payout customers"
      );
    }
  }
);

export const fetchAsmCustomerPartnersPayout = createAsyncThunk(
  "asm/fetchCustomerPartnersPayout",
  async (customerId, { rejectWithValue }) => {
    const { asmToken } = getAuthData();

    try {
      const response = await axios.get(
        `${backendurl}/asm/customer/${customerId}/partners-payout`,
        {
          headers: {
            Authorization: `Bearer ${asmToken}`,
          },
        }
      );

      return response.data; // { partners }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch partners payout details"
      );
    }
  }
);

export const setAsmPayouts = createAsyncThunk(
  "asm/setPayouts",
  async (payoutData, { rejectWithValue }) => {
    const { asmToken } = getAuthData();

    try {
      const response = await axios.post(
        `${backendurl}/asm/set-payouts`,
        payoutData, // { applicationId, partnerId, payoutPercentage, note, payOutStatus }
        {
          headers: {
            Authorization: `Bearer ${asmToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data; // { message, payout }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to set payout"
      );
    }
  }
);

export const fetchPayouts = createAsyncThunk(
  "asm/fetchPayouts",
  async (status, { rejectWithValue }) => {
    try {
      const { asmToken } = getAuthData();
      const url = status 
        ? `${backendurl}/asm/payouts?status=${status}`
        : `${backendurl}/asm/payouts`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${asmToken}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch payouts"
      );
    }
  }
);

// Create/Update Payout (ASM role)
export const createPayout = createAsyncThunk(
  "asm/createPayout",
  async ({ applicationId, partnerId, payoutPercentage, note }, { rejectWithValue }) => {
    try {
      const { asmToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/asm/payouts/create`,
        { applicationId, partnerId, payoutPercentage, note },
        {
          headers: {
            Authorization: `Bearer ${asmToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create payout"
      );
    }
  }
);

// Approve Payout (ASM role)
export const approvePayout = createAsyncThunk(
  "asm/approvePayout",
  async (payoutId, { rejectWithValue }) => {
    try {
      const { asmToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/asm/payouts/approve`,
        { payoutId },
        {
          headers: {
            Authorization: `Bearer ${asmToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to approve payout"
      );
    }
  }
);

// ==================== INCENTIVE MANAGEMENT ====================

// Fetch Incentives (ASM role)
export const fetchIncentives = createAsyncThunk(
  "asm/fetchIncentives",
  async ({ year, month }, { rejectWithValue }) => {
    try {
      const { asmToken } = getAuthData();
      const params = new URLSearchParams();
      if (year) params.append("year", year);
      if (month) params.append("month", month);
      const url = params.toString() 
        ? `${backendurl}/asm/incentives?${params.toString()}`
        : `${backendurl}/asm/incentives`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${asmToken}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch incentives"
      );
    }
  }
);

// Record Incentive Payment (ASM role)
export const payIncentive = createAsyncThunk(
  "asm/payIncentive",
  async ({ partnerId, basis, percentValue, fixedValue, amount, month, year, notes }, { rejectWithValue }) => {
    try {
      const { asmToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/asm/incentives/${partnerId}/pay`,
        { basis, percentValue, fixedValue, amount, month, year, notes },
        {
          headers: {
            Authorization: `Bearer ${asmToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to record incentive payment"
      );
    }
  }
);

// ==================== PARTNER TARGET ASSIGNMENT (ASM Only) ====================

// Assign Target to Single Partner (ASM role)
export const assignPartnerTarget = createAsyncThunk(
  "asm/assignPartnerTarget",
  async ({ partnerId, month, year, fileCountTarget, disbursementTarget }, { rejectWithValue }) => {
    try {
      const { asmToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/asm/target/assign-partner`,
        { partnerId, month, year, fileCountTarget, disbursementTarget },
        {
          headers: {
            Authorization: `Bearer ${asmToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign target to partner"
      );
    }
  }
);

// Assign Target to All Partners in Bulk (ASM role)
export const assignPartnerTargetBulk = createAsyncThunk(
  "asm/assignPartnerTargetBulk",
  async ({ month, year, fileCountTarget, disbursementTarget }, { rejectWithValue }) => {
    try {
      const { asmToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/asm/target/assign-partner-bulk`,
        { month, year, fileCountTarget, disbursementTarget },
        {
          headers: {
            Authorization: `Bearer ${asmToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign targets to partners"
      );
    }
  }
);

// Fetch Partner Targets (ASM role)
export const fetchPartnerTargets = createAsyncThunk(
  "asm/fetchPartnerTargets",
  async ({ year, month }, { rejectWithValue }) => {
    try {
      const { asmToken } = getAuthData();
      const params = new URLSearchParams();
      if (year) params.append("year", year);
      if (month) params.append("month", month);
      
      const response = await axios.get(
        `${backendurl}/asm/partners/targets?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${asmToken}`,
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
// NOTE: ASM can NO LONGER create RM directly.
// ASM should create RSM, and RSM will create RM.
// This thunk has been removed to enforce the hierarchy: ADMIN → ASM → RSM → RM
// Use createRsmByAdminOrAsm instead to create RSM, then RSM can create RM.