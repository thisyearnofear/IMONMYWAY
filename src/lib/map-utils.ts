// Map utilities for consistent marker creation across the app
// Single source of truth for Leaflet markers and icons

import L from "leaflet";

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

export const createDefaultIcon = (url: string, shadowUrl = DEFAULT_SHADOW_URL) =>
    L.icon({ ...ICON_OPTIONS, iconUrl: url, shadowUrl });

export const createStartMarker = (latlng: L.LatLngExpression) =>
    L.marker(latlng, { icon: createDefaultIcon(DEFAULT_ICON_URL) });

export const createDestinationMarker = (latlng: L.LatLngExpression) =>
    L.marker(latlng, { icon: createDefaultIcon(RED_ICON_URL) });

export const createUserMarker = (latlng: L.LatLngExpression, active: boolean) => {
    const iconUrl = active ? DEFAULT_ICON_URL : GREY_ICON_URL;
    return L.marker(latlng, { icon: createDefaultIcon(iconUrl) });
};

export const createPolyline = (latlngs: L.LatLngExpression[], active: boolean) =>
    L.polyline(latlngs, {
        color: active ? "blue" : "gray",
        weight: 3,
        opacity: 0.7,
    });

export const fitBoundsToMarkers = (map: L.Map, markers: L.FeatureGroup) => {
    map.fitBounds(markers.getBounds().pad(0.1));
};