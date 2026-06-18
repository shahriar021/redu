// ─── Location Data ────────────────────────────────────────────────────────────
// Search result, map marker, pickup/dropoff point সব জায়গায় use হয়

export type LocationData = {
  id: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
};

// ─── Route Data ───────────────────────────────────────────────────────────────
// Google Directions API থেকে decode করা route info

export type RouteData = {
  points: { latitude: number; longitude: number }[]; // Polyline points
  distance: number; // km
  duration: number; // minutes
  polyline: string; // encoded polyline string (backup)
};
