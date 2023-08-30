// Rounds coordinates to make borders of different countries align (they're inconsistent in base file for some reason)
// Necessary to work with https://mapshaper.org/

import fs from "fs";
import { GeoJson } from "../src/scripts/lib/geojson";
import baseCountriesImport from "./countries/countries-base.json"

const rounding = 1e9;

const countries = baseCountriesImport as GeoJson;
roundAllCoords(countries);

fs.writeFileSync("./gen/countries/countries-rounded.json", JSON.stringify(countries));

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