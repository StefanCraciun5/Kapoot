import { HttpResponse } from '@angular/common/http';
import { ComponentFixture, discardPeriodicTasks, fakeAsync, flush, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { DataService } from '@app/services/data-service/data.service';
import { DialogService } from '@app/services/dialog-service/dialog.service';
import { TimeService } from '@app/services/time-service/time.service';
import { QuestionObj } from '@common/message';
import { of } from 'rxjs';
import { PlayAreaComponent } from './play-area.component';
import SpyObj = jasmine.SpyObj;

describe('PlayAreaComponent', () => {
    let component: PlayAreaComponent;
    let fixture: ComponentFixture<PlayAreaComponent>;
    let communicationServiceSpy: SpyObj<CommunicationService>;
    let dialogServiceSpy: SpyObj<DialogService>;
    let dataServiceSpy: SpyObj<DataService>;
    let timeServiceSpy: SpyObj<TimeService>;
    let routerSpy: SpyObj<Router>;

    beforeEach(waitForAsync(() => {
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['basicGet']);
        dialogServiceSpy = jasmine.createSpyObj('DialogService', ['openErrorDialog']);
        dataServiceSpy = jasmine.createSpyObj('DataService', [
            'setSharedQuiz',
            'setSharedQuestions',
            'getSharedQuiz',
            'getSharedQuestions',
            'validateAnswer',
        ]);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        timeServiceSpy = jasmine.createSpyObj('TimeSErvice', ['stopTimer', 'startTimer']);

        TestBed.configureTestingModule({
            declarations: [PlayAreaComponent],
            providers: [
                { provide: CommunicationService, useValue: communicationServiceSpy },
                { provide: DialogService, useValue: dialogServiceSpy },
                { provide: DataService, useValue: dataServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: TimeService, useValue: timeServiceSpy },
            ],
        }).compileComponents();
    }));

    beforeEach(fakeAsync(() => {
        fixture = TestBed.createComponent(PlayAreaComponent);
        component = fixture.componentInstance;
    }));

    it('should return the time from TimeService', () => {
        // Act
        const result = component.time;

        // Assert
        expect(result).toBe(timeServiceSpy.time);
    });
    it('should call onChoiceClick when a number key is pressed', () => {
        // Arrange

        const mockQuestions: QuestionObj[] = [
            {
                question: 'Sample question 1',
                points: 10,
                choices: [
                    { choice: 'Option A', isCorrect: true },
                    { choice: 'Option B', isCorrect: false },
                    { choice: 'Option C', isCorrect: false }
                ],
                type: 'multiple-choice',
                id: '1'
            },
            {
                question: 'Sample question 2',
                points: 15,
                choices: [
                    { choice: 'Option A', isCorrect: false },
                    { choice: 'Option B', isCorrect: true },
                    { choice: 'Option C', isCorrect: false }
                ],
                type: 'multiple-choice',
                id: '2'
            }
        ];

        component.canChoose = true;
        component.currentQuestionIndex = 0;
        component.questions = mockQuestions
        const mockEvent = new KeyboardEvent('keydown', { key: '1' });
        spyOn(component, 'onChoiceClick');

        // Act
        component.keyboardDetect(mockEvent);

        // Assert
        expect(component.onChoiceClick).toHaveBeenCalled();
    });

    it('should handle Enter key press when canChoose is true', () => {
        const key = 'Enter';
        const mockEvent = new KeyboardEvent('keydown', { key } as KeyboardEventInit);
        const validateAnswerSpy = spyOn(component, 'validateAnswer');

        component.canChoose = true;

        component.keyboardDetect(mockEvent);
        expect(validateAnswerSpy).toHaveBeenCalled();
    });

    it('should call loadQuiz during ngOnInit', () => {
        spyOn(component, 'loadQuiz');
        component.ngOnInit();
        expect(component.loadQuiz).toHaveBeenCalled();
    });

    it('should load quiz and set properties', fakeAsync(() => {
        // Arrange
        const mockQuiz = {
            title: 'MOCK QUIZ',
            body: JSON.stringify(
                JSON.stringify({
                    title: 'quiz1',
                    description: 'description1',
                    questions: ['1', '2'],
                    id: '1',
                    visible: 'true',
                    duration: 30,
                    lastModification: new Date(),
                }),
            ),
        };
        const beginningIndex = -1;
        dataServiceSpy.getSharedQuiz.and.returnValue(of(mockQuiz));
        spyOn(component, 'loadQuestions');
        spyOn(component, 'startCountdown').and.callFake((seconds, callback) => {
            // Simulate the countdown immediately triggering the callback
            callback();
        });

        spyOn(component, 'showNextQuestion');

        component.loadQuiz();
        tick();
        expect(component.canChoose).toBe(false);
        expect(dataServiceSpy.getSharedQuiz).toHaveBeenCalled();
        expect(component.loadQuestions).toHaveBeenCalled();
        expect(component.quiz).toBeDefined();
        expect(component.timer).toBeDefined();
        expect(component.currentQuestionIndex).toBe(beginningIndex);
        expect(component.points).toBe(0);

        expect(component.startCountdown).toHaveBeenCalledWith(3, jasmine.any(Function));
        tick(3000)
        expect(component.showNextQuestion).toHaveBeenCalled();
        clearInterval(component.countdownInterval);

    }));


    it('should load questions', fakeAsync(() => {
        const mockQuestions = {
            title: 'MOCK QUESTIONS',
            body: JSON.stringify(
                JSON.stringify([
                    { question: 'question 1', points: 30, choices: [], type: 'MCQ', id: '1' },
                    { question: 'question 2', points: 50, choices: [], type: 'MCQ', id: '2' },
                ]),
            ),
        };

        dataServiceSpy.getSharedQuestions.and.returnValue(of(mockQuestions));

        component.loadQuestions();
        tick();

        expect(dataServiceSpy.getSharedQuestions).toHaveBeenCalled();
        expect(component.questions).toBeDefined();
        expect(component.questions.length).toBe(2);
    }));

    it('should clear countdown interval if it is not undefined', fakeAsync(() => {
        const mockQuestions = [
            { question: 'question 1', points: 30, choices: [], type: 'MCQ', id: '1' },
            { question: 'question 2', points: 50, choices: [], type: 'MCQ', id: '2' },
        ];
        component.questions = mockQuestions;
        component.currentQuestionIndex = 0;
        component.timer = 30;
        timeServiceSpy['time'] = 0;

        timeServiceSpy.stopTimer;
        timeServiceSpy.startTimer;


        const clearIntervalSpy = spyOn(window, 'clearInterval');
        const validateAnswerSpy = spyOn(component, 'validateAnswer');


        component.countdownInterval = setInterval(() => {}, 1000) as NodeJS.Timer;
        component.showNextQuestion();
        tick(10000);

        expect(clearIntervalSpy).toHaveBeenCalled();
        expect(validateAnswerSpy).toHaveBeenCalled();


        tick();
        expect(clearIntervalSpy).toHaveBeenCalled();

        clearInterval(component.countdownInterval);
        discardPeriodicTasks()

        flush();

    }));

    it('should show next question and start countdown', fakeAsync(() => {
        const mockQuestions = [
            { question: 'question 1', points: 30, choices: [], type: 'MCQ', id: '1' },
            { question: 'question 2', points: 50, choices: [], type: 'MCQ', id: '2' },
        ];
        const beginningIndex = -1;
        component.questions = mockQuestions;
        component.currentQuestionIndex = 0;
        component.timer = 30;

        timeServiceSpy.stopTimer;
        timeServiceSpy.startTimer;
        spyOn(component, 'startCountdown').and.callFake((seconds, callback) => {
            // Simulate the countdown immediately triggering the callback
            callback();
        });
        spyOn(component, 'quitGame');

        component.showNextQuestion();
        tick();
        expect(component.currentQuestionIndex).toBe(1);
        expect(timeServiceSpy.stopTimer).toHaveBeenCalled();
        expect(timeServiceSpy.startTimer).toHaveBeenCalledWith(component.timer);
        expect(component.canChoose).toBe(true);
        expect(component.countdownInterval).toBeDefined();
        expect(component.quitGame);

        component.currentQuestionIndex = mockQuestions.length - 1;

        component.showNextQuestion();
        tick();
        expect(component.currentQuestionIndex).toBe(beginningIndex);
        expect(component.startCountdown).toHaveBeenCalledWith(component.countdownSeconds, jasmine.any(Function));

        clearInterval(component.countdownInterval);
    }));

    it('should add and remove choices from selectedChoices array', () => {
        const choice1 = { choice: 'Choice 1', isCorrect: true };
        const choice2 = { choice: 'Choice 2', isCorrect: false };

        component.onChoiceClick(choice1);

        expect(component.selectedChoices).toContain(choice1);
        expect(component.selectedChoices.length).toBe(1);

        component.onChoiceClick(choice2);

        expect(component.selectedChoices).toContain(choice1);
        expect(component.selectedChoices).toContain(choice2);
        expect(component.selectedChoices.length).toBe(2);

        component.onChoiceClick(choice1);

        expect(component.selectedChoices).not.toContain(choice1);
        expect(component.selectedChoices).toContain(choice2);
        expect(component.selectedChoices.length).toBe(1);
    });

    it('should return true if choice is selected, false otherwise', () => {
        const choice1 = { choice: 'Choice 1', isCorrect: true };
        const choice2 = { choice: 'Choice 2', isCorrect: false };

        component.selectedChoices = [choice1];

        expect(component.isChoiceSelected(choice1)).toBe(true);
        expect(component.isChoiceSelected(choice2)).toBe(false);

        component.selectedChoices = [choice2];

        expect(component.isChoiceSelected(choice1)).toBe(false);
        expect(component.isChoiceSelected(choice2)).toBe(true);
    });

    it('should validate answer and update properties accordingly', fakeAsync(() => {
        const mockChoices = [
            { choice: 'Choice 1', isCorrect: true },
            { choice: 'Choice 2', isCorrect: false },
        ];
        spyOn(component, 'startCountdown').and.callFake((seconds, callback) => {
            // Simulate the countdown immediately triggering the callback
            callback();
        });
        component.countdownInterval = setInterval(() => {}, 1000) as NodeJS.Timer;

        const mockQuestion = { id: '1', points: 30, choices: mockChoices, type: 'MCQ', question: 'Question 1' };
        const mockResponse = new HttpResponse<string>({
            body: JSON.stringify({
                hasGoodAnswer: true,
                correctAnswers: mockChoices,
            }),
        });
        const bonus = 1.2;
        dataServiceSpy.validateAnswer.and.returnValue(of(mockResponse));
        component.currentQuestionIndex = 0;
        component.canChoose = true;
        component.questions = [mockQuestion];
        component.points = 0;
        component.selectedChoices = [];

        component.validateAnswer();
        tick();
        expect(dataServiceSpy.validateAnswer).toHaveBeenCalledWith(mockQuestion.id, component.selectedChoices);
        expect(component.hasGoodAnswer).toBe(true);
        expect(component.correctAnswer).toEqual(mockChoices);
        expect(component.points).toBe(mockQuestion.points * bonus);
        expect(component.canChoose).toBe(false);
        expect(component.countdownSeconds).toBe(3);
        expect(component.startCountdown).toHaveBeenCalled();

        clearInterval(component.countdownInterval);
    }));

    it('should navigate to /create-game and stop timers on quitGame', () => {
        component.quitGame();

        expect(routerSpy.navigate).toHaveBeenCalledWith(['/create-game']);
        expect(timeServiceSpy.stopTimer).toHaveBeenCalled();
    });

    it('should start countdown and invoke callback when countdown reaches 0', fakeAsync(() => {
        const seconds = 5;
        const callbackSpy = jasmine.createSpy('callback');
        const fourSeconds = 4000;
        const oneSecond = 1000;
        component.startCountdown(seconds, callbackSpy);
        tick(oneSecond);
        expect(component.countdownSeconds).toBe(seconds - 1);

        tick(fourSeconds);
        tick(oneSecond);
        expect(component.countdownSeconds).toBe(0);
        expect(callbackSpy).toHaveBeenCalled();
    }));
});
