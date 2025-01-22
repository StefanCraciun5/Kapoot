import { expect } from 'chai';
import { QuizObjects } from '@app/classes/database-types/quiz-objects/quiz-objects';

describe('QuizObjects', () => {
    let testInstance: QuizObjects;
    const title = 'test for the QuizObjects object';
    const description = 'this is a test';
    const questions: string[] = ['question1-id', 'question2-id', 'etc...'];
    const duration = 20;
    beforeEach(() => {
        testInstance = new QuizObjects(title, description, questions);
    });

    it('should get created beautifully', () => {
        const instanceJSON = JSON.parse(JSON.stringify(testInstance.toJSON()));
        expect(instanceJSON.title).to.deep.equal(title);
        expect(instanceJSON.description).to.deep.equal(description);
        expect(instanceJSON.duration).to.equal(0);
        expect(instanceJSON.isVisible).to.equal(true);
        expect(instanceJSON.lastModification).to.be.a('string');
    });
    it('should set the the duration to any given number', () => {
        testInstance.setDuration(duration);
        expect(JSON.parse(JSON.stringify(testInstance.toJSON())).duration).to.deep.equal(duration);
    });
});
