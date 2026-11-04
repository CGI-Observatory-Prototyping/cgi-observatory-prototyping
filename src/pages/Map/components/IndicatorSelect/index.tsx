import React, {useMemo} from "react";
import {Button, Dropdown, Menu, Space} from "antd";
import {convertIndicatorToMenuItems, convertToCascadingMenu} from "@/pages/Map/components/IndicatorSelect/utils";
import {DownOutlined} from "@ant-design/icons";

interface IndicatorSelectProps {
    value: string;
    onChange: (value: string) => void;
    indicatorSchema: Array<Indicator>;
}

export default function IndicatorSelect(props: IndicatorSelectProps): React.ReactNode {

    const {value, onChange, indicatorSchema} = props;

    const items = useMemo(() => convertToCascadingMenu(indicatorSchema), [indicatorSchema]);
    const indicatorNames = useMemo(()=>{
        return Object.fromEntries(indicatorSchema.map(i=>{
            return [i.indicator_code, i.indicator_name]
        }))
    }, [indicatorSchema]);

    const [selected, setSelected] = React.useState<string>(value);

    const onSelect = (value: string) => {
        setSelected(value);
        onChange(value);
    }

    return (
        <>
            <Dropdown
                trigger={["click"]}
                menu={{ items, onClick: (e)=>{
                        onSelect(e.key);
                    },
                    triggerSubMenuAction: "click",
                    popupRender: (node, props)=>(
                        <div style={{
                            // background:"rgb(228,117,117)",
                            maxHeight:"60vh",
                            maxWidth:"200px",
                            overflow:"auto",
                        }}>
                            {node}
                        </div>
                    )
                }}>
                <Button block onClick={(e)=>{e.preventDefault()}}>
                    <Space>{indicatorNames[selected]} <DownOutlined style={{color:"rgba(0,0,0,0.25)"}}/></Space>
                </Button>
            </Dropdown>
        </>
    )
}

// export default function IndicatorSelect(props: IndicatorSelectProps): React.ReactNode {
//
//     const {value, onChange, indicatorSchema} = props;
//
//     return (
//         <>
//             <Menu
//                 className="ant-select ant-select-outlined css-var-r0 ant-select-css-var css-dev-only-do-not-override-tql0nm ant-select-single ant-select-show-arrow"
//                 style={{padding:'0px'}}
//                 // mode="vertical"
//                 mode="inline"
//                 items={convertIndicatorToMenuItems(indicatorSchema)}
//                 onClick={(e) => {
//                     onChange(e.key);
//                 }}
//             />
//         </>
//     )
// }
