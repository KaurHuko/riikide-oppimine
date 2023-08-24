import type { GeometryType, GeoJsonProperties } from "./geojson";

export type ArcIndexes = number[][] | number[][][];

export interface TopoJson {
    type: string,
    arcs: number[][][],
    objects: { topoJsonObject: TopoJsonObject },
    bbox: number[]
}

export interface TopoJsonObject {
    type: string,
    geometries: TopoJsonGeometry[]
}

export interface TopoJsonGeometry {
    type: GeometryType,
    arcs: ArcIndexes,
    properties: GeoJsonProperties,
}