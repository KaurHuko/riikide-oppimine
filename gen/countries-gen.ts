// Generates the final json for country borders and names used in the website.

import { GeoJson, GeoJsonFeature, Geometry } from "../src/scripts/lib/geojson";
import { BBox, CountryJson } from "../src/scripts/lib/countryjson";
import { projectedYCoordinate } from '../src/scripts/util/math-util';

import fullCountriesImport from "./countries/countries-rounded.json";
import halfSimpleCountriesImport from "./countries/countries-half-simple.json";
import simpleCountriesImport from "./countries/countries-simplest.json";

import manualTranslationImport from "./translations/manual-translations.json";

import * as turf from "@turf/turf";
import fs from "fs";

interface TranslationData {
    translations: string[] | undefined,
    alternatives: string[],
}

interface ManualTranslation {
    english: string,
    translations: string[] | undefined,
    alternatives: string[] | undefined,
}

const simpleCountries = simpleCountriesImport as GeoJson;
const halfSimpleCountries = halfSimpleCountriesImport as GeoJson;
const fullCountries = fullCountriesImport as GeoJson;

const mapLeftTrim = 4 - 180;
const usRightTrim = 180 - 15;
const mapBottomTrim = 30 - 90;

const nameToIso3 = new Map<string, string>();
const iso3ToNames = new Map<string, string[]>();
const manualTranslations = new Map<string, ManualTranslation>();

const simpleGeometries = new Map<string, number[][][][]>();
const halfSimpleGeometries = new Map<string, number[][][][]>();

const countriesExport: CountryJson[] = [];

loadNameToIso3();
loadAdditionalNames();
loadManualTranslations();
loadSimplerGeometries();
loadCountries();

fs.writeFileSync("./src/assets/countries.json", JSON.stringify({countries: countriesExport}, undefined, 0));

function loadNameToIso3() {
    iterateTsv(translationDir("iso3-to-est.txt"), tsvLine => {
        const values = getTsv(tsvLine, 0, 3);
        if (values === undefined) return;
        
        const countryName = cleanTabValue(values[0]);
        const iso3 = cleanTabValue(values[1]);
        
        nameToIso3.set(countryName, iso3);
    });
}

function loadAdditionalNames() {
    iterateTsv(translationDir("more-est-names.txt"), tsvLine => {
        const values = getTsv(tsvLine, 0);
        if (values === undefined) return;

        const countryNames = cleanTabValue(values[0]).split(" ~ ");
        for (const name of countryNames) {
            const iso3 = nameToIso3.get(name);
            if (iso3 === undefined) continue;

            iso3ToNames.set(iso3, countryNames);
            break;
        }
    });
}

function translationDir(fileName: string): string {
    return "./gen/translations/" + fileName;
}

function iterateTsv(filePath: string, process: (line: string) => void) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.split('\n');
        
        for (const line of lines) {
            process(line);
        }
    } catch (err) {
        throw err;
    }
}

function getTsv(line: string, ...columns: number[]): string[] | undefined {
    if (line.length < 1 || line[0] === "*") return undefined;

    const tsv = line.split("\t");
    const returnValues: string[] = [];

    for (const column of columns) {
        if (tsv.length <= column) return undefined;
        returnValues.push(tsv[column]);
    }

    return returnValues;
}

function cleanTabValue(name: string): string {
    // Remove text in brackets
    name = name.replace(/\([^)]*\)/g, "");
    name = name.replace(/\[[^\]]*\]/g, "");

    // Remove unnecessary spaces
    name = name.replace(/ {2,}/g, " ");
    name = name.trim();

    return name;
}

function loadManualTranslations() {
    for (const manualTranslation of manualTranslationImport.translations) {
        manualTranslations.set(manualTranslation.english, manualTranslation as unknown as ManualTranslation);
    }
}

function loadSimplerGeometries() {
    for (const country of halfSimpleCountries.features) {
        const geometry = getGeometryCoords(country.geometry);
        if (geometry.length > 0) halfSimpleGeometries.set(country.properties.ADMIN, geometry);
    }

    for (const country of simpleCountries.features) {
        const geometry = getGeometryCoords(country.geometry);
        if (geometry.length > 0) simpleGeometries.set(country.properties.ADMIN, geometry);
    }
}

