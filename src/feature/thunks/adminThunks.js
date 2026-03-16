import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { backendurl } from "../urldata";
import { getAuthData, saveAuthData } from "../../utils/localStorage";

// Login User (for all roles)
export const loginUser = createAsyncThunk(
  "admin/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${backendurl}/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data;

      // Save auth data based on role
      if (user.role === "SUPER_ADMIN") {
        saveAuthData(token, user, false, "admin");
      } else if (user.role === "ASM") {
        saveAuthData(token, user, false, "asm");
      } else if (user.role === "RSM") {
        saveAuthData(token, user, false, "rsm");
      } else if (user.role === "RM") {
        saveAuthData(token, user, false, "rm");
      } else if (user.role === "PARTNER") {
        saveAuthData(token, user, false, "partner");
      } else if (user.role === "CUSTOMER") {
        saveAuthData(token, user, false, "customer");
      }

      return { token, user };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Login failed"
      );
    }
  }
);

// Fetch Admin Dashboard
export const fetchAdminDashboard = createAsyncThunk(
  "admin/fetchAdminDashboard",
  async (_, { rejectWithValue }) => {
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

// Fetch recent activities for admin dashboard
export const fetchRecentActivities = createAsyncThunk(
  "admin/fetchRecentActivities",
  async (limit = 10, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();

      const response = await axios.get(`${backendurl}/admin/recent-activities`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        params: { limit },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch recent activities"
      );
    }
  }
);

// Fetch ASMs
export const fetchAsms = createAsyncThunk(
  "admin/fetchAsms",
  async (_, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.get(`${backendurl}/admin/get-asm`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch ASMs"
      );
    }
  }
);

// Fetch RMs
export const fetchRMs = createAsyncThunk(
  "admin/fetchRMs",
  async (_, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.get(`${backendurl}/admin/get-rm`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch RMs"
      );
    }
  }
);

// Fetch RSMs
export const fetchRSMs = createAsyncThunk(
  "admin/fetchRSMs",
  async (_, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.get(`${backendurl}/admin/get-rsm`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch RSMs"
      );
    }
  }
);

// Create ASM
export const createAsm = createAsyncThunk(
  "admin/createAsm",
  async (asmData, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/admin/create-asm`,
        asmData,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
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

// Create RSM
export const createRSM = createAsyncThunk(
  "admin/createRSM",
  async (rsmData, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/admin/create-rsm`,
        rsmData,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create RSM"
      );
    }
  }
);

// Create RM
export const createRm = createAsyncThunk(
  "admin/createRm",
  async (rmData, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/admin/create-rm`,
        rmData,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
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

// Assign RM to ASM
export const assignRmToAsm = createAsyncThunk(
  "admin/assignRmToAsm",
  async ({ rmId, asmId }, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/admin/assign-rm-asm`,
        { rmId, asmId },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
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

// Reassign all RMs from ASM
export const reassignAllRmsFromAsm = createAsyncThunk(
  "admin/reassignAllRmsFromAsm",
  async ({ oldAsmId, newAsmId }, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/admin/reassign-rms-asm`,
        { oldAsmId, newAsmId },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reassign RMs"
      );
    }
  }
);

// Activate ASM
export const activateAsm = createAsyncThunk(
  "admin/activateAsm",
  async (asmId, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/admin/asm/activate`,
        { asmId },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
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

// Delete ASM
export const deleteAsm = createAsyncThunk(
  "admin/deleteAsm",
  async (asmId, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.delete(
        `${backendurl}/admin/asm/${asmId}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete ASM"
      );
    }
  }
);

// Fetch Analytics Dashboard
// Fetch Analytics for any role (Admin can view all roles)
// Now uses universal analytics endpoint
export const fetchAnalyticsdashboard = createAsyncThunk(
  "admin/fetchAnalyticsdashboard",
  async ({ ID, token }, { rejectWithValue }) => {
    try {
      const adminToken = token || getAuthData().adminToken;
      if (!adminToken) {
        return rejectWithValue("Admin token not found");
      }
      
      // Use universal analytics endpoint
      const response = await axios.get(
        `${backendurl}/analytics/${ID}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch analytics"
      );
    }
  }
);

// Fetch Admin Profile
export const fetchAdminProfile = createAsyncThunk(
  "admin/fetchAdminProfile",
  async (_, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.get(`${backendurl}/admin/profile`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch admin profile"
      );
    }
  }
);

// Fetch Partners
export const fetchPartners = createAsyncThunk(
  "admin/fetchPartners",
  async (_, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.get(`${backendurl}/admin/get-partners`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch partners"
      );
    }
  }
);

// Get Unassigned Partners
export const getUnassignedPartners = createAsyncThunk(
  "admin/getUnassignedPartners",
  async (_, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.get(
        `${backendurl}/admin/unassigned-partners`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch unassigned partners"
      );
    }
  }
);

// Get All Customers
export const getAllCustomers = createAsyncThunk(
  "admin/getAllCustomers",
  async (_, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.get(`${backendurl}/admin/get-customers`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch customers"
      );
    }
  }
);

// Fetch Banners
export const fetchBanners = createAsyncThunk(
  "admin/fetchBanners",
  async (_, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.get(`${backendurl}/admin/banners`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch banners"
      );
    }
  }
);

// Delete RM
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
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete RM"
      );
    }
  }
);

