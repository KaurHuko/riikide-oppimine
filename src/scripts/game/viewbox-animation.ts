import { BBox, cloneBBox } from "../lib/countryjson";
import { someSmoothCurve } from "../util/math-util";
import { centerX, centerY, mapSvg, xBorder, yBorder } from "./map-render";

const countryZoomDuration = 500;

let animationState: "CountryZoom" | "ScrollZoom" | "None" = "None";
let startTime: number | undefined = undefined;

let mouseDown = false;

let previousViewBox: BBox | undefined;
let currentViewBox: BBox | undefined;
let targetViewBox: BBox;

export function setupAnimation() {
    mapSvg.addEventListener("wheel", onWheel);
    mapSvg.addEventListener("mousemove", onMouseMove);

    mapSvg.addEventListener("mousedown", (event) => {
        if (event.button === 0) {
            mouseDown = true
        }
    });

    mapSvg.addEventListener("mouseup", (event) => {
        if (event.button === 0) {
            document.body.style.cursor = "auto";
            mouseDown = false
        }
    });
}

function onWheel(event: WheelEvent) {
    event.preventDefault();
    if (previousViewBox === undefined || animationState === "CountryZoom") return;

    const newViewBox = cloneBBox(previousViewBox);
    
    const zoom = Math.pow(1.003, event.deltaY);
    newViewBox.size = [newViewBox.size[0] * zoom, newViewBox.size[1] * zoom];
    clampSize(newViewBox, 0);
    const sizeChange = [previousViewBox.size[0] - newViewBox.size[0], previousViewBox.size[1] - newViewBox.size[1]];

    const mouseX = event.clientX / viewWidth();
    const mouseY = event.clientY / viewHeight();
    newViewBox.pos = [previousViewBox.pos[0] + sizeChange[0] * mouseX, previousViewBox.pos[1] + sizeChange[1] * mouseY];
    clampCoordinates(newViewBox);

    previousViewBox = newViewBox;
    setViewBox(newViewBox);
}

function onMouseMove(event: MouseEvent) {
    if (!mouseDown || previousViewBox === undefined) return

    const newViewBox = cloneBBox(previousViewBox);

    const mouseX = event.movementX / viewWidth() * newViewBox.size[0];
    const mouseY = event.movementY / viewHeight() * newViewBox.size[1];

    newViewBox.pos[0] -= mouseX;
    newViewBox.pos[1] -= mouseY;

    clampCoordinates(newViewBox);

    previousViewBox = newViewBox;
    setViewBox(newViewBox);

    document.body.style.cursor = "move";
}

export function animateViewBox(bounding: BBox) {
    targetViewBox = countryZoomView(bounding);

    if (previousViewBox === undefined) {
        previousViewBox = targetViewBox;
        setViewBox(targetViewBox);
        return;
    }

    startTime = undefined;
    animationState = "CountryZoom";
    window.requestAnimationFrame(animationFrame);
}

function animationFrame(currentTime: number) {
    if (previousViewBox === undefined) return;

    if (startTime === undefined) {
        startTime = currentTime;
    }

    const progress = someSmoothCurve(Math.min(1, (currentTime - startTime) / countryZoomDuration));
    currentViewBox = calculateCurrentViewBox(previousViewBox, targetViewBox, progress);
    setViewBox(currentViewBox);

    if (progress < 1) {
        window.requestAnimationFrame(animationFrame);
    } else {
        animationState = "None";
        previousViewBox = targetViewBox;
    }
}

function calculateCurrentViewBox(previous: BBox, target: BBox, progress: number): BBox {
    const currentViewBox: BBox = new BBox(0, 0, 0, 0);

    for (let i = 0; i < 2; i++) {
        const prevSize = previous.size[i];
        const targetSize = target.size[i];
        const newSize = Math.pow(prevSize, (1 - progress)) * Math.pow(targetSize, progress);
        currentViewBox.size[i] = newSize;

        const sizeProgress = (newSize - prevSize) / (targetSize - prevSize);
        // This only happens if target is equal to previous.
        if (Number.isNaN(sizeProgress) || !Number.isFinite(sizeProgress)) return previous;

        const prevPos = previous.pos[i];
        const targetPos = target.pos[i];
        currentViewBox.pos[i] = prevPos + sizeProgress * (targetPos - prevPos);
    }

    return currentViewBox;
}

function setViewBox(viewBox: BBox) {
    mapSvg.setAttribute("viewBox", `${viewBox.pos[0]} ${viewBox.pos[1]} ${viewBox.size[0]} ${viewBox.size[1]}`)
}

function countryZoomView(bounding: BBox): BBox {
    const view = cloneBBox(bounding);

    const viewExpand = 10;

    view.pos[0] = centerX + view.pos[0] - viewExpand;
    view.pos[1] = centerY - view.pos[1] - view.size[1] - viewExpand;
    view.size[0] = view.size[0] + 2 * viewExpand;
    view.size[1] = view.size[1] + 2 * viewExpand;

    fixSizeRatio(view);
    view.pos[1] -= (windowHeight() / viewHeight() - 1.1) / 2 * view.size[1];
    clampCoordinates(view);

    return view;
}

function fixSizeRatio(viewBox: BBox) {
    const mapRatio = viewWidth() / viewHeight();

    if (viewBox.size[0] / viewBox.size[1] < mapRatio) { 
        fixOneCoord(viewBox, 0, mapRatio);
    } else {
        fixOneCoord(viewBox, 1, 1 / mapRatio);
    }

    function fixOneCoord(bbox: BBox, i0: number, mapRatio: number) {
        const i1 = 1 - i0;
        const newSize = bbox.size[i1] * mapRatio;
        bbox.pos[i0] -= (newSize - bbox.size[i0]) / 2;
        bbox.size[i0] = newSize;
    }
}

function clampSize(vb: BBox, i: number) {
    const i1 = 1 - i;
    if (vb.size[i] < 1) {
        vb.size[i1] = vb.size[i1] * 1 / vb.size[i];
        vb.size[i] = 1;
    } else if (vb.size[i] > xBorder[2]) {
        vb.size[i1] = vb.size[i1] * xBorder[2] / vb.size[i];
        vb.size[i] = xBorder[2];
    }
}

function clampCoordinates(viewBox: BBox) {
    viewBox.pos[0] = Math.max(xBorder[0], Math.min(xBorder[1] - viewBox.size[0], viewBox.pos[0]));
    viewBox.pos[1] = Math.max(yBorder[0], Math.min(yBorder[1] - viewBox.size[1], viewBox.pos[1]));
}

function viewWidth() {
    if (window.visualViewport) return window.visualViewport.width;
    return window.screen.width;
}

function viewHeight() {
    if (window.visualViewport) return window.visualViewport.height;
    return window.screen.height;
}

function windowHeight() {
    return window.innerHeight;
}