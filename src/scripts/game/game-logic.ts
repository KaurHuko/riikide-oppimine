import type { CountryJson, CountryJsonList, CountryData } from '@/scripts/lib/countryjson';
import jsonCountries from '@/assets/countries.json'; 
import { toPascalCase } from '../util/text-util';
import { mapElementSetup, drawNewCountry, highlightNewCountry } from './map-render';

const countryJsonArray: CountryJson[] = (jsonCountries as CountryJsonList).countries;

const countryMap: Map<string, CountryData> = new Map();
const countryNameList: string[] = [];
let currentCountry: string;

export function gameSetup() { 
    mapElementSetup();
    setupCountries();
    setupInsert();
    generateQuesion();
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
    const countryName: string = countryNameList[Math.floor(Math.random() * countryNameList.length)];
    const country: CountryData | undefined = countryMap.get(countryName);

    currentCountry = countryName;
    if (country === undefined) return;

    highlightNewCountry(country);
}
