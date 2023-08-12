// Generates a translation template file from geojson countries, for (most likely) manual translating (fun).

import baseCountries from "./countries-base.json" assert {type: "json"}
import fs from "fs"

const exportJson = {translations: []};
const translations = exportJson.translations;

for (const country of baseCountries.features) {
    translations.push({
        original: country.properties.ADMIN,
        translations: [],
        alternatives: [],
    });
    fs.writeFileSync("./gen/translations-base.json", JSON.stringify(exportJson, undefined, 1));
}
