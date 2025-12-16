import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAsmCustomers,
  fetchAsmDashboard,
  fetchAsmPartners,
  fetchAsmProfile,
  fetchRmList,
  fetchAsmApplications,
  getAnalytics,
  deleteRmAsm,
} from "../thunks/asmThunks";



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

  profile: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  // 🔹 RM List state
  rmList: {
    loading: false,
    error: null,
    success: false,
    data: [],
  },
  deleteRm: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  // 🔹 Dashboard state
  dashboard: {
    loading: false,
    error: null,
    success: false,
    data: null, // will store { totals, targets, topPerformers }
  },
  // 🔹 Partners list state
  partners: {
    loading: false,
    error: null,
    success: false,
    data: [],
  },

  // 🔹 Customers list state (NEW)
  customers: {
    loading: false,
    error: null,
    success: false,
    data: [],
  },
  applications: {
    loading: false,
    error: null,
    success: false,
    data: [],
  },


  analyticsdashboard: {
    loading: false,
    error: null,
    success: false,
    analyticsData: null,
  },

    // Assign RM -> ASM action state
    assignPartnerToRM: {
      loading: false,
      error: null,
      success: false,
      data: null,
    },
    // Bulk reassign RMs from old ASM to new ASM (deactivation)
    reassignAllCustomerToPartner: {
      loading: false,
      error: null,
      success: false,
      data: null,
    },

};

const asmSlice = createSlice({
  name: "asm",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // 🔹 Fetch ASM Profile Thunk
      .addCase(fetchAsmProfile.pending, (state) => {
        state.profile = {
          loading: true,
          error: null,
          success: false,
          data: null,
        };
      })
      .addCase(fetchAsmProfile.fulfilled, (state, action) => {
        state.profile = {
          loading: false,
          error: null,
          success: true,
          data: action.payload, // profile data from API
        };
      })
      .addCase(fetchAsmProfile.rejected, (state, action) => {
        state.profile = {
          loading: false,
          error: action.payload,
          success: false,
          data: null,
        };
      })

      // Rm fetch list
      .addCase(fetchRmList.pending, (state) => {
        state.rmList = {
          loading: true,
          error: null,
          success: false,
          data: [],
        };
      })
      .addCase(fetchRmList.fulfilled, (state, action) => {
        state.rmList = {
          loading: false,
          error: null,
          success: true,
          data: action.payload, // list of RMs
        };
      })
      .addCase(fetchRmList.rejected, (state, action) => {
        state.rmList = {
          loading: false,
          error: action.payload,
          success: false,
          data: [],
        };
      })

      .addCase(fetchAsmDashboard.pending, (state) => {
        state.dashboard = {
          loading: true,
          error: null,
          success: false,
          data: null,
        };
      })
      .addCase(fetchAsmDashboard.fulfilled, (state, action) => {
        state.dashboard = {
          loading: false,
          error: null,
          success: true,
          data: action.payload, // full dashboard { totals, targets, topPerformers }
        };
      })
      .addCase(fetchAsmDashboard.rejected, (state, action) => {
        state.dashboard = {
          loading: false,
          error: action.payload,
          success: false,
          data: null,
        };
      })

      // 🔹 Fetch ASM Partners
      .addCase(fetchAsmPartners.pending, (state) => {
        state.partners = {
          loading: true,
          error: null,
          success: false,
          data: [],
        };
      })
      .addCase(fetchAsmPartners.fulfilled, (state, action) => {
        state.partners = {
          loading: false,
          error: null,
          success: true,
          data: action.payload, // formatted partners list from API
        };
      })
      .addCase(fetchAsmPartners.rejected, (state, action) => {
        state.partners = {
          loading: false,
          error: action.payload,
          success: false,
          data: [],
        };
      })

      // 🔹 Fetch ASM Applications
      .addCase(fetchAsmApplications.pending, (state) => {
        state.applications = {
          loading: true,
          error: null,
          success: false,
          data: [],
        };
      })
      .addCase(fetchAsmApplications.fulfilled, (state, action) => {
        state.applications = {
          loading: false,
          error: null,
          success: true,
          data: action.payload, // formatted applications list from API
        };
      })
      .addCase(fetchAsmApplications.rejected, (state, action) => {
        state.applications = {
          loading: false,
          error: action.payload,
          success: false,
          data: [],
        };
      })

      // ASM CUSTOMER
      // 🔹 Customers (NEW)
      .addCase(fetchAsmCustomers.pending, (state) => {
        state.customers = {
          loading: true,
          error: null,
          success: false,
          data: [],
        };
      })
      .addCase(fetchAsmCustomers.fulfilled, (state, action) => {
        state.customers = {
          loading: false,
          error: null,
          success: true,
          data: action.payload,
        };
      })
      .addCase(fetchAsmCustomers.rejected, (state, action) => {
        state.customers = {
          loading: false,
          error: action.payload,
          success: false,
          data: [],
        };
      });

      builder
      .addCase(getAnalytics.pending, (state) => {
        state.analyticsdashboard.loading = true;
        state.analyticsdashboard.error = null;
        state.analyticsdashboard.success = false;
        state.analyticsdashboard.analyticsData = null;
      })
      .addCase(getAnalytics.fulfilled, (state, action) => {
        state.analyticsdashboard.loading = false;
        state.analyticsdashboard.error = null;
        state.analyticsdashboard.success = true;
        state.analyticsdashboard.analyticsData = action.payload; // full { profile, analytics }
      })
      .addCase(getAnalytics.rejected, (state, action) => {
        state.analyticsdashboard.loading = false;
        state.analyticsdashboard.error =
          action.payload || "Failed to fetch analyticsData";
        state.analyticsdashboard.success = false;
        state.analyticsdashboard.analyticsData = null;
      });

      // Delete RM (ASM)
      builder
        .addCase(deleteRmAsm.pending, (state) => {
          state.deleteRm.loading = true;
          state.deleteRm.error = null;
          state.deleteRm.success = false;
          state.deleteRm.data = null;
        })
        .addCase(deleteRmAsm.fulfilled, (state, action) => {
          state.deleteRm.loading = false;
          state.deleteRm.error = null;
          state.deleteRm.success = true;
          state.deleteRm.data = action.payload;
        })
        .addCase(deleteRmAsm.rejected, (state, action) => {
          state.deleteRm.loading = false;
          state.deleteRm.error = action.payload;
          state.deleteRm.success = false;
          state.deleteRm.data = null;
        });
  },

  
});

export default asmSlice.reducer;
