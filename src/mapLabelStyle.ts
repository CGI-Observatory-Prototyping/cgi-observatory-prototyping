import type { Map } from 'mapbox-gl';

/** Improve place-name contrast while preserving the basemap's fonts and zoom sizing. */
export const DEFAULT_MAP_LABEL_COLOR = '#1f2937';

export const DEFAULT_MAP_LABEL_OUTLINE_COLOR = '#ffffff';

export function applyMapLabelStyle(
    map: Map,
    textColor = DEFAULT_MAP_LABEL_COLOR,
    outlineColor = DEFAULT_MAP_LABEL_OUTLINE_COLOR,
): void {
    const labelLayers = [
        'country-label',
        'settlement-major-label',
        'settlement-minor-label',
    ];

    for (const id of labelLayers) {
        if (map.getLayer(id)?.type !== 'symbol') continue;

        map.setPaintProperty(id, 'text-color', textColor);
        map.setPaintProperty(id, 'text-opacity', 1);
        map.setPaintProperty(id, 'text-halo-color', outlineColor);
        map.setPaintProperty(id, 'text-halo-width', 1.5);
        map.setPaintProperty(id, 'text-halo-blur', 0.5);
    }
}
