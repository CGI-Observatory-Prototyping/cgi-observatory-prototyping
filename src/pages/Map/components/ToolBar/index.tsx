import {Dispatch, ReactNode} from "react";
import {Form, Select, Space, Switch} from "antd";
import {range} from "@/utils";
import {FilterAction, FilterState, initialFilterState} from "@/pages/Map/filterState";
import IndicatorSelect from "../IndicatorSelect";

interface ToolBarProps {
    filterState: FilterState;
    filterDispatch: Dispatch<FilterAction>;
    indicatorSchema?: Array<Indicator>;
}

export default function ToolBar(props: ToolBarProps): ReactNode {

    const {filterState, filterDispatch, indicatorSchema} = props;

    return (
        <div style={{
            background:"rgba(255,255,255,0.82)",
            padding: "8px",
            borderRadius: "8px"
        }}>
            <Space orientation="vertical">
                <Select
                    defaultValue={filterState.year}
                    style={{
                        width: "100%",
                        minWidth:"100px"
                    }}
                    onChange={(value: number)=>{
                        filterDispatch({type: "year", payload: value})
                    }}
                    options={range(2024,2009, -1).map(year=>({value: year, label: year}))}
                />
                <Select
                    defaultValue={filterState.layer}
                    style={{
                        width: "100%",
                        minWidth:"120px"
                    }}
                    onChange={(value: string|null)=>{
                        filterDispatch({type: "layer", payload: value})
                    }}
                    options={[
                        {value: null, label: "No Layer"},
                        {value: "ghs_pop", label: "Population"},
                        // {value: "ghs_pop_3d", label: "Population 3D"},
                        {value: "ghs_smod", label: "Settlement Model"},
                    ]}
                />
                <div
                    style={{minWidth:"200px", maxWidth:"400px", maxHeight:"600px", overflow:"auto"}}
                >
                    {indicatorSchema&&(
                        <IndicatorSelect
                            value={initialFilterState.indicator} onChange={value => filterDispatch({type: "indicator", payload: value})}
                            indicatorSchema={indicatorSchema}/>
                    )}
                </div>
                {/*<Space>*/}
                {/*    City Boundaries:*/}
                {/*    <Switch size="small" onChange={(value: boolean)=>{*/}
                {/*        filterDispatch({type: "showBoundaries", payload: value})*/}
                {/*    }}/>*/}
                {/*</Space>*/}
                <Select
                    style={{
                        width: "100%",
                        minWidth:"120px"
                    }}
                    defaultValue={null}
                    options={[
                        {label: "No Boundary", value:null},
                        {label: "CGI GADM boundaries", value:"gadm"},
                        {label: "Territorial units for statistics (NUTS)", value:"nuts3"},
                        {label: "Cities and functional urban areas", value:"urau"},
                    ]}
                    onChange={(v)=>{
                        filterDispatch({type:"boundary", payload:v})
                    }}
                />
            </Space>
        </div>
    )
}
