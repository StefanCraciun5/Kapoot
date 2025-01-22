import { HttpResponse } from '@angular/common/http';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { QuestionMemento } from '@app/classes/modification-memento/mementos/question-memento';
import { MCQuestion } from '@app/classes/question/question-interfaces';
import { QuestionStates } from '@app/classes/reducer/states';
import { BankService } from '@app/services/bank-service/bank-service';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { of } from 'rxjs';
import { QuestionRenderer } from './question-renderer';

export class QuestionRendererMock {
    static async getQuestion(id: string, communicationService: CommunicationService): Promise<string> {
        return JSON.stringify({ question: id, somethingElse: JSON.stringify(communicationService) });
    }
    initialize() {
        return;
    }

    render() {
        return null;
    }

    doSomething() {
        return;
    }

    save() {
        return null;
    }

    restore(memento: QuestionMemento) {
        if (memento) {
            return;
        }
        return;
    }
}

describe('QuestionRenderer', () => {
    let questionRenderer: QuestionRenderer;
    let questionRendererNoId: QuestionRenderer;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;

    beforeEach(() => {
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['delete', 'patch', 'basicGet', 'adminPost']);
        TestBed.configureTestingModule({
            providers: [QuestionRenderer, { provide: CommunicationService, useValue: communicationServiceSpy }],
        });
        questionRenderer = new QuestionRenderer(communicationServiceSpy, '1');
        questionRendererNoId = new QuestionRenderer(communicationServiceSpy);
    });

    it('should be created', () => {
        expect(questionRenderer).toBeTruthy();
    });

    it('should create a question successfully', fakeAsync(async () => {
        const questionMock = {
            id: '123',
            question: 'Sample question',
            points: 10,
            lastModified: new Date(),
            choices: [
                { choice: 'Choice 1', isCorrect: true },
                { choice: 'Choice 2', isCorrect: false },
            ],
            type: 'MCQ',
        };
        const httpResponse = new HttpResponse({ status: 200, body: '123' });
        communicationServiceSpy.adminPost.and.returnValue(of(httpResponse));
        const result = await QuestionRenderer.createQuestion(questionMock, true, 'admin/question', communicationServiceSpy);
        tick();

        expect(result).toEqual(questionMock.id);
    }));

    it('should create a LAQ question successfully', fakeAsync(async () => {
        const questionMock = {
            id: '123',
            question: 'Sample question',
            points: 10,
            lastModified: new Date(),
            choices: [
                { choice: 'Choice 1', isCorrect: true },
                { choice: 'Choice 2', isCorrect: false },
            ],
            type: 'MCQ',
        };
        const httpResponse = new HttpResponse({ status: 200, body: '123' });
        communicationServiceSpy.adminPost.and.returnValue(of(httpResponse));
        const result = await QuestionRenderer.createQuestion(questionMock, false, 'admin/question', communicationServiceSpy);
        tick();

        expect(result).toEqual(questionMock.id);
    }));

    it('should get a question successfully', fakeAsync(async () => {
        const questionId = '123';
        const questionMock = {
            id: questionId,
            question: 'Sample question',
            points: 10,
            lastModified: new Date(),
            choices: [
                { choice: 'Choice 1', isCorrect: true },
                { choice: 'Choice 2', isCorrect: false },
            ],
        };
        communicationServiceSpy.basicGet.and.returnValue(of({ title: '', body: JSON.stringify(questionMock) }));
        const result = await QuestionRenderer.getQuestion(questionId, communicationServiceSpy);
        tick();

        expect(result).toEqual(JSON.stringify(questionMock));
    }));

    it('should handle create question error', fakeAsync(async () => {
        const questionMock = {
            id: '123',
            question: 'Sample question',
            points: 10,
            lastModified: new Date(),
            choices: [
                { choice: 'Choice 1', isCorrect: true },
                { choice: 'Choice 2', isCorrect: false },
            ],
            type: 'MCQ',
        };

        communicationServiceSpy.adminPost.and.returnValue(new Error('Some error'));

        const result = await QuestionRenderer.createQuestion(questionMock, true, 'admin/questions', communicationServiceSpy);
        tick();

        expect(result).toEqual('');
    }));

    it('should initialize a question successfully', fakeAsync(async () => {
        const questionId = '1';
        const questionMock = {
            id: questionId,
            question: 'Sample question',
            points: 10,
            lastModified: new Date(),
            choices: [
                { choice: 'Choice 1', isCorrect: true },
                { choice: 'Choice 2', isCorrect: false },
            ],
        };
        const doSomethingSpy = spyOn(questionRenderer, 'doSomething');
        communicationServiceSpy.basicGet.and.returnValue(of({ title: '', body: JSON.stringify(questionMock) }));

        await questionRenderer.initialize();

        tick();

        expect(doSomethingSpy).toHaveBeenCalled();
    }));

    it('should not initialize a question when id is undefined', fakeAsync(async () => {
        const doSomethingSpy = spyOn(questionRendererNoId, 'doSomething');
        await questionRendererNoId.initialize();
        tick();

        expect(doSomethingSpy).not.toHaveBeenCalled();
    }));

    it('should render the top question successfully', () => {
        const mockQuestion: MCQuestion = {
            id: '1',
            question: 'Sample question',
            points: 10,
            lastModified: new Date(),
            choices: [
                { choice: 'Choice 1', isCorrect: true },
                { choice: 'Choice 2', isCorrect: false },
            ],
            type: 'MCQ',
        };
        const mockState = {
            questionID: '1',
            action: QuestionStates.CreateQuestion,
            questionOBJ: mockQuestion,
        };
        const mockQuestionMemento = new QuestionMemento(mockState);

        questionRenderer.state = mockQuestionMemento;

        const renderedQuestion: MCQuestion = questionRenderer.render();

        expect(renderedQuestion.id).toEqual(mockQuestion.id);
        expect(renderedQuestion.question).toEqual(mockQuestion.question);
        expect(renderedQuestion.points).toEqual(mockQuestion.points);
        expect(renderedQuestion.lastModified).toEqual(mockQuestion.lastModified);
        expect(renderedQuestion.choices).toEqual(mockQuestion.choices);
    });

    it('should revert to empty question successfully', () => {
        const nonEmptyQuestion: MCQuestion = {
            id: '1',
            question: 'Sample question',
            points: 10,
            lastModified: new Date(),
            choices: [
                { choice: 'Choice 1', isCorrect: true },
                { choice: 'Choice 2', isCorrect: false },
            ],
            type: 'MCQ',
        };
        const mockState = {
            questionID: '1',
            action: QuestionStates.CreateQuestion,
            questionOBJ: nonEmptyQuestion,
        };
        const mockQuestionMemento = new QuestionMemento(mockState);

        questionRenderer.state = mockQuestionMemento;

        questionRenderer.revertToEmptyQuestion();

        const revertedQuestion: MCQuestion = questionRenderer.render();
        const expectedEmptyQuestion: MCQuestion = {
            id: '',
            question: '',
            points: 10,
            lastModified: new Date(),
            choices: [
                { choice: '', isCorrect: false },
                { choice: '', isCorrect: false },
            ],
            type: 'MCQ',
        };
        expect(revertedQuestion.id).toEqual(expectedEmptyQuestion.id);
        expect(revertedQuestion.question).toEqual(expectedEmptyQuestion.question);
        expect(revertedQuestion.points).toEqual(expectedEmptyQuestion.points);
        expect(revertedQuestion.choices).toEqual(expectedEmptyQuestion.choices);
    });

    it('should patch the question successfully', fakeAsync(() => {
        const questionState = {
            questionID: '1',
            action: QuestionStates.UpdateQuestionChoices,
        };
        const quizId = '123';

        const httpResponse = new HttpResponse({ status: 200, body: 'Some response' });
        communicationServiceSpy.patch.and.returnValue(of(httpResponse));

        let result: boolean | undefined;
        questionRenderer.patch(questionState, quizId).then((res) => (result = res));
        tick();

        expect(communicationServiceSpy.patch).toHaveBeenCalledWith(
            { title: '', body: JSON.parse(JSON.stringify({ ...questionState })) },
            'admin/question/123/1',
        );

        expect(result).toBeTrue();
    }));

    it('should handle patch error', fakeAsync(() => {
        const questionState = {
            questionID: '1',
            action: QuestionStates.UpdateQuestionChoices,
        };
        const quizId = '123';

        communicationServiceSpy.patch.and.returnValue(new Error('Some error'));

        let result: boolean | undefined;
        questionRenderer.patch(questionState, quizId).then((res) => (result = res));
        tick();

        expect(communicationServiceSpy.patch).toHaveBeenCalledWith(
            { title: '', body: JSON.parse(JSON.stringify({ ...questionState })) },
            'admin/question/123/1',
        );

        expect(result).toBeFalse();
    }));

    it('should create a question successfully', fakeAsync(() => {
        const sampleMCQuestion: MCQuestion = {
            id: '1',
            question: 'Sample question',
            points: 10,
            lastModified: new Date(),
            choices: [
                { choice: 'Choice 1', isCorrect: true },
                { choice: 'Choice 2', isCorrect: false },
            ],
            type: 'MCQ',
        };
        const currentURI = 'admin/question';
        const httpResponse = new HttpResponse({ status: 200, body: '123' });
        communicationServiceSpy.adminPost.and.returnValue(of(httpResponse));

        let result: string | undefined;
        questionRenderer.createQuestion(sampleMCQuestion, true, currentURI).then((res) => (result = res));
        tick();

        expect(result).toEqual('123');
    }));

    it('should call BankService.addToQuestionBank with correct argument', fakeAsync(() => {
        const questionID = '123';
        const spy = spyOn(BankService, 'addToQuestionBank');
        questionRenderer.addToQuestionBank(questionID);

        expect(spy).toHaveBeenCalled();
    }));

    it('should delete question from the bank', fakeAsync(() => {
        const questionId = '123';

        communicationServiceSpy.delete.and.returnValue(of({}));
        questionRenderer.deleteQuestionFromBank(questionId);

        const expectedRequestPath = `admin/question-bank/${questionId}`;
        expect(communicationServiceSpy.delete).toHaveBeenCalledWith(expectedRequestPath);
        tick();
    }));
});
