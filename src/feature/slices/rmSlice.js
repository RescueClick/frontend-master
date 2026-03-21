import { createSlice } from "@reduxjs/toolkit";
import {
  fetchPartners,
  fetchRmProfile,
  updateRmProfile,
  fetchDashboard,
  fetchRmCustomers,
  assignPartnerBulkTarget,
  fetchCustomerPartnersPayout,
  updateFollowUp,
  fetchPartnersWithFollowUp, // 🔹 new thunk
  fetchRmCustomersPayOutPending,
  fetchRmCustomersPayOutDone,
  setPayouts, // ✅ Add setPayouts thunk
  getAnalytics,
  fetchRmPartnerTargets,
} from "../thunks/rmThunks";



const initialState = {
  partner: {
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
  customers: {
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

  bulkTarget: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  // ✅ New follow-up state
  followUp: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },

  partnersWithFollowUp: {
    // 🔹 new state
    loading: false,
    error: null,
    success: false,
    data: [],
  },

  
  pendingPayout: {
    // 🔹 new state
    loading: false,
    error: null,
    success: false,
    data: [],
  },

  
  donePayout: {
    // 🔹 new state
    loading: false,
    error: null,
    success: false,
    data: [],
  },

  analyticsdashboard: {
    loading: false,
    error: null,
    success: false,
    data: null, // Changed from analyticsData to data for consistency
  },
  // Partner Targets state
  partnerTargets: {
    loading: false,
    error: null,
    success: false,
    data: [],
  },

  
};

const rmSlice = createSlice({
  name: "rm",
  initialState,
  reducers: {
    resetPartner: (state) => {
      state.partner = { ...initialState.partner };
    },
    resetProfile: (state) => {
      state.profile = { ...initialState.profile };
    },
    resetDashboard: (state) => {
      state.dashboard = { ...initialState.dashboard };
    },
    resetCustomers: (state) => {
      state.customers = { ...initialState.customers };
    },
    resetPartnerLoans: (state) => {
      state.partnerLoans = { ...initialState.partnerLoans };
    },
    resetAll: (state) => {
      state.partner = { ...initialState.partner };
      state.profile = { ...initialState.profile };
      state.dashboard = { ...initialState.dashboard };
      state.customers = { ...initialState.customers };
      state.partnerLoans = { ...initialState.partnerLoans };
    },
  },
  extraReducers: (builder) => {
    // ✅ Partners
    builder
      .addCase(fetchPartners.pending, (state) => {
        state.partner.loading = true;
        state.partner.error = null;
        state.partner.success = false;
      })
      .addCase(fetchPartners.fulfilled, (state, action) => {
        state.partner.loading = false;
        state.partner.error = null;
        state.partner.success = true;
        state.partner.data = action.payload;
      })
      .addCase(fetchPartners.rejected, (state, action) => {
        state.partner.loading = false;
        state.partner.error = action.payload;
        state.partner.success = false;
        state.partner.data = null;
      });

    // ✅ RM Profile
    builder
      .addCase(fetchRmProfile.pending, (state) => {
        state.profile.loading = true;
        state.profile.error = null;
        state.profile.success = false;
      })
      .addCase(fetchRmProfile.fulfilled, (state, action) => {
        state.profile.loading = false;
        state.profile.error = null;
        state.profile.success = true;
        state.profile.data = action.payload;
      })
      .addCase(fetchRmProfile.rejected, (state, action) => {
        state.profile.loading = false;
        state.profile.error = action.payload;
        state.profile.success = false;
        state.profile.data = null;
      })
      .addCase(updateRmProfile.pending, (state) => {
        state.profile.loading = true;
        state.profile.error = null;
        state.profile.success = false;
      })
      .addCase(updateRmProfile.fulfilled, (state, action) => {
        state.profile.loading = false;
        state.profile.error = null;
        state.profile.success = true;
        state.profile.data = { ...(state.profile.data || {}), ...action.payload };
      })
      .addCase(updateRmProfile.rejected, (state, action) => {
        state.profile.loading = false;
        state.profile.error = action.payload;
        state.profile.success = false;
      });

    // ✅ Dashboard
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.dashboard.loading = true;
        state.dashboard.error = null;
        state.dashboard.success = false;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.dashboard.loading = false;
        state.dashboard.error = null;
        state.dashboard.success = true;
        state.dashboard.data = action.payload;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.dashboard.loading = false;
        state.dashboard.error = action.payload;
        state.dashboard.success = false;
        state.dashboard.data = null;
      });

    // ✅ RM Customers
    builder
      .addCase(fetchRmCustomers.pending, (state) => {
        state.customers.loading = true;
        state.customers.error = null;
        state.customers.success = false;
      })
      .addCase(fetchRmCustomers.fulfilled, (state, action) => {
        state.customers.loading = false;
        state.customers.error = null;
        state.customers.success = true;
        state.customers.data = action.payload;
      })
      .addCase(fetchRmCustomers.rejected, (state, action) => {
        state.customers.loading = false;
        state.customers.error = action.payload;
        state.customers.success = false;
        state.customers.data = [];
      });

    // ✅ Assign Partner Bulk Target thunk
    builder
      .addCase(assignPartnerBulkTarget.pending, (state) => {
        state.bulkTarget.loading = true;
        state.bulkTarget.error = null;
        state.bulkTarget.success = false;
      })
      .addCase(assignPartnerBulkTarget.fulfilled, (state, action) => {
        state.bulkTarget.loading = false;
        state.bulkTarget.success = true;
        state.bulkTarget.data = action.payload; // API response data
      })
      .addCase(assignPartnerBulkTarget.rejected, (state, action) => {
        state.bulkTarget.loading = false;
        state.bulkTarget.error =
          action.payload || "Failed to assign bulk target";
        state.bulkTarget.success = false;
      });

    builder
      .addCase(fetchCustomerPartnersPayout.pending, (state) => {
        state.customerPartnersPayout.loading = true;
        state.customerPartnersPayout.error = null;
        state.customerPartnersPayout.success = false;
      })
      .addCase(fetchCustomerPartnersPayout.fulfilled, (state, action) => {
        state.customerPartnersPayout.loading = false;
        state.customerPartnersPayout.success = true;
        state.customerPartnersPayout.data = action.payload; // { customerId, partners }
      })
      .addCase(fetchCustomerPartnersPayout.rejected, (state, action) => {
        state.customerPartnersPayout.loading = false;
        state.customerPartnersPayout.error =
          action.payload || "Failed to fetch partners payout details";
        state.customerPartnersPayout.success = false;
      });

    // follow up slice
    builder
      .addCase(updateFollowUp.pending, (state) => {
        state.followUp.loading = true;
        state.followUp.error = null;
        state.followUp.success = false;
      })
      .addCase(updateFollowUp.fulfilled, (state, action) => {
        state.followUp.loading = false;
        state.followUp.error = null;
        state.followUp.success = true;
        state.followUp.data = action.payload; // { message, followUp }
      })
      .addCase(updateFollowUp.rejected, (state, action) => {
        state.followUp.loading = false;
        state.followUp.error = action.payload;
        state.followUp.success = false;
        state.followUp.data = null;
      });

    // 🔹 Fetch Partners with Follow-up
    builder
      .addCase(fetchPartnersWithFollowUp.pending, (state) => {
        state.partnersWithFollowUp.loading = true;
        state.partnersWithFollowUp.error = null;
        state.partnersWithFollowUp.success = false;
      })
      .addCase(fetchPartnersWithFollowUp.fulfilled, (state, action) => {
        state.partnersWithFollowUp.loading = false;
        state.partnersWithFollowUp.error = null;
        state.partnersWithFollowUp.success = true;
        state.partnersWithFollowUp.data = action.payload; // API array response
      })
      .addCase(fetchPartnersWithFollowUp.rejected, (state, action) => {
        state.partnersWithFollowUp.loading = false;
        state.partnersWithFollowUp.error = action.payload;
        state.partnersWithFollowUp.success = false;
        state.partnersWithFollowUp.data = [];
      });

      builder
      .addCase(fetchRmCustomersPayOutPending.pending, (state) => {
        state.pendingPayout.loading = true;
        state.pendingPayout.error = null;
        state.pendingPayout.success = false;
      })
      .addCase(fetchRmCustomersPayOutPending.fulfilled, (state, action) => {
        state.pendingPayout.loading = false;
        state.pendingPayout.error = null;
        state.pendingPayout.success = true;
        state.pendingPayout.data = action.payload; // API array response
      })
      .addCase(fetchRmCustomersPayOutPending.rejected, (state, action) => {
        state.pendingPayout.loading = false;
        state.pendingPayout.error = action.payload;
        state.pendingPayout.success = false;
        state.pendingPayout.data = [];
      });

      builder
      .addCase(fetchRmCustomersPayOutDone.pending, (state) => {
        state.donePayout.loading = true;
        state.donePayout.error = null;
        state.donePayout.success = false;
      })
      .addCase(fetchRmCustomersPayOutDone.fulfilled, (state, action) => {
        state.donePayout.loading = false;
        state.donePayout.error = null;
        state.donePayout.success = true;
        state.donePayout.data = action.payload; // API array response
      })
      .addCase(fetchRmCustomersPayOutDone.rejected, (state, action) => {
        state.donePayout.loading = false;
        state.donePayout.error = action.payload;
        state.donePayout.success = false;
        state.donePayout.data = [];
      });

    // ✅ Set Payouts
    builder
      .addCase(setPayouts.pending, (state) => {
        state.setPayouts.loading = true;
        state.setPayouts.error = null;
        state.setPayouts.success = false;
      })
      .addCase(setPayouts.fulfilled, (state, action) => {
        state.setPayouts.loading = false;
        state.setPayouts.error = null;
        state.setPayouts.success = true;
        state.setPayouts.data = action.payload;
      })
      .addCase(setPayouts.rejected, (state, action) => {
        state.setPayouts.loading = false;
        state.setPayouts.error = action.payload;
        state.setPayouts.success = false;
        state.setPayouts.data = null;
      });


      builder
  .addCase(getAnalytics.pending, (state) => {
    state.analyticsdashboard.loading = true;
    state.analyticsdashboard.error = null;
    state.analyticsdashboard.success = false;
    state.analyticsdashboard.data = null;
  })
  .addCase(getAnalytics.fulfilled, (state, action) => {
    state.analyticsdashboard.loading = false;
    state.analyticsdashboard.error = null;
    state.analyticsdashboard.success = true;
    state.analyticsdashboard.data = action.payload; // Store full response
  })
  .addCase(getAnalytics.rejected, (state, action) => {
    state.analyticsdashboard.loading = false;
    state.analyticsdashboard.error = action.payload || "Failed to fetch analytics";
    state.analyticsdashboard.success = false;
    state.analyticsdashboard.data = null;
  })

  // Fetch Partner Targets
  .addCase(fetchRmPartnerTargets.pending, (state) => {
    state.partnerTargets.loading = true;
    state.partnerTargets.error = null;
    state.partnerTargets.success = false;
  })
  .addCase(fetchRmPartnerTargets.fulfilled, (state, action) => {
    state.partnerTargets.loading = false;
    state.partnerTargets.data = action.payload;
    state.partnerTargets.success = true;
  })
      .addCase(fetchRmPartnerTargets.rejected, (state, action) => {
        state.partnerTargets.loading = false;
        state.partnerTargets.error = action.payload;
        state.partnerTargets.success = false;
      });
  },
});

export const {
  resetPartner,
  resetProfile,
  resetDashboard,
  resetCustomers,
  resetPartnerLoans,
  resetAll,
  resetBulkTargetState,
} = rmSlice.actions;

export default rmSlice.reducer;
