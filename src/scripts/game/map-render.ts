
import { projectedYCoordinate } from "../util/math-util";
import { replaceForeignChars } from "../util/text-util";
import type { CountryData } from "@/scripts/lib/countryjson";
import { animateViewBox } from "./viewbox-animation";

export let mapSvg: HTMLElement;
let mapSvgCountries: HTMLElement;

const latitudeSize = projectedYCoordinate(180);
const altitudeSize = 360;

export const xBorder = [-20, altitudeSize + 50, altitudeSize + 70];
export const yBorder = [120, latitudeSize - 180, latitudeSize - 300];

export const centerX = altitudeSize / 2;
export const centerY = latitudeSize / 2;

let drawnCountry: SVGGElement | undefined = undefined;

export function mapElementSetup() {
    mapSvg = document.getElementById("map")!;
    mapSvgCountries = document.getElementById("countries")!
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

    animateViewBox(country.jsonData.bounding);
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
