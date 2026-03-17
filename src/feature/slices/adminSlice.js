import { createSlice } from "@reduxjs/toolkit";
import {
  loginUser,
  fetchAsms,
  fetchRMs,
  fetchRSMs,
  createAsm,
  createRSM,
  createRm,
  assignRmToAsm,
  reassignAllRmsFromAsm,
  activateAsm,
  deleteAsm,
  fetchAnalyticsdashboard,
  fetchAdminProfile,
  fetchAdminDashboard,
  fetchRecentActivities,
  fetchPartners,
  getUnassignedPartners,
  getAllCustomers,
  fetchBanners,
  deleteRm,
  rejectPartner,
  loginAsUserThunk,
  fetchDeleteAccountRequests,
  updateDeleteAccountRequestStatus,
  fetchAdminCustomersPayOutPending,
  fetchAdminCustomersPayOutDone,
  fetchAdminCustomerPartnersPayout,
  setAdminPayouts,
  activatePartner,
  reassignCustomersAndDeactivatePartner,
  activateRM,
  assignPartnersToRM,
  activateRSM,
  deactivateRSM,
  assignAsmBulkTarget,
  assignBulkTargetAll,
  uploadBanners,
  deleteBanner,
  assignPartnerToRm,
  fetchAdminPartnerTargets,
  assignAdminPartnerTarget,
  distributeHierarchicalTargets,
  fetchAdminIncentives,
  payAdminIncentive,
} from "../thunks/adminThunks";


import { saveAuthData } from "../../utils/localStorage";

const initialState = {
  // Login related state
  login: {
    loading: false,
    error: null,
    success: false,
    user: null,
    token: null,
    isAuthenticated: false,
  },
  // ASM related state
  asm: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  // Create ASM state
  createAsmAdmin: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  // Create RSM state
  createRSMAdmin: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  // RM related state
  rm: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  // RSM related state
  rsm: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  // Assign RM -> ASM action state
  assignRmToAsm: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  // Bulk reassign RMs from old ASM to new ASM (deactivation)
  reassignAllRmsFromAsm: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  // Partner related state
  partner: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  // Partners list state
  partners: {
    loading: false,
    error: null,
    success: false,
    data: [],
  },
  // Partner Targets state
  partnerTargets: {
    loading: false,
    error: null,
    success: false,
    data: [],
  },
  // Hierarchical Target Distribution state
  distributeHierarchicalTargets: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  // Customer related state
  customer: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  // General admin state
  general: {
    loading: false,
    error: null,
    success: false,
  },
  // Create RM state
  createRmAdmin: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  // Deactivate ASM action state
  deactivateAsm: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  // Activate ASM action state
  activateAsm: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  // Delete ASM action state
  deleteAsm: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  // Dashboard metrics for a specific ASM
  Analyticsdashboard : {
    loading: false,
    error: null,
    success: false,
    data: null,
  },

  profile: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  
  dashboard: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },

  // Delete RM action state
  deleteRm: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  rejectPartner: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },

  unassignedPartners: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },



  allCustomers: {
      loading: false,
      error: null,
      success: false,
      data: null,
    },


    allBanners: {
      loading: false,
      error: null,
      success: false,
      data: null,
    },

    recentActivities: {
      loading: false,
      error: null,
      success: false,
      activities: [],
    },

    deleteAccountRequests: {
      loading: false,
      error: null,
      success: false,
      data: [],
    },
    // Payout Management (Pending/Done)
    pendingPayout: {
      loading: false,
      error: null,
      success: false,
      data: [],
    },
    donePayout: {
      loading: false,
      error: null,
      success: false,
      data: [],
    },
    customerPartnersPayout: {
      loading: false,
      error: null,
      success: false,
      data: null,
    },
    setPayouts: {
      loading: false,
      error: null,
      success: false,
      data: null,
    },

    // Incentive management (Admin)
    incentives: {
      loading: false,
      error: null,
      success: false,
      data: [],
    },
    payIncentive: {
      loading: false,
      error: null,
      success: false,
      data: null,
    },

};

