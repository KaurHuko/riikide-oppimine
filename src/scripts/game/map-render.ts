import { projectedYCoordinate } from "../util/math-util";
import type { CountryElementData } from "@/scripts/lib/countryjson";
import { animateViewBox } from "./viewbox-animation";

export let mapSvg: HTMLElement;
let mapSvgCountries: HTMLElement;
let smallCountryHighlight: HTMLElement;

const latitudeSize = projectedYCoordinate(180);
const altitudeSize = 360;

export const xBorder = [-20, altitudeSize + 50, altitudeSize + 70];
export const yBorder = [120, latitudeSize - 180, latitudeSize - 300];

export const centerX = altitudeSize / 2;
export const centerY = latitudeSize / 2;

let drawnCountry: SVGGElement | undefined = undefined;

export function mapElementSetup() {
    mapSvg = document.getElementById("map")!;
    mapSvgCountries = document.getElementById("countries")!;
    smallCountryHighlight = document.getElementById("country-highlighter")!;
}

export function drawNewCountry(name: string, geometry: number[][][][]): SVGGElement {
    
    const countryElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
    countryElement.id = name.toLocaleLowerCase().replace(/ /g, "-");

    for (const landPatch of geometry) {
        drawLandPatch(countryElement, landPatch);
    }

    colorCountry(countryElement, false);

    mapSvgCountries.appendChild(countryElement);
    return countryElement;
}

export function highlightNewCountry(country: CountryElementData) {
    if (drawnCountry !== undefined) {
        colorCountry(drawnCountry, false);
    }
    drawnCountry = country.countrySvg;
    colorCountry(country.countrySvg, true);
    highlightSmallCountry(country);

    animateViewBox(country.jsonData.bounding);
}

function drawLandPatch(countryElement: SVGGElement, landPatch: number[][][]): SVGPathElement {
    
    const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    countryElement.appendChild(pathElement);

    let svgPointsAttribute = "";

    for (const svgPoints of landPatch) {
        svgPointsAttribute +=
            "M" +
            svgPoints.map(point => mapX(point[0]) + " " + mapY(point[1])).join(" ")
            + "z";
    }

    pathElement.setAttribute("d", svgPointsAttribute);
    return pathElement;
}

function colorCountry(country: SVGGElement, highlight: boolean) {
    if (highlight) {
        country.classList.add("country-active");
        country.classList.remove("country-inactive");

        const parent = country.parentElement!;
        parent.removeChild(country);
        parent.appendChild(country);

    } else {
        country.classList.add("country-inactive");
        country.classList.remove("country-active");
    }
}

function highlightSmallCountry(country: CountryElementData) {
    const bounding = country.jsonData.bounding;
    if (bounding.size[0] + bounding.size[1] < 1) {
        smallCountryHighlight.setAttribute("cx", `${mapX(bounding.pos[0] + bounding.size[0]/2)}`);
        smallCountryHighlight.setAttribute("cy", `${mapY(bounding.pos[1] + bounding.size[1]/2)}`);
        smallCountryHighlight.style.visibility = "visible";
    } else {
        smallCountryHighlight.style.visibility = "hidden";
    }
}

function mapX(geometryX: number): number {
    return centerX + geometryX;
}

function mapY(geometryY: number): number {
    return centerY - geometryY;
}