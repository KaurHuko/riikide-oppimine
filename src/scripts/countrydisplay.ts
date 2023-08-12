import jsonCountries from '../assets/countries.json'; 

const jsonCountryList: any[] = (jsonCountries as any).features;

let svgMap: HTMLElement;

const max_lat = 90;
const max_alt = 180;

let ppd: number; // pixels per degree
let center_x: number;
let center_y: number;

const countries: Map<string, SVGPathElement[]> = new Map();
const countryNameList: string[] = [];
let currentCountry: string;

const drawnCountries: SVGPathElement[][] = [];

export function setup() { 

    htmlElementSetup();
    setupCountries();
    setupInsert();
    generateQuesion();

}

function htmlElementSetup() {
    svgMap = document.getElementById("map")!;

    const mapWidth = parseFloat(svgMap.getAttribute("width")!);
    const mapHeight = parseFloat(svgMap.getAttribute("height")!);

    ppd = Math.min(mapWidth / max_lat, mapHeight / max_alt);
    center_x = ppd * max_alt;
    center_y = ppd * max_lat;
}

function setupCountries() {
    jsonCountryList.forEach(country => {
        const name: string = (country.properties.ADMIN as string).toLocaleLowerCase();
        const geometry: any = country.geometry;
        const geometryType: any = geometry.type;
        const coords: number[][][] = geometry.coordinates;
    
        if (geometryType == "MultiPolygon") {
            countries.set(name, drawNewCountry(coords as any as number[][][][]));
            countryNameList.push(name);

        } else if (geometryType == "Polygon") {
            countries.set(name, drawNewCountry([coords]));
            countryNameList.push(name);
        }
    })
}

function setupInsert() {
    try {
        const form: HTMLFormElement = document.getElementById("country-guess-form") as HTMLFormElement;
        const input: HTMLInputElement = document.getElementById("country-name") as HTMLInputElement;
        const feedback: HTMLElement = document.getElementById("feedback") as HTMLElement;

        form.addEventListener("submit", event => {
            event.preventDefault();

            const guess: string = input.value.toLocaleLowerCase();
            if (guess === currentCountry) {
                feedback.style.color = "green";
                feedback.innerHTML = formatName(currentCountry) + " is correct!";
                generateQuesion();
            } else {
                feedback.style.color = "red";
                feedback.innerHTML = "Correct answer: " + formatName(currentCountry);
            }
        })

    } catch (ignored: any) {}
}

function generateQuesion() {
    clearPrevCountries();

    const countryName: string = countryNameList[Math.floor(Math.random() * countryNameList.length)];
    const country: SVGPathElement[] | undefined = countries.get(countryName);

    currentCountry = countryName;
    if (country === undefined) return;

    colorCountry(country, true);
}

function clearPrevCountries() {
    drawnCountries.forEach(drawnCountry => {
        colorCountry(drawnCountry, false);
    });
    drawnCountries.length = 0;
}

function drawNewCountry(country: number[][][][]): SVGPathElement[] {
    
    const counrtySvg: SVGPathElement[] = [];

    for (const landPatch of country) {
        counrtySvg.push(drawLandPatch(landPatch));
    }

    colorCountry(counrtySvg, false);

    return counrtySvg;
}

function colorCountry(country: SVGPathElement[], highlight: boolean) {
    const color = highlight ? "yellow" : "green";
    if (highlight) drawnCountries.push(country);

    for (const landPatch of country) {
        landPatch.setAttribute("fill", color);
    }
}

function drawLandPatch(landPatch: number[][][]): SVGPathElement {
    
    const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    svgMap.appendChild(pathElement);

    let svgPointsAttribute = "";

    for (const svgPoints of landPatch) {
        svgPointsAttribute +=
            "M" +
            svgPoints.map(point => (center_x + ppd * point[0]) + " " + (center_y - ppd * point[1])).join(" ")
            + "z";
    }

    pathElement.setAttribute("d", svgPointsAttribute);
    pathElement.setAttribute("fill", "black");

    pathElement.setAttribute("stroke", "#ffffff33");
    pathElement.setAttribute("stroke-width", "0.75");
    
    return pathElement;
}

function formatName(name: string): string {
    name = name.substring(0, 1).toUpperCase() + name.substring(1);
    for (let i: number = 1; i < name.length - 1; i++) {
        if (name.charAt(i) === " ") {
            name = name.substring(0, i+1) + name.charAt(i+1).toUpperCase() + name.substring(i+2);
        }
        console.log(name.length);
    }
    return name;
}