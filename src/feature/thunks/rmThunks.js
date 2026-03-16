// thunks/createPartner.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { backendurl } from "../urldata";
import { getAuthData } from "../../utils/localStorage";


 
 
 
export const createPartner = createAsyncThunk(
  "partner/createPartner",
  async ( newFormData, { rejectWithValue }) => {
 
    let {rmToken} = getAuthData();

    let token = rmToken;
 
    try {
      const response = await axios.post(
        `${backendurl}/rm/create-partners`,
        newFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create Partner"
      );
    }
  }
);

// Fetch partners thunk with auth token
export const fetchPartners = createAsyncThunk(
  "partners/fetchPartners",
  async (_, { rejectWithValuee }) => {
    try {

   
        

      let {rmToken} = getAuthData();

      let token = rmToken;


      const response = await axios.get(`${backendurl}/rm/get-partners`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (err) {
      return rejectWithValuee(err.response?.data || { message: err.message });
    }
  }
);

export const fetchRmProfile = createAsyncThunk(
  "rm/fetchProfile",
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${backendurl}/rm/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
   
      return response.data; // returns only profile object
     
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch RM profile"
      );
    }
  }
);


// Fetch Dashboard
export const fetchDashboard = createAsyncThunk(
  "rm/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const { rmToken } = getAuthData();
      const response = await axios.get(`${backendurl}/rm/dashboard`, {
        headers: { Authorization: `Bearer ${rmToken}` },
      });
      return response.data; // { totalPartners, activePartners, totalRevenue, avgRating }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch dashboard");
    }
  }
);

export const fetchRmCustomers = createAsyncThunk(
  "rmCustomers/fetchRmCustomers",
  async (_, { rejectWithValue }) => {
    try {
      const { rmToken } = getAuthData();

      const response = await axios.get(`${backendurl}/rm/customers`, {
        headers: { Authorization: `Bearer ${rmToken}` },
      });

      return response.data; // returns array of customer objects
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch RM customers"
      );
    }
  }
);

export const fetchRmCustomersPayOutPending = createAsyncThunk(
  "rmCustomers/fetchPendingPayouts",
  async (_, { rejectWithValue }) => {
    try {
      const { rmToken } = getAuthData();

      const response = await axios.get(`${backendurl}/rm/customers/pending-payouts`, {
        headers: { Authorization: `Bearer ${rmToken}` },
      });

      return response.data; // returns array of customer objects
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch RM customers"
      );
    }
  }
);

export const fetchRmCustomersPayOutDone = createAsyncThunk(
  "rmCustomers/fetchDonePayout",
  async (_, { rejectWithValue }) => {
    try {
      const { rmToken } = getAuthData();

      const response = await axios.get(`${backendurl}/rm/customers/done-payouts`, {
        headers: { Authorization: `Bearer ${rmToken}` },
      });

      return response.data; // returns array of customer objects
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch RM customers"
      );
    }
  }
);




export const fetchPartnerLoans = createAsyncThunk(
  "rm/fetchPartnerLoans",
  async (partnerId, { rejectWithValue }) => {
    try {
      const { rmToken } = getAuthData();

      const response = await axios.get(`${backendurl}/rm/partner/${partnerId}/loans`, {
        headers: { Authorization: `Bearer ${rmToken}` },
      });

      return response.data; // { partner, applications }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch partner loan details"
      );
    }
  }
);

export const assignPartnerBulkTarget = createAsyncThunk(
  "target/assignPartnerBulk",
  async ({ month, year, totalTarget }, { rejectWithValue }) => {

    const {rmToken} = getAuthData();

    try {
      const response = await axios.post(
        `${backendurl}/rm/target/assign-partner-bulk`,
        
        { month, year, totalTarget },
        {
          headers: {
            Authorization: `Bearer ${rmToken}`,
          },
        }
      );

      
      return response.data; // returns success data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign bulk target"
      );
    }
  }
);


