// Generates the final json for country borders and names, used in the actual website.
// Translations file generated from translation-gen.js, translated and renamed (to not accidentally overwrite translations)

import baseCountries from "./countries-base.json" assert {type: "json"}
import translations from "./translations.json" assert {type: "json"}
import fs from "fs"

const translationMap = new Map();
const countries = [];

for (const countryName of translations.translations) {
    if (countryName.translations.length >= 1) {
        translationMap.set(countryName.original, countryName);
    }
}

for (const baseCountry of baseCountries.features) {

    const newCountry = {
        active: false,
        names: [],
        alternativeNames: [],
        bounding: [
            [Number.MAX_VALUE, Number.MAX_VALUE],
            [-Number.MAX_VALUE, -Number.MAX_VALUE]
        ],
        geometry: undefined
    }

    if (baseCountry.geometry.type == "Polygon") {
        newCountry.geometry = [baseCountry.geometry.coordinates];
    } else if (baseCountry.geometry.type == "MultiPolygon") {
        newCountry.geometry = baseCountry.geometry.coordinates;
    } else {
        continue;
    }

    if (translationMap.has(baseCountry.properties.ADMIN)) {
        const nameData = translationMap.get(baseCountry.properties.ADMIN);
        newCountry.active = true;
        newCountry.names = nameData.translations;
        if (nameData.alternatives !== undefined) {
            newCountry.alternativeNames = nameData.alternatives;
        }
        
        const bounding = newCountry.bounding;

        for (const landPatch of newCountry.geometry) {
            for (const polygon of landPatch) {
                for (const point of polygon) {
                    bounding[0][0] = Math.min(bounding[0][0], point[0]);
                    bounding[0][1] = Math.min(bounding[0][1], point[1]);
                    bounding[1][0] = Math.max(bounding[1][0], point[0]);
                    bounding[1][1] = Math.max(bounding[1][1], point[1]);
                }
            }
        }
        
    }

    countries.push(newCountry);
}

fs.writeFileSync("./src/assets/countries.json", JSON.stringify({countries: countries}, undefined, 0));