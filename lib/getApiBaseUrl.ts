const getApiBaseUrl = (): string =>
  (process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.NEXT_PUBLIC_LOCAL_API_URL) ?? "";

export default getApiBaseUrl;

