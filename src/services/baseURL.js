// =============================================================================
// API Base URL Configuration
// =============================================================================
//
// The app talks to ONE of two backends, chosen entirely by .env:
//
//   Production (default)  REACT_APP_API_URL=https://core.meghalisilk.in/api/v1
//                         REACT_APP_USE_MOCK_API=false
//                         → the Laravel API + MySQL database on Cloudways.
//
//   Local mock            REACT_APP_API_URL=http://localhost:3001
//                         REACT_APP_USE_MOCK_API=true
//                         → JSON Server over db.json (npm run dev).
//
// Restart the dev server after changing .env. No code changes are needed to
// switch; every service method in api.js branches on IS_MOCK_API below.
// `npm run test:live` drives api.js against the production API end to end.
// =============================================================================

// Development / Mock API URL (JSON Server)
export const MOCK_API_URL = "http://localhost:3001";

// Determine which URL to use
const getBaseURL = () => {
  if (process.env.REACT_APP_USE_MOCK_API === "true") {
    return MOCK_API_URL;
  }
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (process.env.NODE_ENV === "development") {
    return MOCK_API_URL;
  }
  return process.env.REACT_APP_API_URL || MOCK_API_URL;
};

const BASE_URL = getBaseURL();

// Flag to detect mock API (JSON Server) mode
export const IS_MOCK_API =
  BASE_URL === MOCK_API_URL ||
  process.env.REACT_APP_USE_MOCK_API === "true";

export const API_VERSION = "v1";

if (process.env.NODE_ENV === "development") {
  console.log(`[API] Mode: ${IS_MOCK_API ? "JSON Server (Mock)" : "Production API"}`);
  console.log(`[API] Base URL: ${BASE_URL}`);
}

export default BASE_URL;