const adminSlice = createSlice({
  name: "admin",
  initialState,

  reducers: {
    resetAsmState: (state) => {
      state.asm = { ...initialState.asm };
    },
    resetCreateAsmState: (state) => {
      state.createAsmAdmin = { ...initialState.createAsmAdmin };
    },
    resetRmState: (state) => {
      state.rm = { ...initialState.rm };
    },
    resetPartnerState: (state) => {
      state.partner = { ...initialState.partner };
    },
    resetCustomerState: (state) => {
      state.customer = { ...initialState.customer };
    },
    resetAllAdminState: (state) => {
      state.asm = { ...initialState.asm };
      state.rm = { ...initialState.rm };
      state.partner = { ...initialState.partner };
      state.customer = { ...initialState.customer };
      state.general = { ...initialState.general };
      state.login = { ...initialState.login };
      state.createAsmAdmin = { ...initialState.createAsmAdmin };
    },

    resetCreateRmState: (state) => {
      state.createRmAdmin = { ...initialState.createRmAdmin };
    },


  },

  extraReducers: (builder) => {
    // 🔹 Login Thunk
    builder
      .addCase(loginUser.pending, (state) => {
        state.login.loading = true;
        state.login.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.login.loading = false;
        state.login.token = action.payload?.token || null;
        state.login.user = action.payload?.user || null;
        state.login.isAuthenticated = !!(action.payload?.token && action.payload?.user);
        state.login.success = true;

        if (action.payload?.token && action.payload?.user) {
          saveAuthData(action.payload.token, action.payload.user);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.login.loading = false;
        state.login.error = action.payload || "Login failed";
        state.login.isAuthenticated = false;
      });

    // 🔹 Create ASM Thunk
    builder
      .addCase(createAsm.pending, (state) => {
        state.createAsmAdmin.loading = true;
        state.createAsmAdmin.error = null;
        state.createAsmAdmin.success = false;
      })
      .addCase(createAsm.fulfilled, (state, action) => {
        state.createAsmAdmin.loading = false;
        state.createAsmAdmin.data = action.payload;
        state.createAsmAdmin.success = true;
      })
      .addCase(createAsm.rejected, (state, action) => {
        state.createAsmAdmin.loading = false;
        state.createAsmAdmin.error = action.payload;
        state.createAsmAdmin.success = false;
      });

    // 🔹 Create RSM Thunk
    builder
      .addCase(createRSM.pending, (state) => {
        state.createRSMAdmin.loading = true;
        state.createRSMAdmin.error = null;
        state.createRSMAdmin.success = false;
      })
      .addCase(createRSM.fulfilled, (state, action) => {
        state.createRSMAdmin.loading = false;
        state.createRSMAdmin.data = action.payload;
        state.createRSMAdmin.success = true;
      })
      .addCase(createRSM.rejected, (state, action) => {
        state.createRSMAdmin.loading = false;
        state.createRSMAdmin.error = action.payload;
        state.createRSMAdmin.success = false;
      });

    // 🔹 ASM Thunk
    builder
      .addCase(fetchAsms.pending, (state) => {
        state.asm.loading = true;
        state.asm.error = null;
      })
      .addCase(fetchAsms.fulfilled, (state, action) => {
        state.asm.loading = false;
        state.asm.data = action.payload;
        state.asm.success = true;
      })
      .addCase(fetchAsms.rejected, (state, action) => {
        state.asm.loading = false;
        state.asm.error = action.payload;
      });

    // 🔹 RM Thunk
    builder
      .addCase(fetchRMs.pending, (state) => {
        state.rm.loading = true;
        state.rm.error = null;
      })
      .addCase(fetchRMs.fulfilled, (state, action) => {
        state.rm.loading = false;
        state.rm.data = action.payload;
        state.rm.success = true;
      })
      .addCase(fetchRMs.rejected, (state, action) => {
        state.rm.loading = false;
        state.rm.error = action.payload;
      });

    // 🔹 RSM Thunk
    builder
      .addCase(fetchRSMs.pending, (state) => {
        state.rsm.loading = true;
        state.rsm.error = null;
      })
      .addCase(fetchRSMs.fulfilled, (state, action) => {
        state.rsm.loading = false;
        state.rsm.data = action.payload;
        state.rsm.success = true;
      })
      .addCase(fetchRSMs.rejected, (state, action) => {
        state.rsm.loading = false;
        state.rsm.error = action.payload;
      });

    // 🔹 Create RM Thunk
    builder
      .addCase(createRm.pending, (state) => {
        state.createRmAdmin.loading = true;
        state.createRmAdmin.error = null;
        state.createRmAdmin.success = false;
      })
      
      .addCase(createRm.fulfilled, (state, action) => {
        state.createRmAdmin.loading = false;
        state.createRmAdmin.data = action.payload;
        state.createRmAdmin.success = true;
      })
      .addCase(createRm.rejected, (state, action) => {
        state.createRmAdmin.loading = false;
        state.createRmAdmin.error = action.payload;
        state.createRmAdmin.success = false;
      });

    // 🔹 Assign RM to ASM
    builder
      .addCase(assignRmToAsm.pending, (state) => {
        state.assignRmToAsm.loading = true;
        state.assignRmToAsm.error = null;
        state.assignRmToAsm.success = false;
      })
      .addCase(assignRmToAsm.fulfilled, (state, action) => {
        state.assignRmToAsm.loading = false;
        state.assignRmToAsm.data = action.payload;
        state.assignRmToAsm.success = true;
      })
      .addCase(assignRmToAsm.rejected, (state, action) => {
        state.assignRmToAsm.loading = false;
        state.assignRmToAsm.error = action.payload;
        state.assignRmToAsm.success = false;
      });

    // 🔹 Bulk reassign all RMs from one ASM to another
    builder
      .addCase(reassignAllRmsFromAsm.pending, (state) => {
        state.reassignAllRmsFromAsm.loading = true;
        state.reassignAllRmsFromAsm.error = null;
        state.reassignAllRmsFromAsm.success = false;
      })
      .addCase(reassignAllRmsFromAsm.fulfilled, (state, action) => {
        state.reassignAllRmsFromAsm.loading = false;
        state.reassignAllRmsFromAsm.data = action.payload;
        state.reassignAllRmsFromAsm.success = true;
      })
      .addCase(reassignAllRmsFromAsm.rejected, (state, action) => {
        state.reassignAllRmsFromAsm.loading = false;
        state.reassignAllRmsFromAsm.error = action.payload;
        state.reassignAllRmsFromAsm.success = false;
      });

    // 🔹 Activate ASM
    builder
      .addCase(activateAsm.pending, (state) => {
        state.activateAsm.loading = true;
        state.activateAsm.error = null;
        state.activateAsm.success = false;
      })
      .addCase(activateAsm.fulfilled, (state, action) => {
        state.activateAsm.loading = false;
        state.activateAsm.data = action.payload;
        state.activateAsm.success = true;
      })
      .addCase(activateAsm.rejected, (state, action) => {
        state.activateAsm.loading = false;
        state.activateAsm.error = action.payload;
        state.activateAsm.success = false;
      });

    // 🔹 Delete ASM
    builder
      .addCase(deleteAsm.pending, (state) => {
        state.deleteAsm.loading = true;
        state.deleteAsm.error = null;
        state.deleteAsm.success = false;
      })
      .addCase(deleteAsm.fulfilled, (state, action) => {
        state.deleteAsm.loading = false;
        state.deleteAsm.data = action.payload;
        state.deleteAsm.success = true;
      })
      .addCase(deleteAsm.rejected, (state, action) => {
        state.deleteAsm.loading = false;
        state.deleteAsm.error = action.payload;
        state.deleteAsm.success = false;
      });

    // 🔹 ASM Dashboard Metrics
    builder
      .addCase(fetchAnalyticsdashboard.pending, (state) => {
        state.Analyticsdashboard.loading = true;
        state.Analyticsdashboard.error = null;
        state.Analyticsdashboard.success = false;
      })
      .addCase(fetchAnalyticsdashboard.fulfilled, (state, action) => {
        state.Analyticsdashboard.loading = false;
        state.Analyticsdashboard.data = action.payload;
        state.Analyticsdashboard.success = true;
      })
      .addCase(fetchAnalyticsdashboard.rejected, (state, action) => {
        state.Analyticsdashboard.loading = false;
        state.Analyticsdashboard.error = action.payload;
        state.Analyticsdashboard.success = false;
      });

      builder
      .addCase(fetchAdminProfile.pending, (state) => {
        state.profile = {
          loading: true,
          error: null,
          success: false,
          data: null,
        };
      })
      .addCase(fetchAdminProfile.fulfilled, (state, action) => {
        state.profile = {
          loading: false,
          error: null,
          success: true,
          data: action.payload, // profile data from API
        };
      })
      .addCase(fetchAdminProfile.rejected, (state, action) => {
        state.profile = {
          loading: false,
          error: action.payload,
          success: false,
          data: null,
        };
      });

      builder
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.dashboard = {
          loading: true,
          error: null,
          success: false,
          data: null,
        };
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.dashboard = {
          loading: false,
          error: null,
          success: true,
          data: action.payload, // dashboard data from API
        };
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.dashboard = {
          loading: false,
          error: action.payload,
          success: false,
          data: null,
        };
      });

    // 🔹 Fetch Recent Activities Thunk
    builder
      .addCase(fetchRecentActivities.pending, (state) => {
        state.recentActivities = {
          loading: true,
          error: null,
          success: false,
          activities: state.recentActivities?.activities || [],
        };
      })
      .addCase(fetchRecentActivities.fulfilled, (state, action) => {
        state.recentActivities = {
          loading: false,
          error: null,
          success: true,
          activities: action.payload?.activities || [],
        };
      })
      .addCase(fetchRecentActivities.rejected, (state, action) => {
        state.recentActivities = {
          loading: false,
          error: action.payload,
          success: false,
          activities: state.recentActivities?.activities || [],
        };
      });

    // 🔹 Fetch Partners Thunk
    builder
      .addCase(fetchPartners.pending, (state) => {
        state.partners.loading = true;
        state.partners.error = null;
        state.partners.success = false;
      })
      .addCase(fetchPartners.fulfilled, (state, action) => {
        state.partners.loading = false;
        state.partners.data = action.payload;
        state.partners.success = true;
      })
      .addCase(fetchPartners.rejected, (state, action) => {
        state.partners.loading = false;
        state.partners.error = action.payload;
        state.partners.success = false;
      });

      // Fetch Unassigned Partners
    builder
      .addCase(getUnassignedPartners.pending, (state) => {
        state.unassignedPartners.loading = true;
        state.unassignedPartners.error = null;
        state.unassignedPartners.success = false;
      })
      .addCase(getUnassignedPartners.fulfilled, (state, action) => {
        state.unassignedPartners.loading = false;
        state.unassignedPartners.success = true;
        state.unassignedPartners.data = action.payload;
      })
      .addCase(getUnassignedPartners.rejected, (state, action) => {
        state.unassignedPartners.loading = false;
        state.unassignedPartners.error = action.payload;
      });


      // Fetch All Customers
    builder
      .addCase(getAllCustomers.pending, (state) => {
        state.allCustomers.loading = true;
        state.allCustomers.error = null;
        state.allCustomers.success = false;
      })
      .addCase(getAllCustomers.fulfilled, (state, action) => {
        state.allCustomers.loading = false;
        state.allCustomers.success = true;
        state.allCustomers.data = action.payload;
      })
      .addCase(getAllCustomers.rejected, (state, action) => {
        state.allCustomers.loading = false;
        state.allCustomers.error = action.payload;
      });


      builder
      // Fetch Banners
      .addCase(fetchBanners.pending, (state) => {
        state.allBanners.loading = true;
        state.allBanners.error = null;
        state.allBanners.success = false;
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.allBanners.loading = false;
        state.allBanners.success = true;
        // Handle both array and object with banners property
        state.allBanners.data = Array.isArray(action.payload) 
          ? action.payload 
          : (action.payload?.banners || []);
      })
      .addCase(fetchBanners.rejected, (state, action) => {
        state.allBanners.loading = false;
        state.allBanners.error = action.payload;
      })

      // Upload Banners
      .addCase(uploadBanners.pending, (state) => {
        state.allBanners.loading = true;
        state.allBanners.error = null;
        state.allBanners.success = false;
      })
      .addCase(uploadBanners.fulfilled, (state, action) => {
        state.allBanners.loading = false;
        state.allBanners.success = true;
        // Handle both array and object with banners property
        state.allBanners.data = Array.isArray(action.payload) 
          ? action.payload 
          : (action.payload?.banners || []);
      })
      .addCase(uploadBanners.rejected, (state, action) => {
        state.allBanners.loading = false;
        state.allBanners.error = action.payload;
      })

      // Delete Banner
      .addCase(deleteBanner.pending, (state) => {
        state.allBanners.loading = true;
        state.allBanners.error = null;
        state.allBanners.success = false;
      })
      .addCase(deleteBanner.fulfilled, (state, action) => {
        state.allBanners.loading = false;
        state.allBanners.success = true;
        // Handle both array and object with banners property
        state.allBanners.data = Array.isArray(action.payload) 
          ? action.payload 
          : (action.payload?.banners || []);
        // If delete was successful, refetch banners
        if (action.payload && !Array.isArray(action.payload) && !action.payload.banners) {
          // If response doesn't contain banners array, keep existing data
          // The component will refetch after delete
        }
      })
      .addCase(deleteBanner.rejected, (state, action) => {
        state.allBanners.loading = false;
        state.allBanners.error = action.payload;
      })

      // Assign Partner to RM
      .addCase(assignPartnerToRm.pending, (state) => {
        state.partner.loading = true;
        state.partner.error = null;
        state.partner.success = false;
      })
      .addCase(assignPartnerToRm.fulfilled, (state, action) => {
        state.partner.loading = false;
        state.partner.success = true;
        state.partner.data = action.payload;
      })
      .addCase(assignPartnerToRm.rejected, (state, action) => {
        state.partner.loading = false;
        state.partner.error = action.payload;
        state.partner.success = false;
      });

      // 🔹 Delete RM
      builder
        .addCase(deleteRm.pending, (state) => {
          state.deleteRm.loading = true;
          state.deleteRm.error = null;
          state.deleteRm.success = false;
        })
        .addCase(deleteRm.fulfilled, (state, action) => {
          state.deleteRm.loading = false;
          state.deleteRm.data = action.payload;
          state.deleteRm.success = true;
        })
        .addCase(deleteRm.rejected, (state, action) => {
          state.deleteRm.loading = false;
          state.deleteRm.error = action.payload;
          state.deleteRm.success = false;
        });

      // 🔹 Reject Partner
      builder
        .addCase(rejectPartner.pending, (state) => {
          state.rejectPartner.loading = true;
          state.rejectPartner.error = null;
          state.rejectPartner.success = false;
        })
        .addCase(rejectPartner.fulfilled, (state, action) => {
          state.rejectPartner.loading = false;
          state.rejectPartner.data = action.payload;
          state.rejectPartner.success = true;
          
          // Remove rejected partner from partners list
          if (state.partners.data) {
            state.partners.data = state.partners.data.filter(
              (p) => p._id !== action.meta.arg
            );
          }
          
          // Remove rejected partner from unassignedPartners list (optimistic update)
          if (state.unassignedPartners.data) {
            state.unassignedPartners.data = state.unassignedPartners.data.filter(
              (p) => p._id !== action.meta.arg
            );
          }
        })
        .addCase(rejectPartner.rejected, (state, action) => {
          state.rejectPartner.loading = false;
          state.rejectPartner.error = action.payload;
          state.rejectPartner.success = false;
        });

      // 🔹 Fetch delete-account requests
      builder
        .addCase(fetchDeleteAccountRequests.pending, (state) => {
          state.deleteAccountRequests.loading = true;
          state.deleteAccountRequests.error = null;
          state.deleteAccountRequests.success = false;
        })
        .addCase(fetchDeleteAccountRequests.fulfilled, (state, action) => {
          state.deleteAccountRequests.loading = false;
          state.deleteAccountRequests.data = action.payload || [];
          state.deleteAccountRequests.success = true;
        })
        .addCase(fetchDeleteAccountRequests.rejected, (state, action) => {
          state.deleteAccountRequests.loading = false;
          state.deleteAccountRequests.error = action.payload;
          state.deleteAccountRequests.success = false;
        });

      // 🔹 Update delete-account request status
      builder
        .addCase(updateDeleteAccountRequestStatus.pending, (state) => {
          // no separate loading slice; keep it simple
        })
        .addCase(updateDeleteAccountRequestStatus.fulfilled, (state, action) => {
          const updated = action.payload;
          if (!updated) return;
          const idx = state.deleteAccountRequests.data.findIndex(
            (r) => r._id === updated._id
          );
          if (idx !== -1) {
            state.deleteAccountRequests.data[idx] = updated;
          }
        })
        .addCase(updateDeleteAccountRequestStatus.rejected, (_state, _action) => {
          // ignore; UI will surface via thunk reject message
        });

      // 🔹 Login As (impersonation) Thunk
builder
.addCase(loginAsUserThunk.pending, (state) => {
  state.login.loading = true;
  state.login.error = null;
})
.addCase(loginAsUserThunk.fulfilled, (state, action) => {
  state.login.loading = false;
  state.login.token = action.payload?.token || null;
  state.login.user = action.payload?.user || null;
  state.login.isAuthenticated = !!(action.payload?.token && action.payload?.user);
  state.login.success = true;

  if (action.payload?.token && action.payload?.user) {
    // Save impersonation with a flag
    saveAuthData(action.payload.token, action.payload.user, true);
  }
})
.addCase(loginAsUserThunk.rejected, (state, action) => {
  state.login.loading = false;
  state.login.error = action.payload || "Login as user failed";
  state.login.isAuthenticated = false;
})

      // Pending Payout
      .addCase(fetchAdminCustomersPayOutPending.pending, (state) => {
        state.pendingPayout.loading = true;
        state.pendingPayout.error = null;
      })
      .addCase(fetchAdminCustomersPayOutPending.fulfilled, (state, action) => {
        state.pendingPayout.loading = false;
        state.pendingPayout.data = action.payload;
        state.pendingPayout.success = true;
      })
      .addCase(fetchAdminCustomersPayOutPending.rejected, (state, action) => {
        state.pendingPayout.loading = false;
        state.pendingPayout.error = action.payload;
      })

      // Done Payout
      .addCase(fetchAdminCustomersPayOutDone.pending, (state) => {
        state.donePayout.loading = true;
        state.donePayout.error = null;
      })
      .addCase(fetchAdminCustomersPayOutDone.fulfilled, (state, action) => {
        state.donePayout.loading = false;
        state.donePayout.data = action.payload;
        state.donePayout.success = true;
      })
      .addCase(fetchAdminCustomersPayOutDone.rejected, (state, action) => {
        state.donePayout.loading = false;
        state.donePayout.error = action.payload;
      })

      // Customer Partners Payout
      .addCase(fetchAdminCustomerPartnersPayout.pending, (state) => {
        state.customerPartnersPayout.loading = true;
        state.customerPartnersPayout.error = null;
      })
      .addCase(fetchAdminCustomerPartnersPayout.fulfilled, (state, action) => {
        state.customerPartnersPayout.loading = false;
        state.customerPartnersPayout.data = action.payload;
        state.customerPartnersPayout.success = true;
      })
      .addCase(fetchAdminCustomerPartnersPayout.rejected, (state, action) => {
        state.customerPartnersPayout.loading = false;
        state.customerPartnersPayout.error = action.payload;
      })

      // Set Payouts
      .addCase(setAdminPayouts.pending, (state) => {
        state.setPayouts.loading = true;
        state.setPayouts.error = null;
        state.setPayouts.success = false;
      })
      .addCase(setAdminPayouts.fulfilled, (state, action) => {
        state.setPayouts.loading = false;
        state.setPayouts.data = action.payload;
        state.setPayouts.success = true;
      })
      .addCase(setAdminPayouts.rejected, (state, action) => {
        state.setPayouts.loading = false;
        state.setPayouts.error = action.payload;
        state.setPayouts.success = false;
      })

      // Activate Partner
      .addCase(activatePartner.pending, (state) => {
        state.partner.loading = true;
        state.partner.error = null;
        state.partner.success = false;
      })
      .addCase(activatePartner.fulfilled, (state, action) => {
        state.partner.loading = false;
        state.partner.data = action.payload;
        state.partner.success = true;
        // Update partner in partners list if exists
        if (state.partners.data && Array.isArray(state.partners.data)) {
          const index = state.partners.data.findIndex(
            (p) => p._id === action.payload?.partner?._id
          );
          if (index !== -1) {
            state.partners.data[index] = {
              ...state.partners.data[index],
              status: "ACTIVE",
            };
          }
        }
      })
      .addCase(activatePartner.rejected, (state, action) => {
        state.partner.loading = false;
        state.partner.error = action.payload;
        state.partner.success = false;
      })

      // Reassign Customers and Deactivate Partner
      .addCase(reassignCustomersAndDeactivatePartner.pending, (state) => {
        state.partner.loading = true;
        state.partner.error = null;
        state.partner.success = false;
      })
      .addCase(reassignCustomersAndDeactivatePartner.fulfilled, (state, action) => {
        state.partner.loading = false;
        state.partner.data = action.payload;
        state.partner.success = true;
      })
      .addCase(reassignCustomersAndDeactivatePartner.rejected, (state, action) => {
        state.partner.loading = false;
        state.partner.error = action.payload;
        state.partner.success = false;
      })

      // Activate RM
      .addCase(activateRM.pending, (state) => {
        state.rm.loading = true;
        state.rm.error = null;
        state.rm.success = false;
      })
      .addCase(activateRM.fulfilled, (state, action) => {
        state.rm.loading = false;
        state.rm.data = action.payload;
        state.rm.success = true;
      })
      .addCase(activateRM.rejected, (state, action) => {
        state.rm.loading = false;
        state.rm.error = action.payload;
        state.rm.success = false;
      })

      // Assign Partners to RM
      .addCase(assignPartnersToRM.pending, (state) => {
        state.partner.loading = true;
        state.partner.error = null;
        state.partner.success = false;
      })
      .addCase(assignPartnersToRM.fulfilled, (state, action) => {
        state.partner.loading = false;
        state.partner.data = action.payload;
        state.partner.success = true;
      })
      .addCase(assignPartnersToRM.rejected, (state, action) => {
        state.partner.loading = false;
        state.partner.error = action.payload;
        state.partner.success = false;
      })

      // Activate RSM
      .addCase(activateRSM.pending, (state) => {
        state.rsm.loading = true;
        state.rsm.error = null;
        state.rsm.success = false;
      })
      .addCase(activateRSM.fulfilled, (state, action) => {
        state.rsm.loading = false;
        state.rsm.data = action.payload;
        state.rsm.success = true;
      })
      .addCase(activateRSM.rejected, (state, action) => {
        state.rsm.loading = false;
        state.rsm.error = action.payload;
        state.rsm.success = false;
      })

      // Deactivate RSM
      .addCase(deactivateRSM.pending, (state) => {
        state.rsm.loading = true;
        state.rsm.error = null;
        state.rsm.success = false;
      })
      .addCase(deactivateRSM.fulfilled, (state, action) => {
        state.rsm.loading = false;
        state.rsm.data = action.payload;
        state.rsm.success = true;
      })
      .addCase(deactivateRSM.rejected, (state, action) => {
        state.rsm.loading = false;
        state.rsm.error = action.payload;
        state.rsm.success = false;
      })

      // Assign ASM Bulk Target
      .addCase(assignAsmBulkTarget.pending, (state) => {
        state.asm.loading = true;
        state.asm.error = null;
        state.asm.success = false;
      })
      .addCase(assignAsmBulkTarget.fulfilled, (state, action) => {
        state.asm.loading = false;
        state.asm.data = action.payload;
        state.asm.success = true;
      })
      .addCase(assignAsmBulkTarget.rejected, (state, action) => {
        state.asm.loading = false;
        state.asm.error = action.payload;
        state.asm.success = false;
      })

      // Assign Bulk Target All
      .addCase(assignBulkTargetAll.pending, (state) => {
        state.asm.loading = true;
        state.asm.error = null;
        state.asm.success = false;
      })
      .addCase(assignBulkTargetAll.fulfilled, (state, action) => {
        state.asm.loading = false;
        state.asm.data = action.payload;
        state.asm.success = true;
      })
      .addCase(assignBulkTargetAll.rejected, (state, action) => {
        state.asm.loading = false;
        state.asm.error = action.payload;
        state.asm.success = false;
      })

      // Fetch Partner Targets
      .addCase(fetchAdminPartnerTargets.pending, (state) => {
        state.partnerTargets.loading = true;
        state.partnerTargets.error = null;
        state.partnerTargets.success = false;
      })
      .addCase(fetchAdminPartnerTargets.fulfilled, (state, action) => {
        state.partnerTargets.loading = false;
        state.partnerTargets.data = action.payload;
        state.partnerTargets.success = true;
      })
      .addCase(fetchAdminPartnerTargets.rejected, (state, action) => {
        state.partnerTargets.loading = false;
        state.partnerTargets.error = action.payload;
        state.partnerTargets.success = false;
      })

      // Assign Partner Target
      .addCase(assignAdminPartnerTarget.pending, (state) => {
        state.partnerTargets.loading = true;
        state.partnerTargets.error = null;
        state.partnerTargets.success = false;
      })
      .addCase(assignAdminPartnerTarget.fulfilled, (state, action) => {
        state.partnerTargets.loading = false;
        state.partnerTargets.success = true;
      })
      .addCase(assignAdminPartnerTarget.rejected, (state, action) => {
        state.partnerTargets.loading = false;
        state.partnerTargets.error = action.payload;
        state.partnerTargets.success = false;
      })

      // Distribute Hierarchical Targets
      .addCase(distributeHierarchicalTargets.pending, (state) => {
        state.distributeHierarchicalTargets.loading = true;
        state.distributeHierarchicalTargets.error = null;
        state.distributeHierarchicalTargets.success = false;
      })
      .addCase(distributeHierarchicalTargets.fulfilled, (state, action) => {
        state.distributeHierarchicalTargets.loading = false;
        state.distributeHierarchicalTargets.data = action.payload;
        state.distributeHierarchicalTargets.success = true;
      })
      .addCase(distributeHierarchicalTargets.rejected, (state, action) => {
        state.distributeHierarchicalTargets.loading = false;
        state.distributeHierarchicalTargets.error = action.payload;
        state.distributeHierarchicalTargets.success = false;
      })

      // ==================== INCENTIVE MANAGEMENT (Admin) ====================
      .addCase(fetchAdminIncentives.pending, (state) => {
        state.incentives.loading = true;
        state.incentives.error = null;
        state.incentives.success = false;
      })
      .addCase(fetchAdminIncentives.fulfilled, (state, action) => {
        state.incentives.loading = false;
        state.incentives.data = action.payload || [];
        state.incentives.success = true;
      })
      .addCase(fetchAdminIncentives.rejected, (state, action) => {
        state.incentives.loading = false;
        state.incentives.error = action.payload;
        state.incentives.success = false;
      })

      .addCase(payAdminIncentive.pending, (state) => {
        state.payIncentive.loading = true;
        state.payIncentive.error = null;
        state.payIncentive.success = false;
      })
      .addCase(payAdminIncentive.fulfilled, (state, action) => {
        state.payIncentive.loading = false;
        state.payIncentive.data = action.payload;
        state.payIncentive.success = true;
      })
      .addCase(payAdminIncentive.rejected, (state, action) => {
        state.payIncentive.loading = false;
        state.payIncentive.error = action.payload;
        state.payIncentive.success = false;
      });

  },
});

export const {
  resetAsmState,
  resetCreateAsmState,
  resetRmState,
  resetPartnerState,
  resetCustomerState,
  resetAllAdminState,
  resetCreateRmState,

} = adminSlice.actions;

export default adminSlice.reducer;
