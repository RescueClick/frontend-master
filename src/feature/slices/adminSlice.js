import { createSlice } from "@reduxjs/toolkit";
import {loginUser,
   fetchAsms,
   fetchRMs,
   createAsm,
   createRm,
  assignRmToAsm, 
  reassignAllRmsFromAsm, 
  activateAsm, 
  deleteAsm,
  fetchAnalyticsdashboard,   
  fetchAdminProfile,  
  fetchAdminDashboard, 
  fetchPartners,
  getUnassignedPartners,
  getAllCustomers,
  fetchBanners,
  deleteRm,
  loginAsUserThunk

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
  // RM related state
  rm: {
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
        state.allBanners.data = action.payload;
      })
      .addCase(fetchBanners.rejected, (state, action) => {
        state.allBanners.loading = false;
        state.allBanners.error = action.payload;
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
