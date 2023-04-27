import { defineCustomElement } from 'vue';
import jsonCountries from './assets/countries/countries.json'; 

const jsonCountryList: any[] = (jsonCountries as any).features;

let possibleCanvas: HTMLElement | null;

const max_lat = 90;
const max_alt = 180;
let ppd: number; // pixels per degree
let center_x: number;
let center_y: number;

const countries: Map<string, number[][][][]> = new Map();
const countryNameList: string[] = [];
let currentCountry: string;

const drawnCountries: number[][][][][] = [];

export function setup() {
    possibleCanvas = document.getElementById("countryCanvas");
    setupCountries();
    setupInsert();
    drawMap();
    generateQuesion();
}

function setupCountries() {
    jsonCountryList.forEach(country => {
        const name: string = (country.properties.ADMIN as string).toLocaleLowerCase();
        const geometry: any = country.geometry;
        const geometryType: any = geometry.type;
        const coords: number[][][] = geometry.coordinates;
    
        if (geometryType == "MultiPolygon") {
            countries.set(name, coords as any as number[][][][]);
            countryNameList.push(name);

        } else if (geometryType == "Polygon") {
            countries.set(name, [coords]);
            countryNameList.push(name);

        } else {
            console.log("Geometry type: " + geometryType);
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
    const country: number[][][][] | undefined = countries.get(countryName);
    currentCountry = countryName;	
    if (country === undefined) return;
    drawCountry(country, false);
}

function drawMap() {
    countries.forEach(country => {
        drawCountry(country, true);
    });
}

function clearPrevCountries() {
    drawnCountries.forEach(drawnCountry => {
        drawCountry(drawnCountry, true);
    });
    drawnCountries.length = 0;
}

function drawCountry(country: number[][][][], erase: boolean) {
    if (!(possibleCanvas instanceof HTMLCanvasElement)) return;
    const canvas: HTMLCanvasElement = possibleCanvas as HTMLCanvasElement;
    
    const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
    if (ctx == null) return;

    ppd = 0.5 * Math.min(canvas.height / max_lat, canvas.width / max_alt);
    center_x = ppd * max_alt;
    center_y = ppd * max_lat;

    if (!erase) drawnCountries.push(country);

    const eraseColor: string = "green";
    const color: string = erase ? eraseColor : "yellow";

    country.forEach(landPatch => {
        drawPoly(ctx, landPatch[0], color);

        for (let i: number = 1; i < landPatch.length; i++) {
            drawPoly(ctx, landPatch[i], eraseColor);
        }
    });
}

function drawPoly(ctx: CanvasRenderingContext2D, polygon: number[][], color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();

    ctx.moveTo(center_x + ppd * polygon[0][0], (center_y - ppd * polygon[0][1]));
    polygon.forEach(point => {
        ctx.lineTo(center_x + ppd * point[0], (center_y - ppd * point[1]));
    });

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    //ctx.stroke();

    ctx.closePath();
    ctx.fill();
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