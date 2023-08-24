import { mapHeight, mapSvg, mapWidth } from "./map-render";

const countryZoomDuration = 500;
let countryZoomActive = false;
let startTime: number | undefined = undefined;

let previousViewBox: number[][] | undefined;
let targetViewBox: number[][];

export function setupAnimation() {
    mapSvg.addEventListener("wheel", onWheel);
}

function onWheel(event: WheelEvent) {
    if (previousViewBox === undefined || countryZoomActive === true) return;
    event.preventDefault();

    const zoom = Math.pow(1.004, event.deltaY);
    const prevScale = previousViewBox[1];
    const newScale = [prevScale[0] * zoom, prevScale[1] * zoom];
    const scaleChange = [prevScale[0] - newScale[0], prevScale[1] - newScale[1]];

    const mouseX = event.clientX / mapWidth;
    const mouseY = event.clientY / mapHeight;

    const prevMinPos = previousViewBox[0];
    const newMinPos = [prevMinPos[0] + scaleChange[0] * mouseX, prevMinPos[1] + scaleChange[1] * mouseY];

    previousViewBox = [newMinPos, newScale];
    setViewBox(previousViewBox);
}

export function animateViewBox(target: number[][]) {
    targetViewBox = target;

    if (previousViewBox === undefined) {
        previousViewBox = target;
        setViewBox(target);
        return;
    }

    startTime = undefined;
    countryZoomActive = true;
    window.requestAnimationFrame(animationFrame);
}

function animationFrame(currentTime: number) {
    if (previousViewBox === undefined) return;

    if (startTime === undefined) {
        startTime = currentTime;
    }

    const progress = Math.min(1, (currentTime - startTime) / countryZoomDuration);

    const currentViewBox: number[][] = [[0, 0], [0, 0]];
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
            currentViewBox[i][j] = (1 - progress) * previousViewBox[i][j] + progress * targetViewBox[i][j];
        }
    }
    setViewBox(currentViewBox);

    if (progress < 1) {
        window.requestAnimationFrame(animationFrame);
    } else {
        countryZoomActive = false;
        previousViewBox = targetViewBox;
    }
}

function setViewBox(viewBox: number[][]) {
    mapSvg.setAttribute("viewBox", `${viewBox[0][0]} ${viewBox[0][1]} ${viewBox[1][0]} ${viewBox[1][1]}`)
}