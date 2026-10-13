/**
 * Simulated Clock Service for Time Travel & Reservation Expiry Testing
 */

class ClockService {
  constructor() {
    this.offsetMs = parseInt(localStorage.getItem('smartpark_clock_offset') || '0', 10);
    this.listeners = new Set();
    this.timerId = null;

    // Tick every 1 second to update relative timers
    if (typeof window !== 'undefined') {
      this.timerId = window.setInterval(() => {
        this.notifyListeners();
      }, 1000);
    }
  }

  getCurrentTime() {
    return new Date(Date.now() + this.offsetMs);
  }

  getCurrentIso() {
    return this.getCurrentTime().toISOString();
  }

  getOffsetMinutes() {
    return Math.round(this.offsetMs / 60000);
  }

  isOffset() {
    return Math.abs(this.offsetMs) > 1000;
  }

  advanceMinutes(minutes) {
    this.offsetMs += minutes * 60 * 1000;
    localStorage.setItem('smartpark_clock_offset', this.offsetMs.toString());
    this.notifyListeners();
  }

  resetToRealTime() {
    this.offsetMs = 0;
    localStorage.removeItem('smartpark_clock_offset');
    this.notifyListeners();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.getCurrentTime());
    return () => {
      this.listeners.delete(callback);
    };
  }

  notifyListeners() {
    const now = this.getCurrentTime();
    this.listeners.forEach((callback) => {
      try {
        callback(now);
      } catch (err) {
        console.error('Error in clock listener:', err);
      }
    });
  }
}

export const clockService = new ClockService();
