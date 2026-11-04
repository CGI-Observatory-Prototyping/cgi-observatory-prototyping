import seedrandom from 'seedrandom';

export const buildIndicatorGeoJSON = (
    citySchema: Array<City>, indicatorValues: Array<IndicatorValue>
) => {
    // Build a fast lookup map: city_code → CityValue
    const valueMap = new Map<string, IndicatorValue>(
        indicatorValues.map((v) => [v.city_code, v])
    );

    const features = citySchema.map((meta) => {
        const match = valueMap.get(meta.city_code);

        const properties = {
            // Metadata fields
            cgi_id: meta.cgi_id,
            city_code: meta.city_code,
            city_name: meta.city_name,
            country: meta.country,
            // Value fields — fall back to null / -1 when no match
            indicator_code: match?.indicator_code ?? null,
            indicator_name: match?.indicator_name ?? null,
            year: match?.year ?? null,
            value: Math.floor(Math.random() * 20) + 1,
            sheet_name: match?.sheet_name ?? null,
        };

        return {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: meta.coordination, // already [lng, lat]
            },
            properties,
        };
    });

    return {
        type: "FeatureCollection",
        features,
    };
}

export function redShade(value: number): string {
    value = Math.max(1, Math.min(200, value));

    const lightness = 90 - ((value - 1) / 199) * 60;

    // Convert HSL to hex
    return hslToHex(0, 80, lightness);
}

function hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

export function randomInt(min: number=1, max: number=100, seed: number): number {
    const rng = seedrandom('my-seed');
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


export class RandomInt {
    private rng: any;
    constructor(seed: number=0) {
        this.setSeed(seed);
    }

    setSeed(seed: number) {
        this.rng = seedrandom(seed);
    }

    randomInt(min: number=1, max: number=100) {
        return Math.floor(this.rng() * (max - min + 1)) + min;
    }
}