function loadCountries() {
    for (const baseCountry of fullCountries.features) {

        const newCountry: CountryJson = {
            active: false,
            names: [],
            alternativeNames: [],
            geometry: [],
            bounding: new BBox(0, 0, 0, 0),
        };

        const translationData = getCountryTranslations(baseCountry);
        if (translationData !== undefined && translationData.translations !== undefined) {
            newCountry.active = true;
            newCountry.names = translationData.translations;
            newCountry.alternativeNames = translationData.alternatives;
        } else {
            newCountry.names = [baseCountry.properties.ADMIN];
        }

        newCountry.geometry = getCountryGeometry(baseCountry, newCountry.active);
        if (newCountry.geometry.length < 1) continue;

        newCountry.bounding = getGeometryBounding(newCountry.geometry);

        countriesExport.push(newCountry);
    }
}

function getCountryTranslations(baseCountry: GeoJsonFeature): TranslationData {
    const returnData: TranslationData = {translations: undefined, alternatives: []};
    
    const manualTranslation = manualTranslations.get(baseCountry.properties.ADMIN);

    if (manualTranslation !== undefined) {
        if (manualTranslation.translations !== undefined) {
            returnData.translations = manualTranslation.translations;
        }
        if (manualTranslation.alternatives !== undefined) {
            returnData.alternatives = manualTranslation.alternatives;
        }
    }

    if (returnData.translations === undefined) {
        returnData.translations = iso3ToNames.get(baseCountry.properties.ISO_A3);
    }
    
    return returnData;
}

function getCountryGeometry(baseCountry: GeoJsonFeature, active: boolean): number[][][][] {
    let geometry = chooseSimplification(baseCountry, active);

    if (baseCountry.properties.ADMIN === "Russia") uniteRussia(geometry);
    geometry = cutMapEdges(baseCountry.properties.ADMIN, geometry);
    applyMapProjection(geometry);

    return geometry;
}

function getGeometryCoords(geometry: Geometry): number[][][][] {
    if (geometry.type == "Polygon") {
        return [geometry.coordinates] as number[][][][];
    }
    if (geometry.type == "MultiPolygon") {
        return geometry.coordinates as number[][][][];
    }
    return [];
}

function chooseSimplification(country: GeoJsonFeature, active: boolean): number[][][][] {
    const fullGeometry = getGeometryCoords(country.geometry);
    const area = areaInKm2(country);
    const name = country.properties.ADMIN;

    if (area > 1000 || !active) {
        return simpleGeometries.get(name)!
    }
    
    if (area > 200) {
        return halfSimpleGeometries.get(name)!
    }
    
    return fullGeometry;
}

function areaInKm2(baseCountry: GeoJsonFeature) {
    return turf.area(baseCountry.geometry) / 1e6;
}

// The function name sounds extremely wrong, I'm just moving the right part of russia (left on the map) to the right
// Because of polygon strokes it still looks kinda trash, but it's better than having a part of russia cut off
// Might be a temporary solution, might not, idk
function uniteRussia(geometry: number[][][][]) {
    for (const landPatch of geometry) {
        for (const polygon of landPatch) {
            for (const point of polygon) {
                if (point[0] < 0) point[0] += 360;
            }
        }
    }
}

function cutMapEdges(name: string, geometry: number[][][][]): number[][][][] {
    const newGeometry: number[][][][] = [];
    let countryCutOff = false;

    const leftTrim = mapLeftTrim;
    const rightTrim = name === "United States of America" ? usRightTrim : 200;
    const bottomTrim = mapBottomTrim;

    for (const landPatch of geometry) {
        const polygon = landPatch[0];
        let landPatchCutoff = false;

        for (const point of polygon) {
            if (point[0] < leftTrim || point[0] > rightTrim || point[1] < bottomTrim) {
                landPatchCutoff = true;
                break;
            }
        }

        if (!landPatchCutoff) newGeometry.push(landPatch);
        else countryCutOff = true;
    }

    if (countryCutOff) {
        if (newGeometry.length > 0) console.log(`Partly cut off ${name}.`)
        else console.log(`Entirely cut off ${name}.`)
    }

    return newGeometry;
}

function applyMapProjection(geometry: number[][][][]) {
    for (const landPatch of geometry) {
        for (const polygon of landPatch) {
            for (const point of polygon) {
                point[1] = projectedYCoordinate(point[1]);
            }
        }
    }
}

function getGeometryBounding(geometry: number[][][][]): BBox {
    const bounding: BBox = new BBox(Number.MAX_VALUE, Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

    for (const landPatch of geometry) {
        const polygon = landPatch[0];
        for (const point of polygon) {
            bounding.pos[0] = Math.min(bounding.pos[0], point[0]);
            bounding.pos[1] = Math.min(bounding.pos[1], point[1]);
            bounding.size[0] = Math.max(bounding.size[0], point[0]);
            bounding.size[1] = Math.max(bounding.size[1], point[1]);
        }
        
    }
    bounding.size[0] -= bounding.pos[0];
    bounding.size[1] -= bounding.pos[1];
    return bounding;
}