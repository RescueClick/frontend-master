import { createSlice } from "@reduxjs/toolkit";
import {
  fetchRsmDashboard,
  fetchRsmRms,
  fetchRsmApplications,
  transitionRsmApplication,
  createRmByRsm,
  fetchRsmProfile,
  fetchRsmPartnerTargets,
  fetchRmAnalytics,
  fetchRmFollowUps,
  recordRmFollowUp,
} from "../thunks/rsmThunks";

const initialState = {
  // Profile state
  profile: {
    loading: false,
    error: null,
    data: null,
  },
  // Dashboard state
  dashboard: {
    loading: false,
    error: null,
    success: false,
    data: null, // will store { totals, targets, topPerformers, rsmType }
  },
  // RMs list state
  rms: {
    loading: false,
    error: null,
    success: false,
    data: [],
  },
  // Applications list state
  applications: {
    loading: false,
    error: null,
    success: false,
    data: [],
  },
  // Transition application state
  transitionApplication: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  // Create RM state
  createRm: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  // Partner Targets state
  partnerTargets: {
    loading: false,
    error: null,
    success: false,
    data: [],
  },
  // RM Analytics state (RSM viewing RM analytics)
  rmAnalytics: {
    loading: false,
    error: null,
    data: null,
  },
  // RM Follow-ups (RSM taking follow-ups of RMs)
  rmFollowUps: {
    loading: false,
    error: null,
    success: false,
    data: [],
  },
};

const rsmSlice = createSlice({
  name: "rsm",
  initialState,
  reducers: {
    clearRsmState: (state) => {
      return initialState;
    },
    clearTransitionError: (state) => {
      state.transitionApplication.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Profile
    builder
      .addCase(fetchRsmProfile.pending, (state) => {
        state.profile.loading = true;
        state.profile.error = null;
      })
      .addCase(fetchRsmProfile.fulfilled, (state, action) => {
        state.profile.loading = false;
        state.profile.data = action.payload;
      })
      .addCase(fetchRsmProfile.rejected, (state, action) => {
        state.profile.loading = false;
        state.profile.error = action.payload;
      });

    // Fetch Dashboard
    builder
      .addCase(fetchRsmDashboard.pending, (state) => {
        state.dashboard.loading = true;
        state.dashboard.error = null;
      })
      .addCase(fetchRsmDashboard.fulfilled, (state, action) => {
        state.dashboard.loading = false;
        state.dashboard.data = action.payload;
        state.dashboard.success = true;
      })
      .addCase(fetchRsmDashboard.rejected, (state, action) => {
        state.dashboard.loading = false;
        state.dashboard.error = action.payload;
      });

    // Fetch RMs
    builder
      .addCase(fetchRsmRms.pending, (state) => {
        state.rms.loading = true;
        state.rms.error = null;
      })
      .addCase(fetchRsmRms.fulfilled, (state, action) => {
        state.rms.loading = false;
        state.rms.data = action.payload;
        state.rms.success = true;
      })
      .addCase(fetchRsmRms.rejected, (state, action) => {
        state.rms.loading = false;
        state.rms.error = action.payload;
      });

    // Fetch Applications
    builder
      .addCase(fetchRsmApplications.pending, (state) => {
        state.applications.loading = true;
        state.applications.error = null;
      })
      .addCase(fetchRsmApplications.fulfilled, (state, action) => {
        state.applications.loading = false;
        state.applications.data = action.payload;
        state.applications.success = true;
      })
      .addCase(fetchRsmApplications.rejected, (state, action) => {
        state.applications.loading = false;
        state.applications.error = action.payload;
      });

    // Transition Application
    builder
      .addCase(transitionRsmApplication.pending, (state) => {
        state.transitionApplication.loading = true;
        state.transitionApplication.error = null;
      })
      .addCase(transitionRsmApplication.fulfilled, (state, action) => {
        state.transitionApplication.loading = false;
        state.transitionApplication.data = action.payload;
        state.transitionApplication.success = true;
      })
      .addCase(transitionRsmApplication.rejected, (state, action) => {
        state.transitionApplication.loading = false;
        state.transitionApplication.error = action.payload;
      });

    // Create RM
    builder
      .addCase(createRmByRsm.pending, (state) => {
        state.createRm.loading = true;
        state.createRm.error = null;
      })
      .addCase(createRmByRsm.fulfilled, (state, action) => {
        state.createRm.loading = false;
        state.createRm.data = action.payload;
        state.createRm.success = true;
      })
      .addCase(createRmByRsm.rejected, (state, action) => {
        state.createRm.loading = false;
        state.createRm.error = action.payload;
      })

      // Fetch Partner Targets
      .addCase(fetchRsmPartnerTargets.pending, (state) => {
        state.partnerTargets.loading = true;
        state.partnerTargets.error = null;
        state.partnerTargets.success = false;
      })
      .addCase(fetchRsmPartnerTargets.fulfilled, (state, action) => {
        state.partnerTargets.loading = false;
        state.partnerTargets.data = action.payload;
        state.partnerTargets.success = true;
      })
      .addCase(fetchRsmPartnerTargets.rejected, (state, action) => {
        state.partnerTargets.loading = false;
        state.partnerTargets.error = action.payload;
        state.partnerTargets.success = false;
      })
      // Fetch RM Analytics (RSM viewing RM analytics)
      .addCase(fetchRmAnalytics.pending, (state) => {
        state.rmAnalytics.loading = true;
        state.rmAnalytics.error = null;
      })
      .addCase(fetchRmAnalytics.fulfilled, (state, action) => {
        state.rmAnalytics.loading = false;
        state.rmAnalytics.data = action.payload;
      })
      .addCase(fetchRmAnalytics.rejected, (state, action) => {
        state.rmAnalytics.loading = false;
        state.rmAnalytics.error = action.payload;
      })
      // RM Follow-ups (RSM role)
      .addCase(fetchRmFollowUps.pending, (state) => {
        state.rmFollowUps.loading = true;
        state.rmFollowUps.error = null;
        state.rmFollowUps.success = false;
      })
      .addCase(fetchRmFollowUps.fulfilled, (state, action) => {
        state.rmFollowUps.loading = false;
        state.rmFollowUps.data = action.payload;
        state.rmFollowUps.success = true;
      })
      .addCase(fetchRmFollowUps.rejected, (state, action) => {
        state.rmFollowUps.loading = false;
        state.rmFollowUps.error = action.payload;
        state.rmFollowUps.success = false;
      })
      .addCase(recordRmFollowUp.fulfilled, (state) => {
        // no-op: UI will refetch follow-ups after successful record
      });
  },
});

export const { clearRsmState, clearTransitionError } = rsmSlice.actions;
export default rsmSlice.reducer;

