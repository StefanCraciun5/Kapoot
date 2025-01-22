import { TestBed } from '@angular/core/testing';
import { GameTransitionComponent } from './game-transition.component';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { Socket } from 'socket.io-client';
import { RouterTestingModule } from '@angular/router/testing';
import { QuestionObj } from '@common/message';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('GameTransitionComponent', () => {
    let component: GameTransitionComponent;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;

        await TestBed.configureTestingModule({
            declarations: [GameTransitionComponent],
            providers: [{ provide: SocketClientService, useValue: socketServiceMock }],
            imports: [RouterTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        const fixture = TestBed.createComponent(GameTransitionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Receiving events', () => {
        it('should handle answerValidated event', () => {
            component.questionEnd = false;
            socketHelper.peerSideEmit('answerValidated', true);
            expect(component.questionEnd).toBe(true);
            expect(component.isCorrect).toBe(true);
        });
        it('should handle nextQuestionCountdown event', () => {
            component.nextQuestionCountdown = 5;
            socketHelper.peerSideEmit('nextQuestionCountdown', 4);
            expect(component.nextQuestionCountdown).toBe(4);
        });
        it('should handle correctAnswerQuestion event', () => {
            const question: QuestionObj = {
                question: 'question1',
                points: 10,
                choices: [],
                id: 'id 1',
                type: 'MCQ'
            }
            socketHelper.peerSideEmit('correctAnswerQuestion', question);
            expect(component.lastQuestionAns.question).toBe(question.question);
        });
        it('should handle startQuestion event', () => {
            component.questionEnd = true;
            socketHelper.peerSideEmit('startQuestion');
            expect(component.questionEnd).toBe(false);
        });
    });
});