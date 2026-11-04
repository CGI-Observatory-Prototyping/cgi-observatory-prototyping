import {Menu, MenuProps, Space} from "antd";
import {
    GlobalOutlined, InteractionOutlined, LineChartOutlined,
    UnorderedListOutlined
} from "@ant-design/icons";
import {SelectLang, history, useLocation, FormattedMessage, getLocale} from "umi";
import {useEffect, useState} from "react";

type MenuItem = Required<MenuProps>['items'][number];
const items: MenuItem[] = [
    {
        label: <FormattedMessage id="menu.map" defaultMessage="2D Map"/>,
        key: 'map',
        icon: <GlobalOutlined />
    },
    {
        label: <FormattedMessage id="menu.map3d" defaultMessage="3D Map"/>,
        key: 'map3d',
        icon: <GlobalOutlined />
    },
    // {
    //     label: <FormattedMessage id="menu.cities" defaultMessage="Cities"/>,
    //     key: 'cities',
    //     icon: <UnorderedListOutlined />
    // },
    // {
    //     label: <FormattedMessage id="menu.compare" defaultMessage="Compare"/>,
    //     key: 'compare',
    //     icon: <InteractionOutlined />,
    //     disabled: true,
    // },
    // {
    //     label: <FormattedMessage id="menu.evolution" defaultMessage="Evolution" />,
    //     key: 'evolution',
    //     icon: <LineChartOutlined />
    // },
];

export default function Header() {

    const location = useLocation();
    const key = location.pathname.split("/")[1];
    const [current, setCurrent] = useState<string>(key);

    const locale = getLocale();

    useEffect(()=>{
        setCurrent(location.pathname.split("/")[1]);
    }, [location])

    const onClick: MenuProps['onClick'] = (e) => {
        setCurrent(e.key);
        history.push(`/${e.key}`);
    };

    return (
        <div style={{display: "flex", justifyContent: "space-between"}}>
            <Space align="center">
                <div style={{ marginLeft: "16px" }}>
                    CGI Observatory
                </div>
                <Menu disabledOverflow onClick={onClick} selectedKeys={[current]} mode="horizontal" items={items} />
            </Space>
            <Space>
                {/*{locale}*/}
                <SelectLang reload={true}/>
            </Space>
        </div>
    )
}
