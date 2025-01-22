import { QuestionRangeError } from './question-range-error';

describe('QuestionRangeError', () => {
    it('should create a QuestionRangeError instance with the correct error message', () => {
        const lowerBound = 1;
        const upperBound = 10;
        const numberReceived = 15;

        try {
            throw new QuestionRangeError(lowerBound, upperBound, numberReceived);
        } catch (error) {
            expect(error).toBeInstanceOf(QuestionRangeError);
            expect((error as Error).message).toContain(
                `Invalid number : expected number in range [${lowerBound}, ${upperBound}], but got ${numberReceived}`,
            );
        }
    });

    it('should not throw an error when the number is within the range', () => {
        const lowerBound = 1;
        const upperBound = 10;
        const numberReceived = 5;

        expect(() => {
            new QuestionRangeError(lowerBound, upperBound, numberReceived);
        }).not.toThrow();
    });

    it('should throw an error when the number is below the lower bound', () => {
        const lowerBound = 1;
        const upperBound = 10;
        const numberReceived = 0;

        expect(() => {
            throw new QuestionRangeError(lowerBound, upperBound, numberReceived);
        }).toThrow();
    });

    it('should throw an error when the number is above the upper bound', () => {
        const lowerBound = 1;
        const upperBound = 10;
        const numberReceived = 15;

        expect(() => {
            throw new QuestionRangeError(lowerBound, upperBound, numberReceived);
        }).toThrow();
    });
});
