import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { backendurl } from "../urldata";
import { clearAuthData, getAuthData, saveAuthData } from "../../utils/localStorage";
import {
  runActivationRequest,
  runDeactivationRequest,
} from "./activationDeactivationUx";

const unwrapApiData = (payload) => payload?.data ?? payload;
const extractApiErrorMessage = (error, fallback = "Something went wrong") =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.response?.data?.data?.message ||
  error?.message ||
  fallback;

// Login User (for all roles)
export const loginUser = createAsyncThunk(
  "admin/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${backendurl}/auth/login`, {
        email,
        password,
      });

      // Handle multiple backend shapes:
      // 1) { data: { token, user }, message }
      // 2) { token, user, message }
      // 3) { data: { data: { token, user } }, message }
      const body = response?.data ?? {};
      const nestedData = body?.data ?? {};
      const deepestData = nestedData?.data ?? {};
      const token = body?.token || nestedData?.token || deepestData?.token;
      const user = body?.user || nestedData?.user || deepestData?.user;

      if (!token || !user) {
        return rejectWithValue(
          body?.message ||
            nestedData?.message ||
            "Invalid server response during login (missing token/user)."
        );
      }

      if (!user.role) {
        return rejectWithValue(
          "Invalid server response during login (missing user role)."
        );
      }

      // Replace any stale tokens / impersonation stack so ProtectedRoute matches this session
      clearAuthData();
      saveAuthData(token, user);

      return { token, user };
    } catch (error) {
      return rejectWithValue(extractApiErrorMessage(error, "Login failed"));
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

      return unwrapApiData(response.data);
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

      return unwrapApiData(response.data);
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
      return unwrapApiData(response.data);
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
      return unwrapApiData(response.data);
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
      return unwrapApiData(response.data);
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
  async (asmData, { rejectWithValue, dispatch }) => {
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
      dispatch(fetchAsms());
      return unwrapApiData(response.data);
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
  async (rsmData, { rejectWithValue, dispatch }) => {
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
      dispatch(fetchRSMs());
      return unwrapApiData(response.data);
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
  async (rmData, { rejectWithValue, dispatch }) => {
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
      dispatch(fetchRMs());
      return unwrapApiData(response.data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create RM"
      );
    }
  }
);

// Assign RM to ASM
export const adminDeactivateAsm = createAsyncThunk(
  "admin/adminDeactivateAsm",
  async ({ oldAsmId, newAsmId }, { rejectWithValue, dispatch }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await runDeactivationRequest({
        pendingMessage: "ASM deactivation in progress...",
        progressMessage: "Reassigning RSM/RM/partner/customer hierarchy...",
        successMessage: "ASM deactivated successfully.",
        errorMessage: "Failed to deactivate ASM",
        request: () =>
          axios.post(
            `${backendurl}/admin/asm-deactivate`,
            { oldAsmId, newAsmId },
            {
              headers: {
                Authorization: `Bearer ${adminToken}`,
                "Content-Type": "application/json",
              },
            }
          ),
      });
      dispatch(fetchAsms());
      dispatch(fetchRSMs());
      dispatch(fetchRMs());
      return unwrapApiData(response.data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to     deactivate ASM"
      );
    }
  }
);

