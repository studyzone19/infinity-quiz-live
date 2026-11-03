/**
 * Centralized API & Socket Configuration
 * Reads from VITE_API_URL environment variable if deployed on Vercel/Netlify/Cloud,
 * or dynamically detects local backend server (port 5000) during local development.
 */

const getApiBase = () => {
  if (import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, "");
  }

  if (typeof window !== "undefined" && window.location) {
    const { protocol, hostname } = window.location;
    if (!hostname || protocol === "file:") {
      return "http://localhost:5000";
    }
    return `${protocol}//${hostname}:5000`;
  }

  return "http://localhost:5000";
};

export const API_BASE = getApiBase();
export default API_BASE;
