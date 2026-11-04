export function range(start: number, stop?: number, step: number = 1): number[] {
    // Handle single-argument form: range(stop)
    if (stop === undefined) {
        stop = start;
        start = 0;
    }

    if (step === 0) throw new Error("range() step argument must not be zero");

    const result: number[] = [];

    if (step > 0) {
        for (let i = start; i < stop; i += step) result.push(i);
    } else {
        for (let i = start; i > stop; i += step) result.push(i);
    }

    return result;
}
