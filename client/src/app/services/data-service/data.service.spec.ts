import { HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { CommunicationServiceMock } from '@app/services/communication-service/communication.service.spec';
import { DataService } from '@app/services/data-service/data.service';
import { of } from 'rxjs';

describe('DataService', () => {
    let dataService: DataService;
    let communicationService: CommunicationService;

    const quizMock = {
        title: 'Sample Quiz',
        description: 'Test quiz',
        questions: [],
        id: '123',
        visible: true,
        duration: 60,
        lastModification: new Date(),
    };

    const questionsMock = [
        {
            question: 'What is the capital of France?',
            points: 5,
            choices: [
                { choice: 'Paris', isCorrect: true },
                { choice: 'Berlin', isCorrect: false },
                { choice: 'Madrid', isCorrect: false },
                { choice: 'Rome', isCorrect: false },
            ],
            type: 'MCQ',
            id: '1',
        },
    ];

    const questionId = '1';
    const selectedAnswers = [{ choice: 'Paris', isCorrect: true }];

    const ok = 200;

    const basicPath = 'client/game';
    const quizPath = basicPath + '/quiz';
    const validatePath = basicPath + '/validate';
    const questionPath = quizPath + '/questions';

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [DataService, { provide: CommunicationService, useClass: CommunicationServiceMock }],
        });

        dataService = TestBed.inject(DataService);
        communicationService = TestBed.inject(CommunicationService);
    });

    it('should set and get shared quiz correctly', () => {
        spyOn(communicationService, 'basicPost').and.returnValue(of(new HttpResponse({ status: ok, body: 'Mocked Response' })));
        spyOn(communicationService, 'basicGet').and.returnValue(of({ title: '', body: JSON.stringify(quizMock) }));

        const resultPost = dataService.setSharedQuiz(quizMock);
        expect(resultPost).toBeTruthy();
        expect(communicationService.basicPost).toHaveBeenCalled();
        expect(communicationService.basicPost).toHaveBeenCalledWith({ title: '', body: JSON.stringify(quizMock) }, quizPath);

        const resultGet = dataService.getSharedQuiz();
        expect(resultGet).toBeTruthy();
        expect(communicationService.basicGet).toHaveBeenCalled();
        expect(communicationService.basicGet).toHaveBeenCalledWith(quizPath);
    });

    it('should set and get shared questions correctly', () => {
        spyOn(communicationService, 'basicPost').and.returnValue(of(new HttpResponse({ status: ok, body: 'Mocked Response' })));
        spyOn(communicationService, 'basicGet').and.returnValue(of({ title: '', body: JSON.stringify(questionsMock) }));

        const resultPost = dataService.setSharedQuestions(questionsMock);
        expect(resultPost).toBeTruthy();
        expect(communicationService.basicPost).toHaveBeenCalled();
        expect(communicationService.basicPost).toHaveBeenCalledWith({ title: '', body: JSON.stringify(questionsMock) }, questionPath);

        const resultGet = dataService.getSharedQuestions();
        expect(resultGet).toBeTruthy();
        expect(communicationService.basicGet).toHaveBeenCalled();
        expect(communicationService.basicGet).toHaveBeenCalledWith(questionPath);
    });

    it('should validate answer correctly', () => {
        spyOn(communicationService, 'basicPost').and.returnValue(of(new HttpResponse({ status: ok, body: 'Mocked Response' })));

        const result = dataService.validateAnswer(questionId, selectedAnswers);
        expect(result).toBeTruthy();
        expect(communicationService.basicPost).toHaveBeenCalled();
        expect(communicationService.basicPost).toHaveBeenCalledWith(
            jasmine.objectContaining({ body: JSON.stringify({ questionId, selectedAnswers }) }),
            validatePath,
        );
    });
});
