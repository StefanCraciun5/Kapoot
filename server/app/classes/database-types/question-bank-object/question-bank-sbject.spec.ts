import { expect } from 'chai';
import { QuestionBankObject } from './question-bank-object';

describe('QuestionBankObject', () => {
    beforeEach(() => {
        // Create a new instance of QuestionBankObject before each test
    });

    it('should have a toJSON() method ', () => {
        const testInstance = new QuestionBankObject('Sample question');
        expect(() => testInstance.toJSON()).to.be.a('function');
    });
    it('should convert to JSON correctly', () => {
        const currentDate = new Date().toISOString();
        const sampleQuestion = 'Sample question';

        const testInstance = new QuestionBankObject(sampleQuestion);
        const jsonTestInstance = testInstance.toJSON();

        const expectedJSON = {
            lastModification: currentDate,
            question: sampleQuestion,
        };

        expect(jsonTestInstance).to.deep.equal(expectedJSON);
    });
});
