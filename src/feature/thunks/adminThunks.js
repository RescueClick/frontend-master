// src/redux/slices/asm/asmRmSlice.js
import {createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { backendurl } from "../urldata";
import { getAuthData } from "../../utils/localStorage";





export const fetchAdminDashboard = createAsyncThunk(
  "admin/fetchAdminDashboard",
  async (_, { rejectWithValue }) => {   // ✅ FIX: _ means no payload
    
    try {
      const { adminToken } = getAuthData();

      const response = await axios.get(`${backendurl}/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch dashboard stats"
      );
    }
  }
);


// Async thunk for creating ASM
export const createAsm = createAsyncThunk(
  "asm/createAsm",
  async ({ firstName, lastName, phone, email ,dob, region , password, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${backendurl}/admin/create-asm`,
        {
          firstName,
          lastName,
          phone,
          email,
          dob,
          region,
          password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create ASM"
      );
    }
  }
);

 
 
// Async thunk for login
export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${backendurl}/auth/login`, {
        email,
        password,
      });
      // Open the response object to inspect its properties
  

      return response.data; // must be serializable (JSON)
    } catch (err) {
      if (err.response && err.response.data) {
      
        return rejectWithValue(err.response.data.message);
      } else {
        return rejectWithValue(err.message);
      }
    }
  }
);

// 🔹 Async thunk for fetching ASMs
export const fetchAsms = createAsyncThunk(
  "asm/fetchAsms",
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${backendurl}/admin/get-asm`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
     
 
      return response.data; // list of ASMs
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch ASMs"
      );
    }
  }
);