// Reassign all RMs from ASM
export const adminDeactivateRsm = createAsyncThunk(
  "admin/adminDeactivateRsm",
  async ({ rsmId, newRsmId }, { rejectWithValue, dispatch }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await runDeactivationRequest({
        pendingMessage: "RSM deactivation in progress...",
        progressMessage: "Reassigning RM ownership...",
        successMessage: "RSM deactivated successfully.",
        errorMessage: "Failed to reassign RMs",
        request: () =>
          axios.post(
            `${backendurl}/admin/rsm-deactivate`,
            { rsmId, newRsmId },
            {
              headers: {
                Authorization: `Bearer ${adminToken}`,
                "Content-Type": "application/json",
              },
            }
          ),
      });
      dispatch(fetchRSMs());
      dispatch(fetchRMs());
      return unwrapApiData(response.data);
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
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const { adminToken } = getAuthData();
      const asmId = typeof payload === "string" ? payload : payload?.asmId;
      if (!asmId) {
        return rejectWithValue("asmId is required");
      }
      const response = await runActivationRequest({
        pendingMessage: "Activating ASM...",
        successMessage: "ASM activated successfully.",
        errorMessage: "Failed to activate ASM",
        request: () =>
          axios.post(
            `${backendurl}/admin/asm-activate`,
             { asmId },
            {
              headers: {
                Authorization: `Bearer ${adminToken}`,
                "Content-Type": "application/json",
              },
            }
          ),
      });
      dispatch(fetchAsms());
      return unwrapApiData(response.data);
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
  async (asmId, { rejectWithValue, dispatch }) => {
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
      dispatch(fetchAsms());
      return unwrapApiData(response.data);
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
      return unwrapApiData(response.data);
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
      return unwrapApiData(response.data);
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
      return unwrapApiData(response.data);
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
        `${backendurl}/admin/get-unassigned-partners`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      return unwrapApiData(response.data);
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
      return unwrapApiData(response.data);
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
      return unwrapApiData(response.data);
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

// Permanently delete RSM (SUPER_ADMIN) — DELETE /admin/rsm/:rsmId
export const deleteRsm = createAsyncThunk(
  "admin/deleteRsm",
  async (rsmId, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.delete(`${backendurl}/admin/rsm/${rsmId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete RSM"
      );
    }
  }
);

// Permanently delete partner (SUPER_ADMIN) — DELETE /admin/partner/:partnerId
export const rejectPartner = createAsyncThunk(
  "admin/rejectPartner",
  async (partnerId, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.delete(
        `${backendurl}/admin/partner/${partnerId}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete partner"
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
  async ({ requestId, id, status }, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const resolvedRequestId = requestId || id;
      if (!resolvedRequestId) {
        return rejectWithValue("Request id is required");
      }
      const response = await axios.patch(
        `${backendurl}/admin/delete-account-requests/${resolvedRequestId}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data?.request || response.data;
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
  async (payoutData, { rejectWithValue, dispatch }) => {
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

      dispatch(fetchAdminCustomersPayOutPending());
      dispatch(fetchAdminCustomersPayOutDone());
      return unwrapApiData(response.data); // { message, payout }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to set payout"
      );
    }
  }
);

// ==================== INCENTIVE MANAGEMENT (Admin) ====================

// Fetch Incentives for Admin (optionally filtered by status / year / month)
// payload: { status?, year?, month? }
export const fetchAdminIncentives = createAsyncThunk(
  "admin/fetchIncentives",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const { status, year, month } = filters || {};
      const { adminToken } = getAuthData();
      const response = await axios.get(`${backendurl}/admin/incentives`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: {
          ...(status ? { status } : {}),
          ...(year ? { year } : {}),
          ...(month ? { month } : {}),
        },
      });
      return unwrapApiData(response.data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch incentives"
      );
    }
  }
);

// Mark incentive as PAID (Admin)
export const payAdminIncentive = createAsyncThunk(
  "admin/payIncentive",
  async (incentiveId, { rejectWithValue, dispatch }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/admin/incentives/${incentiveId}/pay`,
        {},
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      dispatch(fetchAdminIncentives({}));
      return unwrapApiData(response.data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to pay incentive"
      );
    }
  }
);

// Activate Partner
export const activatePartner = createAsyncThunk(
  "admin/activatePartner",
  async (partnerId, { rejectWithValue, dispatch }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await runActivationRequest({
        pendingMessage: "Activating partner...",
        successMessage: "Partner activated successfully.",
        errorMessage: "Failed to activate partner",
        request: () =>
          axios.post(
            `${backendurl}/admin/partner-activate`,
            { partnerId },
            {
              headers: {
                Authorization: `Bearer ${adminToken}`,
                "Content-Type": "application/json",
              },
            }
          ),
      });
      dispatch(fetchPartners());
      return unwrapApiData(response.data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to activate partner"
      );
    }
  }
);

// Reassign Customers and Deactivate Partner
export const adminDeactivatePartner = createAsyncThunk(
  "admin/reassignCustomersAndDeactivatePartner",
  async ({ oldPartnerId, newPartnerId }, { rejectWithValue, dispatch }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await runDeactivationRequest({
        pendingMessage: "Partner deactivation in progress...",
        progressMessage: "Reassigning customers, applications and pending finance...",
        successMessage: "Partner deactivated successfully.",
        errorMessage: "Failed to reassign customers and deactivate partner",
        request: () =>
          axios.post(
            `${backendurl}/admin/partner-deactivate`,
            { oldPartnerId, newPartnerId },
            {
              headers: {
                Authorization: `Bearer ${adminToken}`,
                "Content-Type": "application/json",
              },
            }
          ),
      });
      dispatch(fetchPartners());
      dispatch(getAllCustomers());
      return unwrapApiData(response.data);
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
  async (rmId, { rejectWithValue, dispatch }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await runActivationRequest({
        pendingMessage: "Activating RM...",
        successMessage: "RM activated successfully.",
        errorMessage: "Failed to activate RM",
        request: () =>
          axios.post(
            `${backendurl}/admin/rm-activate`,
            { rmId },
            {
              headers: {
                Authorization: `Bearer ${adminToken}`,
                "Content-Type": "application/json",
              },
            }
          ),
      });
      dispatch(fetchRMs());
      return unwrapApiData(response.data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to activate RM"
      );
    }
  }
);

// Assign Partners to RM (Admin role) - Reassigns partners from old RM to new RM
export const adminDeactivateRM = createAsyncThunk(
  "admin/assignPartnersToRM",
  async ({ oldRmId, newRmId }, { rejectWithValue, dispatch }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await runDeactivationRequest({
        pendingMessage: "RM deactivation in progress...",
        progressMessage: "Reassigning partners and active applications...",
        successMessage: "RM deactivated successfully.",
        errorMessage: "Failed to assign partners to RM",
        request: () =>
          axios.post(
            `${backendurl}/admin/rm-deactivate`,
            { oldRmId, newRmId },
            {
              headers: {
                Authorization: `Bearer ${adminToken}`,
                "Content-Type": "application/json",
              },
            }
          ),
      });
      dispatch(fetchRMs());
      dispatch(fetchPartners());
      return unwrapApiData(response.data);
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
  async (rsmId, { rejectWithValue, dispatch }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await runActivationRequest({
        pendingMessage: "Activating RSM...",
        successMessage: "RSM activated successfully.",
        errorMessage: "Failed to activate RSM",
        request: () =>
          axios.post(
            `${backendurl}/admin/rsm-activate`,
            { rsmId },
            {
              headers: {
                Authorization: `Bearer ${adminToken}`,
                "Content-Type": "application/json",
              },
            }
          ),
      });
      dispatch(fetchRSMs());
      return unwrapApiData(response.data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to activate RSM"
      );
    }
  }
);


// Assign ASM Bulk Target (Admin role)
export const assignAsmBulkTarget = createAsyncThunk(
  "admin/assignAsmBulkTarget",
  async ({ month, year, totalTarget }, { rejectWithValue, dispatch }) => {
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
      dispatch(fetchAdminDashboard());
      return unwrapApiData(response.data);
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
  async ({ month, year, totalTarget }, { rejectWithValue, dispatch }) => {
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
      dispatch(fetchAdminDashboard());
      return unwrapApiData(response.data);
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
  async ({ month, year, totalCompanyTarget, partnerFileCountTarget, assignmentMode = "replace" }, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.post(
        `${backendurl}/admin/target/distribute-hierarchical`,
        { month, year, totalCompanyTarget, partnerFileCountTarget, assignmentMode },
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


export const createBank = createAsyncThunk(
  "admin/createBank",
  async (formData, {rejectWithValue}) =>{
      try{
        const {adminToken} = getAuthData();
        console.log("Admin Token:", adminToken);  
        console.log("Form Data:", formData);

        const response = await axios.post(`${backendurl}/admin/banks`,
          formData,
          {
              headers:{
                 Authorization: `Bearer ${adminToken}`,
              }
          }
        )

        return response.data;

      }
      catch(error)
      {
        return rejectWithValue(error.response?.data?.message || "Failed to create bank")

      }
  }
)


export const fetchAdminBanks = createAsyncThunk(
  "admin/fetchAdminBanks",
  async (_, { rejectWithValue }) => {
    try {
      console.log("Fetch Admin Banks");
      const { adminToken } = getAuthData();
      console.log("Admin Token:", adminToken);
      const response = await axios.get(`${backendurl}/admin/banks`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      console.log("Fetch Admin Banks Response:", response.data);

      return response.data.banks;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch banks"
      );
    }
  }
);

export const deleteBank = createAsyncThunk(
  "admin/deleteBank",
  async (bankId, { rejectWithValue }) => {
    try {
      const { adminToken } = getAuthData();
      const response = await axios.delete(
        `${backendurl}/admin/banks/${bankId}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete bank"
      );
    }
  }
);




       
