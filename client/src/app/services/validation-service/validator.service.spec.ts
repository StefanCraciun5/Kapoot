import { TestBed } from '@angular/core/testing';
import { QuizMemento } from '@app/classes/modification-memento/mementos/quiz-memento';
import { MCQuestion } from '@app/classes/question/question-interfaces';
import { QuizInterface } from '@app/classes/quiz/quiz-interface';
import { QuizStates } from '@app/classes/reducer/states';
import { QuestionRenderer } from '@app/classes/renderer/question-renderer/question-renderer';
import { QuestionRendererMock } from '@app/classes/renderer/question-renderer/question-renderer.spec';
import { QuizRenderer } from '@app/classes/renderer/quiz-renderer/quiz-renderer';
import { BankService } from '@app/services/bank-service/bank-service';
import { MockBankService } from '@app/services/bank-service/bank-service.spec';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { Validator } from './validator.service';

describe('Validator', () => {
    let question: MCQuestion;
    let quiz: QuizInterface;
    let bankServiceMock: MockBankService;
    let questionRendererMock: QuestionRendererMock;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;
    let quizRenderer: QuizRenderer;
    beforeEach(() => {
        bankServiceMock = new MockBankService();
        questionRendererMock = new QuestionRendererMock();
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['basicGet', 'adminPost']);
        quizRenderer = new QuizRenderer(communicationServiceSpy, '');
        TestBed.configureTestingModule({
            providers: [
                Validator,
                { provide: BankService, useValue: bankServiceMock },
                { provide: QuestionRenderer, useValue: questionRendererMock },
            ],
        });

        spyOn(BankService, 'getBankQuestions').and.returnValue(
            Promise.resolve(JSON.stringify([{ question: 'question1' }, { question: 'question2' }])),
        );

        question = {
            choices: [
                { choice: 'blabla', isCorrect: true },
                { choice: 'blabla2', isCorrect: false },
            ],
            id: '123',
            lastModified: new Date(),
            points: 20,
            question: 'A question',
            type: 'MCQ',
        };
        quiz = {
            description: 'blablabla',
            duration: 30,
            id: 'someQuizID',
            lastModification: new Date(),
            questionIDs: ['someQuestionID'],
            title: 'A quiz',
            visibility: false,
        };
    });

    it('should validate a valid question', () => {
        expect(Validator.validateQuestion(question, true)).toBeTrue();
    });
    it('should invalidate an invalid question', () => {
        expect(Validator.validateQuestion(undefined as unknown as MCQuestion, true)).toBeFalse();
    });
    it('should invalidate a question missing a name', () => {
        question.question = '';
        expect(Validator.validateQuestion(question, true)).toBeFalse();
    });
    it('should invalidate a question with the wrong number of choices', () => {
        question.choices = [{ choice: 'some choice', isCorrect: true }];
        expect(Validator.validateQuestion(question, true)).toBeFalse();
        question.choices = [
            { choice: 'bla', isCorrect: true },
            { choice: 'blabla', isCorrect: true },
            { choice: 'blabla2', isCorrect: false },
            { choice: 'blabla', isCorrect: true },
            { choice: 'blabla2', isCorrect: false },
        ];
        expect(Validator.validateQuestion(question, true)).toBeFalse();
    });
    it("should invalidate a question that doesn't have an invalid option", () => {
        question.choices = [
            { choice: 'bla', isCorrect: true },
            { choice: 'blabla', isCorrect: true },
            { choice: 'blabla2', isCorrect: true },
        ];
        expect(Validator.validateQuestion(question, true)).toBeFalse();
    });
    it("should invalidate a question that doesn't have an valid option", () => {
        question.choices = [
            { choice: 'bla', isCorrect: false },
            { choice: 'blabla', isCorrect: false },
            { choice: 'blabla2', isCorrect: false },
        ];
        expect(Validator.validateQuestion(question, true)).toBeFalse();
    });
    it('should not allow an empty option', () => {
        question.choices = [
            { choice: '', isCorrect: false },
            { choice: undefined as unknown as string, isCorrect: true },
            { choice: 'blabla2', isCorrect: false },
        ];
        expect(Validator.validateQuestion(question, true)).toBeFalse();
    });
    it('should invalidate a question with a bad number of points', () => {
        question.points = -5;
        expect(Validator.validateQuestion(question, true)).toBeFalse();
        question.points = 105;
        expect(Validator.validateQuestion(question, true)).toBeFalse();
    });
    it('should validate a valid question', () => {
        expect(Validator.validateQuiz(quiz)).toBeTrue();
    });
    it('should invalidate a quiz with no title', () => {
        quiz.title = '';
        expect(Validator.validateQuiz(quiz)).toBeFalse();
    });
    it('should invalidate a quiz with an invalid duration', () => {
        quiz.duration = -1;
        expect(Validator.validateQuiz(quiz)).toBeFalse();
        quiz.duration = 70;
        expect(Validator.validateQuiz(quiz)).toBeFalse();
        quiz.duration = undefined as unknown as number;
        expect(Validator.validateQuiz(quiz)).toBeFalse();
    });
    it('should invalidate a quiz that has an unbeknownst visibility', () => {
        quiz.visibility = undefined as unknown as boolean;
        expect(Validator.validateQuiz(quiz)).toBeFalse();
    });
    it('should invalidate a quiz that has no questions', () => {
        quiz.questionIDs = [];
        expect(Validator.validateQuiz(quiz)).toBeFalse();
    });
    it('should return false if a quiz name does not already exist in the question bank', async () => {
        spyOn(QuestionRenderer, 'getQuestion').and.returnValue(Promise.resolve(JSON.stringify({ question: 'randomQuestion' })));
        const value = await Validator.validateIsAlreadyInQuestionBank(question, communicationServiceSpy);
        expect(value).toBeFalse();
    });
    it('should return true if a quiz name already exists in the question bank', async () => {
        spyOn(QuestionRenderer, 'getQuestion').and.returnValue(Promise.resolve(JSON.stringify({ question: 'A question' })));
        const value = await Validator.validateIsAlreadyInQuestionBank(question, communicationServiceSpy);
        expect(value).toBeTrue();
    });
    it('should return false if an imported question name does not already exist in the quiz', async () => {
        spyOn(QuestionRenderer, 'getQuestion').and.returnValue(Promise.resolve(JSON.stringify({ question: 'A random question' })));
        quizRenderer.state = new QuizMemento({
            action: QuizStates.Initialize,
            quiz,
        });
        const value = await Validator.validateIsAlreadyInQuiz(question, quizRenderer, communicationServiceSpy);
        expect(value).toBeFalse();
    });
    it('should return true if an imported question name already exists in the quiz', async () => {
        spyOn(QuestionRenderer, 'getQuestion').and.returnValue(Promise.resolve(JSON.stringify({ question: 'A question' })));
        quiz.questionIDs.push('someQuizID');
        quizRenderer.state = new QuizMemento({
            action: QuizStates.Initialize,
            quiz,
        });
        const value = await Validator.validateIsAlreadyInQuiz(question, quizRenderer, communicationServiceSpy);
        expect(value).toBeTrue();
    });

    describe('Validator', () => {
        describe('validateQuizJSON', () => {
            it('should return true for a valid quiz JSON object', () => {
                const quizJSON = {
                    title: 'My Quiz',
                    description: 'A quiz description',
                    duration: 30,
                    questions: ['questionID1', 'questionID2'],
                    lastModification: new Date(),
                    id: 'quizID',
                    visible: true,
                };

                const isValid = Validator.validateQuizJSON(quizJSON as unknown as JSON);

                expect(isValid).toBe(true);
            });

            it('should return false for a quiz JSON object with missing or invalid properties', () => {
                // Missing title
                let quizJSON: Partial<QuizInterface> = {
                    description: 'A quiz description',
                    duration: 30,
                    questionIDs: ['questionID1', 'questionID2'],
                    lastModification: new Date(),
                    id: 'quizID',
                    visibility: true,
                };
                let isValid = Validator.validateQuizJSON(quizJSON as unknown as JSON);
                expect(isValid).toBe(false);

                // Missing duration
                quizJSON = {
                    title: 'My Quiz',
                    description: 'A quiz description',
                    questionIDs: ['questionID1', 'questionID2'],
                    lastModification: new Date(),
                    id: 'quizID',
                    visibility: true,
                };
                isValid = Validator.validateQuizJSON(quizJSON as unknown as JSON);
                expect(isValid).toBe(false);

                // Invalid duration
                quizJSON = {
                    title: 'My Quiz',
                    description: 'A quiz description',
                    duration: -10,
                    questionIDs: ['questionID1', 'questionID2'],
                    lastModification: new Date(),
                    id: 'quizID',
                    visibility: true,
                };
                isValid = Validator.validateQuizJSON(quizJSON as unknown as JSON);
                expect(isValid).toBe(false);

                // Missing questions
                quizJSON = {
                    title: 'My Quiz',
                    description: 'A quiz description',
                    duration: 30,
                    lastModification: new Date(),
                    id: 'quizID',
                    visibility: true,
                };
                isValid = Validator.validateQuizJSON(quizJSON as unknown as JSON);
                expect(isValid).toBe(false);

                // Missing visibility
                quizJSON = {
                    title: 'My Quiz',
                    description: 'A quiz description',
                    duration: 30,
                    questionIDs: ['questionID1', 'questionID2'],
                    lastModification: new Date(),
                    id: 'quizID',
                };
                isValid = Validator.validateQuizJSON(quizJSON as unknown as JSON);
                expect(isValid).toBe(false);
            });
        });
    });
});
