import { ChoiceInterface } from '@app/classes/database-types/choice-interface/choice-interface';
import { QuestionObjects } from '@app/classes/database-types/question-objects/question-objects';
import { expect } from 'chai';

describe('QuestionObjects', () => {
    let testInstance: QuestionObjects;
    const question = 'who lives in a pineapple under the sea?';
    const points = 70;
    const choices: ChoiceInterface[] = [
        {
            choice: 'SpongeBob SquarePants',
            isCorrect: true,
        },
        {
            choice: 'Mr. Krabs',
            isCorrect: false,
        },
        {
            choice: 'Andrew Tate, lord of all beasts of the land and fishes in the sea',
            isCorrect: true,
        },
    ];
    const questionJson = {
        question,
        points,
        choices,
        id: '123',
        type: 'MCQ',
    };
    beforeEach(() => {
        testInstance = new QuestionObjects(questionJson);
    });

    it('should get created beautifully', () => {
        const instanceJSON = JSON.stringify(testInstance.toJSON());
        expect(JSON.parse(instanceJSON).points).to.deep.equal(points);
        expect(JSON.parse(instanceJSON).question).to.deep.equal(question);
    });
    it('should assign the appropriate type of question upon creation', () => {
        const instanceJSON = JSON.stringify(testInstance.toJSON());
        expect(JSON.parse(instanceJSON).type).to.deep.equal('MCQ');
        const newInstance = JSON.stringify(new QuestionObjects(questionJson).toJSON());
        expect(JSON.parse(instanceJSON).type).to.not.deep.equal(JSON.parse(newInstance).type);
        expect(JSON.parse(newInstance).type).to.deep.equal('LAQ');
    });
    it('should assign a unique ID upon creation', () => {
        const instanceJSON = JSON.stringify(testInstance.toJSON());
        const newInstance = JSON.stringify(new QuestionObjects(questionJson).toJSON());
        expect(JSON.parse(instanceJSON).id).to.not.deep.equal(JSON.parse(newInstance).id);
    });
});
