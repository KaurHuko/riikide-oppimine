// Generates the final json for country borders and names used in the website.

import { GeoJson, GeoJsonFeature } from "../src/lib/geojson"
import { CountryJson } from "../src/lib/countryjson"
import baseCountriesImport from "./countries-base.json"
import manualTranslationImport from "./manual-translations.json"
import fs from "fs"

interface TranslationData {
    translations: string[] | undefined,
    alternatives: string[],
}

interface ManualTranslation {
    english: string,
    translations: string[] | undefined,
    alternatives: string[] | undefined,
}

const baseCountries = baseCountriesImport as GeoJson;

const mapLeftTrim = 3 - 180;
const usRightTrim = 180 - 15;
const mapBottomTrim = 30 - 90;

const nameToIso3 = new Map<string, string>();
const iso3ToNames = new Map<string, string[]>();
const manualTranslations = new Map<string, ManualTranslation>();
const countries: CountryJson[] = [];

loadNameToIso3();
loadAdditionalNames();
loadManualTranslations();
loadCountries();

fs.writeFileSync("./src/assets/countries.json", JSON.stringify({countries: countries}, undefined, 0));

function loadNameToIso3() {
    iterateTsv(currentDir("iso3-to-est.txt"), tsvLine => {
        const values = getTsv(tsvLine, 0, 3);
        if (values === undefined) return;
        
        const countryName = cleanTabValue(values[0]);
        const iso3 = cleanTabValue(values[1]);
        
        nameToIso3.set(countryName, iso3);
    });
}

function loadAdditionalNames() {
    iterateTsv(currentDir("more-est-names.txt"), tsvLine => {
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

function currentDir(fileName: string): string {
    return "./gen/" + fileName;
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

function loadCountries() {
    for (const baseCountry of baseCountries.features) {

        const newCountry: CountryJson = {
            active: false,
            names: [],
            alternativeNames: [],
            geometry: [],
            bounding: [],
        };

        newCountry.geometry = getCountryGeometry(baseCountry);
        if (newCountry.geometry.length < 1) continue;

        newCountry.bounding = getGeometryBounding(newCountry.geometry);

        const translationData = getCountryTranslations(baseCountry);
        if (translationData !== undefined && translationData.translations !== undefined) {
            newCountry.active = true;
            newCountry.names = translationData.translations;
            newCountry.alternativeNames = translationData.alternatives;
        } else {
            newCountry.names = [baseCountry.properties.ADMIN];
        }

        countries.push(newCountry);
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

function getCountryGeometry(baseCountry: GeoJsonFeature): number[][][][] {
    const geometryData = baseCountry.geometry;
    let geometry: number[][][][] | undefined;

    if (geometryData.type == "Polygon") {
        geometry = [geometryData.coordinates] as number[][][][];
    } else if (geometryData.type == "MultiPolygon") {
        geometry = geometryData.coordinates as number[][][][];
    } else {
        return [];
    }

    if (baseCountry.properties.ADMIN === "Russia") uniteRussia(geometry);
    geometry = cutMapEdges(baseCountry.properties.ADMIN, geometry);
    applyMapProjection(geometry);

    geometry = simplifiedGeometry(baseCountry.properties.ADMIN, geometry);

    return geometry;
}

// The function name sounds extremely wrong, I'm just moving the right part of russia to the right
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
                const warp = point[1] / 90;
                point[1] *= (1 + 0.5 * Math.abs(warp * warp));
            }
        }
    }
}

function simplifiedGeometry(name: string, geometry: number[][][][]): number[][][][] {
    if (geometry.length < 1) return [];
    const newGeometry: number[][][][] = [];

    for (const landPatch of geometry) {
        const newLandPatch: number[][][] = [];

        for (let i = 0; i < landPatch.length; i++) {
            const polygon = landPatch[i];
            const newPolygon: number[][] = [polygon[0]];

            for (let j = 1; j < polygon.length; j++) {
                const previousPoint = newPolygon[newPolygon.length - 1];
                const point = polygon[j];
                if (sqrDistance(previousPoint, point) > 0.1) {
                    newPolygon.push(point);
                }
            }

            if (newPolygon.length >= 3) newLandPatch.push(newPolygon);
        }
        if (newLandPatch.length > 0) newGeometry.push(newLandPatch);
    }

    if (newGeometry.length < 1) console.log("Simplified to non-existence: " + name);
    return newGeometry;
}

function sqrDistance(pointA: number[], pointB: number[]): number {
    const x = pointA[0] - pointB[0];
    const y = pointA[1] - pointB[1];
    return x*x + y*y;
}

function getGeometryBounding(geometry: number[][][][]): number[][] {
    const bounding = [
        [Number.MAX_VALUE, Number.MAX_VALUE],
        [-Number.MAX_VALUE, -Number.MAX_VALUE]
    ];

    for (const landPatch of geometry) {
        const polygon = landPatch[0];
        for (const point of polygon) {
            bounding[0][0] = Math.min(bounding[0][0], point[0]);
            bounding[0][1] = Math.min(bounding[0][1], point[1]);
            bounding[1][0] = Math.max(bounding[1][0], point[0]);
            bounding[1][1] = Math.max(bounding[1][1], point[1]);
        }
        
    }
    return bounding;
}