import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Building2, RefreshCw, Search } from "lucide-react";
import { backendurl } from "../../../feature/urldata";
import { getAuthData } from "../../../utils/localStorage";
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
  const [options, setOptions] = useState({
    banks: [],
    products: [],
    marketTypes: [],
    states: [],
    cities: [],
  });
  const [rows, setRows] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedLoginCodeId, setCopiedLoginCodeId] = useState(null);

  const getAuthHeaders = useCallback(() => {
    const auth = getAuthData() || {};
    const token = auth.rsmToken || auth.asmToken || auth.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

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
        toast.error(err?.response?.data?.message || "Failed to load filter options");
      } finally {
        setLoadingOptions(false);
      }
    },
    [filters, getAuthHeaders]
  );

  useEffect(() => {
    fetchOptions(EMPTY_FILTERS);
    // initial load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setHasSearched(false);
    setRows([]);
    await fetchOptions(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isPan = filters.state === "PAN India" || filters.state === "Open India";
    const effectiveCity = isPan && !filters.city ? "All Cities" : filters.city;

    if (!filters.bank || !filters.product || !filters.marketType || !filters.state || !effectiveCity) {
      toast.error("Please select Bank, Product, Market Type, State and City");
      return;
    }

    try {
      setLoadingResults(true);
      setHasSearched(true);
      const res = await axios.get(`${backendurl}/rsm/bank-rms`, {
        headers: getAuthHeaders(),
        params: {
          bank: filters.bank,
          product: filters.product,
          marketType: filters.marketType,
          state: filters.state,
          city: effectiveCity,
        },
      });
      setRows(Array.isArray(res.data?.bankRms) ? res.data.bankRms : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to search Bank RMs");
      setRows([]);
    } finally {
      setLoadingResults(false);
    }
  };

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

  const selectClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100";

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Find Bank Rm</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Search active bank RM directory records by location and product
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchOptions(filters)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loadingOptions ? "animate-spin" : ""}`} />
            Refresh Filters
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center gap-2 text-slate-800">
            <Building2 className="h-4 w-4 text-rose-500" />
            <h2 className="text-base font-semibold">Find Bank Rm</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-slate-600">Please Select Bank</span>
              <select
                value={filters.bank}
                onChange={(e) => handleFilterChange("bank", e.target.value)}
                className={selectClass}
              >
                <option value="">Please Select Bank</option>
                {options.banks.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-slate-600">Please Select Product</span>
              <select
                value={filters.product}
                onChange={(e) => handleFilterChange("product", e.target.value)}
                className={selectClass}
                disabled={!filters.bank}
              >
                <option value="">Please Select Product</option>
                {options.products.map((product) => (
                  <option key={product} value={product}>
                    {product}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-slate-600">Please Select Market Type</span>
              <select
                value={filters.marketType}
                onChange={(e) => handleFilterChange("marketType", e.target.value)}
                className={selectClass}
                disabled={!filters.product}
              >
                <option value="">Please Select Market Type</option>
                {options.marketTypes.map((marketType) => (
                  <option key={marketType} value={marketType}>
                    {marketType}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-slate-600">Please Select State</span>
              <select
                value={filters.state}
                onChange={(e) => handleFilterChange("state", e.target.value)}
                className={selectClass}
                disabled={!filters.marketType}
              >
                <option value="">Please Select State</option>
                {options.states.map((state) => (
                  <option key={state} value={state}>
                    {state === "PAN India" ? "🌍 PAN India (Nationwide)" : state}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-slate-600">Please Select City</span>
              <select
                value={filters.city}
                onChange={(e) => handleFilterChange("city", e.target.value)}
                className={selectClass}
                disabled={!filters.state}
              >
                <option value="">Please Select City</option>
                {options.cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5">
            <button
              type="submit"
              disabled={loadingResults}
              className="rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {loadingResults ? "Searching..." : "Submit"}
            </button>
          </div>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-900">Banks Details</h3>
          </div>
          <BankRmResultsTable
            rows={rows}
            loading={loadingResults}
            emptyMessage={
              !hasSearched
                ? "Select filters and click Submit to view Bank RM details"
                : "No matching Bank RM records found"
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
