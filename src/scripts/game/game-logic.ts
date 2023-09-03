import type { CountryJson, CountryJsonList, CountryData } from '@/scripts/lib/countryjson';
import jsonCountries from '@/assets/countries.json';
import fastDiff from "fast-diff";
import { mapElementSetup, drawNewCountry, highlightNewCountry } from './map-render';
import { setupAnimation } from './viewbox-animation';
import type diff from 'fast-diff';
import { pickFirstCountry, pickNewCountry, setupPicker } from './country-picker';

interface FeedbackComponent {
    text: string,
    color: string
}

export class CurrentGuess {
    country: CountryData;
    falseGuesses: number = 0;

    constructor(country: CountryData) {
        this.country = country;
    }
    
    reset(country: CountryData) {
        this.country = country;
        this.falseGuesses = 0;
    }
}

let feedbackBgElement: HTMLElement;
let feedbackTextElement: HTMLElement;

const colors = {
    bgError: "#ff000077",
    bgMistake: "#bbbb0077",
    bgCorrect: "#00ff0077",

    plainText: "#ffffff",
    missingChar: "#33ff33",
    extraChar: "#ff3333"
}

const countryJsonArray: CountryJson[] = (jsonCountries as CountryJsonList).countries;

const countryMap: Map<string, CountryData> = new Map();

let currentGuess: CurrentGuess;

export function gameSetup() {
    mapElementSetup();

    setupCountries();
    setupPicker(countryMap);

    setupInsert();
    setupAnimation();
    generateQuesion(true);
}

function setupCountries() {
    for (const country of countryJsonArray) {
        const name = country.names[0].toLowerCase();
        const geometry = country.geometry;
        const countrySvg = drawNewCountry(name, geometry);

        if (!country.active) continue;

        const countryData: CountryData = {jsonData: country, countrySvg: countrySvg};
        countryMap.set(name, countryData);
    }
}

function setupInsert() {
    const form: HTMLFormElement = document.getElementById("country-guess-form") as HTMLFormElement;
    const input: HTMLInputElement = document.getElementById("country-input") as HTMLInputElement;
    feedbackTextElement = document.getElementById("feedback") as HTMLElement;
    feedbackBgElement = document.getElementById("input-area") as HTMLElement;

    form.addEventListener("submit", event => {
        event.preventDefault();

        const guess: string = input.value;
        input.value = "";

        answerCheck(guess);
    });
}

function displayFeedback(bgColor: string, feedback: FeedbackComponent[]) {
    feedbackBgElement.style.backgroundColor = bgColor;
    
    feedbackTextElement.innerHTML = "";

    for (const feedbackComp of feedback) {
        const span = document.createElement("span");
        span.textContent = feedbackComp.text;
        span.style.color = feedbackComp.color;
        feedbackTextElement.appendChild(span);
    }
}

function generateQuesion(first: boolean) {

    // For development
    const override = "balls";

    let newCountry: CountryData | undefined;
    if (countryMap.has(override)) newCountry = countryMap.get(override);
    else newCountry = first ? pickFirstCountry() : pickNewCountry(currentGuess);

    if (newCountry === undefined) {
        displayFeedback(colors.bgCorrect, [{ text: "It's Joever", color: "white" }]);
        return;
    }

    if (first) {
        currentGuess = new CurrentGuess(newCountry);
    }

    currentGuess.reset(newCountry);
    highlightNewCountry(newCountry);
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
    wrongAnswerFeedback(answers);
}

function isCorrectAnswer(guess: string, answers: string[]): boolean {
    for (const correctAnswer of answers) {
        if (guess.toLocaleLowerCase() === correctAnswer.toLocaleLowerCase()) {
            displayFeedback(colors.bgCorrect, [{
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
            displayFeedback(colors.bgMistake, formatMisspellFeedback(correctDiffs, guessDiffs));
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

function formatMisspellFeedback(correctDiffs: diff.Diff[], guessDiffs: diff.Diff[]) {
    const feedback: FeedbackComponent[] = [];
    feedback.push({ text: "Kirjaviga: ", color: colors.plainText });

    for (const diff of guessDiffs) {
        feedback.push({
            text: diff[1],
            color: diff[0] === 1 ? colors.extraChar : colors.plainText
        })
    }

    feedback.push({ text: " -> ", color: colors.plainText });

    for (const diff of correctDiffs) {
        feedback.push({
            text: diff[1],
            color: diff[0] === -1 ? colors.missingChar : colors.plainText
        })
    }
    return feedback;
}

function unofficialCheck(guess: string, unofficials: string[]): boolean {
    for (const unofficial of unofficials) {
        if (guess.toLowerCase() === unofficial.toLowerCase()) {
            displayFeedback(colors.bgMistake, [{
                text: `${unofficial} pole riigi ametlik nimi.`,
                color: "white"
            }]);
            return true;
        }
    }
    return false;
}

function wrongAnswerFeedback(answers: string[]) {
    const feedback: FeedbackComponent = {
        text: "",
        color: "white"
    }

    if (currentGuess.falseGuesses <= 1) {
        const hint = answers[0];
        feedback.text = `Vihje: ${hint.substring(0, 1) + hint.substring(1).replace(/\p{L}/gu, "*")}`

    } else if (answers.length > 1) {
        feedback.text = `Õiged vastused: ${answers.join(" / ")}`;
    } else {
        feedback.text = `Õige vastus: ${answers[0]}`;
    }

    displayFeedback(colors.bgError, [feedback]);
}
