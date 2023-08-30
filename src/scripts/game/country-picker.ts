import type { CountryData } from "../lib/countryjson";
import { shuffleArray } from "../util/math-util";
import type { CurrentGuess } from "./game-logic";

interface AskedQuestion {
    country: CountryData,
    correctStreak: number
}

let streakToRemoveQuestion: number;

const questionQueue = new Map<number, AskedQuestion[]>();
let queueIndex = 0;
let questionListIndex = -1;

let allCountries: CountryData[] = [];
let allCountriesIndex = 0;

export function setupPicker(countryMap: Map<string, CountryData>) {
    allCountries = Array.from(countryMap.values());
    shuffleArray(allCountries);

    streakToRemoveQuestion = 4;
}

export function pickFirstCountry(): CountryData | undefined {

    if (allCountries.length === 0) {
        return undefined;
    }
    return allCountries[allCountriesIndex++];
}

export function pickNewCountry(prevGuess: CurrentGuess): CountryData | undefined {
    managePreviousGuess(prevGuess);

    const fromActiveList = pickFromActiveList();
    if (fromActiveList !== undefined) return fromActiveList;

    const fromQueueOrUnasked = pickFromQueueOrUnasked();
    if (fromQueueOrUnasked !== undefined) return fromQueueOrUnasked;

    return pickFromLeftover(prevGuess.country);
}

function pickFromActiveList(): CountryData | undefined {
    const activeQuestionList = questionQueue.get(queueIndex);

    if (activeQuestionList !== undefined && activeQuestionList.length > questionListIndex + 1) {
        questionListIndex++;
        return activeQuestionList[questionListIndex].country;
    }

    questionQueue.delete(queueIndex);
}

function pickFromQueueOrUnasked() {
    if (allCountries.length > allCountriesIndex) {

        queueIndex++;
        const questionList = questionQueue.get(queueIndex);

        if (questionList !== undefined) {
            questionListIndex = 0;
            return questionList[questionListIndex].country;
        }
        
        return allCountries[allCountriesIndex++];
    }
}

function pickFromLeftover(prevCountry: CountryData): CountryData | undefined {
    const maxPushIndex = pushIndex(streakToRemoveQuestion - 1);

    let chosenCountry: CountryData | undefined;
    let count = 0;

    for (let i = queueIndex + 1; i <= maxPushIndex; i++) {
        const questionList = questionQueue.get(i);
        if (questionList === undefined) continue;

        count += questionList.length;
        
        if (chosenCountry !== undefined) continue;
        
        questionListIndex = 0;
        
        if (questionList[questionListIndex].country === prevCountry) {
            questionListIndex++;
            count--;
            if (questionList.length <= questionListIndex) continue;
        }
        chosenCountry = questionList[questionListIndex].country;
        queueIndex = i;
    }
    
    streakToRemoveQuestion = Math.ceil(Math.log2(count));

    return chosenCountry;
}

function managePreviousGuess(prevGuess: CurrentGuess) {
    const prevCountry = prevGuess.country;
    const falseAnswer = prevGuess.falseGuesses > 0;

    const activeQuestionList = questionQueue.get(queueIndex);

    if (activeQuestionList !== undefined && activeQuestionList[questionListIndex] !== undefined) {
        const queueCountry = activeQuestionList[questionListIndex];
        
        if (falseAnswer) queueCountry.correctStreak = 0;
        else queueCountry.correctStreak++;

        pushQuestion(queueCountry);
        return;
    }

    if (falseAnswer) {
        const newQueueQuestion: AskedQuestion = {country: prevCountry, correctStreak: 0};
        pushQuestion(newQueueQuestion);
    }
}

function pushQuestion(question: AskedQuestion) {
    if (question.correctStreak >= streakToRemoveQuestion) return;

    const queuePosition = pushIndex(question.correctStreak);
    const targetQuestionList = questionQueue.get(queuePosition);

    if (targetQuestionList === undefined) {
        questionQueue.set(queuePosition, [question]);
    } else {
        targetQuestionList.push(question);
    }
}

function pushIndex(correctStreak: number): number {
    return queueIndex + Math.pow(2, correctStreak + 1);
}