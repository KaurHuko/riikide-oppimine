
export function projectedYCoordinate(coordinate: number): number {
    const warp = Math.abs(coordinate) / 90;
    const multiplier = 1 + 0.5 * (warp * warp);
    return coordinate * multiplier;
}

export function sqrDistance(pointA: number[], pointB: number[]): number {
    const x = pointA[0] - pointB[0];
    const y = pointA[1] - pointB[1];
    return x*x + y*y;
}

// Takes and returns number between 0 and 1
// Has a smooth graph shape
export function someSmoothCurve(input: number): number {
    const sqr = input*input;
    return 3*sqr - 2*sqr*input;
}

export function shuffleArray(array: any[]) {
    for (let i = array.length; i > 0; i--) {
        const j = Math.floor(Math.random() * i);
        [array[i-1], array[j]] = [array[j], array[i-1]];
    }
}