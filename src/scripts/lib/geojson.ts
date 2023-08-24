
export type GeometryType = "Polygon" | "MultiPolygon";

export interface GeoJson {
    type: string,
    features: GeoJsonFeature[]
}

export interface GeoJsonFeature {
    type: string,
    properties: GeoJsonProperties,
    geometry: Geometry
}

export interface GeoJsonProperties {
    ADMIN: string,
    ISO_A3: string
}

export interface Geometry {
    type: GeometryType,
    coordinates: GeometryCoordinates
}

export type GeometryCoordinates = number[][][] | number[][][][];