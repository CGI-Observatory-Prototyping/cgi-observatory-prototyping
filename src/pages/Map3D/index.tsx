import MapView from "@/pages/Map3D/components/MapView";
import {useCallback, useEffect, useReducer, useState} from "react";
import {getCitySchema, getIndicatorSchema, getMapBoxToken, searchValue} from "@/services/api";
import DebugInfo from "@/components/DebugInfo";
import {filterReducer, initialFilterState} from "@/pages/Map3D/filterState";
import ToolBar from "@/pages/Map3D/components/ToolBar";
import {useModel} from "umi";

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

    useEffect(() => {
        searchValue(filterState.year, filterState.indicator).then(res=>{
            console.log("=== UE searchValue ===");
            setIndicatorValues(res);
        })
    }, [filterState.year, filterState.indicator]);

    if (loading) {
        return <>Loading ...</>
    }

    if(!mapboxToken){
        return <>Map service not available.</>
    }

    return (
        <div style={{position:"relative", backgroundColor: "#e3fffd", height: "100%" }}>
            <MapView
                // citySchema={citySchema} indicatorValues={indicatorValues}
                mapboxToken={mapboxToken} showBoundaries={filterState.showBoundaries}
                filterState={filterState}
            />
            <div style={{position:"absolute", left:"8px", top:"8px"}}>
                <ToolBar
                    filterState={filterState} filterDispatch={filterDispatch}
                />
            </div>
        </div>
    );
}
