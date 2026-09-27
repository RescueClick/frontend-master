import axios from "axios";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";

export function tokenForMode(mode) {
  const a = getAuthData();
  if (mode === "ADMIN") return a.adminToken;
  if (mode === "RSM") return a.rsmToken || a.adminToken;
  if (mode === "ASM") return a.asmToken || a.adminToken;
  return a.rmToken || a.asmToken || a.rsmToken || a.adminToken;
}

const client = (mode) =>
  axios.create({
    baseURL: `${backendurl}/targets`,
    headers: { Authorization: `Bearer ${tokenForMode(mode)}` },
  });

export const errorMessage = (err, fallback) => err?.response?.data?.message || fallback;

export const fetchMyTargets = (mode, { month, year }) =>
  client(mode).get("/me", { params: { month, year } }).then((r) => r.data);

export const fetchMemberTargets = (mode, { role, id, month, year }) =>
  client(mode).get(`/view/${role}/${id}`, { params: { month, year } }).then((r) => r.data);

export const saveTargetAllocations = (mode, body) => client(mode).put("/allocations", body).then((r) => r.data);

export const copyPreviousTargets = (mode, body) => client(mode).post("/copy-previous", body).then((r) => r.data);

export const lockTargetMonth = (mode, body) => client(mode).post("/lock", body).then((r) => r.data);

export const fetchTargetTrend = (mode, { year, role, userId }) =>
  client(mode).get("/trend", { params: { year, role, userId } }).then((r) => r.data);
