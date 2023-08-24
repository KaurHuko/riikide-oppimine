
const duration = 500;
let startTime: number | undefined = undefined;

let previousViewBox: number[][] | undefined;
let targetViewBox: number[][];

let viewBoxElement: HTMLElement;

export function animateViewBox(target: number[][], element: HTMLElement) {
    targetViewBox = target;
    viewBoxElement = element;

    if (previousViewBox === undefined) {
        previousViewBox = target;
        setViewBox(target);
        return;
    }

    startTime = undefined;
    window.requestAnimationFrame(animationFrame);
}

function animationFrame(currentTime: number) {
    if (previousViewBox === undefined) return;

    if (startTime === undefined) {
        startTime = currentTime;
    }

    const progress = Math.min(1, (currentTime - startTime) / duration);

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
        previousViewBox = targetViewBox;
    }
}

function setViewBox(viewBox: number[][]) {
    viewBoxElement.setAttribute("viewBox", `${viewBox[0][0]} ${viewBox[0][1]} ${viewBox[1][0]} ${viewBox[1][1]}`)
}