// Reject Partner
export const rejectPartner = createAsyncThunk(
  "admin/rejectPartner",
  async (partnerId, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/admin/reject-partner`,
        { partnerId },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reject partner"
      );
    }
  }
);

// Login As User (Impersonation)
export const loginAsUserThunk = createAsyncThunk(
  "admin/loginAsUser",
  async (userId, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/auth/login-as/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      return response.data; // { token, user }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to login as user"
      );
    }
  }
);

// Fetch Delete Account Requests
export const fetchDeleteAccountRequests = createAsyncThunk(
  "admin/fetchDeleteAccountRequests",
  async (_, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.get(
        `${backendurl}/admin/delete-account-requests`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch delete account requests"
      );
    }
  }
);

// Update Delete Account Request Status
export const updateDeleteAccountRequestStatus = createAsyncThunk(
  "admin/updateDeleteAccountRequestStatus",
  async ({ requestId, status }, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.patch(
        `${backendurl}/admin/delete-account-requests/${requestId}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update delete account request"
      );
    }
  }
);

// Payout Management - Pending/Done (similar to RM)
export const fetchAdminCustomersPayOutPending = createAsyncThunk(
  "adminCustomers/fetchPendingPayouts",
  async (_, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();

      const response = await axios.get(`${backendurl}/admin/customers/pending-payouts`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      return response.data; // returns array of customer objects
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch Admin pending payout customers"
      );
    }
  }
);

export const fetchAdminCustomersPayOutDone = createAsyncThunk(
  "adminCustomers/fetchDonePayout",
  async (_, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();

      const response = await axios.get(`${backendurl}/admin/customers/done-payouts`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      return response.data; // returns array of customer objects
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch Admin done payout customers"
      );
    }
  }
);

export const fetchAdminCustomerPartnersPayout = createAsyncThunk(
  "admin/fetchCustomerPartnersPayout",
  async (customerId, { rejectWithValue }) => {
    const { adminToken } = getAuthData();

    try {
      const response = await axios.get(
        `${backendurl}/admin/customer/${customerId}/partners-payout`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
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

export const setAdminPayouts = createAsyncThunk(
  "admin/setPayouts",
  async (payoutData, { rejectWithValue }) => {
    const { adminToken } = getAuthData();

    try {
      const response = await axios.post(
        `${backendurl}/admin/set-payouts`,
        payoutData, // { applicationId, partnerId, payoutPercentage, note, payOutStatus }
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
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

// Activate Partner
export const activatePartner = createAsyncThunk(
  "admin/activatePartner",
  async (partnerId, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
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
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to activate partner"
      );
    }
  }
);

// Reassign Customers and Deactivate Partner
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
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reassign customers and deactivate partner"
      );
    }
  }
);

// Activate RM (Admin role)
export const activateRM = createAsyncThunk(
  "admin/activateRM",
  async (rmId, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
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
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to activate RM"
      );
    }
  }
);

// Assign Partners to RM (Admin role) - Reassigns partners from old RM to new RM
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
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign partners to RM"
      );
    }
  }
);

// Activate RSM (Admin role)
export const activateRSM = createAsyncThunk(
  "admin/activateRSM",
  async (rsmId, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/admin/rsm/activate`,
        { rsmId },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to activate RSM"
      );
    }
  }
);

// Deactivate RSM (Admin role)
export const deactivateRSM = createAsyncThunk(
  "admin/deactivateRSM",
  async (rsmId, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/admin/rsm/deactivate`,
        { rsmId },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to deactivate RSM"
      );
    }
  }
);

// Assign ASM Bulk Target (Admin role)
export const assignAsmBulkTarget = createAsyncThunk(
  "admin/assignAsmBulkTarget",
  async ({ month, year, totalTarget }, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/admin/target/assign-asm-bulk`,
        { month, year, totalTarget },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign ASM bulk target"
      );
    }
  }
);

// Assign Bulk Target All (Admin role) - Assigns targets to all ASMs, RMs, and Partners
export const assignBulkTargetAll = createAsyncThunk(
  "admin/assignBulkTargetAll",
  async ({ month, year, totalTarget }, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/admin/target/assign-bulk`,
        { month, year, totalTarget },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign bulk target to all"
      );
    }
  }
);

// Upload Banners (Admin role)
export const uploadBanners = createAsyncThunk(
  "admin/uploadBanners",
  async (formData, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/admin/banners`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to upload banners"
      );
    }
  }
);

// Delete Banner (Admin role)
export const deleteBanner = createAsyncThunk(
  "admin/deleteBanner",
  async (bannerId, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.delete(
        `${backendurl}/admin/banners/${bannerId}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete banner"
      );
    }
  }
);

// Assign Partner to RM (Admin role)
export const assignPartnerToRm = createAsyncThunk(
  "admin/assignPartnerToRm",
  async ({ partnerId, rmId }, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/admin/assign-admin-partner-to-rm`,
        { partnerId, rmId },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign partner to RM"
      );
    }
  }
);

// ==================== PARTNER TARGET MANAGEMENT (Admin) ====================

// Fetch Partner Targets (Admin role)
export const fetchAdminPartnerTargets = createAsyncThunk(
  "admin/fetchPartnerTargets",
  async ({ year, month }, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const params = new URLSearchParams();
      if (year) params.append("year", year);
      if (month) params.append("month", month);
      
      const response = await axios.get(
        `${backendurl}/admin/partners/targets?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
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

// Assign Target to Single Partner (Admin role)
export const assignAdminPartnerTarget = createAsyncThunk(
  "admin/assignPartnerTarget",
  async ({ partnerId, month, year, fileCountTarget, disbursementTarget }, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/admin/target/assign-partner`,
        { partnerId, month, year, fileCountTarget, disbursementTarget },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
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

// Distribute Hierarchical Targets (Admin) - Top-Down Model
export const distributeHierarchicalTargets = createAsyncThunk(
  "admin/distributeHierarchicalTargets",
  async ({ month, year, totalCompanyTarget, partnerFileCountTarget }, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/admin/target/distribute-hierarchical`,
        { month, year, totalCompanyTarget, partnerFileCountTarget },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to distribute hierarchical targets"
      );
    }
  }
);
