import { DEFAULT_MAP_LABEL_COLOR, DEFAULT_MAP_LABEL_OUTLINE_COLOR } from '@/mapLabelStyle';

export interface FilterState extends Record<string, any>{
    labelColor: string;
    labelOutlineColor: string;
    showBoundaries: boolean;
    show3D: boolean;
    minValue: number;
    cityColorInside: string;
    cityColorOutside: string;
    zoomRange: number[];
    indicator: string;
    year: number;
    boundary: string;
}

export const initialFilterState: FilterState = {
    labelColor: DEFAULT_MAP_LABEL_COLOR,
    labelOutlineColor: DEFAULT_MAP_LABEL_OUTLINE_COLOR,
    showBoundaries: false,
    show3D: false,
    minValue: 0,
    // cityColorInside: "#ffbebe",
    cityColorInside: "#fde7e7",
    cityColorOutside: "#888888",
    zoomRange: [4, 7],
    indicator: "feature1",
    year: 2020,
    boundary: "gadm"
}

export type FilterAction =
    { type: "labelColor"; payload: string; }
    | { type: "labelOutlineColor"; payload: string; }
    | { type: "showBoundaries"; payload: boolean; }
    | { type: "show3D"; payload: boolean; }
    | { type: "minValue"; payload: number; }
    | { type: "cityColorInside"; payload: string; }
    | { type: "cityColorOutside"; payload: string; }
    | { type: "zoomRange"; payload: number[]; }
    | { type: "indicator"; payload: string; }
    | { type: "boundary"; payload: string; }

export function filterReducer(state: FilterState, action: FilterAction): FilterState {
    switch (action.type) {
        case "labelOutlineColor":
            return {...state, labelOutlineColor: action.payload};
        case "labelColor":
            return {...state, labelColor: action.payload};
        case "showBoundaries":
            return {...state, showBoundaries: action.payload};
        case "show3D":
            return {...state, show3D: action.payload};
        case "minValue":
            return {...state, minValue: action.payload};
        case "cityColorInside":
            return {...state, cityColorInside: action.payload};
        case "cityColorOutside":
            return {...state, cityColorOutside: action.payload};
        case "zoomRange":
            return {...state, zoomRange: action.payload};
        case "indicator":
            return {...state, indicator: action.payload};
        case "boundary":
            return {...state, boundary: action.payload};
    }
}
