/**
 * Cross-platform Camera & Sensor Adapter for CookCart (Bon Taste).
 *
 * Designed so the exact same live camera step-by-step action and wave gesture
 * pipeline works in:
 * 1. Mobile & desktop browsers (`navigator.mediaDevices.getUserMedia`)
 * 2. React Native WebView / Expo / Capacitor phone app shells (`window.ReactNativeWebView`
 *    or `window.CookCartNativeCamera`)
 */

export type CameraFacingMode = "user" | "environment";

export interface NativeCameraBridge {
  captureFrameBase64?: (facingMode: CameraFacingMode) => Promise<string | null>;
  requestCameraPermission?: () => Promise<boolean>;
  onGestureEvent?: (handler: (direction: "next" | "back") => void) => () => void;
}

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
    };
    CookCartNativeCamera?: NativeCameraBridge;
  }
}

/**
 * True when running inside a React Native WebView, Expo shell, or Capacitor phone app.
 */
export function isNativePhoneApp(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    window.ReactNativeWebView ||
      window.CookCartNativeCamera ||
      (window.Capacitor && typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform())
  );
}

/**
 * True when either the browser MediaDevices API or a native mobile camera bridge is available.
 */
export function isCameraSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (window.CookCartNativeCamera || window.ReactNativeWebView) return true;
  return Boolean(typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia);
}

/**
 * Notify the host React Native / Capacitor shell of a step or camera action.
 */
export function postNativeCameraEvent(type: string, payload: Record<string, unknown> = {}): void {
  if (typeof window === "undefined" || !window.ReactNativeWebView?.postMessage) return;
  try {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        source: "cookcart-camera",
        type,
        ...payload,
      })
    );
  } catch {
    // Ignore bridge serialization errors
  }
}

/**
 * Request a live MediaStream for the specified camera facing mode (`"user"` for
 * front-camera hand-wave gestures, `"environment"` for rear-camera stove/pan checks).
 * Automatically falls back to any available camera if the preferred lens is busy or absent.
 */
export async function openCameraStream(
  facingMode: CameraFacingMode = "user",
  idealWidth = 320,
  idealHeight = 240
): Promise<MediaStream> {
  if (typeof window !== "undefined" && window.CookCartNativeCamera?.requestCameraPermission) {
    await window.CookCartNativeCamera.requestCameraPermission().catch(() => false);
  }

  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera API unavailable");
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: idealWidth },
        height: { ideal: idealHeight },
      },
      audio: false,
    });
  } catch {
    // Fallback for desktop webcams or single-lens mobile devices
    return await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
  }
}

/**
 * Capture a compressed JPEG base64 frame from a live HTMLVideoElement or native phone bridge.
 */
export async function captureCameraFrameBase64(
  video: HTMLVideoElement | null,
  facingMode: CameraFacingMode = "environment",
  maxWidth = 640,
  quality = 0.78
): Promise<string | null> {
  if (typeof window !== "undefined" && window.CookCartNativeCamera?.captureFrameBase64) {
    try {
      const nativeFrame = await window.CookCartNativeCamera.captureFrameBase64(facingMode);
      if (nativeFrame) return nativeFrame;
    } catch {
      // Fall back to HTML5 video canvas capture
    }
  }

  if (!video || video.readyState < 2) {
    return null;
  }

  const vw = video.videoWidth || 320;
  const vh = video.videoHeight || 240;
  const scale = vw > maxWidth ? maxWidth / vw : 1;
  const targetW = Math.max(64, Math.round(vw * scale));
  const targetH = Math.max(48, Math.round(vh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, targetW, targetH);
  return canvas.toDataURL("image/jpeg", quality);
}

