import React, { useState, useRef } from "react";

const Banks = () => {

  const [bank, setBank] = useState({
    name: "",
    logo: null,
    loanType: "",
    loginId: "",
    password: "",
    link: ""
  });

  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setBank({
      ...bank,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Bank Data:", bank);

    // Later you will send this to backend API
    // axios.post("/api/banks", bank)

    alert("Bank added successfully");

    setBank({
      name: "",
      logo: "",
      loanType: "",
      loginId: "",
      password: "",
      link: ""
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        {/* <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Add Lending Partner
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Add bank or NBFC partner credentials for RSM access.
          </p>
        </div> */}

        {/* Form card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-md font-bold text-gray-800">
              Add Bank Details
            </h2>
          </div>

          <form
            onSubmit={handleSubmit}
            className="px-6 py-6 space-y-6"
          >
            {/* Bank name + loan type in two columns on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bank Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Bank Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={bank.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm  outline-none placeholder:text-gray-400"
                  placeholder="Enter bank or NBFC name"
                />
              </div>

              {/* Loan Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Loan Type
                </label>
                <select
                  name="loanType"
                  value={bank.loanType}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white  outline-none"
                >
                  <option value="">Select loan type</option>
                  <option value="Personal Loan">Personal Loan</option>
                  <option value="Business Loan">Business Loan</option>
                  <option value="Home Loan">Home Loan</option>
                </select>
              </div>
            </div>

            {/* Logo URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Bank Logo
              </label>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                name="logo"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setBank({
                      ...bank,
                      logo: file
                    });
                  }
                }}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-teal-500 file:text-white hover:file:bg-teal-600"
              />
              {/* Preview */}
              {/* {bank.preview && (
                <div className="mt-3 inline-flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                  <span className="text-xs text-gray-500">Preview</span>

                  <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                    <img
                      src={bank.preview}
                      alt="Logo preview"
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                </div>
              )} */}
            </div>
            {/* Credentials section title */}
            <div className="pt-2 border-t border-dashed border-gray-100">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Portal Credentials
              </p>
              <p className="mt-1 text-xs text-gray-500">
                These details will be shared with RSMs for partner portal access.
              </p>
            </div>

            {/* Login & password side by side on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Login ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Login ID
                </label>
                <input
                  type="text"
                  name="loginId"
                  value={bank.loginId}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-gray-400"
                  placeholder="Enter portal login ID"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Password
                </label>
                <input
                  type="text"
                  name="password"
                  value={bank.password}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-gray-400"
                  placeholder="Enter portal password"
                />
              </div>
            </div>

            {/* Portal link */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Portal Link
              </label>
              <input
                type="text"
                name="link"
                value={bank.link}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-gray-400"
                placeholder="https://bankportal.com"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setBank({
                    name: "",
                    logo: null,
                    loanType: "",
                    loginId: "",
                    password: "",
                    link: "",
                  });
                
                  // ✅ THIS IS THE KEY FIX
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition"
              >
                Clear
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 text-sm font-semibold rounded-xl text-white bg-teal-500 hover:bg-teal-600 shadow-sm transition"
              >
                Add Bank
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Banks;