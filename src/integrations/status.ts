export type IntegrationConnection = {
  id: "google-drive" | "meta" | "affiliate-networks";
  name: string;
  status: "not_connected";
  detail: string;
};

export function integrationStatus(): IntegrationConnection[] {
  return [
    {
      id: "google-drive",
      name: "Google Drive",
      status: "not_connected",
      detail:
        "OAuth is not connected. The database will store Drive folder and file IDs after authentication. Staff will not use Shahzeb's Google password. No file IDs are stored yet.",
    },
    {
      id: "meta",
      name: "Meta publishing and insights",
      status: "not_connected",
      detail:
        "There is no Page token and no publishing permission. Posts are published manually. Performance is entered by hand at 24 hours, 72 hours and 7 days. Organic and paid reach stay separate.",
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
