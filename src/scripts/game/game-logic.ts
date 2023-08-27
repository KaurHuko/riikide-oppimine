import type { CountryJson, CountryJsonList, CountryData } from '@/scripts/lib/countryjson';
import jsonCountries from '@/assets/countries.json'; 
import * as Diff from "diff";
import { mapElementSetup, drawNewCountry, highlightNewCountry } from './map-render';
import { setupAnimation } from './viewbox-animation';

interface AnswerFeedback {
    message: string,
    color: string
}

interface ReplaceChange {
    added: string,
    removed: string
}

type Misspell = Diff.Change | ReplaceChange;

const countryJsonArray: CountryJson[] = (jsonCountries as CountryJsonList).countries;

const countryMap: Map<string, CountryData> = new Map();
const countryNameList: string[] = [];
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

        const name = country.names[0].toLocaleLowerCase();
        const geometry = country.geometry;

        countryMap.set(name, {jsonData: country, countrySvg: drawNewCountry(name, geometry)});
        countryNameList.push(name);
    }
}

function setupInsert() {
    const form: HTMLFormElement = document.getElementById("country-guess-form") as HTMLFormElement;
    const input: HTMLInputElement = document.getElementById("country-name") as HTMLInputElement;
    const feedbackElement: HTMLElement = document.getElementById("feedback") as HTMLElement;

    form.addEventListener("submit", event => {
        event.preventDefault();

        const guess: string = input.value;
        const feedback = answerCheck(guess);

        feedbackElement.innerHTML = feedback.message;
        feedbackElement.style.color = feedback.color;

    })
}

function generateQuesion() {
    const countryName: string = countryNameList[Math.floor(Math.random() * countryNameList.length)];
    const country: CountryData = countryMap.get(countryName)!;

    currentCountry = country;
    highlightNewCountry(country);
}

function answerCheck(guess: string): AnswerFeedback {
    const answers = currentCountry.jsonData.names;

    let feedback = isCorrectAnswer(guess, answers);
    if (feedback) {
        generateQuesion();
        return feedback;
    }

    feedback = misspelledCheck(guess, answers);
    if (feedback) return feedback;
        
    return wrongAnswerFeedback(answers);
}

function isCorrectAnswer(guess: string, answers: string[]): AnswerFeedback | undefined {
    for (const correctAnswer of answers) {
        if (guess.toLocaleLowerCase() === correctAnswer.toLocaleLowerCase()) {
            return {
                message: `${correctAnswer} is correct!`,
                color: "green"
            };
        }
    }
    return undefined;
}

function misspelledCheck(guess: string, answers: string[]): AnswerFeedback | undefined {
    for (const correctAnswer of answers) {
        const misspells = getMisspells(guess, correctAnswer);

        const errorCount = countErrors(misspells);
        const acceptedErrorCount = Math.floor(correctAnswer.length / 3);

        if (errorCount <= acceptedErrorCount) {
            return {
                message: `Misspell: ${guess} -> ${correctAnswer}`,
                color: "goldenrod"
            }
        }
    }
    return undefined;
}

function getMisspells(guess: string, correctAnswer: string): Misspell[] {
    const changes = Diff.diffChars(correctAnswer, guess, { ignoreCase: true });
    const misspells: Misspell[] = [];

    for (let i = 0; i < changes.length; i++) {
        const change = changes[i];
        const nextChange = changes[i+1];
        
        if (i+1 == changes.length) {
            misspells.push(change);
            continue;
        }

        if ((change.added && nextChange.removed) || (change.removed && nextChange.added)) {
            i = mergeMisspell(misspells, change, nextChange, i);
        } else {
            misspells.push(change);
        }
    }

    return misspells;
}

function mergeMisspell(misspells: Misspell[], change: Diff.Change, nextChange: Diff.Change, i: number): number {

    const added = change.added ? change.value : nextChange.value;
    const removed = change.added ? nextChange.value : change.value;

    if (change.count! < nextChange.count!) {
        currentChangeSmaller()
    } else if (change.count! > nextChange.count!) {
        nextChangeSmaller();
    } else {
        changesEqual();
    }

    return i;

    function currentChangeSmaller() {
        misspells.push({
            added: added.substring(0, change.count),
            removed: removed.substring(0, change.count)
        })
        nextChange.count! -= change.count!;
        nextChange.value = nextChange.value.substring(change.count!);
    }

    function changesEqual() {
        misspells.push({
            added: added.substring(0, change.count),
            removed: removed.substring(0, nextChange.count)
        })
        i++;
    }

    function nextChangeSmaller() {
        misspells.push({
            added: added.substring(0, change.count),
            removed: removed.substring(0, nextChange.count)
        })
        misspells.push({
            value: change.value.substring(nextChange.count!),
            added: change.added,
            removed: change.removed,
            count: change.count! - nextChange.count!
        })
        i++;
    }
}

function countErrors(misspells: Misspell[]): number {
    let count = 0;

    for (const misspell of misspells) {
        if ("value" in misspell) {
            if (misspell.added || misspell.removed) count += misspell.count!;
        } else {
            count += misspell.added.length;
        }
    }
    return count;
}

function wrongAnswerFeedback(answers: string[]): AnswerFeedback {
    const feedback: AnswerFeedback = {
        message: "",
        color: "red"
    }

    if (answers.length > 1) {
        feedback.message = `Correct Answers: ${answers.join(" / ")}`;
    } else {
        feedback.message = `Correct answer: ${answers[0]}`;
    }

    return feedback;
}
