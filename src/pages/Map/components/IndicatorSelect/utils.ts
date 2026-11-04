import type { MenuProps } from 'antd';
import type { TreeDataNode } from 'antd';

export function convertToTreeData(indicators: Indicator[]): TreeDataNode[] {
    const domainMap = new Map<string, Map<string, Map<string | null, Indicator[]>>>();

    // Group indicators into nested maps (same logic as menu)
    for (const item of indicators) {
        const { indicator_domain, indicator_theme, indicator_sub_theme } = item;

        if (!domainMap.has(indicator_domain)) {
            domainMap.set(indicator_domain, new Map());
        }
        const themeMap = domainMap.get(indicator_domain)!;

        if (!themeMap.has(indicator_theme)) {
            themeMap.set(indicator_theme, new Map());
        }
        const subThemeMap = themeMap.get(indicator_theme)!;

        const subThemeKey = indicator_sub_theme ?? null;
        if (!subThemeMap.has(subThemeKey)) {
            subThemeMap.set(subThemeKey, []);
        }

        subThemeMap.get(subThemeKey)!.push(item);
    }

    // Build TreeDataNode children for domains
    const domainNodes: TreeDataNode[] = [];

    for (const [domain, themeMap] of domainMap) {
        const themeNodes: TreeDataNode[] = [];

        for (const [theme, subThemeMap] of themeMap) {
            const directLeaves: TreeDataNode[] = (subThemeMap.get(null) ?? []).map((ind) => ({
                key: ind.indicator_code,
                title: ind.indicator_name,
            }));

            const subThemeNodes: TreeDataNode[] = [];
            for (const [subTheme, leafIndicators] of subThemeMap) {
                if (subTheme === null) continue;

                subThemeNodes.push({
                    key: `subtheme__${domain}__${theme}__${subTheme}`,
                    title: subTheme,
                    children: leafIndicators.map((ind) => ({
                        key: ind.indicator_code,
                        title: ind.indicator_name,
                    })),
                });
            }

            themeNodes.push({
                key: `theme__${domain}__${theme}`,
                title: theme,
                children: [...subThemeNodes, ...directLeaves],
            });
        }

        domainNodes.push({
            key: `domain__${domain}`,
            title: domain,
            children: themeNodes,
        });
    }

    // Single top-level "Indicators" node
    return [
        {
            key: 'indicators',
            title: 'Indicators',
            children: domainNodes,
        },
    ];
}

export type FlatNode = { key: React.Key; title: string };

export function generateFlatList(treeData: TreeDataNode[]): FlatNode[] {
    const result: FlatNode[] = [];

    const traverse = (nodes: TreeDataNode[]) => {
        for (const node of nodes) {
            result.push({ key: node.key!, title: node.title as string });
            if (node.children) {
                traverse(node.children);
            }
        }
    };

    traverse(treeData);
    return result;
}

type MenuItem = Required<MenuProps>['items'][number];

export function convertIndicatorToMenuItems(indicators: Indicator[]): MenuItem[] {
    const domainMap = new Map<string, Map<string, Map<string | null, MenuItem[]>>>();

    for (const item of indicators) {
        const { indicator_domain, indicator_theme, indicator_sub_theme, indicator_code, indicator_name } = item;

        if (!domainMap.has(indicator_domain)) {
            domainMap.set(indicator_domain, new Map());
        }
        const themeMap = domainMap.get(indicator_domain)!;

        if (!themeMap.has(indicator_theme)) {
            themeMap.set(indicator_theme, new Map());
        }
        const subThemeMap = themeMap.get(indicator_theme)!;

        const subThemeKey = indicator_sub_theme ?? null;
        if (!subThemeMap.has(subThemeKey)) {
            subThemeMap.set(subThemeKey, []);
        }

        subThemeMap.get(subThemeKey)!.push({
            key: indicator_code,
            label: indicator_name,
        });
    }

    const domainChildren: MenuItem[] = [];

    for (const [domain, themeMap] of domainMap) {
        const themeChildren: MenuItem[] = [];

        for (const [theme, subThemeMap] of themeMap) {
            const directItems = subThemeMap.get(null) ?? [];
            const subThemeChildren: MenuItem[] = [];

            for (const [subTheme, leafItems] of subThemeMap) {
                if (subTheme === null) continue;

                subThemeChildren.push({
                    key: `subtheme__${domain}__${theme}__${subTheme}`,
                    label: subTheme,
                    children: leafItems,
                });
            }

            themeChildren.push({
                key: `theme__${domain}__${theme}`,
                label: theme,
                children: [...subThemeChildren, ...directItems],
            });
        }

        domainChildren.push({
            key: `domain__${domain}`,
            label: domain,
            children: themeChildren,
        });
    }

    return [
        {
            key: 'indicators',
            label: 'Indicators',
            children: domainChildren,
        },
    ];
}

interface Indicator {
    indicator_code: string;
    source: string;
    cgi_indicator_code: string;
    indicator_domain: string;
    indicator_theme: string;
    indicator_sub_theme: string | null;
    indicator_name: string;
}

export function convertToCascadingMenu(indicators: Indicator[]): MenuProps['items'] {
    const domainMap = new Map<string, Map<string, Map<string | null, Indicator[]>>>();

    // Group indicators into nested maps
    for (const item of indicators) {
        const { indicator_domain, indicator_theme, indicator_sub_theme } = item;

        if (!domainMap.has(indicator_domain)) {
            domainMap.set(indicator_domain, new Map());
        }
        const themeMap = domainMap.get(indicator_domain)!;

        if (!themeMap.has(indicator_theme)) {
            themeMap.set(indicator_theme, new Map());
        }
        const subThemeMap = themeMap.get(indicator_theme)!;

        const subThemeKey = indicator_sub_theme ?? null;
        if (!subThemeMap.has(subThemeKey)) {
            subThemeMap.set(subThemeKey, []);
        }
        subThemeMap.get(subThemeKey)!.push(item);
    }

    const domainGroups: MenuItem[] = [];

    for (const [domain, themeMap] of domainMap) {
        const themeChildren: MenuItem[] = [];

        for (const [theme, subThemeMap] of themeMap) {
            const directLeaves: MenuItem[] = (subThemeMap.get(null) ?? []).map((ind) => ({
                key: ind.indicator_code,
                label: ind.indicator_name,
            }));

            const subThemeChildren: MenuItem[] = [];
            for (const [subTheme, leafIndicators] of subThemeMap) {
                if (subTheme === null) continue;

                subThemeChildren.push({
                    key: `subtheme__${domain}__${theme}__${subTheme}`,
                    label: subTheme,
                    children: leafIndicators.map((ind) => ({
                        key: ind.indicator_code,
                        label: ind.indicator_name,
                    })),
                });
            }

            themeChildren.push({
                key: `theme__${domain}__${theme}`,
                label: theme,
                children: [...subThemeChildren, ...directLeaves],
            });
        }

        // ✅ Domains use type: 'group' — flat header with visible children (no click needed)
        domainGroups.push({
            key: `domain__${domain}`,
            type: 'group',
            label: domain,
            children: themeChildren,
        });
    }

    return domainGroups;
}