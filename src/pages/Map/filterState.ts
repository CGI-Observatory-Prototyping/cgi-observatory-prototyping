export interface FilterState extends Record<string, any>{
    year: number;
    indicator: string;
    layer: string|null;
    showBoundaries: boolean;
    boundary: string|null;
}

export const initialFilterState: FilterState = {
    year: 2024,
    indicator: "SA2007V",
    layer: null,
    showBoundaries: false,
    boundary: null
}

export type FilterAction =
    | { type: "year"; payload: number; }
    | { type: "indicator"; payload: string; }
    | { type: "layer"; payload: string|null; }
    | { type: "showBoundaries"; payload: boolean; }
    | { type: "boundary"; payload: string|null; }

export function filterReducer(state: FilterState, action: FilterAction): FilterState {
    switch (action.type) {
        case "year":
            return {...state, year: action.payload};
        case "indicator":
            return {...state, indicator: action.payload};
        case "layer":
            return {...state, layer: action.payload};
        case "showBoundaries":
            return {...state, showBoundaries: action.payload};
        case "boundary":
            return {...state, boundary: action.payload};
    }
}
