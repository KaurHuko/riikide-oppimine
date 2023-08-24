import { GeoJson } from "../src/scripts/lib/geojson";

const rounding = 1000000000;

function roundAllCoords(geoJson: GeoJson) {
    for (const country of geoJson.features) {

        if (country.geometry.type === "Polygon") {
            roundLandPatchCoords(country.geometry.coordinates as number[][][]);
    
        } else if (country.geometry.type === "MultiPolygon") {
            for (const landPatch of country.geometry.coordinates) {
                roundLandPatchCoords(landPatch as number[][][]);
            }
        }
    }
}

function roundLandPatchCoords(landPatch: number[][][]) {
    for (const polygon of landPatch) {
        for (const point of polygon) {
            point[0] = Math.round(point[0] * rounding) / rounding;
            point[1] = Math.round(point[1] * rounding) / rounding;
        }
    }
}