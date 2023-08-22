// Generates the final json for country borders and names used in the website.

import { count } from "console";
import baseCountries from "./countries-base.json" assert {type: "json"}
import manualTranslationData from "./manual-translations.json" assert {type: "json"}
import fs from "fs"

const nameToIso3 = new Map();
const iso3ToNames = new Map();
const manualTranslations = new Map();
const countries = [];

loadNameToIso3();
loadAdditionalNames();
loadManualTranslations();
loadCountries();

fs.writeFileSync("./src/assets/countries.json", JSON.stringify({countries: countries}, undefined, 0));

function currentDir(fileName) {
    return "./gen/" + fileName;
}

function loadNameToIso3() {
    try {
        const data = fs.readFileSync(currentDir("iso3-to-est.txt"), 'utf8');
        const lines = data.split('\n');
        for (const line of lines) {
            const values = getTsv(line, 0, 3);
            if (values === undefined) continue;
            
            const countryName = cleanTabValue(values[0]);
            const iso3 = cleanTabValue(values[1]);
            
            nameToIso3.set(countryName, iso3);
        }
    } catch (err) {
        throw err;
    }
}

function loadAdditionalNames() {
    try {
        const data = fs.readFileSync(currentDir("more-est-names.txt"), 'utf8');
        const lines = data.split('\n');
        
        for (const line of lines) {
            const values = getTsv(line, 0);
            if (values === undefined) continue;

            const countryNames = cleanTabValue(values[0]).split(" ~ ");
            for (const name of countryNames) {
                const iso3 = nameToIso3.get(name);
                if (iso3 === undefined) continue;

                iso3ToNames.set(iso3, countryNames);
                break;
            }
        }
    } catch (err) {
        throw err;
    }
}

function getTsv(line, ...columns) {
    if (line.length < 1 || line[0] === "*") return undefined;

    const tsv = line.split("\t");
    const returnValues = [];

    for (const column of columns) {
        if (tsv.length <= column) return undefined;
        returnValues.push(tsv[column]);
    }

    return returnValues;
}

function cleanTabValue(name) {
    // Remove text in brackets
    name = name.replace(/\([^)]*\)/g, "");
    name = name.replace(/\[[^\]]*\]/g, "");

    // Remove unnecessary spaces
    name = name.replace(/ {2,}/g, " ");
    name = name.trim();

    return name;
}

function loadManualTranslations() {
    for (const manualTranslation of manualTranslationData.translations) {
        manualTranslations.set(manualTranslation.english, manualTranslation);
    }
}

function loadCountries() {
    for (const baseCountry of baseCountries.features) {

        const newCountry = {
            active: false,
            names: [],
            alternativeNames: [],
            geometry: undefined,
            bounding: undefined,
        };

        newCountry.geometry = getCountryGeometry(baseCountry);
        if (newCountry.geometry === undefined) continue;

        newCountry.bounding = getGeometryBounding(newCountry.geometry);

        const translationData = getCountryTranslations(baseCountry);
        if (translationData !== undefined && translationData.translations !== undefined) {
            newCountry.active = true;
            newCountry.names = translationData.translations;
            newCountry.alternativeNames = translationData.alternatives;
        } else {
            newCountry.names = baseCountry.properties.ADMIN;
        }

        countries.push(newCountry);
    }
}

function getCountryTranslations(baseCountry) {
    const returnData = {translations: undefined, alternatives: []};
    
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

function getCountryGeometry(baseCountry) {
    if (baseCountry.geometry.type == "Polygon") {
        return [baseCountry.geometry.coordinates];

    } else if (baseCountry.geometry.type == "MultiPolygon") {
        return baseCountry.geometry.coordinates;
    }
    return undefined;
}

function getGeometryBounding(geometry) {
    const bounding = [
        [Number.MAX_VALUE, Number.MAX_VALUE],
        [-Number.MAX_VALUE, -Number.MAX_VALUE]
    ];

    for (const landPatch of geometry) {
        for (const polygon of landPatch) {
            for (const point of polygon) {
                bounding[0][0] = Math.min(bounding[0][0], point[0]);
                bounding[0][1] = Math.min(bounding[0][1], point[1]);
                bounding[1][0] = Math.max(bounding[1][0], point[0]);
                bounding[1][1] = Math.max(bounding[1][1], point[1]);
            }
        }
    }
    return bounding;
}