// 🔹 Async thunk for fetching RMs
export const fetchRMs = createAsyncThunk(
  "rm/fetchRMs",
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${backendurl}/admin/get-rm`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
     
      return response.data; // list of RMs
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch RMs"
      );
    }
  }
);

// Async thunk for creating RM
export const createRm = createAsyncThunk(
  "rm/createRm",
  async ({ firstName, lastName, phone, email, dob, region, password, assignedAsmId, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${backendurl}/admin/create-rm`,
        {
          firstName,
          lastName,
          phone,
          dob,
          region,
          email,
          password,
          asmId: assignedAsmId, // Add ASM ID to the request
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
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

// 🔹 Async thunk to assign an RM to an ASM
export const assignRmToAsm = createAsyncThunk(
  "rm/assignRmToAsm",
  async ({ rmId, asmId, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${backendurl}/admin/assign-rm-to-asm`,
        { rmId, asmId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign RM to ASM"
      );
    }
  }
);

// 🔹 Async thunk to bulk assign all RMs from one ASM to another (for deactivation flow)
export const reassignAllRmsFromAsm = createAsyncThunk(
  "rm/reassignAllRmsFromAsm",
  async ({ oldAsmId, newAsmId, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${backendurl}/admin/assign-rms-to-asm`,
        { oldAsmId, newAsmId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reassign RMs to new ASM"
      );
    }
  }
);


// 🔹 Async thunk to activate an ASM
export const activateAsm = createAsyncThunk(
  "asm/activateAsm",
  async ({ asmId, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${backendurl}/admin/activate-asm`,
        { asmId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to activate ASM"
      );
    }
  }
);

// 🔹 Permanently delete an ASM (must be deactivated first)
export const deleteAsm = createAsyncThunk(
  "asm/deleteAsm",
  async ({ asmId }, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.delete(`${backendurl}/admin/asm/${asmId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete ASM"
      );
    }
  }
);

// 🔹 Async thunk to fetch ASM dashboard metrics
export const fetchAnalyticsdashboard  = createAsyncThunk(
  "asm/fetchAnalyticsdashboard ",
  async ({ ID, token }, { rejectWithValue }) => {



    try {
      const response = await axios.get(
        `${backendurl}/admin/${ID}/analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch ASM dashboard"
      );
    }
  }
);

export const fetchAdminProfile = createAsyncThunk(
  "admin/fetchProfile",
  async (adminToken, { rejectWithValue }) => {
   
    try {
      const response = await axios.get(`${backendurl}/admin/profile`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
 
      
      return response.data; // return only profile object
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch admin profile"
      );
    }
  }
);

// 🔹 Async thunk for fetching Partners
export const fetchPartners = createAsyncThunk(
  "admin/fetchPartners",
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${backendurl}/admin/get-partners`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data; // list of partners
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch partners"
      );
    }
  }
);


 // Get Unassigned Partners Thunk
 export const getUnassignedPartners = createAsyncThunk(
  "admin/getUnassignedPartners",
  async (_, { rejectWithValue }) => {


    const {adminToken} = getAuthData();


    

    try {
      const res = await axios.get(`${backendurl}/admin/get-unassigned-partners`, {
        headers: {
          Authorization: `Bearer ${adminToken}`, // Adjust based on how you store token
        },
      });

      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);



// Assign Partner to RM Thunk
export const assignPartnerToRm = createAsyncThunk(
  "admin/assignPartnerToRm",
  async ({ partnerId, rmId }, { rejectWithValue }) => {


    
    
    

    const { adminToken } = getAuthData();

    try {
      const res = await axios.post(
        `${backendurl}/admin/assign-admin-partner-to-rm`,
        { partnerId, rmId },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);


export const assignAsmBulkTarget = createAsyncThunk(
  "target/assignAsmBulkTarget",
  async ({ month, year, totalTarget }, { rejectWithValue }) => {

    const { adminToken } = getAuthData(); // Admin token

    try {
      const response = await axios.post(
        `${backendurl}/admin/target/assign-asm-bulk`,
        { month, year, totalTarget },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      
      return response.data; // returns bulk assignments
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign bulk ASM targets"
      );
    }
  }
);


export const assignBulkTargetAll = createAsyncThunk(
  "target/assignBulkTargetAll",
  async ({ month, year, totalTarget }, { rejectWithValue }) => {

    const { adminToken } = getAuthData(); // Admin token

    try {
      const response = await axios.post(
        `${backendurl}/admin/target/assign-bulk`,
        { month, year, totalTarget },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      
      return response.data; // returns bulk assignments
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign bulk targets to all"
      );
    }
  }
);



export const getAllCustomers = createAsyncThunk(
  "customers/getAllCustomers",
  async (_, { rejectWithValue }) => {
    const { adminToken } = getAuthData(); // Super Admin token

    try {
      const response = await axios.get(`${backendurl}/admin/get-customers`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      
      return response.data; // Send data to reducer
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch customers"
      );
    }
  }
);



export const uploadBanners = createAsyncThunk(
  "banners/uploadBanners",
  async (formData , { rejectWithValue }) => {
    const { adminToken } = getAuthData(); // Super Admin Token
  

    try {
      const response = await axios.post(`${backendurl}/admin/banners`, formData, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

    
      return response.data; // Send data to reducer
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to upload banners"
      );
    }
  }
);



// Thunk to fetch all banners
export const fetchBanners = createAsyncThunk(
  "admin/fetchBanners",
  async (_, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.get(`${backendurl}/admin/banners`, {
        headers: {
          Authorization: `Bearer ${adminToken }`,
        },
      });
      return response.data.banners; // return banners to slice
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch banners");
    }
  }
);


export const deleteBanner = createAsyncThunk(
  "admin/deleteBanner",
  async (bannerId, { rejectWithValue }) => {


   
    
    try {
      const { adminToken } = getAuthData();

      const response = await axios.delete(`${backendurl}/admin/banners/${bannerId}`, {
        headers: {
          Authorization: `Bearer ${adminToken }`,
        },
      });
      return { id: bannerId, message: response.data.message };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete banner");
    }
  }
);


export const assignPartnersToRM = createAsyncThunk(
  "admin/assignPartnersToRM",
  async ({ oldRmId, newRmId }, { rejectWithValue }) => {
   

    try {
      const { adminToken } = getAuthData();

      const response = await axios.post(
        `${backendurl}/admin/assign-partners-rm`,
        { oldRmId, newRmId },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.message;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to assign partners");
    }
  }
);


export const reassignCustomersAndDeactivatePartner = createAsyncThunk(
  "admin/reassignCustomersAndDeactivatePartner",
  async ({ oldPartnerId }, { rejectWithValue }) => {
   

    try {
      const { adminToken } = getAuthData();

      const response = await axios.post(
        `${backendurl}/admin/deactivate-partner`,
        { oldPartnerId },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.message; // success message
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to reassign customers"
      );
    }
  }
);


// Thunk to activate RM
export const activateRM = createAsyncThunk(
  "admin/activateRM",
  async (rmId , { rejectWithValue }) => {
   

    try {
      const { adminToken } = getAuthData(); // ✅ Use your stored token

      const response = await axios.post(
        `${backendurl}/admin/rm/activate`,
        { rmId },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
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

// 🔹 Permanently delete an RM (must be deactivated first)
export const deleteRm = createAsyncThunk(
  "admin/deleteRm",
  async (rmId, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.delete(`${backendurl}/admin/rm/${rmId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete RM");
    }
  }
);


// Thunk to activate Partner
export const activatePartner = createAsyncThunk(
  "admin/activatePartner",
  async ( partnerId , { rejectWithValue }) => {
   

    try {
      const { adminToken } = getAuthData(); // ✅ get token

      const response = await axios.post(
        `${backendurl}/admin/partner/activate`,
        { partnerId },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.message; // ✅ return success message
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to activate partner"
      );
    }
  }
);

// Async thunk for Login As (Impersonation)
export const loginAsUserThunk = createAsyncThunk(
  "auth/loginAsUser",
  async ({ userId }, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      if (!adminToken) throw new Error("Admin not authenticated");

      const res = await axios.post(
        `${backendurl}/auth/login-as/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      return res.data; // { token, user }
    } catch (err) {
      if (err.response && err.response.data) {
        return rejectWithValue(err.response.data.message);
      } else {
        return rejectWithValue(err.message);
      }
    }
  }
);
