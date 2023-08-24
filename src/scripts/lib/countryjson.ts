
export interface CountryJsonList {
    countries: CountryJson[]
}

export interface CountryJson {
    active: boolean,
    names: string[],
    alternativeNames: string[],
    bounding: number[][],
    geometry: number[][][][]
}

export interface CountryData {
    jsonData: CountryJson,
    countrySvg: SVGGElement
}