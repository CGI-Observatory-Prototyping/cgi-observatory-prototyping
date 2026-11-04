import mapboxgl, { GeoJSONSource } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import React, { useEffect, useRef, useMemo } from "react";
import {Button, FloatButton, message, Space } from "antd";
import { MinusOutlined, PlusOutlined, UndoOutlined } from "@ant-design/icons";
import { initMapState } from "@/pages/Map/components/MapView/config";
import {buildIndicatorGeoJSON, mapToGhsYear} from "./utils";
import { calculateBanding, buildMapboxPaint, PAINTS } from "@/pages/Map/components/MapView/cityBanding";
import type { FeatureCollection, Geometry } from 'geojson';
import { getLocale } from 'umi';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import { applyMapLabelStyle } from '@/mapLabelStyle';
import DebugInfo from "@/components/DebugInfo";
import boundaries from "@/services/mockdata/boundaries";

interface MapViewProps {
    citySchema: Array<City>;
    indicatorValues: Array<IndicatorValue>;
    layerData?: string | null; // e.g. "ghsl", or any other layer key; null/undefined = no raster layer
    year: number;
    mapboxToken: string;
    showBoundaries?: boolean;
    boundary: string|null;
}

const EMPTY_GEOJSON: FeatureCollection<Geometry, { city_code: string }> = {
    type: 'FeatureCollection',
    features: [],
};

const LangMap: Record<string, string> = {
    "zh-CN": "zh-Hans",
    "en-US": "en",
};

const RASTER_SOURCE_ID = "raster-pop";
const RASTER_LAYER_ID  = "raster-population";

const RASTER_TYPE: Record<string, string> = {
    flat: "png",
    "3d": "pbf"
}

const buildTilesUrl = (layer: string, year: number, type: string="flat") =>
    type=="3d"
        ?`${window.location.origin}/api/tiles/layer/${type}/${layer}/${year}/all/{z}/{x}/{y}.${RASTER_TYPE[type]}`
        :`${window.location.origin}/api/tiles/layer/${type}/${layer}/${year}/{z}/{x}/{y}.${RASTER_TYPE[type]}`;

// The feature property that holds the numeric city value.
// Must match what buildIndicatorGeoJSON() writes into each feature.
const VALUE_PROPERTY = "value";

