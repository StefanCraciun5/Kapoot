import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';
import { COUNTDOWN_4, COUNTDOWN_ENDED } from '@common/constant';
import { QuestionObj } from '@common/message';
import { Socket } from 'socket.io-client';
import { PreviewQuestionComponent } from './preview-question.component';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('PreviewQuestionComponent', () => {
    let component: PreviewQuestionComponent;
    let fixture: ComponentFixture<PreviewQuestionComponent>;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;

    beforeEach(() => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;

        TestBed.configureTestingModule({
            declarations: [PreviewQuestionComponent],
            providers: [{ provide: SocketClientService, useValue: socketServiceMock }],
        });
        fixture = TestBed.createComponent(PreviewQuestionComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call handleSockets method on initialization', () => {
        const handleSocketsSpy = spyOn(component, 'handleSockets');

        component.ngOnInit();

        expect(handleSocketsSpy).toHaveBeenCalled();
    });

    it('should emit startNextQuestion event and set shouldSkip to false if there is a previewQuestion', () => {
        const question: QuestionObj = {
            question: 'question',
            id: '1',
            choices: [],
            points: 10,
            type: 'LAQ',
        };
        component.previewQuestion = question;
        const startNextQuestionSpy = spyOn(component.startNextQuestion, 'emit');

        component.nextQuestion();

        expect(startNextQuestionSpy).toHaveBeenCalled();
        expect(component.shouldSkip).toBeFalse();
    });

    it('should emit showResults event and set shouldSkip to false if there is no previewQuestion', () => {
        const showResultsSpy = spyOn(component.showResults, 'emit');

        component.nextQuestion();

        expect(showResultsSpy).toHaveBeenCalled();
        expect(component.shouldSkip).toBeFalse();
    });

    it('should emit skipNextQuestion event and toggle shouldSkip', () => {
        const skipNextQuestionSpy = spyOn(component.skipNextQuestion, 'emit');
        expect(component.shouldSkip).toBeFalse();

        component.skipQuestion();
        expect(skipNextQuestionSpy).toHaveBeenCalled();

        expect(component.shouldSkip).toBeTrue();
        component.skipQuestion();
        expect(component.shouldSkip).toBeFalse();
    });

    describe('Receiving events', () => {
        it('should handle nextQuestionCountdown event', () => {
            component.ngOnInit();
            component.nextQuestionCooldown = 5;
            socketHelper.peerSideEmit('nextQuestionCountdown', COUNTDOWN_4);
            expect(component.nextQuestionCooldown).toBe(COUNTDOWN_4);
        });
        it('should handle newCurrentQst event', () => {
            component.ngOnInit();
            socketHelper.peerSideEmit('newCurrentQst');
            expect(component.nextQuestionCooldown).toBe(COUNTDOWN_ENDED);
        });
    });
});
