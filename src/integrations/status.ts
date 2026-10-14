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
        "Not the confirmed 5 TB store. OAuth is not connected, and this build does not assume the permanent library is Google Drive.",
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
        "Primary language-model provider. The server reads NOVITA_API_KEY and NOVITA_MODEL. Neither is configured, so no model is called and no story is invented.",
    },
    {
      id: "live-research",
      name: "Live research",
      status: "not_connected",
      detail: "Live research is unavailable. No authorised search API is configured. Novita is not treated as a web search.",
    },
    {
      id: "permanent-storage",
      name: "Permanent media storage",
      status: "not_connected",
      detail:
        "The 5 TB destination is not confirmed. Uploads stay on the application host. Nothing is copied to Drive, S3, or a disk that has not been named.",
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
