
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
