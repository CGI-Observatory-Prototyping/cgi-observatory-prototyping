import {Dispatch, ReactNode} from "react";
import {Button, ColorPicker, Divider, Form, InputNumber, Select, Space, Switch} from "antd";
import {FilterAction, FilterState} from "@/pages/Map3D/filterState";
import RangeSlider from "@/components/Slider";
import {RedoOutlined} from "@ant-design/icons";
import { DEFAULT_MAP_LABEL_COLOR, DEFAULT_MAP_LABEL_OUTLINE_COLOR } from '@/mapLabelStyle';

interface ToolBarProps {
    filterState: FilterState;
    filterDispatch: Dispatch<FilterAction>;
}

export default function ToolBar(props: ToolBarProps): ReactNode {

    const {filterState, filterDispatch} = props;

    return (
        <div style={{
            background:"rgba(255,255,255,0.82)",
            padding: "16px",
            borderRadius: "8px"
        }}>
            <Form
                // layout="vertical"
                // style={{minWidth:"400px"}}
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
            >
                <Form.Item
                    label="Zoom Range"
                    name="zoomRange"
                >
                    <RangeSlider
                        style={{minWidth:"160px"}}
                        max={12} min={2} step={0.1}
                        defaultValue={[4,7]}
                        onChange={v=>filterDispatch({type: "zoomRange", payload: v})}
                    />
                </Form.Item>
                <Form.Item
                    label="Min Value"
                    tooltip="Area with population below this value will be ignored."
                >
                    <InputNumber
                        defaultValue={0} min={0} max={10000}
                        onChange={v=>filterDispatch({type: "minValue", payload: v||0})}
                    />
                </Form.Item>

                <Form.Item label="Label Fill">
                    <Space>
                        <ColorPicker
                            format="hex"
                            disableAlpha
                            showText
                            value={filterState.labelColor}
                            onChange={color => filterDispatch({type: "labelColor", payload: color.toHexString()})}
                        />
                        <Button
                            size="small"
                            icon={<RedoOutlined />}
                            aria-label="Reset label color"
                            title="Reset label color"
                            onClick={() => filterDispatch({type: "labelColor", payload: DEFAULT_MAP_LABEL_COLOR})}
                        />
                    </Space>
                </Form.Item>

                <Form.Item label="Label Outline">
                    <Space>
                        <ColorPicker
                            format="hex"
                            disableAlpha
                            showText
                            value={filterState.labelOutlineColor}
                            onChange={color => filterDispatch({type: "labelOutlineColor", payload: color.toHexString()})}
                        />
                        <Button
                            size="small"
                            icon={<RedoOutlined />}
                            aria-label="Reset label outline color"
                            title="Reset label outline color"
                            onClick={() => filterDispatch({type: "labelOutlineColor", payload: DEFAULT_MAP_LABEL_OUTLINE_COLOR})}
                        />
                    </Space>
                </Form.Item>

                <Form.Item
                    label="City Boundary"
                >
                    <Switch defaultValue={false} onChange={(v)=>{
                        filterDispatch({type:"showBoundaries", payload:v})
                    }}/>
                </Form.Item>

                {filterState.showBoundaries&&(
                    <Form.Item
                        label="City Color"
                    >
                        <Space>
                            <Button
                                size="small"
                                // type="text"
                                icon={<RedoOutlined />}
                                onClick={()=>{
                                    // filterDispatch({type: "cityColorInside", payload: "#ffbebe"});
                                    filterDispatch({type: "cityColorInside", payload: "#fde7e7"});
                                    filterDispatch({type: "cityColorOutside", payload: "#888888"});
                                }}
                            />
                            {/*<ColorPicker*/}
                            {/*    format="hex"*/}
                            {/*    defaultValue="#fde7e7"*/}
                            {/*    value={filterState.cityColorInside}*/}
                            {/*    onChange={(v)=>{*/}
                            {/*        filterDispatch({type: "cityColorInside", payload: v.toHexString()});*/}
                            {/*    }}*/}
                            {/*/>Inside*/}
                            <ColorPicker
                                format="hex"
                                defaultValue="#888888"
                                value={filterState.cityColorOutside}
                                onChange={(v)=>{
                                    filterDispatch({type: "cityColorOutside", payload: v.toHexString()});
                                }}
                            />Outside
                        </Space>

                    </Form.Item>
                )}

                <Form.Item
                    label="Show 3D"
                >
                    <Switch defaultValue={false} onChange={(v)=>{
                        filterDispatch({type:"show3D", payload:v})
                    }}/>
                </Form.Item>

                <Form.Item
                    label="Boundary"
                >
                    <Select
                        defaultValue="gadm"
                        options={[
                            {label: "CGI GADM boundaries", value:"gadm"},
                            {label: "Territorial units for statistics (NUTS)", value:"nuts3"},
                            {label: "Cities and functional urban areas", value:"urau"},
                        ]}
                        onChange={(v)=>{
                            filterDispatch({type:"boundary", payload:v})
                        }}
                    />

                </Form.Item>

                <Form.Item
                    label="Mock Data"
                >
                    <Select
                        defaultValue="feature1"
                        options={[
                            {label: "Mock Data 1", value:"feature1"},
                            {label: "Mock Data 2", value:"feature2"},
                            {label: "Mock Data 3", value:"feature3"},
                        ]}
                        onChange={(v)=>{
                            filterDispatch({type:"indicator", payload:v})
                        }}
                    />

                </Form.Item>

            </Form>
        </div>
    )
}
