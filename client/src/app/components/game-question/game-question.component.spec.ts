import { TestBed } from '@angular/core/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';
import { QuestionObj } from '@common/message';
import { Socket } from 'socket.io-client';
import { GameQuestionComponent } from './game-question.component';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('GameQuestionComponent', () => {
    let component: GameQuestionComponent;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;

        await TestBed.configureTestingModule({
            declarations: [GameQuestionComponent],
            providers: [{ provide: SocketClientService, useValue: socketServiceMock }],
        }).compileComponents();
    });

    beforeEach(() => {
        const fixture = TestBed.createComponent(GameQuestionComponent);
        component = fixture.componentInstance;

        const questionObj: QuestionObj = {
            question: 'question1',
            choices: [],
            points: 10,
            id: '1',
            type: 'MCQ',
        };
        component.question = questionObj;

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return false if the choice is not in the selectedchoice', () => {
        component.selectedChoices = [];
        const expectedBoolean = component.isChoiceSelected({ choice: '2', isCorrect: false });
        expect(expectedBoolean).toBe(false);
    });
    it('should call onChoiceClick when a number key is pressed and question type is MCQ', () => {
        const mockEvent = new KeyboardEvent('keydown', { key: '1' });
        spyOn(component, 'onChoiceClick');
        component.choices = [
            { choice: 'Option A', isCorrect: false },
            { choice: 'Option B', isCorrect: true },
        ];
        component.question = { type: 'MCQ' } as QuestionObj;

        component.handleKeyEvent(mockEvent);

        expect(component.onChoiceClick).toHaveBeenCalledOnceWith(component.choices[0]);
    });
    it('should call submitAnswer when a Enter key is pressed', () => {
        const mockQuestion: QuestionObj = {
            question: 'Sample question 2',
            points: 10,
            choices: [],
            type: 'LAQ',
            id: '2',
        };
        component.question = mockQuestion;
        const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        spyOn(component, 'submitAnswer');
        component.handleKeyEvent(mockEvent);

        expect(component.submitAnswer).toHaveBeenCalled();
    });
    it('should call submitAnswer when Enter key is pressed and question type is MCQ', () => {
        const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        spyOn(component, 'submitAnswer');
        component.question = { type: 'MCQ' } as QuestionObj;

        component.handleKeyEvent(mockEvent);

        expect(component.submitAnswer).toHaveBeenCalled();
    });

    it('should add choices from selectedChoices array', () => {
        const choice1 = { choice: 'Choice 1', isCorrect: true };

        component.answers = [0, 0];
        component.onChoiceClick(choice1);

        expect(component.selectedChoices).toContain(choice1);
        expect(component.selectedChoices.length).toBe(1);
    });

    it('should remove choices from selectedChoices array', () => {
        const choice1 = { choice: 'Choice 1', isCorrect: true };

        component.answers = [0, 0];
        component.selectedChoices = [choice1];
        component.onChoiceClick(choice1);

        expect(component.selectedChoices).not.toContain(choice1);
        expect(component.selectedChoices.length).toBe(0);
    });
    it('should submitAnswer when it is a wrong LAQ and timer is not done', () => {
        const mockQuestion: QuestionObj = {
            question: 'Sample question 2',
            points: 10,
            choices: [],
            type: 'LAQ',
            id: '2',
        };
        component.question = mockQuestion;
        component.timer = 10;
        component.isAnswerLengthCorrect = () => false;
        component.submitAnswer();
        expect(component.LAQanswer.length).toBe(0);
    });
    it('should return true if the  LAQ answer has the correct length', () => {
        component.LAQanswer = 'allo';
        const response = component.isAnswerLengthCorrect();
        expect(response).toBe(true);
    });
    describe('Receiving events', () => {
        it('should handle answerValidated event', () => {
            const question: QuestionObj = {
                question: 'question1',
                choices: [],
                points: 10,
                id: '1',
                type: 'MCQ',
            };
            component.question = question;
            component.points = 0;
            socketHelper.peerSideEmit('answerValidated', true);
            expect(component.points).toBe(component.question.points);
        });
        it('should handle newCurrentQst event', () => {
            const question: QuestionObj = {
                question: 'question1',
                choices: [],
                points: 10,
                id: '1',
                type: 'MCQ',
            };
            socketHelper.peerSideEmit('newCurrentQst', question);
            expect(component.question.question).toBe('question1');
            expect(component.question.id).toBe('1');
            expect(component.question.choices.length).toBe(0);
            expect(component.question.type).toBe('MCQ');
            expect(component.selectedChoices.length).toBe(0);
        });
        it('should handle countdown event', () => {
            component.timer = 1;
            socketHelper.peerSideEmit('countdown', 0);
            expect(component.timer).toBe(0);
        });
    });

    describe('Emitting event', () => {
        it('should submit the answer to the server', () => {
            const spy = spyOn(component.socketService, 'send');
            const event = 'submitAnswer';
            component.answers = [0, 0, 1];
            component.submitAnswer();
            expect(spy).toHaveBeenCalledWith(event, component.answers);
        });
        it('should send live choices to the server', () => {
            const question: QuestionObj = {
                question: 'question1',
                choices: [
                    { choice: '1', isCorrect: true },
                    { choice: '2', isCorrect: false },
                ],
                points: 10,
                id: '1',
                type: 'MCQ',
            };
            const spy = spyOn(component.socketService, 'send');
            component.question = question;
            component.selectedChoices = component.question.choices;
            component.answers = [0, 0];
            component.setAnswers();
            expect(spy).toHaveBeenCalled();
        });
        it('should emit typeLAQ event', () => {
            const spy = spyOn(component.socketService, 'send');
            component.handleLAQInputChanges('test');
            expect(spy).toHaveBeenCalledWith('typeLAQ');
        });
        it('should submitAnswer when it is a correct LAQ', () => {
            const spy = spyOn(component.socketService, 'send');
            const mockQuestion: QuestionObj = {
                question: 'Sample question 2',
                points: 10,
                choices: [],
                type: 'LAQ',
                id: '2',
            };
            component.question = mockQuestion;
            component.LAQanswer = 'allo';
            component.isAnswerLengthCorrect = () => true;
            component.submitAnswer();
            expect(spy).toHaveBeenCalledWith('submitLAQAnswer', 'allo');
        });
        it('should submitAnswer when it is a wrong LAQ and timer is done', () => {
            const spy = spyOn(component.socketService, 'send');
            const mockQuestion: QuestionObj = {
                question: 'Sample question 2',
                points: 10,
                choices: [],
                type: 'LAQ',
                id: '2',
            };
            component.timer = 0;
            component.question = mockQuestion;
            component.isAnswerLengthCorrect = () => false;
            component.submitAnswer();
            expect(spy).toHaveBeenCalledWith('submitLAQAnswer', '');
        });
    });
});
