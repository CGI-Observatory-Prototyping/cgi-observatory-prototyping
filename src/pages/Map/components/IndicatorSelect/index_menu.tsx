import React from "react";
import {Menu} from "antd";
import {convertIndicatorToMenuItems} from "@/pages/Map/components/IndicatorSelect/utils";

interface IndicatorSelectProps {
    value: string;
    onChange: (value: string) => void;
    indicatorSchema: Array<Indicator>;
}

export default function IndicatorSelect(props: IndicatorSelectProps): React.ReactNode {

    const {value, onChange, indicatorSchema} = props;

    return (
        <>
            <Menu
                mode="vertical" items={convertIndicatorToMenuItems(indicatorSchema)}
                onClick={(e) => {
                    onChange(e.key);
                }}
            />
        </>
    )
}