export const fetchCustomerPartnersPayout = createAsyncThunk(
  "rm/fetchCustomerPartnersPayout",
  async (customerId, { rejectWithValue }) => {
    const { rmToken } = getAuthData();

   
    

    try {
      const response = await axios.get(
        `${backendurl}/rm/customer/${customerId}/partners-payout`,
        {
          headers: {
            Authorization: `Bearer ${rmToken}`,
          },
        }
      );

      return response.data; // { customerId, partners }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch partners payout details"
      );
    }
  }
);




export const setPayouts = createAsyncThunk(
  "rm/setPayouts",
  async (payoutData, { rejectWithValue }) => {
    const { rmToken } = getAuthData();

    try {
      const response = await axios.post(
        `${backendurl}/rm/set-payouts`,
        payoutData, // { applicationId, partnerId, payoutPercentage, note, status }
        {
          headers: {
            Authorization: `Bearer ${rmToken}`,
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


export const fetchPartnersWithFollowUp = createAsyncThunk(
  "rm/fetchPartnersWithFollowUp",
  async (_, { rejectWithValue }) => {
    try {
      const { rmToken } = getAuthData();

      const response = await axios.get(`${backendurl}/rm/partners-with-followup`, {
        headers: { Authorization: `Bearer ${rmToken}` },
      });

      return response.data; // returns partner list with follow-up data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch partners with follow-up"
      );
    }
  }
);




export const updateFollowUp = createAsyncThunk(
  "followUp/updateFollowUp",
  async ({ partnerId, status, remarks, lastCall }, { rejectWithValue }) => {

    

    try {
      const { rmToken } = getAuthData();

      const response = await axios.post(
        `${backendurl}/rm/update-followup/${partnerId}`,
        { status, remarks, lastCall },
        {
          headers: { Authorization: `Bearer ${rmToken}` },
        }
      );

      return response.data; // backend sends message + followUp object
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update follow-up"
      );
    }
  }
);


// Fetch Partner Analytics (RM role - hierarchical access: RM → Partner)
// Now uses universal analytics endpoint
export const getAnalytics = createAsyncThunk(
  "analytics/getAnalytics",
  async (partnerId, { rejectWithValue }) => {
    const { rmToken } = getAuthData();

    if (!rmToken) {
      return rejectWithValue("RM token not found");
    }

    try {
      // Use universal analytics endpoint
      const response = await axios.get(`${backendurl}/analytics/${partnerId}`, {
        headers: {
          Authorization: `Bearer ${rmToken}`,
          "Content-Type": "application/json",
        },
      });

      return response.data; // { data: { profile, analytics } }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch partner analytics"
      );
    }
  }
);


export const assignCustomerToPartner = createAsyncThunk(
  "rm/assignCustomerToPartner",
  async ({ oldPartnerId }, { rejectWithValue }) => {

  
    try {
      const { rmToken } = getAuthData();

      const response = await axios.post(
        `${backendurl}/rm/deactivate-partner`,
        { oldPartnerId }, // Data from frontend
        {
          headers: {
            Authorization: `Bearer ${rmToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.message; // ✅ Success message from backend
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||
          "Failed to reassign customers and deactivate partner"
      );
    }
  }
);


export const activatePartner = createAsyncThunk(
  "rm/activatePartner",
  async ({ partnerId }, { rejectWithValue }) => {
    

    try {
      const { rmToken } = getAuthData();

      const response = await axios.post(
        `${backendurl}/rm/partner/activate`,
        { partnerId },
        {
          headers: {
            Authorization: `Bearer ${rmToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.message; // ✅ success message from backend
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to activate partner"
      );
    }
  }
);

// Fetch Partner Targets (RM role) - View only
export const fetchRmPartnerTargets = createAsyncThunk(
  "rm/fetchPartnerTargets",
  async ({ year, month }, { rejectWithValue }) => {
    try {
      const { rmToken } = getAuthData();
      const params = new URLSearchParams();
      if (year) params.append("year", year);
      if (month) params.append("month", month);
      
      const response = await axios.get(
        `${backendurl}/rm/partners/targets?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${rmToken}`,
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