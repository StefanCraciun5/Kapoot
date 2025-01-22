import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';
import { QuestionObj } from '@common/message';
import { Socket } from 'socket.io-client';
import { CurrentQuestionInfoComponent } from './current-question-info.component';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('CurrentQuestionInfoComponent', () => {
    let component: CurrentQuestionInfoComponent;
    let fixture: ComponentFixture<CurrentQuestionInfoComponent>;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;

        await TestBed.configureTestingModule({
            declarations: [CurrentQuestionInfoComponent],
            providers: [{ provide: SocketClientService, useValue: socketServiceMock }],
        });
        fixture = TestBed.createComponent(CurrentQuestionInfoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update schema when choices or questionName change', () => {
        const initialChoices = [
            { choice: 'Option A', isCorrect: true },
            { choice: 'Option B', isCorrect: false },
        ];
        const newChoices = [
            { choice: 'Option A', isCorrect: true },
            { choice: 'Option C', isCorrect: true },
        ];
        const questionName = 'Question 1';

        component.choices = initialChoices;
        component.questionName = questionName;
        component['lastChoices'] = initialChoices;
        component['lastQuestionName'] = questionName;

        const setMCQSchemaSpy = spyOn<unknown>(component, 'setMCQSchema');

        component.ngDoCheck();
        expect(setMCQSchemaSpy).not.toHaveBeenCalled();

        component.choices = newChoices;

        component.ngDoCheck();
        expect(setMCQSchemaSpy).toHaveBeenCalledWith(
            component.playerAnswers,
            ['Option A', 'Option C'],
            ['rgba(54, 162, 54, 1)', 'rgba(54, 162, 54, 1)'],
        );

        component.questionName = 'Question 2';
        component.ngDoCheck();
        expect(setMCQSchemaSpy).toHaveBeenCalledWith(
            component.playerAnswers,
            ['Option A', 'Option C'],
            ['rgba(54, 162, 54, 1)', 'rgba(54, 162, 54, 1)'],
        );
    });

    describe('Receiving events', () => {
        it('should handle liveChoices event for MCQ', () => {
            const question: QuestionObj = {
                id: 'id 1',
                question: 'question',
                choices: [{ choice: 'a', isCorrect: true }],
                type: 'MCQ',
                points: 10,
            };
            component.choices = question.choices;
            component['currentQuestion'] = question;
            const playerAnswer = {
                answers: [0, 0],
                players: [],
            };
            component['lastChoices'] = [
                { choice: 'a', isCorrect: true },
                { choice: 'a', isCorrect: false },
            ];
            socketHelper.peerSideEmit('liveChoices', JSON.stringify(playerAnswer));
            expect(component.playerAnswers.length).toBe(2);
        });
        it('should handle liveChoices event for LAQ', () => {
            const question: QuestionObj = {
                id: 'id 1',
                question: 'question',
                choices: [],
                type: 'LAQ',
                points: 10,
            };
            component['currentQuestion'] = question;
            const playerAnswer = {
                answers: [0, 0],
                players: [],
            };
            component['lastChoices'] = [
                { choice: 'a', isCorrect: true },
                { choice: 'a', isCorrect: false },
            ];
            const spy = spyOn<unknown>(component, 'setMCQSchema');
            socketHelper.peerSideEmit('liveChoices', JSON.stringify(playerAnswer));
            expect(spy).not.toHaveBeenCalled();
        });
        it('should handle LAQOptions event and call setLAQSchema', () => {
            const question: QuestionObj = {
                id: 'id 1',
                question: 'question',
                choices: [],
                type: 'LAQ',
                points: 10,
            };
            component['currentQuestion'] = question;
            const data = {
                modifications: [0, 0, 0],
                timeFrames: [0, 0],
                numOfPlayers: 5,
            };
            component['isInitialized'] = true;
            socketHelper.peerSideEmit('LAQOptions', JSON.stringify(data));
            const spy = spyOn<unknown>(component, 'setLAQSchema');
            expect(spy).not.toHaveBeenCalled();
        });
        it('should handle LAQOptions event and call setLAQSchema', () => {
            const question: QuestionObj = {
                id: 'id 1',
                question: 'question',
                choices: [],
                type: 'MCQ',
                points: 10,
            };
            component['currentQuestion'] = question;
            const data = {
                modifications: [0, 0, 0],
                timeFrames: [0, 0],
                numOfPlayers: 5,
            };
            socketHelper.peerSideEmit('LAQOptions', JSON.stringify(data));
            const spy = spyOn<unknown>(component, 'setLAQSchema');
            expect(spy).not.toHaveBeenCalled();
        });
        it('should handle MCQ newCurrentQst event', () => {
            const question: QuestionObj = {
                id: 'id 1',
                question: 'question 1',
                points: 10,
                choices: [
                    { choice: 'a', isCorrect: true },
                    { choice: 'a', isCorrect: false },
                ],
                type: 'MCQ',
            };
            socketHelper.peerSideEmit('newCurrentQst', question);
            expect(component['lastChoices'].length).toBe(2);
        });
        it('should handle LAQ newCurrentQst event', () => {
            const question: QuestionObj = {
                id: 'id 1',
                question: 'question 1',
                points: 10,
                choices: [],
                type: 'LAQ',
            };
            socketHelper.peerSideEmit('newCurrentQst', question);
            const spy = spyOn<unknown>(component, 'setLAQSchema');
            expect(spy).not.toHaveBeenCalled();
        });
    });
});
