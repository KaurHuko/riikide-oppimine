import type { CountryNames } from '../lib/country-groups';
import type { CountryJson, CountryJsonList } from '../lib/countryjson';

import jsonCountries from '@/assets/countries.json';
import jsonCountryNames from "@/assets/country-names.json";

const countryJsonArray: CountryJson[] = (jsonCountries as CountryJsonList).countries;
const countryNames: CountryNames = (jsonCountryNames as CountryNames);

export const countryJsonMap: Map<string, CountryJson> = new Map();

const countryRegionMap: Map<string, string[]> = new Map();
const countryListMap: Map<string, Set<string>> = new Map();

export function countryListSetup() {
    for (const country of countryJsonArray) {
        countryJsonMap.set(country.names[0], country);
    }

    for (const region of countryNames.regions) {
        const countries: string[] = [];

        for (const countryName of region.countries) {
            const countryJson = countryJsonMap.get(countryName);
            if (countryJson !== undefined && countryJson.active) countries.push(countryName);
            else console.log(`Missed ${countryName} in region ${region.name}`);
        }

        if (countries.length > 0) countryRegionMap.set(region.name, countries);
    }

    for (const countryList of countryNames.lists) {
        const countries: Set<string> = new Set();

        for (const countryName of countryList.countries) {
            const countryJson = countryJsonMap.get(countryName);
            if (countryJson !== undefined && countryJson.active) countries.add(countryName);
            else (console.log(`Missed ${countryName} in list ${countryList.name}`));
        }

        if (countries.size > 0) countryListMap.set(countryList.name, countries);
    }
}

export function getCountries(regionArg: string | null, listArg: string | null): string[] {
    if (regionArg === null || listArg === null) return [];

    const region = countryRegionMap.get(regionArg);
    const countryList = countryListMap.get(listArg);

    if (region === undefined || countryList === undefined) return [];

    const mergedRegion: string[] = [];
    for (const regionCountry of region) {
        if (countryList.has(regionCountry)) mergedRegion.push(regionCountry);
    }

    return mergedRegion;
}