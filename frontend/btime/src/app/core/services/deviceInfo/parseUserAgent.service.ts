import type { ClientDeviceInfo } from "../../interfaces/deviceInfo/ClientDeviceInfo.interface";

const TV_UA_REGEX =
  /\b(smart-?tv|googletv|android\s*tv|aft[a-z0-9]*|fire\s*tv|tizen|web0s|webos|bravia|viera|vidaa|hbbtv|leanback|mibox|crkey|roku|appletv|netcast|hisense|philipstv|toshibatv|tvappbtime)\b|\btv\b/i;

/**
 * Rileva se il client si sta collegando tramite l'applicazione dedicata TvAppBTime.
 * Funziona sia con lo User-Agent standard di TvAppBTime sia quando in TvAppBTime
 * è attiva la modalità Desktop (rilevando gli elementi/hook iniettati da WebViewController).
 */
export function isTvAppBTimeClient(ua?: string): boolean {
  const userAgent = ua ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");

  if (/\btvappbtime\b/i.test(userAgent)) {
    return true;
  }

  if (typeof document !== "undefined" && document.getElementById("__tvFsStyle") !== null) {
    return true;
  }

  if (typeof window !== "undefined") {
    const win = window as unknown as Record<string, unknown>;
    if (typeof win["__tvUpdateViewport"] === "function" || Boolean(win["__tvDesktopObs"])) {
      return true;
    }
  }

  return false;
}

/**
 * Rileva se il dispositivo corrente è una TV (Smart TV, Android TV, Fire TV, Google TV, Tizen, webOS o TvAppBTime su TV).
 */
export function isTvClient(ua?: string): boolean {
  const userAgent = ua ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");

  if (TV_UA_REGEX.test(userAgent)) {
    return true;
  }

  // Se l'utente usa TvAppBTime su TV con Modalità Desktop attiva (UA Windows/Chrome),
  // non è uno smartphone Android Mobile ma è il client TV in modalità desktop.
  if (isTvAppBTimeClient(userAgent)) {
    const isAndroidPhoneUa = /\bandroid\b/i.test(userAgent) && /\bmobile\b/i.test(userAgent);
    if (!isAndroidPhoneUa) {
      return true;
    }
  }

  return false;
}

/**
 * Rileva se il dispositivo corrente è un computer/desktop (Windows, macOS, Linux, ChromeOS).
 * Esclude esplicitamente dispositivi mobili e Smart TV (anche in modalità desktop simulata).
 */
export function isDesktopClient(ua?: string): boolean {
  const userAgent = ua ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");

  // Se è una TV o una console riconosciuta, NON è un computer
  if (TV_UA_REGEX.test(userAgent)) {
    return false;
  }

  // Se è l'app TvAppBTime (che magari simula l'UA di Windows/Chrome per la modalità desktop),
  // sappiamo che in realtà è una TV, quindi NON è un computer
  if (isTvAppBTimeClient(userAgent)) {
    return false;
  }

  // Escludiamo i dispositivi mobili (smartphone e tablet)
  // Nota: è fondamentale escludere "Android" qui, altrimenti verrebbe scambiato per "Linux" nel check successivo.
  const isMobileOrTablet = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  if (isMobileOrTablet) {
    return false;
  }

  // Verifichiamo la presenza dei sistemi operativi tipicamente Desktop
  // Windows NT (PC Windows), Macintosh (Mac), Linux (PC Linux), CrOS (Chromebook)
  const isDesktopOS = /Windows NT|Macintosh|Linux|CrOS/i.test(userAgent);

  return isDesktopOS;
}

function parseUserAgent(ua: string) {
  let browserName = "Unknown Browser";
  let browserVersion = "";
  let osName = "Unknown OS";
  let deviceType: "Mobile" | "Tablet" | "Desktop" | "TV" = "Desktop";

  const isTv = isTvClient(ua);
  const isDesktop = isDesktopClient(ua);
  const isTvApp = isTvAppBTimeClient(ua);

  // Rilevamento Device Type (TV ha priorità perché Android TV / Fire TV contengono anche "Android" o "Mobile")
  if (isTv) deviceType = "TV";
  else if (/ipad|tablet/i.test(ua)) deviceType = "Tablet";
  else if (/mobi|android|iphone|ipod/i.test(ua)) deviceType = "Mobile";

  // Rilevamento OS
  if (/\baft[a-z0-9]*\b|fire\s*tv/i.test(ua)) osName = "Fire OS";
  else if (/android\s*tv|googletv/i.test(ua)) osName = "Android TV";
  else if (/tizen/i.test(ua)) osName = "Tizen";
  else if (/web0s|webos/i.test(ua)) osName = "webOS";
  else if (/windows/i.test(ua)) osName = "Windows";
  else if (/macintosh|mac os/i.test(ua)) osName = "macOS";
  else if (/iphone|ipad|ipod/i.test(ua)) osName = "iOS";
  else if (/android/i.test(ua)) osName = "Android";
  else if (/linux/i.test(ua)) osName = "Linux";

  // Rilevamento Browser e Versione (ordine importante)
  if (isTvApp) {
    browserName = "TvAppBTime";
    const match = ua.match(/tvappbtime\/([\d.]+)/i);
    browserVersion = match ? match[1] : "1.0";
  } else if (/firefox|fxios/i.test(ua)) {
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

  return { browserName, browserVersion, osName, deviceType, isTv, isTvApp };
}

/**
 * Recupera l'IP pubblico tramite un servizio gratuito via fetch nativa
 */
async function fetchPublicIP(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const response = await fetch("https://api.ipify.org?format=json", { signal: controller.signal });
    clearTimeout(timer);
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
  const { browserName, browserVersion, osName, deviceType, isTv, isTvApp } = parseUserAgent(ua);
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
    isTv,
    isTvAppBTime: isTvApp,
    screen: {
      width: window.screen.width,
      height: window.screen.height,
    },
    language: navigator.language,
  };
}
