import type { CountryData } from "../lib/countryjson";
import { shuffleArray } from "../util/math-util";
import type { CurrentGuess } from "./game-logic";

let askedCountryIndex = 0;
let countriesToAsk: CountryData[] = [];
let countriesToAskNext: CountryData[] = [];

export function setupPicker(countryMap: Map<string, CountryData>) {
    countriesToAsk = Array.from(countryMap.values());

    shuffleArray(countriesToAsk);
}

export function pickFirstCountry(): CountryData | undefined {
    if (countriesToAsk.length === 0) {
        return undefined;
    }
    return countriesToAsk[askedCountryIndex++];
}

export function pickNewCountry(currentGuess: CurrentGuess): CountryData | undefined {
    const prevCountry = currentGuess.country;

    if (currentGuess.falseGuesses > 0) {
        countriesToAskNext.push(prevCountry);
    }

    if (askedCountryIndex >= countriesToAsk.length) {
        countriesToAsk = countriesToAskNext;
        countriesToAskNext = [];
        askedCountryIndex = 0;
    }

    if (countriesToAsk.length === 0 || countriesToAsk.length === 1 && countriesToAsk[0] === prevCountry) {
        return undefined;
    }

    return countriesToAsk[askedCountryIndex++];
}