import type { GeoJSONSource } from 'mapbox-gl';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Button, FloatButton, message, Space } from "antd";
import { MinusOutlined, PlusOutlined, UndoOutlined } from "@ant-design/icons";
import { initMapState } from "@/pages/Map3D/components/MapView/config";
import { getLocale, useModel } from 'umi';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import { applyMapLabelStyle } from '@/mapLabelStyle';
import {FilterState} from "@/pages/Map3D/filterState";
import DebugInfo from "@/components/DebugInfo";
import {RandomInt, randomInt, redShade} from "@/pages/Map3D/components/MapView/utils";
import {mockData} from "@/pages/Map3D/components/MapView/mock";
import boundaries from "@/services/mockdata/boundaries";

interface MapViewProps {
    mapboxToken: string;
    showBoundaries?: boolean;
    filterState: FilterState;
}

const LangMap: Record<string, string> = {
    "zh-CN": "zh-Hans",
    "en-US": "en",
};

// const VECTOR_SOURCE_ID = "raster-pop";
// const VECTOR_LAYER_ID  = "raster-population";
const YEAR = 2020;
const VECTOR_TYPE = "pbf";

const POP3D_CITY_SOURCE_ID = "pop3d-city-source";
const POP3D_CITY_LAYER_ID = "pop3d-city-layer";
const POP3D_NONCITY_SOURCE_ID = "pop3d-noncity-source";
const POP3D_NONCITY_LAYER_ID = "pop3d-noncity-layer";

const NUTS3_CITY_SOURCE_ID = "nuts3-city-source"
const NUTS3_CITY_LAYER_ID = "nuts3-city-layer"
const NUTS3_NONCITY_SOURCE_ID = "nuts3-noncity-source"
const NUTS3_NONCITY_LAYER_ID = "nuts3-noncity-layer"

const buildTilesURL_S3 = (bd: string, split: string="active") => {
    return `https://d1yxfth9bblueo.cloudfront.net/${bd}_${split}.pmtiles`
}

// The feature property that holds the numeric city value.
// Must match what buildIndicatorGeoJSON() writes into each feature.

