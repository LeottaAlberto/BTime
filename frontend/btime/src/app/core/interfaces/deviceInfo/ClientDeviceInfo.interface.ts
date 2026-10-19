export interface ClientDeviceInfo {
  ip: string | null;
  browser: {
    name: string;
    version: string;
  };
  os: {
    name: string;
  };
  deviceType: "Mobile" | "Tablet" | "Desktop";
  screen: {
    width: number;
    height: number;
  };
  language: string;
}
