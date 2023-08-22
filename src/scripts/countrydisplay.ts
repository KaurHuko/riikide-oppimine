import type { CountryJson, CountryJsonList } from '@/lib/countryjson';
import jsonCountries from '../assets/countries.json'; 
import { animateViewBox } from './viewbox-animation';
import { replaceForeignChars, toPascalCase } from './text-util';

interface CountryData {
    jsonData: CountryJson,
    countrySvg: SVGGElement
}

const countryJsonArray: CountryJson[] = (jsonCountries as CountryJsonList).countries;

const countryMap: Map<string, CountryData> = new Map();
const countryNameList: string[] = [];
let currentCountry: string;

const drawnCountries: SVGGElement[] = [];

let mapSvg: HTMLElement;
let mapSvgCountries: HTMLElement;

let mapWidth: number;
let mapHeight: number;

const maxLatitude = 90;
const maxAltitude = 180;

let ppd: number; // pixels per degree
let centerX: number;
let centerY: number;

export function setup() { 

    htmlElementSetup();
    setupCountries();
    setupInsert();
    generateQuesion();

}

function htmlElementSetup() {
    mapSvg = document.getElementById("map")!;
    mapSvgCountries = document.getElementById("countries")!

    mapWidth = parseFloat(mapSvg.getAttribute("width")!);
    mapHeight = parseFloat(mapSvg.getAttribute("height")!);

    ppd = Math.min(mapWidth / maxLatitude, mapHeight / maxAltitude);
    centerX = ppd * maxAltitude;
    centerY = ppd * maxLatitude;
}

function setupCountries() {
    for (const country of countryJsonArray) {
        if (!country.active) continue;

        const name = country.names[0].toLocaleLowerCase();
        const geometry = country.geometry;

        countryMap.set(name, {jsonData: country, countrySvg: drawNewCountry(name, geometry)});
        countryNameList.push(name);
    }
}

function setupInsert() {
    const form: HTMLFormElement = document.getElementById("country-guess-form") as HTMLFormElement;
    const input: HTMLInputElement = document.getElementById("country-name") as HTMLInputElement;
    const feedback: HTMLElement = document.getElementById("feedback") as HTMLElement;

    form.addEventListener("submit", event => {
        event.preventDefault();

        const guess: string = input.value.toLocaleLowerCase();
        if (guess === currentCountry) {
            feedback.style.color = "green";
            feedback.innerHTML = toPascalCase(currentCountry) + " is correct!";
            generateQuesion();
        } else {
            feedback.style.color = "red";
            feedback.innerHTML = "Correct answer: " + toPascalCase(currentCountry);
        }
    })
}

function generateQuesion() {
    clearPrevCountries();

    const countryName: string = countryNameList[Math.floor(Math.random() * countryNameList.length)];
    const country: CountryData | undefined = countryMap.get(countryName);

    currentCountry = countryName;
    if (country === undefined) return;

    colorCountry(country.countrySvg, true);
    animateViewBox(boundingBoxToView(country.jsonData.bounding), mapSvg);
}

function boundingBoxToView(bounding: number[][]): number[][] {
    const position = [bounding[0][0], bounding[0][1]];
    const size = [bounding[1][0] - bounding[0][0], bounding[1][1] - bounding[0][1]];
    const viewExpand = Math.min(5, 2 * maxAltitude - size[0], 2 * maxLatitude - size[1]);

    position[0] = centerX + ppd * (position[0] - viewExpand);
    position[1] = centerY - ppd * (position[1] + size[1] + viewExpand);
    size[0] = ppd * (size[0] + 2 * viewExpand);
    size[1] = ppd * (size[1] + 2 * viewExpand);

    const mapRatio = maxAltitude / maxLatitude;
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

function clearPrevCountries() {
    drawnCountries.forEach(drawnCountry => {
        colorCountry(drawnCountry, false);
    });
    drawnCountries.length = 0;
}

function drawNewCountry(name: string, geometry: number[][][][]): SVGGElement {
    
    const countryElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
    countryElement.id = replaceForeignChars(name).replace(/ /g, "-");

    for (const landPatch of geometry) {
        drawLandPatch(countryElement, landPatch);
    }

    colorCountry(countryElement, false);

    mapSvgCountries.appendChild(countryElement);
    return countryElement;
}

function colorCountry(country: SVGGElement, highlight: boolean) {
    const color = highlight ? "yellow" : "green";
    const strokeColor = highlight ? "#ffff8888" : "#00000033";

    if (highlight) drawnCountries.push(country);

    country.setAttribute("fill", color);
        
    country.setAttribute("stroke", strokeColor);
    country.setAttribute("stroke-width", "0.5");
}

function drawLandPatch(countryElement: SVGGElement, landPatch: number[][][]): SVGPathElement {
    
    const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    countryElement.appendChild(pathElement);

    let svgPointsAttribute = "";

    for (const svgPoints of landPatch) {
        svgPointsAttribute +=
            "M" +
            svgPoints.map(point => (centerX + ppd * point[0]) + " " + (centerY - ppd * point[1])).join(" ")
            + "z";
    }

    pathElement.setAttribute("d", svgPointsAttribute);
    return pathElement;
}