export default function MapView(props: MapViewProps): React.ReactNode {
    const {
        // citySchema, indicatorValues,
        mapboxToken, filterState
    } = props;
    const layerData = "ghs_pop_3d";

    const {
        minValue, cityColorInside, cityColorOutside, zoomRange,
        show3D, showBoundaries, boundary
    } = filterState;

    const mapRef = useRef<mapboxgl.Map | null>(null);
    const mapLangRef = useRef<MapboxLanguage | null>(null);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapLoadedRef = useRef(false);
    const labelColorRef = useRef(filterState.labelColor);
    const labelOutlineColorRef = useRef(filterState.labelOutlineColor);

    useEffect(() => {
        labelColorRef.current = filterState.labelColor;
        labelOutlineColorRef.current = filterState.labelOutlineColor;
        if (mapRef.current && mapLoadedRef.current) {
            applyMapLabelStyle(mapRef.current, filterState.labelColor, filterState.labelOutlineColor);
        }
    }, [filterState.labelColor, filterState.labelOutlineColor]);
    const coloredFeatureIds = useRef(new Set());

    const cityValueIndex = useMemo(()=>{
        return mockData[filterState.indicator];
    }, [filterState.indicator])

    const activeFormatted = useMemo(()=>{
        const activeNew = Object.fromEntries(Object.entries(
            boundaries.active[boundary]
        ));
        activeNew.features.forEach(feature => {
            // console.log("feature.properties:", feature.properties)
            const cgi_name = feature.properties.CGI_Name; // your numeric property
            const city_value = cityValueIndex[cgi_name]
            if(city_value){
                // console.log("city_value:", city_value);
                feature.properties._color = redShade(city_value); // store result
                // console.log("redShade(city_value):", redShade(city_value));
            }else{
                feature.properties._color = cityColorInside
            }
        });
        return activeNew;
    }, [boundary, boundaries, cityColorInside]);

    const changeNutsLayerVisibility = useCallback((map: mapboxgl.Map|null)=>{
        if(!map||!mapLoadedRef.current) return;
        const visible = showBoundaries?'visible':'none';
        map.setLayoutProperty(NUTS3_CITY_LAYER_ID, 'visibility', visible);
        map.setLayoutProperty(NUTS3_NONCITY_LAYER_ID, 'visibility', visible);
    }, [showBoundaries]);

    const addNutsCityLayer = useCallback((
        map: mapboxgl.Map|null
    )=>{
        if(!map||!mapLoadedRef.current) return;
        map.addSource(NUTS3_CITY_SOURCE_ID, {
            type: 'geojson',
            data: activeFormatted,
            generateId: true,  // auto-assigns feature IDs for feature-state
        });

        // 2. Fill layer
        map.addLayer({
                id: NUTS3_CITY_LAYER_ID,
                type: 'fill',
                source: NUTS3_CITY_SOURCE_ID,
                paint: {
                    'fill-color': ['get', '_color']
                },
            },
            // "my-layer"
            "settlement-subdivision-label"
        );
    }, [activeFormatted])

    const updateNutsCityLayer = useCallback((
        map: mapboxgl.Map|null
    )=>{
        if(!map||!mapLoadedRef.current) return;
        if (map.getSource(NUTS3_CITY_SOURCE_ID)){
            (map.getSource(NUTS3_CITY_SOURCE_ID) as GeoJSONSource)?.setData(activeFormatted);
            map.setPaintProperty(NUTS3_CITY_LAYER_ID, 'fill-color', ['get', '_color'])
        }
    }, [activeFormatted])

    const addNutsNonCityLayer = useCallback((map: mapboxgl.Map|null)=>{
        if(!map) return;
        map.addSource(NUTS3_NONCITY_SOURCE_ID, {
            type: 'geojson',
            data: boundaries.inactive[boundary],
            generateId: true,  // auto-assigns feature IDs for feature-state
        });

        map.addLayer({
                id: NUTS3_NONCITY_LAYER_ID,
                type: 'fill',
                source: NUTS3_NONCITY_SOURCE_ID,
                paint: {
                    'fill-color': cityColorOutside,
                },
            },
            "settlement-subdivision-label"
        );
    }, [boundaries, boundary, cityColorOutside])

    const updateNutsNonCityLayer = useCallback((map: mapboxgl.Map|null)=>{
        if(!map) return;
        if(map.getSource(NUTS3_NONCITY_SOURCE_ID)){
            map.setPaintProperty(NUTS3_NONCITY_LAYER_ID, 'fill-color', cityColorOutside)
        }
    }, [cityColorOutside, boundary, boundaries])

    const apply3DFeatureStates = useCallback((map: mapboxgl.Map)=>{
        const features = map.querySourceFeatures(POP3D_CITY_SOURCE_ID, {
            sourceLayer: 'population'
        });

        // console.log("=== sourcedata ===");
        const ri = new RandomInt();

        features.forEach(feature => {

            if(feature.id === undefined) return;

            if(coloredFeatureIds.current.has(feature.id)) return;

            const cgi_name = feature.properties.CGI_Name;
            const city_value = cityValueIndex?.[cgi_name];
            // const city_record = geoJsonValues.features.find(i=>i.properties.city_name==cgi_name)

            if(city_value){
                // const city_value = city_record.properties.value;
                if (feature.id !== undefined) {
                    map.setFeatureState(
                        { source: POP3D_CITY_SOURCE_ID, sourceLayer: 'population', id: feature.id },
                        { cityColor:  redShade(city_value)}
                    );
                }
            }else{
                if (feature.id !== undefined) {
                    ri.setSeed(cgi_name);
                    const temp_value = ri.randomInt();
                    map.setFeatureState(
                        { source: POP3D_CITY_SOURCE_ID, sourceLayer: 'population', id: feature.id },
                        { cityColor:  redShade(randomInt(1, 100, temp_value))}
                        // { cityColor:  "#43e132"}
                        // { cityColor:  "#ffffff"}
                        // { cityColor:  cityColorInside}
                    );
                }
            }
            coloredFeatureIds.current.add(feature.id);
        });
    }, [cityValueIndex, boundary, boundaries])

    const change3DLayerVisibility = useCallback((map: mapboxgl.Map|null)=>{
        if(!map||!mapLoadedRef.current) return;
        const visible = show3D?'visible':'none';
        map.setLayoutProperty(POP3D_CITY_LAYER_ID, 'visibility', visible);
        map.setLayoutProperty(POP3D_NONCITY_LAYER_ID, 'visibility', visible);
        // if(show3D){
        //     onResetViewPort(true, false);
        // }else{
        //     onResetViewPort(false, true);
        // }
    }, [show3D]);

    const add3DCityLayer = useCallback((map: mapboxgl.Map|null)=>{
        if(!map) return;
        map.addSource(POP3D_CITY_SOURCE_ID, {
            type: "vector",
            url: buildTilesURL_S3(boundary, "active"),
            minzoom: 2,
            maxzoom: 10,
            attribution: "© European Commission JRC GHSL",
            tileSize: 512,
        });

        map.addLayer({
            id: POP3D_CITY_LAYER_ID,
            type: "fill-extrusion",
            source: POP3D_CITY_SOURCE_ID,
            "source-layer": "population",   // ← must match --layer= in tippecanoe
            filter: [">=", ["get", "pop"], minValue],
            paint: {
                "fill-extrusion-height": [
                    "interpolate", ["linear"], ["zoom"],
                    5,  ["*", ["get", "pop"],  0.64],
                    6,  ["*", ["get", "pop"],  0.48],
                    7,  ["*", ["get", "pop"],  0.36],
                    8,  ["*", ["get", "pop"],  0.36],
                ],
                "fill-extrusion-color": [
                    "case",
                    ["==", ["to-number", ["get", "isCity"]], 0], cityColorOutside,
                    ["!=", ["feature-state", "cityColor"], null],
                    ["feature-state", "cityColor"],
                    // "rgb(255,255,255)"
                    cityColorInside
                ]
                // "fill-extrusion-cutoff-fade-range": 0.15,
                // "fill-extrusion-vertical-gradient": true,
                // "fill-extrusion-base": 0,
            }
        },"settlement-subdivision-label");

    }, [boundary, boundaries])

    const add3DNonCityLayer = useCallback((map: mapboxgl.Map|null)=>{
        if(!map) return;
        map.addSource(POP3D_NONCITY_SOURCE_ID, {
            type: "vector",
            url: buildTilesURL_S3(boundary, "inactive"),
            minzoom: 2,
            maxzoom: 10,
            attribution: "© European Commission JRC GHSL",
            tileSize: 512,
        });

        map.addLayer({
            id: POP3D_NONCITY_LAYER_ID,
            type: "fill-extrusion",
            source: POP3D_NONCITY_SOURCE_ID,
            "source-layer": "population",   // ← must match --layer= in tippecanoe
            filter: [">=", ["get", "pop"], minValue],
            paint: {
                "fill-extrusion-height": [
                    "interpolate", ["linear"], ["zoom"],
                    5,  ["*", ["get", "pop"],  0.64],
                    6,  ["*", ["get", "pop"],  0.48],
                    7,  ["*", ["get", "pop"],  0.36],
                    8,  ["*", ["get", "pop"],  0.36],
                ],
                "fill-extrusion-color": [
                    "case",
                    ["==", ["to-number", ["get", "isCity"]], 0], cityColorOutside,
                    ["!=", ["feature-state", "cityColor"], null],
                    ["feature-state", "cityColor"],
                    // "rgb(255,255,255)"
                    cityColorInside
                ]
                // "fill-extrusion-cutoff-fade-range": 0.15,
                // "fill-extrusion-vertical-gradient": true,
                // "fill-extrusion-base": 0,
            }
        },"settlement-subdivision-label");

    }, [boundary, boundaries])

    const locale = getLocale();

    const [zoom, setZoom] = React.useState(0);

    useEffect(() => {
        // console.log("=== UE onLoad=== ")
        if (!mapContainerRef.current) return;

        mapboxgl.accessToken = mapboxToken;

        mapLoadedRef.current = false;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            projection: initMapState.projection,
            style: initMapState.style,
            center: initMapState.center,
            zoom: initMapState.zoom,
            minZoom: zoomRange[0]||4,
            maxZoom: zoomRange[1]||7,
            maxBounds: initMapState.maxBounds,
        });

        mapRef.current = map;

        const lang = new MapboxLanguage({ defaultLanguage: LangMap[locale] ?? 'en' });
        mapLangRef.current = lang;
        map.addControl(lang);

        map.on('zoomend', ()=>{
            setZoom(map.getZoom());
        })

        map.on('sourcedata', (e) => {
            if (e.sourceId !== POP3D_CITY_SOURCE_ID || !e.isSourceLoaded) return;
            apply3DFeatureStates(map);
        });

        map.on('load', () => {
            applyMapLabelStyle(map, labelColorRef.current, labelOutlineColorRef.current);
            setZoom(map.getZoom());
            mapLoadedRef.current = true;

            addNutsCityLayer(map);
            addNutsNonCityLayer(map);
            changeNutsLayerVisibility(map);

            add3DCityLayer(map);
            add3DNonCityLayer(map);
            change3DLayerVisibility(map);

            onResetViewPort(true, false);
        });

        return () => {
            mapLoadedRef.current = false;
            map.remove();
            mapRef.current = null;
        };
    }, [locale, boundary]); // locale is the only thing that should trigger a full map rebuild

    useEffect(() => {
        // console.log("=== UE cityValueIndex=== ")
        coloredFeatureIds.current.clear();
        if (mapRef.current){
            apply3DFeatureStates(mapRef.current);
        }
    }, [apply3DFeatureStates]);

    useEffect(() => {
        change3DLayerVisibility(mapRef.current);
    }, [show3D]);

    useEffect(() => {
        changeNutsLayerVisibility(mapRef.current);
    }, [changeNutsLayerVisibility]);

    useEffect(() => {
        updateNutsCityLayer(mapRef.current);
    }, [updateNutsCityLayer]);

    useEffect(() => {
        updateNutsNonCityLayer(mapRef.current);
    }, [updateNutsNonCityLayer]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.getLayer(POP3D_CITY_LAYER_ID)) return;

        map.setFilter(POP3D_CITY_LAYER_ID, [">=", ["get", "pop"], minValue]);

        // Update extrusion height
        map.setPaintProperty(POP3D_CITY_LAYER_ID, "fill-extrusion-height", [
            "interpolate", ["linear"], ["zoom"],
            5,  ["*", ["get", "pop"],  0.64],
            6,  ["*", ["get", "pop"],  0.48],
            7,  ["*", ["get", "pop"],  0.48],
            8,  ["*", ["get", "pop"],  0.36],
        ]);

        map.setPaintProperty(POP3D_CITY_LAYER_ID, "fill-extrusion-color", [
            "case",
            ["==", ["to-number", ["get", "isCity"]], 0], cityColorOutside,
            ["!=", ["feature-state", "cityColor"], null],
            ["feature-state", "cityColor"],
            // "rgb(255,255,255)"
            cityColorInside
        ]);


        if (!map || !map.getLayer(POP3D_NONCITY_LAYER_ID)) return;

        map.setFilter(POP3D_NONCITY_LAYER_ID, [">=", ["get", "pop"], minValue]);

        // Update extrusion height
        map.setPaintProperty(POP3D_NONCITY_LAYER_ID, "fill-extrusion-height", [
            "interpolate", ["linear"], ["zoom"],
            5,  ["*", ["get", "pop"],  0.64],
            6,  ["*", ["get", "pop"],  0.48],
            7,  ["*", ["get", "pop"],  0.48],
            8,  ["*", ["get", "pop"],  0.36],
        ]);

        map.setPaintProperty(POP3D_NONCITY_LAYER_ID, "fill-extrusion-color", [
            "case",
            ["==", ["to-number", ["get", "isCity"]], 0], cityColorOutside,
            ["!=", ["feature-state", "cityColor"], null],
            ["feature-state", "cityColor"],
            // "rgb(255,255,255)"
            cityColorInside
        ]);

        map.setPaintProperty("outside-mask", "fill-color", cityColorOutside)

    }, [cityColorOutside, cityColorInside, minValue /*, other deps */]);

    useEffect(() => {
        if(mapRef.current){
            mapRef.current.setMinZoom(zoomRange[0]);
            mapRef.current.setMaxZoom(zoomRange[1]);
        }
    }, [zoomRange]);

    const onZoomIn = () => mapRef.current?.zoomIn();
    const onZoomOut = () => mapRef.current?.zoomOut();

    const onResetViewPort = (to3D: boolean=false, toCenter: boolean=true) => {
        const params: Record<string, unknown> = to3D?{
            bearing: 39,
            pitch: 64,
            zoom: 6,
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
            <DebugInfo data={[filterState]} />
            {/*<DebugInfo data={[nuts3b.features.map(i=>i.properties)]} />*/}
        </div>
    );
}
