// type MapControl = {
//     zoom: number;
//     center: [number, number];
// }

type MapState = {
    zoom: number;
    center: [number, number];
    minZoom?: number;
    maxZoom?: number;
    maxZoom3D?: number;
    minZoom3D?: number;
    zoom3D?: number;
    style: string;
    projection: "mercator"|"globe";
    maxBounds?: [[number, number], [number, number]];
}
