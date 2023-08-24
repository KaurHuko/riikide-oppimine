
import { projectedYCoordinate } from "../util/math-util";
import { replaceForeignChars } from "../util/text-util";
import type { CountryData } from "@/scripts/lib/countryjson";
import { animateViewBox } from "./viewbox-animation";

let mapSvg: HTMLElement;
let mapSvgCountries: HTMLElement;

let mapWidth: number;
let mapHeight: number;

const latitudeSize = projectedYCoordinate(180);
const altitudeSize = 360;

const centerX = altitudeSize / 2;
const centerY = latitudeSize / 2;

let drawnCountry: SVGGElement | undefined = undefined;

export function mapElementSetup() {
    mapSvg = document.getElementById("map")!;
    mapSvgCountries = document.getElementById("countries")!

    const computedStyle = getComputedStyle(mapSvg);
    mapWidth = parseFloat(computedStyle.width);
    mapHeight = parseFloat(computedStyle.height);
}

export function drawNewCountry(name: string, geometry: number[][][][]): SVGGElement {
    
    const countryElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
    countryElement.id = replaceForeignChars(name).replace(/ /g, "-");

    for (const landPatch of geometry) {
        drawLandPatch(countryElement, landPatch);
    }

    colorCountry(countryElement, false);

    mapSvgCountries.appendChild(countryElement);
    return countryElement;
}

export function highlightNewCountry(country: CountryData) {
    if (drawnCountry !== undefined) {
        colorCountry(drawnCountry, false);
    }
    drawnCountry = country.countrySvg;
    colorCountry(country.countrySvg, true);

    animateViewBox(boundingBoxToView(country.jsonData.bounding), mapSvg);
}

function drawLandPatch(countryElement: SVGGElement, landPatch: number[][][]): SVGPathElement {
    
    const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    countryElement.appendChild(pathElement);

    let svgPointsAttribute = "";

    for (const svgPoints of landPatch) {
        svgPointsAttribute +=
            "M" +
            svgPoints.map(point => (centerX + point[0]) + " " + (centerY - point[1])).join(" ")
            + "z";
    }

    pathElement.setAttribute("d", svgPointsAttribute);
    return pathElement;
}

function colorCountry(country: SVGGElement, highlight: boolean) {
    const color = highlight ? "yellow" : "green";
    const strokeColor = highlight ? "#ffff8888" : "#00000033";

    country.setAttribute("fill", color);
        
    country.setAttribute("stroke", strokeColor);
    country.setAttribute("stroke-width", "0.1");
}

function boundingBoxToView(bounding: number[][]): number[][] {
    const position = [bounding[0][0], bounding[0][1]];
    const size = [bounding[1][0] - bounding[0][0], bounding[1][1] - bounding[0][1]];
    const viewExpand = Math.min(5, altitudeSize - size[0], latitudeSize - size[1]);

    position[0] = centerX + position[0] - viewExpand;
    position[1] = centerY - position[1] - size[1] - viewExpand;
    size[0] = size[0] + 2 * viewExpand;
    size[1] = size[1] + 2 * viewExpand;

    const mapRatio = mapWidth / mapHeight;
    if (size[0] / size[1] < mapRatio) { 
        size[0] = fixSizeRatio(size[0], size[1], position, 0, mapRatio);
    } else {
        size[1] = fixSizeRatio(size[1], size[0], position, 1, 1/mapRatio);
    }

    position[0] = clampCoordinate(position[0], size[0], mapWidth);
    position[1] = clampCoordinate(position[1], size[1], mapHeight);

    return [position, size];
}

function fixSizeRatio(size: number, otherSize: number, pos: number[], index: number, mapRatio: number): number {
    const newSize = otherSize * mapRatio;
    pos[index] -= (newSize - size) / 2;
    return newSize;
}

function clampCoordinate(coord: number, size: number, coordMax: number): number {
    if (coord < 0) {
        coord = 0;
    } else if (coord + size > coordMax) {
        coord = coordMax - size;
    }
    return coord;
}
