import fastDiff from "fast-diff";
import type { CountryElementData } from '../lib/countryjson';

import { pickFirstCountry, pickNewCountry, setupPicker } from './country-picker';
import { mapElementSetup, drawNewCountry, highlightNewCountry } from './map-render';
import { setupAnimation } from './viewbox-animation';
import { countryJsonMap, getCountries } from "./country-list";
import { displayFeedback, feedbackColors, formatMisspellFeedback, pickSubmitIcon, setupFeedback, wrongAnswerFeedback } from "./input-feedback";

export class CurrentGuess {
    country: CountryElementData;
    falseGuesses: number = 0;

    constructor(country: CountryElementData) {
        this.country = country;
    }
    
    reset(country: CountryElementData) {
        this.country = country;
        this.falseGuesses = 0;
    }

    countryName(): string {
        return this.country.jsonData.names[0];
    }
}

let input: HTMLInputElement;
let form: HTMLFormElement;

const countryMap: Map<string, CountryElementData> = new Map();
let askedCountries: string[];
let currentGuess: CurrentGuess;

export function gameSetup(regionArg: string | null, listArg: string | null) {
    mapElementSetup();

    setupCountries(regionArg, listArg);
    setupPicker(askedCountries);

    setupFeedback();
    setupInsert();
    setupAnimation();
    generateQuesion(true);
}

function endGame() {
    displayFeedback(feedbackColors.bgCorrect, [{ text: "Riigid läbi töötatud!", color: "white" }]);
    input.disabled = true;
}

function setupCountries(regionArg: string | null, listArg: string | null) {
    askedCountries = getCountries(regionArg, listArg);

    for (const country of countryJsonMap) {
        const name = country[0];
        const geometry = country[1].geometry;
        const countrySvg = drawNewCountry(name, geometry);

        if (!country[1].active) continue;

        const countryData: CountryElementData = {jsonData: country[1], countrySvg: countrySvg};
        countryMap.set(name, countryData);
    }
}

function setupInsert() {
    form = document.getElementById("country-form") as HTMLFormElement;
    input = document.getElementById("country-input") as HTMLInputElement;

    form.addEventListener("submit", event => {
        event.preventDefault();

        const guess: string = input.value;
        input.value = "";
        input.focus();

        answerCheck(guess);
        pickSubmitIcon(input.value, currentGuess.falseGuesses);
    });

    form.addEventListener("input", () => {
        pickSubmitIcon(input.value, currentGuess.falseGuesses);
    });
}

function generateQuesion(first: boolean) {

    // For development
    const override = "balls";

    let newCountry: CountryElementData | undefined;
    if (countryMap.has(override)) {
        newCountry = countryMap.get(override);
    } else {
        const newCountryName = first ? pickFirstCountry() : pickNewCountry(currentGuess);
        if (newCountryName !== undefined) newCountry = countryMap.get(newCountryName);
    }

    if (newCountry === undefined) {
        endGame();
        return;
    }

    if (first) {
        currentGuess = new CurrentGuess(newCountry);
    }

    currentGuess.reset(newCountry);
    highlightNewCountry(newCountry);
    pickSubmitIcon("", 0);
}

function answerCheck(guess: string) {
    const answers = currentGuess.country.jsonData.names;
    const unofficialAnswers = currentGuess.country.jsonData.alternativeNames;

    if (isCorrectAnswer(guess, answers)) {
        generateQuesion(false);
        return;
    }

    if (misspelledCheck(guess, answers)) return;

    if (unofficialCheck(guess, unofficialAnswers)) return;
    
    currentGuess.falseGuesses++;
    wrongAnswerFeedback(answers, currentGuess.falseGuesses);
}

function isCorrectAnswer(guess: string, answers: string[]): boolean {
    for (const correctAnswer of answers) {
        if (guess.toLocaleLowerCase() === correctAnswer.toLocaleLowerCase()) {
            displayFeedback(feedbackColors.bgCorrect, [{
                text: `${correctAnswer} on õige!`,
                color: "white"
            }]);
            return true
        }
    }
    return false;
}

function misspelledCheck(guess: string, answers: string[]): boolean {
    for (const correctAnswer of answers) {
        const [allDiffs, correctDiffs, guessDiffs] = getDifferences(guess, correctAnswer);

        const errorCount = countErrors(allDiffs);
        const acceptedErrorCount = Math.floor((correctAnswer.length + guess.length) / 4);

        if (errorCount <= acceptedErrorCount) {
            displayFeedback(feedbackColors.bgMistake, formatMisspellFeedback(correctDiffs, guessDiffs));
            return true
        }
    }
    return false;
}

function getDifferences(guess: string, correctAnswer: string) {
    const allDiffs = fastDiff(correctAnswer.toLowerCase(), guess.toLowerCase());

    const correctDiffs: fastDiff.Diff[] = [];
    let correctIndex = 0;
    const guessDiffs: fastDiff.Diff[] = [];
    let guessIndex = 0;

    for (const diff of allDiffs) {
        if (diff[0] === 0 || diff[0] === -1) {
            correctDiffs.push([diff[0], correctAnswer.substring(correctIndex, correctIndex + diff[1].length)]);
            correctIndex += diff[1].length;
        }
        if (diff[0] === 0 || diff[0] === 1) {
            guessDiffs.push([diff[0], guess.substring(guessIndex, guessIndex + diff[1].length)]);
            guessIndex += diff[1].length;
        }
    }

    return [allDiffs, correctDiffs, guessDiffs];
}

function countErrors(diffs: fastDiff.Diff[]): number {
    let count = 0;
    for (const diff of diffs) {
        if (diff[0] !== 0) count += diff[1].length;
    }
    return count;
}

function unofficialCheck(guess: string, unofficials: string[]): boolean {
    for (const unofficial of unofficials) {
        if (guess.toLowerCase() === unofficial.toLowerCase()) {
            displayFeedback(feedbackColors.bgMistake, [{
                text: `${unofficial} pole riigi ametlik nimi.`,
                color: "white"
            }]);
            return true;
        }
    }
    return false;
}
