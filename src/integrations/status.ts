export type IntegrationConnection = {
  id: "google-drive" | "meta" | "affiliate-networks" | "muse-web-studio" | "novita" | "live-research" | "permanent-storage";
  name: string;
  status: "not_connected" | "manual";
  detail: string;
};

export function integrationStatus(): IntegrationConnection[] {
  return [
    {
      id: "google-drive",
      name: "Google Drive",
      status: "not_connected",
      detail:
        "Named as the initial 5 TB library. OAuth is not connected. This build does not upload, move, or delete library files.",
    },
    {
      id: "meta",
      name: "Meta publishing and insights",
      status: "not_connected",
      detail:
        "There is no Page token and no publishing permission. Schedule posts manually in Meta Business Suite. This app does not claim automated Facebook scheduling. Performance is entered by hand at 24 hours, 72 hours and 7 days. Organic and paid reach stay separate.",
    },
    {
      id: "muse-web-studio",
      name: "Muse AI — Web Studio",
      status: "manual",
      detail:
        "Manual website only. Packages are prepared from the plan brief in Content Studio. Finished files are uploaded by hand. No Muse credentials are stored, no API is called, and every capability stays untested until the account confirms it.",
    },
    {
      id: "novita",
      name: "Novita AI",
      status: "not_connected",
      detail:
        "Preserved OpenAI-compatible adapter. It runs only when LANGUAGE_PROVIDER is novita and both NOVITA_API_KEY and NOVITA_MODEL are set. A missing FreeLLMAPI key does not select it. Keys stay on the server.",
    },
    {
      id: "live-research",
      name: "Live research",
      status: "not_connected",
      detail: "Live research is unavailable. No authorised search API is configured. A language model is not treated as a web search.",
    },
    {
      id: "permanent-storage",
      name: "Permanent media storage",
      status: "not_connected",
      detail:
        "The initial library is the named 5 TB Google Drive. The connector is not built. Uploads stay on the application host. A later object store keeps the same library records. No automatic deletion is active.",
    },
    {
      id: "affiliate-networks",
      name: "Affiliate networks and postbacks",
      status: "not_connected",
      detail:
        "No network credentials, click IDs or postback secrets are configured. No commission figures are shown because none have been approved.",
    },
  ];
}

export const PLANNED_DRIVE_FOLDERS = [
  "Brief",
  "Scripts",
  "Images",
  "Audio",
  "Working-Videos",
  "Final-Videos",
  "Thumbnails",
  "Captions",
] as const;
