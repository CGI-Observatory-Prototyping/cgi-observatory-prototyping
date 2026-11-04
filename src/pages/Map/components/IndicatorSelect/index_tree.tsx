import React, { useMemo, useState } from 'react';
import { Input, Tree } from 'antd';
import type { TreeDataNode } from 'antd';
import {convertToTreeData, generateFlatList} from "@/pages/Map/components/IndicatorSelect/utils";

const { Search } = Input;

const getParentKey = (key: React.Key, tree: TreeDataNode[]): React.Key => {
    let parentKey: React.Key;
    for (const node of tree) {
        if (node.children) {
            if (node.children.some((item) => item.key === key)) {
                parentKey = node.key;
            } else if (getParentKey(key, node.children)) {
                parentKey = getParentKey(key, node.children);
            }
        }
    }
    return parentKey!;
};

interface Props {
    // indicators: Indicator[];
    value: string;
    onChange: (value: string) => void;
    indicatorSchema: Array<Indicator>;
}

const IndicatorTree: React.FC<Props> = ({ indicatorSchema }) => {
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
    const [searchValue, setSearchValue] = useState('');
    const [autoExpandParent, setAutoExpandParent] = useState(true);

    // Build tree data and flat list once from indicators
    const defaultTreeData = useMemo(() => convertToTreeData(indicatorSchema), [indicatorSchema]);
    const flatList = useMemo(() => generateFlatList(defaultTreeData), [defaultTreeData]);

    const onExpand = (newExpandedKeys: React.Key[]) => {
        setExpandedKeys(newExpandedKeys);
        setAutoExpandParent(false);
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        const newExpandedKeys = flatList
            .map((item) => {
                if (item.title.toLowerCase().includes(value.toLowerCase())) {
                    return getParentKey(item.key, defaultTreeData);
                }
                return null;
            })
            .filter((item, i, self): item is React.Key => !!(item && self.indexOf(item) === i));

        setExpandedKeys(newExpandedKeys);
        setSearchValue(value);
        setAutoExpandParent(true);
    };

    // Highlight matching search text in node titles
    const treeData = useMemo(() => {
        const loop = (data: TreeDataNode[]): TreeDataNode[] =>
            data.map((item) => {
                const strTitle = item.title as string;
                const index = strTitle.toLowerCase().indexOf(searchValue.toLowerCase());
                const title =
                    index > -1 ? (
                        <span key={item.key}>
              {strTitle.substring(0, index)}
                            <span className="site-tree-search-value">
                {strTitle.substring(index, index + searchValue.length)}
              </span>
                            {strTitle.slice(index + searchValue.length)}
            </span>
                    ) : (
                        <span key={item.key}>{strTitle}</span>
                    );

                return item.children
                    ? { title, key: item.key, children: loop(item.children) }
                    : { title, key: item.key };
            });

        return loop(defaultTreeData);
    }, [searchValue, defaultTreeData]);

    return (
        <div>
            <Search
                style={{ marginBottom: 8 }}
                placeholder="Search indicators..."
                onChange={onChange}
                allowClear
            />
            <Tree
                onExpand={onExpand}
                expandedKeys={expandedKeys}
                autoExpandParent={autoExpandParent}
                treeData={treeData}
            />
        </div>
    );
};

export default IndicatorTree;