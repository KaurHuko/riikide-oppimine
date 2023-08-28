import type { CountryJson, CountryJsonList, CountryData } from '@/scripts/lib/countryjson';
import jsonCountries from '@/assets/countries.json';
import fastDiff from "fast-diff";
import { mapElementSetup, drawNewCountry, highlightNewCountry } from './map-render';
import { setupAnimation } from './viewbox-animation';
import type diff from 'fast-diff';
import { shuffleArray } from '../util/math-util';

interface FeedbackComponent {
    text: string,
    color: string
}

class GuessStatus {
    falseGuesses: number = 0;
    reset() {
        this.falseGuesses = 0;
    }
}

type AnswerFeedback = FeedbackComponent[];

let feedbackElement: HTMLElement;

const countryJsonArray: CountryJson[] = (jsonCountries as CountryJsonList).countries;

const countryMap: Map<string, CountryData> = new Map();

let askedCountryIndex = 0;
let countriesToAsk: CountryData[] = [];
let countriesToAskNext: CountryData[] = [];

const guessStatus = new GuessStatus();
let currentCountry: CountryData;

export function gameSetup() {
    mapElementSetup();
    setupCountries();
    setupInsert();
    setupAnimation();
    generateQuesion();
}

function setupCountries() {
    for (const country of countryJsonArray) {
        if (!country.active) continue;

        const name = country.names[0].toLowerCase();
        const geometry = country.geometry;

        const countryData: CountryData = {jsonData: country, countrySvg: drawNewCountry(name, geometry)};
        countryMap.set(name, countryData);
        countriesToAsk.push(countryData);
    }
    shuffleArray(countriesToAsk);
}

function setupInsert() {
    const form: HTMLFormElement = document.getElementById("country-guess-form") as HTMLFormElement;
    const input: HTMLInputElement = document.getElementById("country-name") as HTMLInputElement;
    feedbackElement = document.getElementById("feedback") as HTMLElement;

    form.addEventListener("submit", event => {
        event.preventDefault();

        const guess: string = input.value;
        const feedback = answerCheck(guess);
        displayFeedback(feedback);
    });
}

function displayFeedback(feedback: AnswerFeedback) {
    feedbackElement.innerHTML = "";

    for (const feedbackComp of feedback) {
        const span = document.createElement("span");
        span.textContent = feedbackComp.text;
        span.style.color = feedbackComp.color;
        feedbackElement.appendChild(span);
    }
}

function generateQuesion() {
    const prevCountry = currentCountry;

    if (askedCountryIndex >= countriesToAsk.length) {
        countriesToAsk = countriesToAskNext;
        countriesToAskNext = [];
        askedCountryIndex = 0;
    }

    if (countriesToAsk.length === 0 || countriesToAsk.length === 1 && countriesToAsk[0] === prevCountry) {
        displayFeedback([{
            text: "It's Joever",
            color: "blue"
        }]);
        return;
    }

    currentCountry = countriesToAsk[askedCountryIndex++];
    guessStatus.reset();
    highlightNewCountry(currentCountry);
}

function answerCheck(guess: string): AnswerFeedback {
    const answers = currentCountry.jsonData.names;
    const unofficialAnswers = currentCountry.jsonData.alternativeNames;

    let feedback = isCorrectAnswer(guess, answers);
    if (feedback) {
        generateQuesion();
        return feedback;
    }

    feedback = misspelledCheck(guess, answers);
    if (feedback) return feedback;

    feedback = unofficialCheck(guess, unofficialAnswers);
    if (feedback) return feedback;
    
    guessStatus.falseGuesses++;
    if (guessStatus.falseGuesses === 1) countriesToAskNext.push(currentCountry);
    return wrongAnswerFeedback(answers);
}

function isCorrectAnswer(guess: string, answers: string[]): AnswerFeedback | undefined {
    for (const correctAnswer of answers) {
        if (guess.toLocaleLowerCase() === correctAnswer.toLocaleLowerCase()) {
            return [{
                text: `${correctAnswer} on õige!`,
                color: "green"
            }];
        }
    }
    return undefined;
}

function misspelledCheck(guess: string, answers: string[]): AnswerFeedback | undefined {
    for (const correctAnswer of answers) {
        const [allDiffs, correctDiffs, guessDiffs] = getDifferences(guess, correctAnswer);
        console.log(allDiffs);
        console.log(correctDiffs);
        console.log(guessDiffs);

        const errorCount = countErrors(allDiffs);
        const acceptedErrorCount = Math.floor((correctAnswer.length + guess.length) / 4);

        if (errorCount <= acceptedErrorCount) {
            return formatMisspellFeedback(correctDiffs, guessDiffs);
        }
    }
    return undefined;
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
    const mainColor = "goldenrod";
    const missingColor = "green";
    const extraColor = "red";

    const feedback: AnswerFeedback = [];
    feedback.push({ text: "Kirjaviga: ", color: mainColor });

    for (const diff of guessDiffs) {
        feedback.push({
            text: diff[1],
            color: diff[0] === 1 ? extraColor : mainColor
        })
    }

    feedback.push({ text: " -> ", color: mainColor });

    for (const diff of correctDiffs) {
        feedback.push({
            text: diff[1],
            color: diff[0] === -1 ? missingColor : mainColor
        })
    }
    return feedback;
}

function unofficialCheck(guess: string, unofficials: string[]): AnswerFeedback | undefined {
    for (const unofficial of unofficials) {
        if (guess.toLowerCase() === unofficial.toLowerCase()) {
            return [{
                text: `${unofficial} pole riigi ametlik nimi.`,
                color: "goldenrod"
            }];
        }
    }
    return undefined;
}

function wrongAnswerFeedback(answers: string[]): AnswerFeedback {
    const feedback: FeedbackComponent = {
        text: "",
        color: "red"
    }

    if (guessStatus.falseGuesses <= 1) {
        const hint = answers[0];
        feedback.text = `Vihje: ${hint.substring(0, 1) + hint.substring(1).replace(/\p{L}/gu, "*")}`

    } else if (answers.length > 1) {
        feedback.text = `Õiged vastused: ${answers.join(" / ")}`;
    } else {
        feedback.text = `Õige vastus: ${answers[0]}`;
    }

    return [feedback];
}
