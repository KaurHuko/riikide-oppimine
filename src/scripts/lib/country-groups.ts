
export interface AllCountryNames {
    regions: CountryNameList[],
    lists: CountryNameList[]
}

export interface CountryNameList {
    name: string,
    displayName: string,
    countries: string[]
}