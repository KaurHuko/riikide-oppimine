import { shuffleArray } from "../util/math-util";
import type { CurrentGuess } from "./game-logic";

interface AskedQuestion {
    country: string,
    correctStreak: number
}

const questionQueue = new Map<number, AskedQuestion[]>();
let queueIndex: number;
let questionListIndex: number;

let allCountries: string[]
let allCountriesIndex: number;

let streakToRemoveQuestion: number;

export function setupPicker(askedCountries: string[]) {
    questionQueue.clear()
    
    queueIndex = 0;
    questionListIndex = -1;

    allCountries = askedCountries;
    shuffleArray(askedCountries);
    allCountriesIndex = 0;

    streakToRemoveQuestion = 4;
}

export function pickFirstCountry(): string | undefined {
    if (allCountries.length === 0) {
        return undefined;
    }
    return allCountries[allCountriesIndex++];
}

export function pickNewCountry(prevGuess: CurrentGuess): string | undefined {
    managePreviousGuess(prevGuess);

    const fromActiveList = pickFromActiveList();
    if (fromActiveList !== undefined) return fromActiveList;

    const fromQueueOrUnasked = pickFromQueueOrUnasked();
    if (fromQueueOrUnasked !== undefined) return fromQueueOrUnasked;

    return pickFromLeftover(prevGuess.countryName());
}

function pickFromActiveList(): string | undefined {
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

function pickFromLeftover(prevCountry: string): string | undefined {
    const maxPushIndex = pushIndex(streakToRemoveQuestion - 1);

    let chosenCountry: string | undefined;
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
        const newQueueQuestion: AskedQuestion = {country: prevGuess.countryName(), correctStreak: 0};
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
    return queueIndex + 3 * Math.pow(2, correctStreak);
}