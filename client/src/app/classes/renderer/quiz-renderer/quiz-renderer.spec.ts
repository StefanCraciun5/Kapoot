import { HttpResponse } from '@angular/common/http';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { QuizMemento, QuizState } from '@app/classes/modification-memento/mementos/quiz-memento';
import { QuizInterface } from '@app/classes/quiz/quiz-interface';
import { QuizPayload } from '@app/classes/reducer/quiz-reducer/quiz-reducer';
import { QuizStates } from '@app/classes/reducer/states';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { of } from 'rxjs';
import { QuizRenderer } from './quiz-renderer';

export class QuizRendererMock {
    state: QuizMemento;
    id: string;
    communicationService: unknown; // Adjust based on your actual service type
    constructor(id?: string) {
        this.id = id as string;
        this.state = this.createEmptyQuizMemento();
    }
    static async staticDelete(id: string, communicationService: unknown): Promise<void> {
        if (id && communicationService) {
            return;
        }
    }
    static async toggleVisibility(id: string, desiredStatus: boolean, communicationService: unknown): Promise<boolean> {
        if (id && desiredStatus && communicationService) {
            return new Promise((resolve) => resolve(true));
        }
        return false;
    }
    async initialize(): Promise<void> {
        if (this.id && this.id !== '0') {
            this.state.quizState.quiz = {
                id: this.id,
                title: 'Mock Quiz Title',
                description: 'Mock Quiz Description',
                lastModification: new Date(),
                questionIDs: ['1', '2', '3'], // Example question IDs
                duration: 30,
                visibility: true,
            };
        }
    }
    setUpDefaultQuestion(quiz: QuizInterface): void {
        if (quiz) {
            this.state.quizState.quiz = quiz;
        }
    }
    render(): QuizInterface {
        return this.state.quizState.quiz;
    }
    doSomething(action: QuizStates, payload: QuizPayload): void {
        if (action && payload) {
            return;
        }
    }
    restore(memento: QuizMemento): void {
        this.state = memento;
    }
    save(): QuizMemento {
        return this.state;
    }
    addQuestion(questionID: string): void {
        this.state.quizState.quiz.questionIDs.push(questionID);
    }
    removeQuestion(questionID: string): void {
        this.state.quizState.quiz.questionIDs = this.state.quizState.quiz.questionIDs.filter((id) => id !== questionID);
    }
    async createQuiz(quizOBJ: QuizState): Promise<void> {
        if (quizOBJ) {
            return new Promise((resolve) => resolve());
        }
    }
    async patch(body: string, path: string): Promise<boolean> {
        if (path && body) {
            return new Promise((resolve) => resolve(true));
        }
        return true;
    }
    async delete(): Promise<void> {
        await QuizRendererMock.staticDelete(this.id as string, this.communicationService);
    }
    private createEmptyQuizMemento(): QuizMemento {
        const emptyQuiz: QuizInterface = {
            id: '',
            title: 'Empty Quiz',
            description: '',
            lastModification: new Date(),
            questionIDs: [],
            duration: 0,
            visibility: false,
        };

        return new QuizMemento({
            quiz: emptyQuiz,
            action: QuizStates.Initialize,
        });
    }
}
describe('QuizRenderer', () => {
    let quizRenderer: QuizRenderer;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;

    beforeEach(() => {
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['delete', 'patch', 'basicGet', 'adminPost']);

        TestBed.configureTestingModule({
            providers: [QuizRenderer, { provide: CommunicationService, useValue: communicationServiceSpy }],
        });
        quizRenderer = new QuizRenderer(communicationServiceSpy, '1');
    });
    it('should be created', () => {
        expect(quizRenderer).toBeTruthy();
    });
    it('should delete quiz', fakeAsync(() => {
        const id = '123';
        const expectedUrl = 'admin/quiz/123';
        const resolveSpy = jasmine.createSpy('resolveSpy');
        communicationServiceSpy.delete.and.returnValue(of({}));
        QuizRenderer.staticDelete(id, communicationServiceSpy).then(resolveSpy);
        tick();
        expect(communicationServiceSpy.delete).toHaveBeenCalledWith(expectedUrl);
        expect(resolveSpy).toHaveBeenCalled();
    }));
    it('should not delete quiz if id is undefined', fakeAsync(() => {
        const id = '';
        const resolveSpy = jasmine.createSpy('resolveSpy');
        communicationServiceSpy.delete.and.returnValue(of({}));
        QuizRenderer.staticDelete(id, communicationServiceSpy).then(resolveSpy);
        tick();
        expect(communicationServiceSpy.delete).not.toHaveBeenCalled();
        expect(resolveSpy).toHaveBeenCalled();
    }));
    it('should not delete quiz if id is undefined', fakeAsync(() => {
        const id = '';
        const resolveSpy = jasmine.createSpy('resolveSpy');
        communicationServiceSpy.delete.and.returnValue(of({}));
        QuizRenderer.staticDelete(id, communicationServiceSpy).then(resolveSpy);
        tick();
        expect(communicationServiceSpy.delete).not.toHaveBeenCalled();
        expect(resolveSpy).toHaveBeenCalled();
    }));
    it('should handle delete quiz error', fakeAsync(() => {
        const id = '123'; // Provide a sample ID
        const expectedUrl = 'admin/quiz/123';
        const rejectSpy = jasmine.createSpy('rejectSpy');
        communicationServiceSpy.delete.and.returnValue(new Error('Some error'));
        QuizRenderer.staticDelete(id, communicationServiceSpy).catch(rejectSpy);
        tick();
        expect(communicationServiceSpy.delete).toHaveBeenCalledWith(expectedUrl);
    }));
    it('should toggle visibility successfully', fakeAsync(() => {
        const id = '123';
        const desiredStatus = true;
        const expectedUrl = 'admin/quiz/123';
        const body = JSON.parse(JSON.stringify({ visible: desiredStatus }));
        const resolveSpy = jasmine.createSpy('resolveSpy');
        const httpResponse = new HttpResponse({ status: 200, body: 'Some response' });
        communicationServiceSpy.patch.and.returnValue(of(httpResponse));
        QuizRenderer.toggleVisibility(id, desiredStatus, communicationServiceSpy).then((result) => {
            resolveSpy(result);
        });
        tick();
        expect(communicationServiceSpy.patch).toHaveBeenCalledWith({ title: '', body }, expectedUrl);
        expect(resolveSpy).toHaveBeenCalledWith(true);
    }));
    it('should not toggle visibility if id is undefined', fakeAsync(() => {
        const id = '';
        const desiredStatus = true;
        const resolveSpy = jasmine.createSpy('resolveSpy');
        communicationServiceSpy.patch.and.returnValue(of());
        QuizRenderer.toggleVisibility(id, desiredStatus, communicationServiceSpy).then(resolveSpy);
        tick();
        expect(communicationServiceSpy.patch).not.toHaveBeenCalled();
    }));
    it('should handle toggle visibility error', fakeAsync(() => {
        const id = '123';
        const desiredStatus = false;
        const expectedUrl = 'admin/quiz/123';
        const body = JSON.parse(JSON.stringify({ visible: desiredStatus }));
        const rejectSpy = jasmine.createSpy('rejectSpy');
        communicationServiceSpy.patch.and.returnValue(new Error('Some error'));
        QuizRenderer.toggleVisibility(id, desiredStatus, communicationServiceSpy).catch((error) => {
            rejectSpy(error);
        });
        tick();
        expect(communicationServiceSpy.patch).toHaveBeenCalledWith({ title: '', body }, expectedUrl);
    }));
    it('should initialize the quiz', () => {
        const initializeSpy = spyOn(quizRenderer, 'initialize');
        quizRenderer.initialize();
        expect(initializeSpy).toHaveBeenCalled();
    });
    it('should initialize with quiz data when id is not "0"', fakeAsync(async () => {
        const quizData = {
            title: 'Sample Quiz',
            description: 'This is a sample quiz.',
            lastModification: new Date(),
            questions: ['q1', 'q2'],
            duration: 20,
            visible: true,
        };
        const doSomethingSpy = spyOn(quizRenderer, 'doSomething');
        communicationServiceSpy.basicGet.and.returnValue(of({ title: '', body: JSON.stringify(quizData) }));

        await quizRenderer.initialize();
        tick();
        expect(doSomethingSpy).toHaveBeenCalledWith(QuizStates.Initialize, { quizOBJ: jasmine.any(Object) });
    }));
    it('should handle error when initialize with quiz data when id is not "0"', fakeAsync(async () => {
        const doSomethingSpy = spyOn(quizRenderer, 'doSomething');
        communicationServiceSpy.basicGet.and.returnValue(new Error('Some error'));
        await quizRenderer.initialize().catch();
        tick();

        expect(doSomethingSpy).toHaveBeenCalledWith(QuizStates.Initialize, { quizOBJ: jasmine.any(Object) });
    }));
    it('should set up default question', () => {
        const spy = spyOn(quizRenderer, 'doSomething');
        const quiz = {
            id: '1',
            title: 'title 1',
            description: 'description 1',
            lastModification: new Date(),
            questionIDs: ['1', '2'],
            duration: 30,
            visibility: true,
        };
        quizRenderer.setUpDefaultQuestion(quiz);

        expect(spy).toHaveBeenCalled();
    });
    it('should add a question to the quiz', () => {
        const doSomethingSpy = spyOn(quizRenderer, 'doSomething');
        const initialQuestions = ['q1', 'q2'];
        quizRenderer.state = { quizState: { quiz: { questionIDs: initialQuestions } }, action: QuizStates } as unknown as QuizMemento;

        const newQuestionID = 'q3';
        quizRenderer.addQuestion(newQuestionID);

        expect(doSomethingSpy).toHaveBeenCalled();
    });
    it('should remove a question from the quiz', () => {
        const doSomethingSpy = spyOn(quizRenderer, 'doSomething');
        const questionToRemove = 'q2';
        const initialQuestions = ['q1', questionToRemove, 'q3'];
        quizRenderer.state = { quizState: { quiz: { questionIDs: initialQuestions } } } as unknown as QuizMemento;

        quizRenderer.removeQuestion(questionToRemove);

        expect(doSomethingSpy).toHaveBeenCalled();
    });
    it('should create a quiz successfully', fakeAsync(async () => {
        const quizObj = {
            id: '1',
            title: 'title 1',
            description: 'desc 1',
            lastModification: new Date(),
            questionIDs: ['1', '2'],
            duration: 30,
            visibility: true,
        };
        const validQuizObject = {
            quiz: quizObj,
            action: QuizStates.CreateQuiz,
            id: '1',
            title: 'title 1',
            description: 'desc 1',
            questions: ['1', '2'],
            duration: 30,
        };
        const httpResponse = new HttpResponse({ status: 200, body: 'Some response' });

        communicationServiceSpy.adminPost.and.returnValue(of(httpResponse));
        await quizRenderer.createQuiz(validQuizObject);
        tick();

        expect(communicationServiceSpy.adminPost).toHaveBeenCalledWith(
            { title: '', body: JSON.parse(JSON.stringify(validQuizObject)) },
            'admin/quiz',
        );
    }));
    it('should handle error when create a quiz', fakeAsync(async () => {
        const quizObj = {
            id: '1',
            title: 'title 1',
            description: 'desc 1',
            lastModification: new Date(),
            questionIDs: ['1', '2'],
            duration: 30,
            visibility: true,
        };
        const validQuizObject = {
            quiz: quizObj,
            action: QuizStates.CreateQuiz,
            id: '1',
            title: 'title 1',
            description: 'desc 1',
            questions: ['1', '2'],
            duration: 30,
        };
        communicationServiceSpy.adminPost.and.returnValue(new Error('Some error'));
        await quizRenderer.createQuiz(validQuizObject).catch();
        tick();

        expect(communicationServiceSpy.adminPost).toHaveBeenCalledWith(
            { title: '', body: JSON.parse(JSON.stringify(validQuizObject)) },
            'admin/quiz',
        );
    }));
    it('should not create a quiz when quiz object is invalid', fakeAsync(async () => {
        const invalidQuizObject = {};

        await quizRenderer.createQuiz({ quizOBJ: invalidQuizObject } as unknown as QuizState);
        expect(communicationServiceSpy.adminPost).not.toHaveBeenCalled();
    }));

    it('should successfully patch with resolve', fakeAsync(async () => {
        const patchBody = 'Sample body';
        const patchPath = 'admin/quiz/123';

        const httpResponse = new HttpResponse({ status: 200, body: 'Some response' });
        communicationServiceSpy.patch.and.returnValue(of(httpResponse));

        const result = await quizRenderer.patch(patchBody, patchPath);
        tick();

        expect(communicationServiceSpy.patch).toHaveBeenCalledWith({ title: '', body: patchBody }, patchPath);
        expect(result).toBe(true);
    }));

    it('should successfully patch with resolve', fakeAsync(async () => {
        const patchBody = 'Sample body';
        const patchPath = 'admin/quiz/123';

        communicationServiceSpy.patch.and.returnValue(new Error('Some Error'));

        const result = await quizRenderer.patch(patchBody, patchPath).catch();
        tick();

        expect(communicationServiceSpy.patch).toHaveBeenCalledWith({ title: '', body: patchBody }, patchPath);
        expect(result).toBe(false);
    }));

    it('should delete successfully', fakeAsync(async () => {
        spyOn(QuizRenderer, 'staticDelete');
        await quizRenderer.delete();
        tick();
        expect(QuizRenderer.staticDelete).toHaveBeenCalled();
    }));
});
