export function getErrorMessage(error, fallback = "Something went wrong.") {
  const data = error.response?.data;

  if (data?.validationErrors) {
    return Object.entries(data.validationErrors)
      .map(([field, message]) => `${field}: ${message}`)
      .join(" | ");
  }

  return data?.message || fallback;
}