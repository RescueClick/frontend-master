import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAsmCustomers,
  fetchAsmDashboard,
  fetchAsmPartners,
  fetchAsmProfile,
  updateAsmProfile,
  fetchRsmList,
  fetchRmList,
  fetchAsmApplications,
  getAnalytics,
  deleteRmAsm,
  fetchPayouts,
  approvePayout,
  createPayout,
  fetchDisbursedApplications,
  fetchIncentives,
  fetchRsmFollowUps,
  recordRsmFollowUp,
  fetchAsmCustomersPayOutPending,
  fetchAsmCustomersPayOutDone,
  fetchAsmCustomerPartnersPayout,
  setAsmPayouts,
  assignPartnerTarget,
  assignPartnerTargetBulk,
  fetchPartnerTargets,
  fetchRsmAnalytics,
  payIncentive,
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
  // 🔹 RSM List state (ASM manages RSMs)
  rsmList: {
    loading: false,
    error: null,
    success: false,
    data: [],
  },
  // 🔹 RM List state (for backward compatibility, ASM can still see RMs via RSMs)
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
  payouts: {
    loading: false,
    error: null,
    success: false,
    data: [],
  },
  disbursedApplications: {
    loading: false,
    error: null,
    success: false,
    data: [],
  },
  incentives: {
    loading: false,
    error: null,
    success: false,
    data: [],
  },
  followUps: {
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
  assignPartnerTarget: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  assignPartnerTargetBulk: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  partnerTargets: {
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
  // RSM Analytics state (ASM viewing RSM analytics)
  rsmAnalytics: {
    loading: false,
    error: null,
    data: null,
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
      .addCase(updateAsmProfile.pending, (state) => {
        state.profile.loading = true;
        state.profile.error = null;
      })
      .addCase(updateAsmProfile.fulfilled, (state, action) => {
        state.profile.loading = false;
        state.profile.success = true;
        const p = action.payload;
        if (p && typeof p === "object") {
          state.profile.data = {
            ...(state.profile.data || {}),
            ...p,
            fullName:
              p.fullName || `${p.firstName || ""} ${p.lastName || ""}`.trim(),
          };
        }
      })
      .addCase(updateAsmProfile.rejected, (state, action) => {
        state.profile.loading = false;
        state.profile.error = action.payload;
      })

      // RSM fetch list (ASM manages RSMs)
      .addCase(fetchRsmList.pending, (state) => {
        state.rsmList = {
          loading: true,
          error: null,
          success: false,
          data: [],
        };
      })
      .addCase(fetchRsmList.fulfilled, (state, action) => {
        state.rsmList = {
          loading: false,
          error: null,
          success: true,
          data: action.payload, // list of RSMs
        };
      })
      .addCase(fetchRsmList.rejected, (state, action) => {
        state.rsmList = {
          loading: false,
          error: action.payload,
          success: false,
          data: [],
        };
      })

      // Rm fetch list (for backward compatibility)
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
        })

      // Payouts
      .addCase(fetchPayouts.pending, (state) => {
        state.payouts.loading = true;
        state.payouts.error = null;
      })
      .addCase(fetchPayouts.fulfilled, (state, action) => {
        state.payouts.loading = false;
        state.payouts.data = action.payload;
        state.payouts.success = true;
      })
      .addCase(fetchPayouts.rejected, (state, action) => {
        state.payouts.loading = false;
        state.payouts.error = action.payload;
      })
      .addCase(approvePayout.fulfilled, (state) => {
        // Refresh payouts after approval
      })
      .addCase(createPayout.fulfilled, (state) => {
        // Refresh payouts after creation
      })

      // Disbursed Applications
      .addCase(fetchDisbursedApplications.pending, (state) => {
        state.disbursedApplications.loading = true;
        state.disbursedApplications.error = null;
      })
      .addCase(fetchDisbursedApplications.fulfilled, (state, action) => {
        state.disbursedApplications.loading = false;
        state.disbursedApplications.data = action.payload;
        state.disbursedApplications.success = true;
      })
      .addCase(fetchDisbursedApplications.rejected, (state, action) => {
        state.disbursedApplications.loading = false;
        state.disbursedApplications.error = action.payload;
      })

      // Incentives
      .addCase(fetchIncentives.pending, (state) => {
        state.incentives.loading = true;
        state.incentives.error = null;
      })
      .addCase(fetchIncentives.fulfilled, (state, action) => {
        state.incentives.loading = false;
        state.incentives.data = action.payload;
        state.incentives.success = true;
      })
      .addCase(fetchIncentives.rejected, (state, action) => {
        state.incentives.loading = false;
        state.incentives.error = action.payload;
      })
      .addCase(payIncentive.pending, (state) => {
        state.incentives.error = null;
      })
      .addCase(payIncentive.fulfilled, (state, _action) => {
        // UI will refetch incentives after payment is recorded
      })
      .addCase(payIncentive.rejected, (state, action) => {
        state.incentives.error = action.payload;
      })

      // Follow-ups
      .addCase(fetchRsmFollowUps.pending, (state) => {
        state.followUps.loading = true;
        state.followUps.error = null;
      })
      .addCase(fetchRsmFollowUps.fulfilled, (state, action) => {
        state.followUps.loading = false;
        state.followUps.data = action.payload;
        state.followUps.success = true;
      })
      .addCase(fetchRsmFollowUps.rejected, (state, action) => {
        state.followUps.loading = false;
        state.followUps.error = action.payload;
      })
      .addCase(recordRsmFollowUp.fulfilled, (state) => {
        // Refresh follow-ups after recording
      })

      // Pending Payout
      .addCase(fetchAsmCustomersPayOutPending.pending, (state) => {
        state.pendingPayout.loading = true;
        state.pendingPayout.error = null;
      })
      .addCase(fetchAsmCustomersPayOutPending.fulfilled, (state, action) => {
        state.pendingPayout.loading = false;
        state.pendingPayout.data = action.payload;
        state.pendingPayout.success = true;
      })
      .addCase(fetchAsmCustomersPayOutPending.rejected, (state, action) => {
        state.pendingPayout.loading = false;
        state.pendingPayout.error = action.payload;
      })

      // Done Payout
      .addCase(fetchAsmCustomersPayOutDone.pending, (state) => {
        state.donePayout.loading = true;
        state.donePayout.error = null;
      })
      .addCase(fetchAsmCustomersPayOutDone.fulfilled, (state, action) => {
        state.donePayout.loading = false;
        state.donePayout.data = action.payload;
        state.donePayout.success = true;
      })
      .addCase(fetchAsmCustomersPayOutDone.rejected, (state, action) => {
        state.donePayout.loading = false;
        state.donePayout.error = action.payload;
      })

      // Customer Partners Payout
      .addCase(fetchAsmCustomerPartnersPayout.pending, (state) => {
        state.customerPartnersPayout.loading = true;
        state.customerPartnersPayout.error = null;
      })
      .addCase(fetchAsmCustomerPartnersPayout.fulfilled, (state, action) => {
        state.customerPartnersPayout.loading = false;
        state.customerPartnersPayout.data = action.payload;
        state.customerPartnersPayout.success = true;
      })
      .addCase(fetchAsmCustomerPartnersPayout.rejected, (state, action) => {
        state.customerPartnersPayout.loading = false;
        state.customerPartnersPayout.error = action.payload;
      })

      // Set Payouts
      .addCase(setAsmPayouts.pending, (state) => {
        state.setPayouts.loading = true;
        state.setPayouts.error = null;
        state.setPayouts.success = false;
      })
      .addCase(setAsmPayouts.fulfilled, (state, action) => {
        state.setPayouts.loading = false;
        state.setPayouts.data = action.payload;
        state.setPayouts.success = true;
      })
      .addCase(setAsmPayouts.rejected, (state, action) => {
        state.setPayouts.loading = false;
        state.setPayouts.error = action.payload;
        state.setPayouts.success = false;
      })

      // Assign Partner Target (Single)
      .addCase(assignPartnerTarget.pending, (state) => {
        state.assignPartnerTarget = {
          loading: true,
          error: null,
          success: false,
        };
      })
      .addCase(assignPartnerTarget.fulfilled, (state, action) => {
        state.assignPartnerTarget = {
          loading: false,
          error: null,
          success: true,
          data: action.payload,
        };
      })
      .addCase(assignPartnerTarget.rejected, (state, action) => {
        state.assignPartnerTarget = {
          loading: false,
          error: action.payload,
          success: false,
        };
      })

      // Assign Partner Target (Bulk)
      .addCase(assignPartnerTargetBulk.pending, (state) => {
        state.assignPartnerTargetBulk = {
          loading: true,
          error: null,
          success: false,
        };
      })
      .addCase(assignPartnerTargetBulk.fulfilled, (state, action) => {
        state.assignPartnerTargetBulk = {
          loading: false,
          error: null,
          success: true,
          data: action.payload,
        };
      })
      .addCase(assignPartnerTargetBulk.rejected, (state, action) => {
        state.assignPartnerTargetBulk = {
          loading: false,
          error: action.payload,
          success: false,
        };
      })

      // Fetch Partner Targets
      .addCase(fetchPartnerTargets.pending, (state) => {
        state.partnerTargets.loading = true;
        state.partnerTargets.error = null;
        state.partnerTargets.success = false;
      })
      .addCase(fetchPartnerTargets.fulfilled, (state, action) => {
        state.partnerTargets.loading = false;
        state.partnerTargets.data = action.payload;
        state.partnerTargets.success = true;
      })
      .addCase(fetchPartnerTargets.rejected, (state, action) => {
        state.partnerTargets.loading = false;
        state.partnerTargets.error = action.payload;
        state.partnerTargets.success = false;
      })

      // Fetch RSM Analytics (ASM viewing RSM analytics)
      .addCase(fetchRsmAnalytics.pending, (state) => {
        state.rsmAnalytics.loading = true;
        state.rsmAnalytics.error = null;
      })
      .addCase(fetchRsmAnalytics.fulfilled, (state, action) => {
        state.rsmAnalytics.loading = false;
        state.rsmAnalytics.data = action.payload;
      })
      .addCase(fetchRsmAnalytics.rejected, (state, action) => {
        state.rsmAnalytics.loading = false;
        state.rsmAnalytics.error = action.payload;
      });
  },
});

export default asmSlice.reducer;
