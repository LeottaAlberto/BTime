export const environment = {
  production: true,
  get apiUrl(): string {
    const host =
      typeof window !== "undefined" && window.location.hostname
        ? window.location.hostname
        : "100.116.254.48";
    return `http://${host}:5008/api`;
  },
};
