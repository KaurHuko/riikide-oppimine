
export interface CountryNames {
    regions: CountriesByRegion[],
    lists: CountriesByList[]
}

export interface CountriesByList {
    name: string,
    description: string,
    countries: string[]
}

export interface CountriesByRegion {
    name: string,
    countries: string[]
}