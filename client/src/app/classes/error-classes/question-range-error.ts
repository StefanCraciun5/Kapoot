export class QuestionRangeError extends Error {
    constructor(lowerBound: number, upperBound: number, numberReceived: number) {
        const errMessage = `Invalid number : expected number in range [${lowerBound}, ${upperBound}], but got ${numberReceived}`;
        super(errMessage);
    }
}
