import { QuizCaretaker } from '@app/classes/modification-memento/caretaker/quiz-caretaker';
import { QuizMemento } from '@app/classes/modification-memento/mementos/quiz-memento';
import { QuizInterface } from '@app/classes/quiz/quiz-interface';
import { QuizPayload, QuizReducer, QuizReducerOBJ } from '@app/classes/reducer/quiz-reducer/quiz-reducer';
import { QuizStates } from '@app/classes/reducer/states';
import { QuizRenderer } from '@app/classes/renderer/quiz-renderer/quiz-renderer';
import { CondenserService } from '@app/services/condenser-service/condenser-service';

interface QuizCaretakerSpy extends jasmine.SpyObj<QuizCaretaker> {
    mementos: QuizMemento[];
}

describe('QuizReducer', () => {
    let mockCaretaker: QuizCaretakerSpy;
    let mockRenderer: jasmine.SpyObj<QuizRenderer>;
    let quizReducer: QuizReducer;

    beforeEach(() => {
        mockCaretaker = jasmine.createSpyObj('QuizCaretaker', ['initialize', 'backup', 'undo']) as QuizCaretakerSpy;
        mockCaretaker.mementos = [];
        mockRenderer = jasmine.createSpyObj('QuizRenderer', ['restore']);
        quizReducer = new QuizReducer(mockCaretaker, mockRenderer);
    });

    const mockQuiz: QuizInterface = {
        id: 'quiz1',
        title: 'Sample Quiz',
        description: 'A sample description for the quiz',
        lastModification: new Date(),
        questionIDs: ['q1', 'q2'],
        duration: 30,
        visibility: true,
    };

    it('should initialize a quiz correctly when the Initialize action is dispatched', () => {
        const payload: QuizPayload = { quizOBJ: mockQuiz };
        const actionObj: QuizReducerOBJ = { action: QuizStates.Initialize, payload };

        quizReducer.reduce(actionObj.action, actionObj.payload);
        expect(mockCaretaker.initialize).toHaveBeenCalledWith(jasmine.any(QuizMemento));
    });

    describe('QuizReducer handleInitialize with missing quizOBJ', () => {
        it('should not proceed with initialization when quizOBJ is missing from the payload', () => {
            const payloadMissingQuizObj: QuizPayload = {}; // Missing quizOBJ
            quizReducer.reduce(QuizStates.Initialize, payloadMissingQuizObj);
            expect(mockCaretaker.initialize).not.toHaveBeenCalled();
        });
    });

    it('should save quiz state correctly when the SaveQuiz action is dispatched and there are multiple mementos', () => {
        mockCaretaker.mementos = [
            new QuizMemento({ quiz: mockQuiz, action: QuizStates.Initialize }),
            new QuizMemento({ quiz: mockQuiz, action: QuizStates.UpdateQuizTitle, title: 'New Title' }),
        ];
        quizReducer.reduce(QuizStates.SaveQuiz, {});
        expect(mockCaretaker.initialize).toHaveBeenCalled();
    });

    it('should not save quiz state when there is one or fewer mementos', () => {
        // Scenario with 0 mementos
        mockCaretaker.mementos = [];
        quizReducer.reduce(QuizStates.SaveQuiz, {});
        expect(mockCaretaker.initialize).not.toHaveBeenCalled();

        // Reset mock calls for the next scenario
        mockCaretaker.initialize.calls.reset();

        // Scenario with 1 memento
        mockCaretaker.mementos = [new QuizMemento({ quiz: mockQuiz, action: QuizStates.Initialize })];
        quizReducer.reduce(QuizStates.SaveQuiz, {});
        expect(mockCaretaker.initialize).not.toHaveBeenCalled();
    });

    it('should update the quiz title correctly when the UpdateQuizTitle action is dispatched', () => {
        const payload: QuizPayload = { title: 'Updated Quiz Title', quizOBJ: mockQuiz };
        quizReducer.reduce(QuizStates.UpdateQuizTitle, payload);
        expect(mockRenderer.restore).toHaveBeenCalledWith(jasmine.any(QuizMemento));
    });

    it('should update the quiz description correctly when the UpdateQuizDescription action is dispatched', () => {
        const payload: QuizPayload = { description: 'Updated Quiz Description', quizOBJ: mockQuiz };
        quizReducer.reduce(QuizStates.UpdateQuizDescription, payload);
        expect(mockRenderer.restore).toHaveBeenCalledWith(jasmine.any(QuizMemento));
    });

    it('should not update quiz when required payload properties are missing for description update', () => {
        const payloadMissingDescription: QuizPayload = { quizOBJ: mockQuiz }; // Missing description
        quizReducer.reduce(QuizStates.UpdateQuizDescription, payloadMissingDescription);
        expect(mockRenderer.restore).not.toHaveBeenCalled();

        const payloadMissingQuizObj: QuizPayload = { description: 'New Description' }; // Missing quizOBJ
        quizReducer.reduce(QuizStates.UpdateQuizDescription, payloadMissingQuizObj);
        expect(mockRenderer.restore).not.toHaveBeenCalled();
    });

    it('should update the quiz duration correctly when the UpdateQuizDuration action is dispatched', () => {
        const payload: QuizPayload = { duration: 45, quizOBJ: mockQuiz };
        quizReducer.reduce(QuizStates.UpdateQuizDuration, payload);
        expect(mockRenderer.restore).toHaveBeenCalledWith(jasmine.any(QuizMemento));
    });

    describe('QuizReducer handleUpdateQuizDuration with missing properties', () => {
        it('should not proceed with update when duration is missing', () => {
            const payloadMissingDuration = { quizOBJ: mockQuiz }; // Missing duration
            quizReducer.reduce(QuizStates.UpdateQuizDuration, payloadMissingDuration);
            expect(mockRenderer.restore).not.toHaveBeenCalled();
        });

        it('should not proceed with update when quizOBJ is missing', () => {
            const payloadMissingQuizObj = { duration: 45 }; // Missing quizOBJ
            quizReducer.reduce(QuizStates.UpdateQuizDuration, payloadMissingQuizObj);
            expect(mockRenderer.restore).not.toHaveBeenCalled();
        });
    });

    it('should update the quiz questions correctly when the UpdateQuizQuestions action is dispatched', () => {
        const payload: QuizPayload = { questionIDs: ['q3', 'q4'], quizOBJ: mockQuiz };
        quizReducer.reduce(QuizStates.UpdateQuizQuestions, payload);
        expect(mockRenderer.restore).toHaveBeenCalledWith(jasmine.any(QuizMemento));
    });

    describe('QuizReducer handleUpdateQuizQuestions with missing properties', () => {
        it('should not proceed with update when questionIDs is missing', () => {
            const payloadMissingQuestionIDs = { quizOBJ: mockQuiz }; // Missing questionIDs
            quizReducer.reduce(QuizStates.UpdateQuizQuestions, payloadMissingQuestionIDs);
            expect(mockRenderer.restore).not.toHaveBeenCalled();
        });

        it('should not proceed with update when quizOBJ is missing', () => {
            const payloadMissingQuizObj = { questionIDs: ['q3', 'q4'] }; // Missing quizOBJ
            quizReducer.reduce(QuizStates.UpdateQuizQuestions, payloadMissingQuizObj);
            expect(mockRenderer.restore).not.toHaveBeenCalled();
        });
    });

    it('should update the quiz visibility correctly when the UpdateQuizVisibility action is dispatched', () => {
        const payload: QuizPayload = { visibility: false, quizOBJ: mockQuiz };
        quizReducer.reduce(QuizStates.UpdateQuizVisibility, payload);
        expect(mockRenderer.restore).toHaveBeenCalledWith(jasmine.any(QuizMemento));
    });

    describe('QuizReducer handleUpdateQuizVisibility with missing properties', () => {
        it('should not proceed with update when visibility is undefined', () => {
            const payloadMissingVisibility = { quizOBJ: mockQuiz }; // Missing visibility
            quizReducer.reduce(QuizStates.UpdateQuizVisibility, payloadMissingVisibility);
            expect(mockRenderer.restore).not.toHaveBeenCalled();
        });

        it('should not proceed with update when quizOBJ is missing', () => {
            const payloadMissingQuizObj = { visibility: true }; // Missing quizOBJ
            quizReducer.reduce(QuizStates.UpdateQuizVisibility, payloadMissingQuizObj);
            expect(mockRenderer.restore).not.toHaveBeenCalled();
        });
    });

    it('should create a quiz correctly when the CreateQuiz action is dispatched with a valid payload', () => {
        // Setup to meet any specific conditions expected by handleCreateQuiz
        // For instance, ensure there's a history of changes that would lead to quiz creation
        mockCaretaker.mementos = [
            new QuizMemento({ quiz: mockQuiz, action: QuizStates.Initialize }),
            new QuizMemento({ quiz: mockQuiz, action: QuizStates.UpdateQuizTitle, title: 'Final Title' }),
        ];

        // Attempt to create the quiz
        quizReducer.reduce(QuizStates.CreateQuiz, { quizOBJ: mockQuiz });

        // Check if initialize was called correctly
        expect(mockCaretaker.initialize).toHaveBeenCalledWith(jasmine.any(QuizMemento));
    });

    describe('QuizReducer handleCreateQuiz with missing condensed properties', () => {
        it('should not proceed with create quiz when condensed memento is missing title, description, or questions', () => {
            spyOn(CondenserService, 'condenseQuiz').and.returnValue(
                new QuizMemento({
                    quiz: mockQuiz,
                    action: QuizStates.CreateQuiz,
                    title: undefined,
                    description: undefined,
                    questions: [],
                }),
            );

            mockCaretaker.mementos = [
                new QuizMemento({ quiz: mockQuiz, action: QuizStates.UpdateQuizTitle, title: 'Temporary Title' }),
                new QuizMemento({ quiz: mockQuiz, action: QuizStates.UpdateQuizDescription, description: 'Temporary Description' }),
            ];

            quizReducer.reduce(QuizStates.CreateQuiz, {});
            expect(mockCaretaker.initialize).not.toHaveBeenCalled();
        });
    });

    it('should not perform any action when attempting to create a quiz without necessary conditions met', () => {
        // Simulate the scenario where conditions for creating a quiz are not met, e.g., no mementos or missing quiz object
        const payload: QuizPayload = {};
        const result = quizReducer.reduce(QuizStates.CreateQuiz, payload);
        expect(mockCaretaker.initialize).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });

    it('should not call any methods and return undefined when an unrecognized action is dispatched', () => {
        const payload: QuizPayload = {};
        const result = quizReducer.reduce('UNRECOGNIZED_ACTION' as unknown as QuizStates, payload);
        expect(mockCaretaker.initialize).not.toHaveBeenCalled();
        expect(mockCaretaker.backup).not.toHaveBeenCalled();
        expect(mockRenderer.restore).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });

    it('should not update quiz when required payload properties are missing', () => {
        let payload: QuizPayload = { quizOBJ: undefined }; // Missing quiz object
        quizReducer.reduce(QuizStates.UpdateQuizTitle, payload);
        expect(mockRenderer.restore).not.toHaveBeenCalled();

        payload = { title: 'New Title' }; // Missing quiz object for title update
        quizReducer.reduce(QuizStates.UpdateQuizTitle, payload);
        expect(mockRenderer.restore).not.toHaveBeenCalled();
    });
});
