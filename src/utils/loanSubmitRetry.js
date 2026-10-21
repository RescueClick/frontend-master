import axios from "axios";

const RETRY_DELAYS_MS = [3000, 8000];

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new axios.Cancel("Request was cancelled"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new axios.Cancel("Request was cancelled"));
      },
      { once: true }
    );
  });
}

/**
 * POST a loan form, retrying only when the server cannot have saved it:
 * nginx could not reach the backend (502/503, e.g. during a restart), or the
 * connection dropped before the request body finished uploading.
 */
export async function postLoanFormWithRetry(url, data, config = {}) {
  for (let attempt = 0; ; attempt += 1) {
    let uploadComplete = false;
    try {
      return await axios.post(url, data, {
        ...config,
        onUploadProgress: (event) => {
          if (event.total && event.loaded >= event.total) uploadComplete = true;
          config.onUploadProgress?.(event);
        },
      });
    } catch (err) {
      const status = err?.response?.status;
      const retryable =
        !axios.isCancel(err) &&
        (status === 502 ||
          status === 503 ||
          (!err?.response && err?.code !== "ECONNABORTED" && !uploadComplete));
      if (!retryable || attempt >= RETRY_DELAYS_MS.length) throw err;
      console.warn(`Loan form request failed, retrying (${attempt + 1}/${RETRY_DELAYS_MS.length})`, err?.message);
      await wait(RETRY_DELAYS_MS[attempt], config.signal);
    }
  }
}
