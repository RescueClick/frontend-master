import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Building2, RefreshCw, Search, X, Filter, RotateCcw } from "lucide-react";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";
import { INDIAN_STATES } from "../../../utils/indianStates";
import BankRmResultsTable from "../../../components/shared/BankRmResultsTable";

const EMPTY_FILTERS = {
  bank: "",
  product: "",
  marketType: "",
  state: "",
  city: "",
};

const FindBankRm = () => {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [options, setOptions] = useState({
    banks: [],
    products: [],
    marketTypes: [],
    states: [],
    cities: [],
  });
  const [allRows, setAllRows] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [copiedLoginCodeId, setCopiedLoginCodeId] = useState(null);

  const getAuthHeaders = useCallback(() => {
    const auth = getAuthData() || {};
    const token = auth.asmToken || auth.rsmToken || auth.adminToken || auth.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Fetch all active bank RMs
  const fetchRows = useCallback(async () => {
    try {
      setLoadingResults(true);
      const res = await axios.get(`${backendurl}/rsm/bank-rms`, {
        headers: getAuthHeaders(),
      });
      const data = Array.isArray(res.data?.bankRms) ? res.data.bankRms : [];
      setAllRows(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load Bank RMs");
      setAllRows([]);
    } finally {
      setLoadingResults(false);
    }
  }, [getAuthHeaders]);

  // Fetch cascading filter options
  const fetchOptions = useCallback(
    async (nextFilters = filters) => {
      try {
        setLoadingOptions(true);
        const params = {};
        if (nextFilters.bank) params.bank = nextFilters.bank;
        if (nextFilters.product) params.product = nextFilters.product;
        if (nextFilters.marketType) params.marketType = nextFilters.marketType;
        if (nextFilters.state) params.state = nextFilters.state;

        const res = await axios.get(`${backendurl}/rsm/bank-rms/filter-options`, {
          headers: getAuthHeaders(),
          params,
        });

        setOptions({
          banks: res.data?.banks || [],
          products: res.data?.products || [],
          marketTypes: res.data?.marketTypes || [],
          states: res.data?.states || [],
          cities: res.data?.cities || [],
        });
      } catch (err) {
        // silent fallback
      } finally {
        setLoadingOptions(false);
      }
    },
    [filters, getAuthHeaders]
  );

  // Initial load
  useEffect(() => {
    fetchOptions(EMPTY_FILTERS);
    fetchRows();
  }, [fetchOptions, fetchRows]);

  // Handle dropdown changes
  const handleFilterChange = async (field, value) => {
    let next = { ...filters, [field]: value };

    if (field === "bank") {
      next = { ...EMPTY_FILTERS, bank: value };
    } else if (field === "product") {
      next = {
        ...EMPTY_FILTERS,
        bank: filters.bank,
        product: value,
      };
    } else if (field === "marketType") {
      next = {
        ...EMPTY_FILTERS,
        bank: filters.bank,
        product: filters.product,
        marketType: value,
      };
    } else if (field === "state") {
      const isPan = value === "PAN India" || value === "Open India";
      next = {
        ...filters,
        state: value,
        city: isPan ? "All Cities" : "",
      };
    }

    setFilters(next);
    await fetchOptions(next);
  };

  // Reset all filters & search query
  const handleResetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSearchQuery("");
    fetchOptions(EMPTY_FILTERS);
  };

  // 1-click copy login code
  const handleCopyLoginCode = async (code, id) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedLoginCodeId(id);
      toast.success("Login code copied");
      setTimeout(() => {
        setCopiedLoginCodeId((prev) => (prev === id ? null : prev));
      }, 2000);
    } catch {
      toast.error("Failed to copy login code");
    }
  };

  // Client-side filtering across both dropdown filters and search query
  const filteredRows = useMemo(() => {
    let list = (allRows || []).filter((r) => r?.isActive !== false);

    // Apply dropdown filters
    if (filters.bank) {
      const b = filters.bank.trim().toLowerCase();
      list = list.filter(
        (r) => String(r.bankNbfcName || "").trim().toLowerCase() === b
      );
    }
    if (filters.product) {
      const p = filters.product.trim().toLowerCase();
      list = list.filter(
        (r) => String(r.product || "").trim().toLowerCase() === p
      );
    }
    if (filters.marketType) {
      const m = filters.marketType.trim().toLowerCase();
      list = list.filter(
        (r) => String(r.marketType || "").trim().toLowerCase() === m
      );
    }
    if (filters.state) {
      const s = filters.state.trim().toLowerCase();
      const isPan = s === "pan india" || s === "open india";
      if (isPan) {
        list = list.filter(
          (r) =>
            r.isPanIndia || /pan\s*india|open\s*india/i.test(r.state || "")
        );
      } else {
        list = list.filter(
          (r) =>
            r.isPanIndia ||
            /pan\s*india|open\s*india/i.test(r.state || "") ||
            String(r.state || "").trim().toLowerCase() === s
        );
      }
    }
    if (filters.city && filters.city.toLowerCase() !== "all cities") {
      const c = filters.city.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.isPanIndia ||
          /all\s*cities/i.test(r.city || "") ||
          String(r.city || "").trim().toLowerCase() === c
      );
    }

    // Apply instant search query across all relevant fields
    const q = String(searchQuery || "").trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const hay = [
          r.bankNbfcName,
          r.loginCode,
          r.product,
          r.marketType,
          r.city,
          r.state,
          r.company,
          r.rmName,
          r.rmPhone,
          r.rmEmail,
          r.rm?.name,
          r.rm?.phone,
          r.rm?.email,
          r.rm?.product,
          r.asm?.name,
          r.asm?.phone,
          r.asm?.email,
          r.asm?.product,
          r.rsm?.name,
          r.rsm?.phone,
          r.rsm?.email,
          r.rsm?.product,
        ]
          .map((v) => String(v || "").toLowerCase())
          .join(" ");
        return hay.includes(q);
      });
    }

    return list;
  }, [allRows, filters, searchQuery]);

  const hasActiveFilters = Boolean(
    filters.bank ||
    filters.product ||
    filters.marketType ||
    filters.state ||
    filters.city ||
    searchQuery.trim()
  );

  const selectClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors";

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Header Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-slate-900">Find Bank RM</h1>
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                  {allRows.length} Active Bank RMs
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                Search active bank RM directory records by bank name, product, location, or contact
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                fetchRows();
                fetchOptions(filters);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <RefreshCw className={`h-4 w-4 ${loadingResults || loadingOptions ? "animate-spin" : ""}`} />
              Refresh
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 shadow-xs transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Panel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          {/* Instant Search Bar */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Quick Bank & RM Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by bank name, product, login code, RM / ASM contact name, phone, city..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-100 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Filter className="h-3.5 w-3.5 text-rose-500" />
                <span>Filter by Specifications</span>
              </div>
              {hasActiveFilters && (
                <span className="text-xs text-rose-600 font-medium">
                  Showing {filteredRows.length} of {allRows.length}
                </span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <label className="space-y-1 text-xs">
                <span className="font-medium text-slate-600">Bank Name</span>
                <select
                  value={filters.bank}
                  onChange={(e) => handleFilterChange("bank", e.target.value)}
                  className={selectClass}
                >
                  <option value="">All Banks</option>
                  {options.banks.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-xs">
                <span className="font-medium text-slate-600">Product</span>
                <select
                  value={filters.product}
                  onChange={(e) => handleFilterChange("product", e.target.value)}
                  className={selectClass}
                  disabled={!filters.bank && options.products.length === 0}
                >
                  <option value="">All Products</option>
                  {options.products.map((product) => (
                    <option key={product} value={product}>
                      {product}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-xs">
                <span className="font-medium text-slate-600">Market Type</span>
                <select
                  value={filters.marketType}
                  onChange={(e) => handleFilterChange("marketType", e.target.value)}
                  className={selectClass}
                  disabled={!filters.product && options.marketTypes.length === 0}
                >
                  <option value="">All Market Types</option>
                  {options.marketTypes.map((marketType) => (
                    <option key={marketType} value={marketType}>
                      {marketType}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-xs">
                <span className="font-medium text-slate-600">State</span>
                <select
                  value={filters.state}
                  onChange={(e) => handleFilterChange("state", e.target.value)}
                  className={selectClass}
                >
                  <option value="">All States</option>
                  {(options.states && options.states.length > 1 ? options.states : INDIAN_STATES).map((state) => (
                    <option key={state} value={state}>
                      {state === "PAN India" ? "🌍 PAN India (Nationwide)" : state}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-xs">
                <span className="font-medium text-slate-600">City</span>
                <select
                  value={filters.city}
                  onChange={(e) => handleFilterChange("city", e.target.value)}
                  className={selectClass}
                  disabled={!filters.state && options.cities.length === 0}
                >
                  <option value="">All Cities</option>
                  {(options.cities && options.cities.length > 0 ? options.cities : ["All Cities"]).map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Results Directory Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-rose-500" />
              <h3 className="text-sm font-semibold text-slate-800">
                Bank RM Directory
              </h3>
              <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-xs font-semibold text-slate-700">
                {filteredRows.length} {filteredRows.length === 1 ? "record" : "records"}
              </span>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
          <BankRmResultsTable
            rows={filteredRows}
            loading={loadingResults}
            emptyMessage={
              hasActiveFilters
                ? "No matching Bank RM records found. Try modifying your search or clearing filters."
                : "No Bank RM directory records available."
            }
            copiedLoginCodeId={copiedLoginCodeId}
            onCopyLoginCode={handleCopyLoginCode}
          />
        </div>
      </div>
    </div>
  );
};

export default FindBankRm;
