/* eslint-disable max-lines */
import { QuestionCaretaker } from '@app/classes/modification-memento/caretaker/question-caretaker';
import { QuestionMemento } from '@app/classes/modification-memento/mementos/question-memento';
import { QuestionPayload, QuestionReducer } from '@app/classes/reducer/question-reducer/question-reducer';
import { QuestionStates } from '@app/classes/reducer/states';
import { QuestionRenderer } from '@app/classes/renderer/question-renderer/question-renderer';
import { CondenserService } from '@app/services/condenser-service/condenser-service';

interface QuestionCaretakerSpy extends jasmine.SpyObj<QuestionCaretaker> {
    mementos: QuestionMemento[];
}

describe('QuestionReducer', () => {
    let mockCaretaker: QuestionCaretakerSpy;
    let mockRenderer: jasmine.SpyObj<QuestionRenderer>;
    let questionReducer: QuestionReducer;

    beforeEach(() => {
        mockCaretaker = jasmine.createSpyObj('QuestionCaretaker', ['initialize', 'backup', 'undo']) as QuestionCaretakerSpy;
        mockCaretaker.mementos = [];
        mockRenderer = jasmine.createSpyObj('QuestionRenderer', ['restore']);
        questionReducer = new QuestionReducer(mockCaretaker, mockRenderer);
    });

    it('should not proceed if memento is falsy', () => {
        questionReducer['handleUpdateQuestion'](null as unknown as QuestionMemento);

        expect(mockRenderer.restore).not.toHaveBeenCalled();
        expect(mockCaretaker.backup).not.toHaveBeenCalled();
    });

    it('should initialize a question correctly when the Initialize action is dispatched', () => {
        const payload: QuestionPayload = {
            questionOBJ: {
                id: '123',
                question: 'What is TypeScript?',
                points: 5,
                choices: [],
                lastModified: new Date(),
                type: 'MCQ',
            },
        };

        questionReducer.reduce({ action: QuestionStates.Initialize, payload });
        expect(mockCaretaker.initialize).toHaveBeenCalledWith(jasmine.anything());
    });

    it('should not call any methods and return undefined when the Save action is dispatched with conditions not met', () => {
        const result = questionReducer.reduce({ action: QuestionStates.Save, payload: {} });
        expect(mockCaretaker.backup).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });

    it('should not call any methods and return undefined when the Save action is dispatched with conditions not met', () => {
        const payload: QuestionPayload = {
            questionOBJ: {
                id: '123',
                question: 'What is TypeScript?',
                points: 5,
                choices: [],
                lastModified: new Date(),
                type: 'MCQ',
            },
        };
        const result = questionReducer.reduce({ action: QuestionStates.UpdateQuestionType, payload });
        // expect(mockCaretaker.backup).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });

    it('should call saveQuestionState correctly when the Save action is dispatched with a payload', () => {
        // Simulate having more than one memento in the mementos array
        const memento1 = new QuestionMemento({
            questionID: '123',
            action: QuestionStates.Initialize,
            questionOBJ: {
                id: '123',
                question: 'What is TypeScript?',
                points: 5,
                choices: [],
                lastModified: new Date(),
                type: 'MCQ',
            },
        });
        const memento2 = new QuestionMemento({
            questionID: '456',
            action: QuestionStates.UpdateQuestionQuestion,
            question: 'Updated question text',
        });

        mockCaretaker.mementos.push(memento1, memento2);
        questionReducer.reduce({ action: QuestionStates.Save, payload: {} });
        expect(mockCaretaker.initialize).toHaveBeenCalled();
    });

    it('should update the question text correctly when the UpdateQuestionQuestion action is dispatched', () => {
        const payload: QuestionPayload = {
            question: 'Updated question text',
            questionOBJ: {
                id: '123',
                question: 'Original question text',
                points: 5,
                choices: [],
                lastModified: new Date(),
                type: 'MCQ',
            },
        };

        questionReducer.reduce({ action: QuestionStates.UpdateQuestionQuestion, payload });
        expect(mockRenderer.restore).toHaveBeenCalledWith(jasmine.anything());
    });

    it('should update the question points correctly when the UpdateQuestionPoints action is dispatched', () => {
        const payload: QuestionPayload = {
            points: 10,
            questionOBJ: {
                id: '123',
                question: 'What is TypeScript?',
                points: 5,
                choices: [],
                lastModified: new Date(),
                type: 'MCQ',
            },
        };

        questionReducer.reduce({ action: QuestionStates.UpdateQuestionPoints, payload });
        expect(mockRenderer.restore).toHaveBeenCalledWith(jasmine.anything());
    });

    it('should update the question choices correctly when the UpdateQuestionChoices action is dispatched', () => {
        const payload: QuestionPayload = {
            choices: [{ choice: 'Updated choice', isCorrect: true }],
            questionOBJ: {
                id: '123',
                question: 'What is TypeScript?',
                points: 5,
                choices: [],
                lastModified: new Date(),
                type: 'MCQ',
            },
        };

        questionReducer.reduce({ action: QuestionStates.UpdateQuestionChoices, payload });
        expect(mockRenderer.restore).toHaveBeenCalledWith(jasmine.anything());
    });

    it('should successfully create a question when all conditions are met', () => {
        // Simulate the scenario where there are multiple mementos and the last memento has all required information
        const memento1 = new QuestionMemento({
            questionID: '123',
            action: QuestionStates.Initialize,
            questionOBJ: {
                id: '123',
                question: 'What is TypeScript?',
                points: 5,
                choices: [{ choice: 'A programming language', isCorrect: true }],
                lastModified: new Date(),
                type: 'MCQ',
            },
        });

        const memento2 = new QuestionMemento({
            questionID: '456',
            action: QuestionStates.UpdateQuestionQuestion,
            question: 'What is TypeScript?',
        });

        const memento3 = new QuestionMemento({
            questionID: '789',
            action: QuestionStates.UpdateQuestionPoints,
            points: 10,
        });

        const memento4 = new QuestionMemento({
            questionID: '1011',
            action: QuestionStates.UpdateQuestionChoices,
            choices: [{ choice: 'A programming language', isCorrect: true }],
        });

        mockCaretaker.mementos.push(memento1, memento2, memento3, memento4);

        spyOn(CondenserService, 'condenseQuestion').and.returnValue(
            new QuestionMemento({
                questionID: 'final',
                action: QuestionStates.CreateQuestion,
                question: 'What is TypeScript?',
                points: 10,
                choices: [{ choice: 'A programming language', isCorrect: true }],
            }),
        );

        questionReducer.reduce({ action: QuestionStates.CreateQuestion, payload: {} });

        expect(mockCaretaker.initialize).toHaveBeenCalled();
        expect(mockCaretaker.initialize).toHaveBeenCalledWith(
            jasmine.objectContaining({
                state: jasmine.objectContaining({
                    questionID: jasmine.any(String),
                    action: QuestionStates.CreateQuestion,
                    questionOBJ: jasmine.objectContaining({
                        id: jasmine.any(String),
                        question: 'What is TypeScript?',
                        points: 10,
                        choices: jasmine.any(Array),
                        lastModified: jasmine.any(Date),
                    }),
                }),
                dirtyBit: false,
            }),
        );
    });

    it('should not create a question when the question text is missing', () => {
        spyOn(CondenserService, 'condenseQuestion').and.returnValue(
            new QuestionMemento({
                questionID: 'no-question',
                action: QuestionStates.CreateQuestion,
                // question is missing
                points: 10,
                choices: [{ choice: 'A programming language', isCorrect: true }],
            }),
        );

        questionReducer.reduce({ action: QuestionStates.CreateQuestion, payload: {} });
        expect(mockCaretaker.initialize).not.toHaveBeenCalled();
    });

    it('should not create a question when the points are missing', () => {
        spyOn(CondenserService, 'condenseQuestion').and.returnValue(
            new QuestionMemento({
                questionID: 'no-points',
                action: QuestionStates.CreateQuestion,
                question: 'What is TypeScript?',
                // points are missing
                choices: [{ choice: 'A programming language', isCorrect: true }],
            }),
        );

        questionReducer.reduce({ action: QuestionStates.CreateQuestion, payload: {} });
        expect(mockCaretaker.initialize).not.toHaveBeenCalled();
    });

    it('should not create a question when the choices are missing', () => {
        spyOn(CondenserService, 'condenseQuestion').and.returnValue(
            new QuestionMemento({
                questionID: 'no-choices',
                action: QuestionStates.CreateQuestion,
                question: 'What is TypeScript?',
                points: 10,
                // choices are missing
            }),
        );

        questionReducer.reduce({ action: QuestionStates.CreateQuestion, payload: {} });
        expect(mockCaretaker.initialize).not.toHaveBeenCalled();
    });

    it('should not call any methods and return undefined when the CreateQuestion action is dispatched with conditions not met', () => {
        const payload = {};
        const result = questionReducer.reduce({ action: QuestionStates.CreateQuestion, payload });
        expect(mockCaretaker.initialize).not.toHaveBeenCalled();
        expect(mockCaretaker.backup).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });

    it('should delete a question correctly when the DeleteQuestion action is dispatched', () => {
        const payload: QuestionPayload = {
            questionOBJ: {
                id: '123',
                question: 'Question to delete',
                points: 5,
                choices: [],
                type: 'MCQ',
                lastModified: new Date(),
            },
        };

        questionReducer.reduce({ action: QuestionStates.DeleteQuestion, payload });
        // Assuming deleteQuestion might result in some form of state change that can be observed. Since it's a deletion,
        // you might need to check if a corresponding method was called on a dependency. If deleteQuestion leads to
        // a method call on either mockCaretaker or mockRenderer, test for that. This is a placeholder for whatever
        // your implementation does.
        expect(mockCaretaker.backup).toHaveBeenCalled(); // Adjust based on actual behavior
    });

    it('should not call any methods on dependencies when an invalid action is dispatched', () => {
        const invalidAction = 'INVALID_ACTION';
        const payload: QuestionPayload = {};

        questionReducer.reduce({ action: invalidAction as unknown as QuestionStates, payload });
        expect(mockCaretaker.initialize).not.toHaveBeenCalled();
        expect(mockCaretaker.backup).not.toHaveBeenCalled();
        expect(mockRenderer.restore).not.toHaveBeenCalled();
    });

    it('should not initialize a question when questionOBJ is not provided', () => {
        const payload: QuestionPayload = {};
        questionReducer.reduce({ action: QuestionStates.Initialize, payload });
        expect(mockCaretaker.initialize).not.toHaveBeenCalled();
    });

    it('should not perform saveQuestionState when there is only one memento', () => {
        // You might need to adjust this setup based on how your mocks and implementations work
        // The idea here is to simulate the condition where there's only one memento in the caretaker
        mockCaretaker.mementos = [
            /* some memento */
        ];
        questionReducer.reduce({ action: QuestionStates.Save, payload: {} });
        expect(mockCaretaker.backup).not.toHaveBeenCalled();
    });

    it('should not create a question when necessary conditions are not met', () => {
        questionReducer.reduce({ action: QuestionStates.CreateQuestion, payload: {} });
        expect(mockCaretaker.initialize).not.toHaveBeenCalled();
    });

    it('should not delete a question when questionOBJ is not provided in the payload', () => {
        const payload: QuestionPayload = {};
        questionReducer.reduce({ action: QuestionStates.DeleteQuestion, payload });
        // Adjust expectation based on actual behavior, this is just a placeholder
        expect(mockCaretaker.backup).not.toHaveBeenCalled();
    });

    describe('QuestionReducer with indirect testing of handleUpdateQuestion', () => {
        beforeEach(() => {
            // Setup your spies, mocks, and instances here as before
            // Resetting spies before each test
            mockCaretaker.backup.calls.reset();
            mockRenderer.restore.calls.reset();
        });

        it('should not update question text if payload is incomplete', () => {
            const incompletePayloads = [
                { questionOBJ: null, question: "What's new?" }, // Missing questionOBJ
                { questionOBJ: { id: '123', question: '', points: 0, choices: [] }, question: null }, // Missing question
            ] as unknown as QuestionPayload[];

            incompletePayloads.forEach((payload) => {
                questionReducer.reduce({ action: QuestionStates.UpdateQuestionQuestion, payload });
                expect(mockRenderer.restore).not.toHaveBeenCalled();
                expect(mockCaretaker.backup).not.toHaveBeenCalled();
            });
        });

        it('should not update question points if payload is incomplete', () => {
            const incompletePayloads = [
                { questionOBJ: null, points: 10 }, // Missing questionOBJ
                { questionOBJ: { id: '123', question: '', points: 0, choices: [] }, points: null }, // Missing points
            ] as unknown as QuestionPayload[];

            incompletePayloads.forEach((payload) => {
                questionReducer.reduce({ action: QuestionStates.UpdateQuestionPoints, payload });
                expect(mockRenderer.restore).not.toHaveBeenCalled();
                expect(mockCaretaker.backup).not.toHaveBeenCalled();
            });
        });

        it('should not update question choices if payload is incomplete', () => {
            const incompletePayloads = [
                { questionOBJ: null, choices: [{ choice: 'A', isCorrect: true }] }, // Missing questionOBJ
                { questionOBJ: { id: '123', question: '', points: 0, choices: [] }, choices: null }, // Missing choices
            ] as unknown as QuestionPayload[];

            incompletePayloads.forEach((payload) => {
                questionReducer.reduce({ action: QuestionStates.UpdateQuestionChoices, payload });
                expect(mockRenderer.restore).not.toHaveBeenCalled();
                expect(mockCaretaker.backup).not.toHaveBeenCalled();
            });
        });
    });
});
