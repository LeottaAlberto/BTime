import { ClientDeviceInfo } from "../../interfaces/deviceInfo/ClientDeviceInfo.interface";

function parseUserAgent(ua: string) {
  let browserName = "Unknown Browser";
  let browserVersion = "";
  let osName = "Unknown OS";
  let deviceType: "Mobile" | "Tablet" | "Desktop" = "Desktop";

  // Rilevamento Device Type
  if (/mobi|android|iphone|ipod/i.test(ua))
    deviceType = "Mobile";
  else if (/ipad|tablet/i.test(ua))
    deviceType = "Tablet";

  // Rilevamento OS
  if (/windows/i.test(ua)) osName = "Windows";
  else if (/macintosh|mac os/i.test(ua)) osName = "macOS";
  else if (/iphone|ipad|ipod/i.test(ua)) osName = "iOS";
  else if (/android/i.test(ua)) osName = "Android";
  else if (/linux/i.test(ua)) osName = "Linux";

  // Rilevamento Browser e Versione (ordine importante)
  if (/firefox|fxios/i.test(ua)) {
    browserName = "Firefox";
    const match = ua.match(/(?:firefox|fxios)\/([\d.]+)/i);
    if (match) browserVersion = match[1];
  } else if (/edg/i.test(ua)) {
    browserName = "Microsoft Edge";
    const match = ua.match(/edg\/([\d.]+)/i);
    if (match) browserVersion = match[1];
  } else if (/chrome|crios/i.test(ua)) {
    browserName = "Chrome";
    const match = ua.match(/(?:chrome|crios)\/([\d.]+)/i);
    if (match) browserVersion = match[1];
  } else if (/safari/i.test(ua)) {
    browserName = "Safari";
    const match = ua.match(/version\/([\d.]+)/i);
    if (match) browserVersion = match[1];
  }

  return { browserName, browserVersion, osName, deviceType };
}

/**
 * Recupera l'IP pubblico tramite un servizio gratuito via fetch nativa
 */
async function fetchPublicIP(): Promise<string | null> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    if (!response.ok) return null;
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn("Impossibile recuperare l'IP:", error);
    return null;
  }
}

/**
 * Funzione principale per raccogliere tutte le informazioni
 */
export async function getClientDeviceInfo(): Promise<ClientDeviceInfo> {
  // Eseguiamo la chiamata IP in parallelo al recupero dei dati locali
  const ipPromise = fetchPublicIP();

  const ua = navigator.userAgent;
  const { browserName, browserVersion, osName, deviceType } = parseUserAgent(ua);
  const ip = await ipPromise;

  return {
    ip,
    browser: {
      name: browserName,
      version: browserVersion,
    },
    os: {
      name: osName,
    },
    deviceType,
    screen: {
      width: window.screen.width,
      height: window.screen.height,
    },
    language: navigator.language,
  };
}
