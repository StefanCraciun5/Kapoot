import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MCQuestion } from '@app/classes/question/question-interfaces';
import { QuizInterface } from '@app/classes/quiz/quiz-interface';
import { QuestionRenderer } from '@app/classes/renderer/question-renderer/question-renderer';
import { QuizRenderer } from '@app/classes/renderer/quiz-renderer/quiz-renderer';
import { AlertService } from '@app/services/alert-service/alert.service';
import { AuthService } from '@app/services/auth-service/auth.service';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { QuizPageComponent } from './quiz-page.component';

describe('QuizPageComponent', () => {
    let component: QuizPageComponent;
    let communicationService: CommunicationService;
    let router: Router;
    let authService: AuthService;
    let quizRenderer: QuizRenderer;
    let alertService: AlertService;
    let matDialog: MatDialog;

    beforeEach(() => {
        communicationService = jasmine.createSpyObj('CommunicationService', ['initialize']);
        router = jasmine.createSpyObj('Router', ['navigate']);
        authService = jasmine.createSpyObj('AuthService', ['isLoggedIn']);
        // alertService = jasmine.createSpy('AuthService', ['showSuccess', 'showError']);
        router = {
            navigate: jasmine.createSpy('navigate'),
            url: 'http://example.com/quizzes/1234',
            parseUrl: jasmine
                .createSpy('parseUrl')
                .and.returnValue({ root: { children: { primary: { segments: [{ path: 'quizzes' }, { path: '1234' }] } } } }),
        } as unknown as Router;

        component = new QuizPageComponent(communicationService, router, authService, matDialog, alertService);
        quizRenderer = new QuizRenderer(communicationService, 'id');

        spyOn(quizRenderer, 'initialize').and.returnValue(Promise.resolve());
        component.quizRenderer = quizRenderer;
    });

    afterEach(() => {
        (authService.isLoggedIn as jasmine.Spy).calls.reset();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with received data', async () => {
        // Arrange
        spyOn(component, 'initialize').and.returnValue(Promise.resolve());
        spyOn(component, 'getQuizInfo');

        const mockData = {
            description: 'Mock Quiz Description',
            duration: 60,
            title: 'Mock Quiz Title',
            questions: [
                {
                    choices: [],
                    points: 10,
                    question: 'Mock Question 1',
                },
            ],
        };

        // Spy on history.state to return the mock data
        spyOnProperty(history, 'state', 'get').and.returnValue({ data: mockData });

        // Act
        await component.ngOnInit();

        // Assert
        expect(component.initialize).toHaveBeenCalled();
        expect(component.getQuizInfo).toHaveBeenCalledWith(jasmine.any(Object), jasmine.any(Array));
    });

    it('should call getQuizInfo when initialized without received data', async () => {
        // Arrange
        spyOn(component, 'initialize').and.returnValue(Promise.resolve());
        spyOn(component, 'getQuizInfo');

        // Act
        await component.ngOnInit();

        // Assert
        expect(component.getQuizInfo).toHaveBeenCalled();
    });

    it('should navigate to login if not logged in', async () => {
        // Arrange
        (authService.isLoggedIn as jasmine.Spy).and.returnValue(Promise.resolve(false));

        // Act
        await component.initialize();

        // Assert
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should set the id if logged in', async () => {
        // Arrange
        (authService.isLoggedIn as jasmine.Spy).and.returnValue(Promise.resolve(true));

        // Act
        await component.initialize();

        // Assert
        expect(component.getId()).toEqual('example.com');
    });

    it('should create quiz and update questionIDs if importedData and questions are provided', async () => {
        // Arrange
        const importedData: QuizInterface = {
            description: 'Quiz Description',
            duration: 60,
            title: 'Quiz Title',
            questionIDs: [],
            visibility: true,
            id: 'quizId',
            lastModification: new Date(),
        };
        const questions: MCQuestion[] = [
            {
                choices: [],
                id: 'questionId',
                lastModified: new Date(),
                points: 10,
                question: 'Question',
                type: 'MCQ',
            },
        ];

        spyOn(QuestionRenderer, 'createQuestion').and.returnValue(Promise.resolve('questionId'));

        // Act
        await component.getQuizInfo(importedData, questions);

        // Assert
        expect(importedData.questionIDs.length).toBe(1);
        expect(importedData.questionIDs[0]).toBe('questionId');
        expect(component.questionIDs).toEqual(importedData.questionIDs);
        // expect(quizRenderer.doSomething).toHaveBeenCalledWith(QuizStates.Initialize, { quizOBJ: importedData });
        // expect(quizRenderer.state.makeDirty).toHaveBeenCalled();
    });
});