export default function MapView(props: MapViewProps): React.ReactNode {
    const {
        citySchema, indicatorValues, layerData, year, mapboxToken,
        showBoundaries=false, boundary=null
    } = props;

    const geoJsonValues = useMemo(() => {
        return buildIndicatorGeoJSON(citySchema, indicatorValues);
    }, [citySchema, indicatorValues]);

    const ghsYear = useMemo(()=>{
        return mapToGhsYear(year)
    }, [year]);

    // Derive banding config from the same values that drive the GeoJSON.
    // calculateBanding() is cheap (pure JS, no side effects) so useMemo is fine.
    const bandingConfig = useMemo(() => {
        const values = geoJsonValues.features.map(
            (f) => (f.properties as Record<string, number>)[VALUE_PROPERTY] ?? -1
        );
        return calculateBanding(values, { minSize: 6, maxSize: 24 });
    }, [geoJsonValues]);

    const mapRef = useRef<mapboxgl.Map | null>(null);
    const mapLangRef = useRef<MapboxLanguage | null>(null);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapLoadedRef = useRef(false);

    const locale = getLocale();

    const [zoom, setZoom] = React.useState(0);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        mapboxgl.accessToken = mapboxToken;

        mapLoadedRef.current = false;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            projection: initMapState.projection,
            style: initMapState.style,
            center: initMapState.center,
            zoom: initMapState.zoom,
            // minZoom: layerData?.endsWith("3d")?initMapState.minZoom3D:initMapState.minZoom,
            // maxZoom: layerData?.endsWith("3d")?initMapState.maxZoom3D:initMapState.maxZoom,
            minZoom: initMapState.minZoom,
            maxZoom: initMapState.maxZoom,
            maxBounds: initMapState.maxBounds,
        });

        mapRef.current = map;

        const lang = new MapboxLanguage({ defaultLanguage: LangMap[locale] ?? 'en' });
        mapLangRef.current = lang;
        map.addControl(lang);

        map.on('zoomend', ()=>{
            setZoom(map.getZoom());
        })

        map.on('load', () => {
            applyMapLabelStyle(map);
            console.log("=== MAP ON LOAD ===");
            console.log('actual zoom:', map.getZoom());
            onResetViewPort()
            setZoom(map.getZoom());

            map.addSource('my-source', {
                type: 'geojson',
                data: EMPTY_GEOJSON,
            });

            // Build paint from the banding config current at mount time.
            // The separate useEffect below keeps it in sync when data changes.
            const initialPaint = buildMapboxPaint(bandingConfigRef.current, VALUE_PROPERTY);

            map.addLayer({
                id: "my-layer",
                type: "circle",
                source: "my-source",
                paint: initialPaint,
            });

            // Add popup on hover
            const popup = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false
            });

            map.on('mouseenter', 'my-layer', (e) => {
                map.getCanvas().style.cursor = 'pointer';

                const coordinates = e.features[0].geometry.coordinates.slice();
                const properties = e.features[0].properties;

                const cityName = properties.city_name;
                const value = properties.value;
                const displayValue = value === -1 ? 'No data' : value;

                popup.setLngLat(coordinates).setHTML(`
      <div style="font-family: sans-serif; padding: 4px 8px;">
        <strong>${cityName}</strong><br/>
        Value: ${displayValue}
      </div>
    `).addTo(map);
            });

            map.on('mouseleave', 'my-layer', () => {
                map.getCanvas().style.cursor = '';
                popup.remove();
            });

            mapLoadedRef.current = true;

            // Apply the initial data that may have arrived before the map loaded
            const source = map.getSource('my-source') as GeoJSONSource;
            source.setData(geoJsonDataRef.current);
        });

        return () => {
            mapLoadedRef.current = false;
            map.remove();
            mapRef.current = null;
        };
    }, [locale]); // locale is the only thing that should trigger a full map rebuild

    // Keep refs in sync so the load handler always sees the latest values
    // without needing them as useEffect dependencies (which would re-create the map).
    // layerDataRef is also kept here so the on('load') closure always reads the
    // freshest layerData without it being a dep of the init effect.
    const geoJsonDataRef = useRef(geoJsonValues);
    const bandingConfigRef = useRef(bandingConfig);
    const layerDataRef = useRef(layerData);
    useEffect(() => {
        geoJsonDataRef.current = geoJsonValues;
        bandingConfigRef.current = bandingConfig;
        layerDataRef.current = layerData;
    });

    // Update GeoJSON data + paint expressions whenever indicatorValues changes
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapLoadedRef.current) return;

        // 1. Push new GeoJSON data into the source
        const source = map.getSource('my-source') as GeoJSONSource | undefined;
        source?.setData(geoJsonValues);

        // 2. Re-derive paint from updated banding and push each property
        const paint = buildMapboxPaint(bandingConfig, VALUE_PROPERTY);
        map.setPaintProperty("my-layer", "circle-color",         paint["circle-color"]);
        map.setPaintProperty("my-layer", "circle-radius",        paint["circle-radius"]);
        map.setPaintProperty("my-layer", "circle-opacity",       paint["circle-opacity"]);
        map.setPaintProperty("my-layer", "circle-stroke-width",  paint["circle-stroke-width"]);
        map.setPaintProperty("my-layer", "circle-stroke-color",  paint["circle-stroke-color"]);
        map.setPaintProperty("my-layer", "circle-stroke-opacity",paint["circle-stroke-opacity"]);
    }, [geoJsonValues, bandingConfig]);

    // ── Raster layer swap ─────────────────────────────────────────────────────
    // When layerData changes, remove the old source+layer and add a new one
    // with the updated URL. If layerData is null/undefined, just remove and
    // stop — leaving the map with no raster layer.
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapLoadedRef.current) return;

        // Always clean up first (layer before source — Mapbox enforces this order).
        if (map.getLayer(RASTER_LAYER_ID)) map.removeLayer(RASTER_LAYER_ID);
        if (map.getSource(RASTER_SOURCE_ID)) map.removeSource(RASTER_SOURCE_ID);

        // =====
        const addLine = false;
        if(addLine){
            const startLng = 0.0;
            const startLat = 50.1;

            // 10km in degrees latitude ≈ 0.0899 degrees
            // For longitude, divide by cos(lat) to account for Earth's curvature
            const km = 1;

            const kmToDegLat = km / 111.32;
            const kmToDegLng = km / (111.32 * Math.cos(startLat * Math.PI / 180));

            map.addSource('line', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [startLng, startLat],
                            [startLng + kmToDegLng, startLat] // horizontal line going east
                        ]
                    }
                }
            });

            map.addLayer({
                id: 'line-layer',
                type: 'line',
                source: 'line',
                paint: {
                    'line-color': '#ff0000',
                    'line-width': 3
                }
            });
            // =====
        }

        // if(boundary){
        if(boundary){
            if(!map.getSource('nuts3')){
                map.addSource('nuts3', {
                    type: 'geojson',
                    data: boundaries.active[boundary],
                    // data: boundaries.active.nuts3,
                    generateId: true,  // auto-assigns feature IDs for feature-state
                });

                // 2. Fill layer
                map.addLayer({
                        id: 'nuts3-fill',
                        type: 'fill',
                        source: 'nuts3',
                        paint: {
                            'fill-color': [
                                'case',
                                ['boolean', ['feature-state', 'selected'], false], '#2563eb',
                                ['boolean', ['feature-state', 'hovered'],  false], '#93c5fd',
                                '#dbeafe',
                            ],
                            'fill-opacity': [
                                'case',
                                ['boolean', ['feature-state', 'selected'], false], 0.7,
                                ['boolean', ['feature-state', 'hovered'],  false], 0.5,
                                0.8,
                            ],
                        },
                    },
                    // "my-layer"
                    "settlement-subdivision-label"
                );

                map.addLayer({
                        id: 'nuts3-line',
                        type: 'line',
                        source: 'nuts3',
                        paint: {
                            'line-color': [
                                'case',
                                ['boolean', ['feature-state', 'selected'], false], '#1d4ed8',
                                'rgb(186,209,244)',
                            ],
                            'line-width': [
                                'case',
                                ['boolean', ['feature-state', 'selected'], false], 2,
                                0.5,
                            ],
                        },
                    },
                    // "my-layer"
                    "settlement-subdivision-label"
                );
            }
        }else{
            if (map.getSource('nuts3')) {
                // map.off('mousemove', 'nuts3-fill', onMouseMove);
                // map.off('mouseleave', 'nuts3-fill', onMouseLeave);
                // map.off('click',     'nuts3-fill', onClick);

                if (map.getLayer('nuts3-fill')) map.removeLayer('nuts3-fill');
                if (map.getLayer('nuts3-line')) map.removeLayer('nuts3-line');
                if (map.getSource('nuts3'))     map.removeSource('nuts3');
            }
        }


        // Only add back if a layer key was provided.
        if (!layerData) return;
        // map.on('click', RASTER_LAYER_ID, (e) => {
        //     console.log(e.features[0].properties);
        // });
        console.log("===layerData===", layerData)
        if(layerData.endsWith("3d")){
            map.setMaxZoom(initMapState.maxZoom3D);
            map.setMinZoom(initMapState.minZoom3D);
            map.addSource(RASTER_SOURCE_ID, {
                type: "vector",
                tiles: [buildTilesUrl(layerData, ghsYear, "3d")],
                // url: "https://d1yxfth9bblueo.cloudfront.net/ghs_pop_3d_euro_all.pmtiles",
                minzoom: 0,
                maxzoom: 10,
                attribution: "© European Commission JRC GHSL",
                tileSize: 512,
            });

            map.addLayer({
                id: RASTER_LAYER_ID,
                type: "fill-extrusion",
                source: RASTER_SOURCE_ID,
                "source-layer": "population",   // ← must match --layer= in tippecanoe
                filter: [">=", ["to-number", ["get", "pop"], 100], 0],
                paint: {
                    "fill-extrusion-height": [
                        "interpolate", ["linear"], ["zoom"],
                        2,  ["*", ["get", "pop"], 0.24],
                        4,  ["*", ["get", "pop"], 0.24],
                        5,  ["*", ["get", "pop"],  0.64],
                        7,  ["*", ["get", "pop"],  0.64],
                        8,  ["*", ["get", "pop"],  3.19],
                        10, ["*", ["get", "pop"],  1.50],
                    ],
                    // "fill-extrusion-color": [
                    //     "interpolate", ["linear"],
                    //     ["ln", ["max", ["get", "pop"], 1]],
                    //     0,    "rgb(255,255,255)",
                    //     4.0,  "rgb(246, 242, 233)",
                    //     8.0,  "rgb(238, 232, 215)",
                    //     11.5, "rgb(195, 211, 186)",
                    //     12.5, "rgb(21, 86, 96)",
                    // ],
                    "fill-extrusion-color": [
                        "case",
                        ["==", ["to-number", ["get", "isCity"]], 0], "#888888",
                        ["interpolate", ["linear"], ["get", "pop"],
                            0, "#ffbebe",
                            50000, "#ec5656",
                            500000, "#7f0000"
                        ]
                    ],
                    "fill-extrusion-opacity": [
                        "interpolate", ["linear"], ["zoom"],
                        2,  0.95,
                        8,  0.90,
                        10, 0.85,
                    ],
                    "fill-extrusion-cutoff-fade-range": 0.15,
                    // "fill-extrusion-vertical-gradient": true,
                    // "fill-extrusion-base": 0,
                }
            },"settlement-subdivision-label");

            // map.on('click', RASTER_LAYER_ID, (e) => {
            //     if (e.features.length > 0) {
            //         const props = e.features[0].properties;
            //         console.log('pop:', props.pop, 'isCity:', props.isCity, typeof props.isCity);
            //         alert(`pop: ${props.pop}, isCity: ${props.isCity}, type: ${typeof props.isCity}`);
            //     }
            // });

            onResetViewPort(true, false);
        }else{
            map.setMaxZoom(initMapState.maxZoom);
            map.setMinZoom(initMapState.minZoom);
            map.addSource(RASTER_SOURCE_ID, {
                type: "raster",
                tiles: [buildTilesUrl(layerData, ghsYear, "flat")],
                tileSize: 256,
                minzoom: 0,
                maxzoom: 8,
                attribution: "© European Commission JRC GHSL",
            });

            map.addLayer(
                {
                    id: RASTER_LAYER_ID,
                    type: "raster",
                    source: RASTER_SOURCE_ID,
                    paint: PAINTS[layerData],
                },
                "settlement-subdivision-label"
            );

        }
        // map.moveLayer('my-layer');
    }, [layerData, ghsYear, boundary, boundaries]);

    const onZoomIn = () => mapRef.current?.zoomIn();
    const onZoomOut = () => mapRef.current?.zoomOut();

    const onResetViewPort = (to3D: boolean=false, toCenter: boolean=true) => {
        const params: Record<string, unknown> = to3D?{
            bearing: 39,
            pitch: 64,
            // zoom: 7.1,
            zoom: 6.1,
        }:{
            bearing: 0,
            pitch: 0,
            zoom: initMapState.zoom
        }
        if (toCenter){
            params["center"] = initMapState.center
        }
        mapRef.current?.flyTo(params);
    }

    return (
        <div style={{ height: "100%", position: "relative" }}>
            <div id='map-container' ref={mapContainerRef} style={{ height: '100%' }} />
            <Space
                orientation="vertical"
                style={{ position: "absolute", right: "8px", top: "8px" }}
            >
                <FloatButton.Group
                    shape="square"
                    style={{ position: "relative", right: "0px", top: "0px" }}
                >
                    <FloatButton icon={<PlusOutlined />} onClick={onZoomIn} />
                    <FloatButton icon={<MinusOutlined />} onClick={onZoomOut} />
                </FloatButton.Group>
                <FloatButton
                    shape="square"
                    icon={<UndoOutlined />}
                    onClick={()=>onResetViewPort(layerData?.endsWith("3d"))}
                    style={{ position: "relative", right: "0px", top: "0px" }}
                />
                <Button onClick={
                    ()=>{
                        message.info(JSON.stringify({
                            bearing: mapRef.current?.getBearing(),
                            pitch: mapRef.current?.getPitch(),
                            zoom: mapRef.current?.getZoom(),
                        }), 100)
                    }
                }>{zoom.toFixed(2)}</Button>
            </Space>
            {/*<DebugInfo data={[geoJsonValues]} />*/}
            {boundaries&&(
                <DebugInfo data={[boundaries]} />
            )}
        </div>
    );
}
