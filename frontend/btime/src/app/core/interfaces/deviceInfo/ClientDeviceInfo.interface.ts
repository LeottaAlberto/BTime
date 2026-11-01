export interface ClientDeviceInfo {
  ip: string | null;
  browser: {
    name: string;
    version: string;
  };
  os: {
    name: string;
  };
  deviceType: "Mobile" | "Tablet" | "Desktop" | "TV";
  isTv: boolean;
  isTvAppBTime: boolean;
  screen: {
    width: number;
    height: number;
  };
  language: string;
}
