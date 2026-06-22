/**
 * Single source of truth for the marketplace/app basemap tiles.
 *
 * Uses MapTiler "Outdoor v4" (rich green topographic style, CDN-reliable) when
 * NEXT_PUBLIC_MAPTILER_KEY is set; otherwise falls back to standard OpenStreetMap
 * green tiles so maps still render without a key (e.g. in local/dev or if the
 * env var is missing on a deploy).
 *
 * Licence: when MapTiler is active we must visibly credit "© MapTiler ©
 * OpenStreetMap contributors" (handled via MAP_TILE_ATTRIBUTION).
 */

const KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY

/** XYZ raster tile URL (256px tiles — directly Leaflet-compatible). */
export const MAP_TILE_URL = KEY
  ? `https://api.maptiler.com/maps/outdoor-v4/256/{z}/{x}/{y}.png?key=${KEY}`
  : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

/** Required attribution string (HTML). */
export const MAP_TILE_ATTRIBUTION = KEY
  ? '© <a href="https://www.maptiler.com/copyright/">MapTiler</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

/** Subdomains for the OSM fallback ({s}); ignored by the keyless MapTiler URL. */
export const MAP_TILE_SUBDOMAINS = "abc"

/** Max zoom supported by the basemap. */
export const MAP_TILE_MAXZOOM = 19

/**
 * A single concrete tile URL for static "mini map" thumbnails/previews
 * (e.g. dashboard cards). Defaults to a low-zoom UK view.
 */
export function mapPreviewTile(z = 6, x = 31, y = 20): string {
  return KEY
    ? `https://api.maptiler.com/maps/outdoor-v4/256/${z}/${x}/${y}.png?key=${KEY}`
    : `https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`
}
