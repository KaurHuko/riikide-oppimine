
export interface CountryJsonList {
    countries: CountryJson[]
}

export interface CountryJson {
    active: boolean,
    names: string[],
    alternativeNames: string[],
    bounding: BBox,
    geometry: number[][][][]
}

export interface CountryElementData {
    jsonData: CountryJson,
    countrySvg: SVGGElement
}

export class BBox {
    pos: number[];
    size: number[];

    constructor(posX: number, posY: number, sizeX: number, sizeY: number) {
        this.pos = [posX, posY];
        this.size = [sizeX, sizeY];
    }
}

export function cloneBBox(bbox: BBox): BBox {
    return new BBox(bbox.pos[0], bbox.pos[1], bbox.size[0], bbox.size[1]);
}