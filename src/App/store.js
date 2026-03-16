import { configureStore } from "@reduxjs/toolkit";
import adminReducer from "../feature/slices/adminSlice"
import asmSlice from "../feature/slices/asmSlice"
import rsmSlice from "../feature/slices/rsmSlice"
import rmSlice from "../feature/slices/rmSlice";
import partnerSlice from "../feature/slices/partnerSlice"


export const store = configureStore({
  reducer: {
    admin:adminReducer,
    asm:asmSlice,
    rsm:rsmSlice,
    rm:rmSlice,
    partner:partnerSlice
  },
});
