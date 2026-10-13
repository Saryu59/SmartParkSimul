/**
 * Service Configuration and Demo Mode Switcher
 */

const STORAGE_KEY = 'smartpark_demo_mode_override';

export function isDemoMode() {
  const override = localStorage.getItem(STORAGE_KEY);
  if (override !== null) {
    return override === 'true';
  }
  // Fall back to environment variable, defaulting to true for prototype
  const envVal = import.meta.env.VITE_DEMO_MODE;
  return envVal !== 'false';
}

export function setDemoMode(enabled) {
  localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  // Dispatch a custom event so contexts can react without hard refresh if desired
  window.dispatchEvent(new CustomEvent('smartpark:demo-mode-changed', { detail: { enabled } }));
}

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
}

export function getWsUrl() {
  return import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/live';
}

export const APP_CONFIG = {
  maxSlots: 6,
  locationName: 'Innovation Lab Parking Bay (ESP32 Prototype)',
  firmwareVersion: 'v1.4.2-esp32-freertos',
};
