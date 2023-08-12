// Generates the final json for country borders and names, used in the actual website.
// Translations file generated from translation-gen.js, translated and renamed (to not accidentally overwrite translations)

import baseCountries from "./countries-base.json" assert {type: "json"}
import translations from "./translations.json" assert {type: "json"}
import fs from "fs"

const translationMap = new Map();
const countryMap = new Map();

for (const countryName of translations.translations) {
    if (countryName.translations.length >= 1) {
        translationMap.set(countryName.original, countryName.translations[0]);
    }
}

for (const country of baseCountries.features) {
    countryMap.set(country.properties.ADMIN, country);
}

for (const countryKey of countryMap.keys()) {
    const country = countryMap.get(countryKey);
    if (translationMap.has(country.properties.ADMIN)) {
        country.properties.ADMIN = translationMap.get(country.properties.ADMIN);
    } else {
        countryMap.delete(countryKey);
    }
}

baseCountries.features = Array.from(countryMap.values());

fs.writeFileSync("./gen/countries.json", JSON.stringify(baseCountries, undefined, 0));