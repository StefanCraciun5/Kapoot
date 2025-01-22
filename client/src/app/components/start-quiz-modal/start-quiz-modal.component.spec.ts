import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { StartQuizModalComponent } from '@app/components/start-quiz-modal/start-quiz-modal.component';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { DataService } from '@app/services/data-service/data.service';
import { of, throwError } from 'rxjs';
import SpyObj = jasmine.SpyObj;
// import { BankService } from '@app/services/bank-service/bank-service';
// import { QuestionObj } from '@common/message';

describe('StartQuizModalComponent', () => {
    let component: StartQuizModalComponent;
    let fixture: ComponentFixture<StartQuizModalComponent>;
    let communicationServiceSpy: SpyObj<CommunicationService>;
    let dialogRef: MatDialogRef<StartQuizModalComponent>;
    let dataServiceSpy: SpyObj<DataService>;
    let routerSpy: SpyObj<Router>;

    beforeEach(async () => {
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['basicGet', 'basicGetString']);
        dataServiceSpy = jasmine.createSpyObj('DataService', ['setSharedQuiz', 'setSharedQuestions']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

        await TestBed.configureTestingModule({
            declarations: [StartQuizModalComponent],
            providers: [
                { provide: CommunicationService, useValue: communicationServiceSpy },
                { provide: MatDialogRef, useValue: dialogRef },
                { provide: DataService, useValue: dataServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();
    });

    beforeEach(fakeAsync(() => {
        fixture = TestBed.createComponent(StartQuizModalComponent);
        component = fixture.componentInstance;

        component.quizzes = [];

        const mockQuizzes = [
            {
                id: '1',
                title: 'Quiz 1',
                description: 'Description 1',
                duration: 10,
                visible: true,
                questions: ['1', '2'],
                lastModification: new Date(),
            },
            { id: '2', title: 'Quiz 2', description: 'Description 2', duration: 20, visible: true, questions: ['3'], lastModification: new Date() },
            {
                id: '3',
                title: 'Quiz 3',
                description: 'Description 3',
                duration: 30,
                visible: false,
                questions: ['3', '2'],
                lastModification: new Date(),
            },
        ];

        communicationServiceSpy.basicGet.and.returnValue(of({ title: ' ', body: JSON.stringify(mockQuizzes) }));
        fixture.detectChanges();
        tick();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should only see the quiz that have the attribute visible: true', () => {
        expect(component.quizzes.length).toBe(2);
    });

    it('should display the quiz title, description and duration on quiz clicked', () => {
        component.onQuizClick(0);
        fixture.detectChanges();

        const compiled = fixture.debugElement.nativeElement;
        const titleElement = compiled.querySelector('#title');
        const descriptionElement = compiled.querySelector('#description');
        const durationElement = compiled.querySelector('#duration');

        expect(titleElement).toBeDefined();
        expect(descriptionElement).toBeDefined();
        expect(durationElement).toBeDefined();
    });

    it('should display the question list of the quiz on click', () => {
        const mockQuestions = [{ question: 'Question 3', points: 50, choices: [], type: 'MCQ', id: '3' }];
        communicationServiceSpy.basicGet.and.returnValue(of({ title: ' ', body: JSON.stringify(mockQuestions) }));

        component.onQuizClick(1);
        fixture.detectChanges();

        const compiled = fixture.debugElement.nativeElement;
        const questionsElements = compiled.querySelectorAll('#questions li');

        expect(questionsElements).toBeTruthy();
    });

    it('should select the proper quiz on clicked', () => {
        component.selectedQuiz = {
            id: '3',
            title: 'Quiz 3',
            description: 'Description 3',
            duration: 30,
            visible: false,
            questions: ['3', '2'],
            lastModification: new Date(),
        };

        component.onQuizClick(1);
        fixture.detectChanges();

        expect(component.selectedQuiz.title).toBe('Quiz 2');
    });

    it('should unselect the proper quiz if clicked twice in a row', () => {
        component.selectedQuiz = {
            id: '2',
            title: 'Quiz 2',
            description: 'Description 2',
            duration: 20,
            visible: true,
            questions: ['3'],
            lastModification: new Date(),
        };

        component.onQuizClick(1);
        fixture.detectChanges();

        expect(component.selectedQuiz).toBeNull();
    });

    it('should handle error in loadQuizzes', fakeAsync(() => {
        const errorMessage = 'Simulated error';
        communicationServiceSpy.basicGet.and.returnValue(throwError(() => new Error(JSON.stringify({ status: 404, statusText: errorMessage }))));

        component.loadQuizzes();
        tick();

        expect(component.quizzes.length).toBe(0);
    }));

    it('should navigate to /player-view if the game is still available (testGame())', fakeAsync(() => {
        const mockSelectedQuiz = {
            id: '1',
            title: 'Quiz 1',
            description: 'Description 1',
            duration: 10,
            visible: true,
            questions: ['1', '2'],
            lastModification: new Date(),
        };
        const mockResponse = { title: ' ', body: JSON.stringify(mockSelectedQuiz) };
        communicationServiceSpy.basicGet.and.returnValue(of(mockResponse));

        dataServiceSpy.setSharedQuiz.and.returnValue(of());
        dataServiceSpy.setSharedQuestions.and.returnValue(of());

        component.selectedQuiz = mockSelectedQuiz;

        fixture.detectChanges();
        component.testGame();
        tick();

        expect(dataServiceSpy.setSharedQuiz).toHaveBeenCalledWith(mockSelectedQuiz);
        expect(dataServiceSpy.setSharedQuestions).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/player-view']);
    }));

    it('should open error dialog if the game is unavailable (testGame())', fakeAsync(() => {
        const mockSelectedQuiz = {
            id: '1',
            title: 'Quiz 1',
            description: 'Description 1',
            duration: 10,
            visible: false,
            questions: ['1', '2'],
            lastModification: new Date(),
        };
        const mockResponse = { title: ' ', body: JSON.stringify(mockSelectedQuiz) };
        communicationServiceSpy.basicGet.and.returnValue(of(mockResponse));

        dataServiceSpy.setSharedQuiz.and.returnValue(of());
        dataServiceSpy.setSharedQuestions.and.returnValue(of());

        component.selectedQuiz = mockSelectedQuiz;

        component.testGame();
        tick();

        expect(dataServiceSpy.setSharedQuiz).toHaveBeenCalledWith(mockSelectedQuiz);
        expect(dataServiceSpy.setSharedQuestions).toHaveBeenCalled();
    }));

    it('should navigate to /waiting-room if the game is still available (startGame())', fakeAsync(() => {
        const mockSelectedQuiz = {
            id: '1',
            title: 'Quiz 1',
            description: 'Description 1',
            duration: 10,
            visible: true,
            questions: ['1', '2'],
            lastModification: new Date(),
        };
        const mockResponse = { title: ' ', body: JSON.stringify(mockSelectedQuiz) };
        communicationServiceSpy.basicGet.and.returnValue(of(mockResponse));

        dataServiceSpy.setSharedQuiz.and.returnValue(of());

        component.selectedQuiz = mockSelectedQuiz;

        fixture.detectChanges();
        component.startGame();
        tick();

        expect(dataServiceSpy.setSharedQuiz).toHaveBeenCalledWith(mockSelectedQuiz);
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/waiting-room', { quizId: '1' }]);
    }));

    it('should open error dialog if the game is unavailable (startGame())', fakeAsync(() => {
        const mockSelectedQuiz = {
            id: '1',
            title: 'Quiz 1',
            description: 'Description 1',
            duration: 10,
            visible: false,
            questions: ['1', '2'],
            lastModification: new Date(),
        };
        const mockResponse = { title: ' ', body: JSON.stringify(mockSelectedQuiz) };
        communicationServiceSpy.basicGet.and.returnValue(of(mockResponse));

        dataServiceSpy.setSharedQuiz.and.returnValue(of());

        component.selectedQuiz = mockSelectedQuiz;

        component.startGame();
        tick();

        expect(dataServiceSpy.setSharedQuiz).toHaveBeenCalledWith(mockSelectedQuiz);
    }));
    it('should close dialog and navigate to /waiting-room with quizId 0', () => {
        component.randomGame();
        expect(dialogRef.close).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/waiting-room', { quizId: '0' }]);
    });
});
