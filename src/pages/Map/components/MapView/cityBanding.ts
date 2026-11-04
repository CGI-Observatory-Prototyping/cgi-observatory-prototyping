// =============================================================================
// cityBanding.ts
//
// Calculates histogram-style bands for Mapbox circle layers.
// Groups city values into colour/size bands using Sturges' rule + quantiles,
// and serialises the result into Mapbox `step` expressions ready for addLayer().
//
// Banding strategy:
//   Uses quantile-based thresholds so each band contains roughly the same
//   number of cities. This naturally handles skewed distributions (e.g. one
//   city at 33,000 and all others under 1,000) — equal-width bands would
//   collapse everything into one band, making the map unreadable.
//
// Usage:
//   const values = features.map(f => f.properties.population ?? -1);
//   const config  = calculateBanding(values, { minSize: 6, maxSize: 24 });
//   const paint   = buildMapboxPaint(config, "population");
//   map.addLayer({ id: "cities", type: "circle", source: "cities", paint });
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface Band {
    /** Inclusive lower bound of this band */
    min: number;
    /** Exclusive upper bound (inclusive for the last band) */
    max: number;
    /** Hex color assigned to this band */
    color: string;
    /** Point radius in pixels */
    size: number;
    /** Human-readable label, e.g. "1.2k – 4.5k" */
    label: string;
}

export interface BandingConfig {
    /** Ordered bands for cities that have a value */
    bands: Band[];
    /** Fallback config for cities where value === -1 */
    noData: {
        color: string;
        size: number;
        label: string;
    };
}

export interface BandingOptions {
    /** Minimum point radius in px (default: 4) */
    minSize?: number;
    /** Maximum point radius in px (default: 20) */
    maxSize?: number;
    /** Color for no-data points (default: "#9CA3AF") */
    noDataColor?: string;
    /** Size for no-data points in px (default: 4) */
    noDataSize?: number;
    /**
     * Optional color palette — array of hex strings, light → dark.
     * Will be interpolated to match the calculated band count.
     * Defaults to a yellow → indigo sequential ramp.
     */
    colors?: string[];
}

// -----------------------------------------------------------------------------
// Public: calculateBanding
// -----------------------------------------------------------------------------

/**
 * Calculates quantile-based bands for Mapbox point visualisation.
 *
 * Band count uses Sturges' rule: k = 1 + ⌈log₂(n)⌉, clamped to [3, 9].
 * Thresholds are derived from quantiles so each band contains roughly the
 * same number of cities — this keeps the map readable even when the data
 * is heavily skewed (e.g. one outlier city 10× larger than all others).
 * Point sizes use a square-root scale so perceived dot area grows evenly.
 *
 * Cities with value === -1 are treated as "no data" and returned
 * separately with a neutral colour and minimum size.
 *
 * @param values  Array of raw city values (-1 means no data)
 * @param options Optional overrides for sizes, colours, etc.
 * @returns       BandingConfig with per-band metadata + noData config
 *
 * @example
 * const config = calculateBanding([450, 1200, -1, 890, 3400, -1, 220]);
 * // config.bands  → array of Band objects
 * // config.noData → { color: '#9CA3AF', size: 4, label: 'No data' }
 */
export function calculateBanding(
    values: number[],
    options: BandingOptions = {}
): BandingConfig {
    const {
        minSize = 16,
        maxSize = 20,
        noDataColor = "#9CA3AF",
        noDataSize = 16,
        colors,
    } = options;

    const noData = { color: noDataColor, size: noDataSize, label: "No data" };

    // Separate valid values from no-data sentinels
    const validValues = values.filter((v) => v !== -1);

    // Edge case: no valid data at all
    if (validValues.length === 0) {
        return { bands: [], noData };
    }

    const sorted = [...validValues].sort((a, b) => a - b);
    const dataMin = sorted[0];
    const dataMax = sorted[sorted.length - 1];

    // Edge case: single unique value — one band, mid-range size
    if (dataMin === dataMax) {
        return {
            bands: [
                {
                    min: dataMin,
                    max: dataMax,
                    color: interpolateColors(colors ?? DEFAULT_PALETTE, 1)[0],
                    size: Math.round((minSize + maxSize) / 2),
                    label: formatNumber(dataMin),
                },
            ],
            noData,
        };
    }

    // --- Band count via Sturges' rule, clamped to [3, 9] ---
    const n = validValues.length;
    const rawBands = 1 + Math.ceil(Math.log2(n));
    const bandCount = Math.max(3, Math.min(9, rawBands));

    // --- Quantile thresholds ---
    // Each threshold is the value at the i/bandCount quantile of the sorted data.
    // This guarantees roughly equal city counts per band regardless of skew.
    // Duplicate thresholds are deduplicated so we never produce an empty band
    // (e.g. if 80% of cities share the same value).
    const rawThresholds = Array.from({ length: bandCount - 1 }, (_, i) => {
        const q = (i + 1) / bandCount;
        return quantile(sorted, q);
    });

    // Remove duplicates and re-clamp to [dataMin+ε, dataMax)
    const thresholds = [...new Set(rawThresholds)].filter(
        (t) => t > dataMin && t < dataMax
    );

    // Re-derive actual band count after deduplication (skewed data may collapse bands)
    const actualBandCount = thresholds.length + 1;
    const palette = interpolateColors(colors ?? DEFAULT_PALETTE, actualBandCount);

    const bands: Band[] = Array.from({ length: actualBandCount }, (_, i) => {
        const bandMin = i === 0 ? dataMin : thresholds[i - 1];
        const bandMax = i === actualBandCount - 1 ? dataMax : thresholds[i];

        // Square-root scale: perceived dot area grows evenly across bands
        const t = actualBandCount === 1 ? 0.5 : Math.sqrt(i / (actualBandCount - 1));
        const size = Math.round(minSize + t * (maxSize - minSize));

        return {
            min: bandMin,
            max: bandMax,
            color: palette[i],
            size,
            label: `${formatNumber(bandMin)} – ${formatNumber(bandMax)}`,
        };
    });

    return { bands, noData };
}

