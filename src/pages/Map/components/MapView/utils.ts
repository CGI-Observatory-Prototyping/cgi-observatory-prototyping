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
            value: match?.value ?? -1,
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

export function mapToGhsYear(selectedYear: number): number {
    if (selectedYear < 2010 || selectedYear > 2024) {
        throw new Error(`Year ${selectedYear} is out of supported range (2010–2024)`);
    }
    return Math.floor(selectedYear / 5) * 5;
}
