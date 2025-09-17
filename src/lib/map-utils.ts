// Map utilities for consistent marker creation across the app
// Single source of truth for Leaflet markers and icons

const DEFAULT_ICON_URL = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png";
const DEFAULT_SHADOW_URL = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";
const RED_ICON_URL = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png";
const GREY_ICON_URL = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png";

const ICON_OPTIONS = {
    iconSize: [25, 41] as [number, number],
    iconAnchor: [12, 41] as [number, number],
    popupAnchor: [1, -34] as [number, number],
    shadowSize: [41, 41] as [number, number],
};

export const createDefaultIcon = async (url: string, shadowUrl = DEFAULT_SHADOW_URL) => {
    const L = await import("leaflet");
    return L.default.icon({ ...ICON_OPTIONS, iconUrl: url, shadowUrl });
};

export const createStartMarker = async (latlng: any) => {
    const L = await import("leaflet");
    const icon = await createDefaultIcon(DEFAULT_ICON_URL);
    return L.default.marker(latlng, { icon });
};

export const createDestinationMarker = async (latlng: any) => {
    const L = await import("leaflet");
    const icon = await createDefaultIcon(RED_ICON_URL);
    return L.default.marker(latlng, { icon });
};

export const createUserMarker = async (latlng: any, active: boolean) => {
    const L = await import("leaflet");
    const iconUrl = active ? DEFAULT_ICON_URL : GREY_ICON_URL;
    const icon = await createDefaultIcon(iconUrl);
    return L.default.marker(latlng, { icon });
};

export const createPolyline = async (latlngs: any[], active: boolean) => {
    const L = await import("leaflet");
    return L.default.polyline(latlngs, {
        color: active ? "blue" : "gray",
        weight: 3,
        opacity: 0.7,
    });
};

export const fitBoundsToMarkers = async (map: any, markers: any) => {
    const L = await import("leaflet");
    map.fitBounds(markers.getBounds().pad(0.1));
};