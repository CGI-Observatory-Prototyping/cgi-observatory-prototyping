import React, {CSSProperties} from "react";
import {Input, InputNumber, Slider, Space} from "antd";

interface RangeSliderProps {
    value?: number[];
    onChange?: (value: number[]) => void;
    min?: number;
    max?: number;
    step?: number;
    style?: CSSProperties;
    defaultValue?: number[];
}

export default function RangeSlider(props: RangeSliderProps): React.ReactNode {

    const {value, style, onChange, min = 0, max = 12, step = 0.1, defaultValue = [0, 12]} = props;

    // const [inputValue, setInputValue] = React.useState<number[]>([0,12]);
    //
    // const onInputChange = (value: number[]) => {
    //     setInputValue(value);
    //
    // }

    return (
        <Space>
            {/*<InputNumber*/}
            {/*    onChange={v=>{*/}
            {/*        setInputValue(prevState => [v as number||min, prevState[1]])*/}
            {/*    }}*/}
            {/*/>*/}
            <div style={{minWidth:"22px"}}>
                {value?.[0]==0?0:value?.[0]||defaultValue?.[0]}
            </div>
            <Slider
                style={style}
                min={min} max={max}
                step={step}
                value={value}
                range defaultValue={defaultValue}
                onChange={onChange}
            />
            <div style={{minWidth:"28px"}}>
                {value?.[1]||defaultValue?.[1]}
            </div>
            {/*<InputNumber*/}
            {/*    onChange={v=>{*/}
            {/*        setInputValue(prevState => [prevState[0], v as number||max])*/}
            {/*    }}*/}
            {/*/>*/}
        </Space>
    )
}