// -----------------------------------------------------------------------------
// Private: quantile helper
// -----------------------------------------------------------------------------

/**
 * Returns the value at quantile q (0–1) from a pre-sorted array.
 * Uses linear interpolation between adjacent ranks (same as d3.quantile).
 */
function quantile(sorted: number[], q: number): number {
    const idx = q * (sorted.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

// -----------------------------------------------------------------------------
// Public: getBandForValue
// -----------------------------------------------------------------------------

/**
 * Returns the matching Band for a value, or the noData config if value === -1.
 *
 * Useful for non-Mapbox rendering (e.g. custom canvas, legend generation,
 * unit tests). For Mapbox layers, use buildMapboxPaint() instead — it
 * serialises the config into a step expression evaluated natively by the GPU.
 *
 * @example
 * const band = getBandForValue(city.population, config);
 * ctx.fillStyle = band.color;
 * ctx.arc(x, y, band.size / 2, 0, Math.PI * 2);
 */
export function getBandForValue(
    value: number,
    config: BandingConfig
): Band | BandingConfig["noData"] {
    if (value === -1) return config.noData;

    const match = config.bands.find(
        (b, i) =>
            value >= b.min &&
            (i === config.bands.length - 1 ? value <= b.max : value < b.max)
    );

    // Float-drift fallback: clamp to nearest band edge
    return (
        match ??
        (value < config.bands[0].min
            ? config.bands[0]
            : config.bands[config.bands.length - 1])
    );
}

// -----------------------------------------------------------------------------
// Public: buildMapboxPaint
// -----------------------------------------------------------------------------

/**
 * Converts a BandingConfig into Mapbox GL JS circle paint properties,
 * using `step` expressions driven by a numeric feature property.
 *
 * The returned object can be passed directly to map.addLayer() or
 * individual properties updated later via map.setPaintProperty().
 *
 * @param config        Output of calculateBanding()
 * @param propertyName  The feature property holding the city value (default: "value")
 *
 * @example
 * const paint = buildMapboxPaint(config, "population");
 *
 * map.addLayer({
 *   id: "cities-layer",
 *   type: "circle",
 *   source: "cities",
 *   paint,
 * });
 *
 * // Later, switch to a different metric:
 * const newConfig = calculateBanding(newValues);
 * const newPaint  = buildMapboxPaint(newConfig, "gdp");
 * map.setPaintProperty("cities-layer", "circle-color",        newPaint["circle-color"]);
 * map.setPaintProperty("cities-layer", "circle-radius",       newPaint["circle-radius"]);
 * map.setPaintProperty("cities-layer", "circle-stroke-color", newPaint["circle-stroke-color"]);
 */
export function buildMapboxPaint(
    config: BandingConfig,
    propertyName = "value"
) {
    return {
        "circle-color": buildStepExpression(
            propertyName,
            config,
            (b) => b.color,
            config.noData.color
        ),
        "circle-radius": buildStepExpression(
            propertyName,
            config,
            (b) => b.size / 2, // Mapbox uses radius, not diameter
            config.noData.size / 2
        ),
        "circle-opacity": 0.85,
        "circle-stroke-width": 1,
        "circle-stroke-color": buildStepExpression(
            propertyName,
            config,
            (b) => b.color,
            config.noData.color
        ),
        "circle-stroke-opacity": 0.4,
    } as const;
}

// -----------------------------------------------------------------------------
// Private: buildStepExpression
// -----------------------------------------------------------------------------

/**
 * Builds a Mapbox expression for a single paint property.
 *
 * Why -1 safely falls into noData:
 *   Mapbox `step` returns the default for any input *below* the first
 *   threshold. Since -1 is always below dataMin, it always hits noDataValue
 *   without any explicit check in the expression.
 *
 * Why band.min as threshold (not band.max):
 *   `step` works as "value >= threshold → output", so using each band's
 *   lower bound gives contiguous, non-overlapping coverage with no gaps.
 *
 * Expression shapes by band count:
 *   0 bands → raw scalar (no expression)
 *   1 band  → ["case", ["==", ["get", prop], -1], noData, bandValue]
 *   2+ bands → ["step", ["get", prop], noData, min0, val0, min1, val1, ...]
 */
function buildStepExpression<T extends string | number>(
    propertyName: string,
    config: BandingConfig,
    getValue: (band: Band) => T,
    noDataValue: T
): unknown {
    const { bands } = config;

    // No valid data — flat scalar, Mapbox accepts this for paint properties
    if (bands.length === 0) {
        return noDataValue;
    }

    // Single band — step requires ≥1 threshold, use case expression instead
    if (bands.length === 1) {
        return [
            "case",
            ["==", ["get", propertyName], -1],
            noDataValue,
            getValue(bands[0]),
        ];
    }

    // Normal path: ≥2 bands
    // ["step", input, default, threshold1, output1, threshold2, output2, ...]
    const expression: unknown[] = [
        "step",
        ["get", propertyName],
        noDataValue, // default: catches -1 and anything below first threshold
    ];

    bands.forEach((band) => {
        expression.push(band.min);       // threshold
        expression.push(getValue(band)); // output for values >= threshold
    });

    return expression;
}

// -----------------------------------------------------------------------------
// Private: colour utilities
// -----------------------------------------------------------------------------

/** Default sequential palette: light yellow → deep indigo */
const DEFAULT_PALETTE = [
    "#FEF9C3", "#FDE68A", "#FCA5A5",
    "#F472B6", "#A78BFA", "#818CF8",
    "#4F46E5", "#3730A3", "#1E1B4B",
];

/** Linearly sample `count` colours from a palette of any size */
function interpolateColors(palette: string[], count: number): string[] {
    if (count === 1) return [palette[Math.floor(palette.length / 2)]];
    return Array.from({ length: count }, (_, i) => {
        const t = i / (count - 1);
        const rawIndex = t * (palette.length - 1);
        const lo = Math.floor(rawIndex);
        const hi = Math.min(lo + 1, palette.length - 1);
        return lerpHex(palette[lo], palette[hi], rawIndex - lo);
    });
}

/** Linearly interpolate between two hex colours */
function lerpHex(a: string, b: string, t: number): string {
    const [ar, ag, ab] = hexToRgb(a);
    const [br, bg, bb] = hexToRgb(b);
    const r  = Math.round(ar + (br - ar) * t);
    const g  = Math.round(ag + (bg - ag) * t);
    const bl = Math.round(ab + (bb - ab) * t);
    return `#${[r, g, bl].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgb(hex: string): [number, number, number] {
    const n = parseInt(hex.replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function formatNumber(n: number): string {
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : Math.round(n).toString();
}

export const PAINTS: Record<string, unknown> = {
    ghs_pop: {
        "raster-opacity": 0.8,
        "raster-contrast": 0.5,
        "raster-saturation": 0.5,
        "raster-color": [
            "interpolate", ["linear"],
            ["raster-value"],
            0,   "rgba(0,0,0,0)",
            10,  "rgb(255,240,178)",
            50,  "rgba(253,141,60,1)",
            200, "rgba(240,59,32,1)",
            500, "rgb(103,0,22)",
        ],
        "raster-color-range": [0, 5000],
        "raster-color-mix": [255, 0, 0, 0],
    },
    ghs_smod: {
        "raster-opacity": 0.8,
        "raster-contrast": 0.5,
        "raster-saturation": 0.5,
        "raster-color": [
            "interpolate", ["linear"],
            ["raster-value"],
            0,   "rgba(0,0,0,0)",
            5,  "rgb(216,245,250)",
            10,  "rgb(147,237,243)",
            15,  "rgb(90,167,255)",
            20, "rgb(5,121,230)",
            25, "rgb(1,61,87)",
        ],
        "raster-color-range": [0, 30],
        "raster-color-mix": [255, 0, 0, 0],
    },
}