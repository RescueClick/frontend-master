import toast from "react-hot-toast";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export async function runActivationRequest({
  request,
  pendingMessage = "Activating user...",
  successMessage = "User activated successfully.",
  errorMessage = "Activation failed",
  position = "top-right",
}) {
  const toastId = toast.loading(pendingMessage, { position });
  try {
    const response = await request();
    toast.success(response?.data?.message || successMessage, {
      id: toastId,
      position,
    });
    return response;
  } catch (error) {
    toast.error(getErrorMessage(error, errorMessage), { id: toastId, position });
    throw error;
  }
}

export async function runDeactivationRequest({
  request,
  pendingMessage = "Deactivation in progress...",
  progressMessage = "Reassigning active data before deactivation...",
  successMessage = "User deactivated successfully.",
  errorMessage = "Deactivation failed",
  progressDelayMs = 850,
  position = "top-right",
}) {
  const toastId = toast.loading(`${pendingMessage} ${progressMessage}`, {
    position,
  });
  try {
    if (progressDelayMs > 0) {
      await sleep(progressDelayMs);
    }
    const response = await request();
    toast.success(response?.data?.message || successMessage, {
      id: toastId,
      position,
    });
    return response;
  } catch (error) {
    toast.error(getErrorMessage(error, errorMessage), { id: toastId, position });
    throw error;
  }
}
