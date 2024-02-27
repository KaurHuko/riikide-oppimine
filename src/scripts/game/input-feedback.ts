import type diff from "fast-diff";

import checkSvg from "@/assets/icons/check.svg";
import hintSvg from "@/assets/icons/hint.svg";
import revealSvg from "@/assets/icons/reveal.svg";

interface SubmitIcon {
    src: string,
    description: string
}

interface FeedbackComponent {
    text: string,
    color: string
}

export const feedbackColors = {
    bgError: "#ff000044",
    bgMistake: "#bbbb0044",
    bgCorrect: "#00ff0044",

    plainText: "#ffffff",
    missingChar: "#33ff33",
    extraChar: "#ff3333"
}

let feedbackBgElement: HTMLElement;
let feedbackTextElement: HTMLElement;
let submitImageElement: HTMLImageElement;

const checkIcon: SubmitIcon = {src: checkSvg, description: "Kontrolli"};
const hintIcon: SubmitIcon = {src: hintSvg, description: "Vihje"};
const revealIcon: SubmitIcon = {src: revealSvg, description: "Avalda"};

let currentSubmitIcon: SubmitIcon;

export function setupFeedback() {
    feedbackTextElement = document.getElementById("feedback") as HTMLElement;
    feedbackBgElement = document.getElementById("input-area") as HTMLElement;
    submitImageElement = document.getElementById("country-submit-image") as HTMLImageElement;
}

export function displayFeedback(bgColor: string, feedback: FeedbackComponent[]) {
    feedbackBgElement.style.backgroundColor = bgColor;
    
    feedbackTextElement.innerHTML = "";

    for (const feedbackComp of feedback) {
        const span = document.createElement("span");
        span.textContent = feedbackComp.text;
        span.style.color = feedbackComp.color;
        feedbackTextElement.appendChild(span);
    }
}

export function formatMisspellFeedback(correctDiffs: diff.Diff[], guessDiffs: diff.Diff[]) {
    const feedback: FeedbackComponent[] = [];
    feedback.push({ text: "Kirjaviga: ", color: feedbackColors.plainText });

    for (const diff of guessDiffs) {
        feedback.push({
            text: diff[1],
            color: diff[0] === 1 ? feedbackColors.extraChar : feedbackColors.plainText
        })
    }

    feedback.push({ text: " -> ", color: feedbackColors.plainText });

    for (const diff of correctDiffs) {
        feedback.push({
            text: diff[1],
            color: diff[0] === -1 ? feedbackColors.missingChar : feedbackColors.plainText
        })
    }
    return feedback;
}

export function wrongAnswerFeedback(answers: string[], falseGuesses: number) {
    const feedback: FeedbackComponent = {
        text: "",
        color: "white"
    }

    if (falseGuesses <= 1) {
        const hint = answers[0];
        feedback.text = `Vihje: ${hint.substring(0, 1) + hint.substring(1).replace(/\p{L}/gu, "*")}`

    } else if (answers.length > 1) {
        feedback.text = `Õiged vastused: ${answers.join(" / ")}`;
    } else {
        feedback.text = `Õige vastus: ${answers[0]}`;
    }

    displayFeedback(feedbackColors.bgError, [feedback]);
}

export function pickSubmitIcon(value: string, falseGuesses: number) {
    let chosenIcon: SubmitIcon;

    if (value !== "") chosenIcon = checkIcon;
    else if (falseGuesses == 0) chosenIcon = hintIcon;
    else chosenIcon = revealIcon;

    if (chosenIcon !== currentSubmitIcon) {
        currentSubmitIcon = chosenIcon;
        submitImageElement.src = currentSubmitIcon.src;
        submitImageElement.title = currentSubmitIcon.description + " (Enter)";
    }
}