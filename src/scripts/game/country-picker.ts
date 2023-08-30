import type { CountryData } from "../lib/countryjson";
import { shuffleArray } from "../util/math-util";
import type { CurrentGuess } from "./game-logic";

class Node {
    // Levels are reversed (bottom is 0, increases with height) as the height changes over time
    level: number;
    parent: ParentNode | undefined;

    constructor(level: number) {
        this.level = level;
    }
}

class CountryNode extends Node {
    country: CountryData;

    constructor(country: CountryData, level: number) {
        super(level);
        this.country = country;
    }
}

class ParentNode extends Node {
    children: Node[] = [];

    gameStatus: undefined | number | "Done";
    falseGuesses = 0;

    constructor(level: number) {
        super(level);
    }
}

const allNodes: Node[][] = [[]];

let activeParent: ParentNode | undefined = undefined;

let askedCountryIndex = 0;
let allCountries: CountryData[] = [];

export function setupPicker(countryMap: Map<string, CountryData>) {
    allCountries = Array.from(countryMap.values());

    shuffleArray(allCountries);
}

export function pickFirstCountry(): CountryData | undefined {
    if (allCountries.length === 0) {
        return undefined;
    }
    return allCountries[askedCountryIndex++];
}

export function pickNewCountry(currentGuess: CurrentGuess): CountryData | undefined {
    const prevCountry = currentGuess.country;

    if (activeParent === undefined) {

        if (currentGuess.falseGuesses <= 0) {
            return newUnaskedCountry();
        }
        return newNodeAndCountry(prevCountry)

    }

    return countryFromActiveParent(currentGuess.falseGuesses <= 0)
}

function newUnaskedCountry(): CountryData | undefined {
    if (askedCountryIndex >= allCountries.length) {
        return undefined;
    }
    return allCountries[askedCountryIndex];
}

function newNodeAndCountry(prevCountry: CountryData) {
    if (allCountries.length === 0 || allCountries.length === 1 && allCountries[0] === prevCountry) {
        return undefined;
    }

    const newNode = new CountryNode(prevCountry, 0);
    allNodes[0].push(newNode);

    const newParent = pairIfPossible(newNode);
    if (newParent !== undefined) activeParent = newParent;

    return allCountries[askedCountryIndex++];
}

function countryFromActiveParent(prevWasCorrect: boolean): CountryData | undefined {
     // The function is called after the if statement that ensures this
    activeParent = activeParent as ParentNode;

    if (activeParent.gameStatus === undefined) {
        activeParent.gameStatus = 0;
        return (activeParent.children[0] as CountryNode).country;
    }

    if (activeParent.gameStatus === whatever)
}

function pairIfPossible(node: Node): ParentNode | undefined {
    const level = node.level;
    const possiblePair = allNodes[level][allNodes[level].length - 2];

    if (possiblePair === undefined || possiblePair.parent !== undefined) return undefined;

    if (allNodes.length <= level+1) allNodes.push([]);

    const newParent = new ParentNode(level+1);
    allNodes[newParent.level].push(newParent);

    newParent.children = [node, possiblePair];
    node.parent = newParent;
    possiblePair.parent = newParent;

    pairIfPossible(newParent);

    return newParent;
} 