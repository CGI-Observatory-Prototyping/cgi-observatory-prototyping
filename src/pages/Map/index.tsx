import MapView from "@/pages/Map/components/MapView";
import React, {useCallback, useEffect, useReducer, useState} from "react";
import {getCitySchema, getIndicatorSchema, getMapBoxToken, searchValue} from "@/services/api";
import DebugInfo from "@/components/DebugInfo";
import {filterReducer, initialFilterState} from "@/pages/Map/filterState";
import ToolBar from "@/pages/Map/components/ToolBar";

export default function MapPage() {

    const [citySchema, setCitySchema] = useState<Array<City>|null>(null);
    const [indicatorSchema, setIndicatorSchema] = useState<Array<Indicator>|null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [mapboxToken, setMapboxToken] = useState<string|null>(null);

    const [filterState, filterDispatch] = useReducer(filterReducer, initialFilterState);

    const [indicatorValues, setIndicatorValues] = useState<Array<IndicatorValue>>([]);

    const initialize = useCallback(async () => {
        const cityResponse = await getCitySchema();
        const indicatorResponse = await getIndicatorSchema();
        return {cityResponse, indicatorResponse};
    }, [])

    useEffect(() => {
        setLoading(true);
        initialize().then(res=>{
            setCitySchema(res.cityResponse);
            setIndicatorSchema(res.indicatorResponse);
            getMapBoxToken().then(token=>setMapboxToken(token));
        }).finally(()=>{
            setLoading(false);
        });
    }, [])

    // useEffect(() => {
    //     getMapBoxToken().then(token=>setMapboxToken(token));
    // }, []);

    useEffect(() => {
        searchValue(filterState.year, filterState.indicator).then(res=>{
            setIndicatorValues(res);
        })
    }, [filterState]);

    if (loading) {
        return <>Loading ...</>
    }

    if(!mapboxToken){
        return <>Map service not available.</>
    }

    if(!citySchema) {
        return (
            <div>Cannot load data.</div>
        )
    }

    return (
        <div style={{position:"relative", backgroundColor: "#e3fffd", height: "100%" }}>
            <MapView
                citySchema={citySchema} indicatorValues={indicatorValues}
                year={filterState.year} layerData={filterState.layer}
                mapboxToken={mapboxToken} showBoundaries={filterState.showBoundaries}
                boundry={filterState.boundary}
            />
            <div style={{position:"absolute", left:"8px", top:"8px"}}>
                <ToolBar
                    filterState={filterState} filterDispatch={filterDispatch}
                    indicatorSchema={indicatorSchema?.filter(x=>!x.indicator_code.endsWith("PC"))}
                />
            </div>
            {/*<DebugInfo data={[*/}
            {/*    // citySchema, indicatorSchema,*/}
            {/*    indicatorValues,*/}
            {/*    // indicatorSchema,*/}
            {/*]} />*/}
            {/*<DebugInfo data={[filterState]} />*/}
        </div>
    );
}
