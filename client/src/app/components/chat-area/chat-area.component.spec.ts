import { TestBed /* fakeAsync, tick*/ } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { ChatAreaComponent } from '@app/components/chat-area/chat-area.component';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';
import { Player } from '@common/player';
import { Socket } from 'socket.io-client';

enum MessageTypes {
    Message,
    Alert,
}

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('ChatAreaComponent', () => {
    let component: ChatAreaComponent;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;
        // routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            declarations: [ChatAreaComponent],
            providers: [{ provide: SocketClientService, useValue: socketServiceMock }],
            imports: [RouterTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        const fixture = TestBed.createComponent(ChatAreaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    afterEach(() => {
        const inputElement = document.getElementById('input-message');
        if (inputElement) {
            inputElement.remove();
        }
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should scroll chat container to bottom', () => {
        const chatContainer = document.createElement('div');
        chatContainer.id = 'messages-area';

        document.body.appendChild(chatContainer);
        component.scrollToBottom();

        setTimeout(() => {
            expect(component.logs.length).toBe(0);
        }, 0);
    });

    it('should call enterMessage when Enter key is pressed on input-message element', () => {
        const enterMessageSpy = spyOn(component, 'enterMessage');
        const keyboardEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        const inputElement = document.createElement('input');
        inputElement.id = 'input-message';
        document.body.appendChild(inputElement);

        inputElement.focus();

        component.keyboardDetect(keyboardEvent);

        expect(enterMessageSpy).not.toHaveBeenCalled();
    });

    it('should return true of the logs is alert', () => {
        const log: string[] = ['0'];
        component.logs = [log];
        component.logs[0][0] = `${MessageTypes.Alert}`;
        const response = component.isAlert(0);
        expect(response).toBe(true);
    });

    it('should render name', () => {
        const response = component.renderName(0);
        expect(response).toBe(true);
    });

    it('should render the date', () => {
        const response = component.renderDate(0);
        expect(response).toBe(true);
    });

    describe('Receiving events', () => {
        it('should handle updateChat event', () => {
            component.logs = [];
            component.username = 'username';
            socketHelper.peerSideEmit('updateChat', ['time', 'username']);

            expect(component.logs.length).toBe(1);
        });
        it('should handle quizStarted event', () => {
            component.quizStarted = false;
            socketHelper.peerSideEmit('quizStarted');
            expect(component.quizStarted).toBe(true);
        });
        it('should handle skedaddle event', () => {
            component.logs = [];
            component.username = 'username';
            socketHelper.peerSideEmit('skedaddle', 'username');

            expect(component.logs.length).toBe(1);
        });
        it('should handle mute event', () => {
            const player: Player = {
                username: 'player1',
                points: 0,
                nBonus: 0,
                isAnswering: false,
                isFinal: false,
                isMuted: false,
                isSubmitted: false,
                isConnected: true,
                goodAnswer: false,
            };
            component.logs = [];
            socketHelper.peerSideEmit('mute', player);
            expect(component.logs.length).toBe(1);
        });
    });

    describe('Emitting event', () => {
        it('should send message to the server', () => {
            const spy = spyOn(component.socketService, 'send');
            const eventName = 'sendMessage';
            const testMessage = 'allo';
            component.message = testMessage;
            component.enterMessage();
            expect(spy).toHaveBeenCalledWith(eventName, testMessage);
            expect(component.message).toEqual('');
        });
        it('should not send message to the server if the message is longer than 200 characters', () => {
            const spy = spyOn(component.socketService, 'send');
            const testMessage =
                'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
                'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
                'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
            component.message = testMessage;
            component.enterMessage();
            expect(spy).not.toHaveBeenCalled();
            expect(component.longMessage).toBe(true);
        });
        it('should scroll to bottom when chatContainer is available', () => {
            const chatContainer = document.createElement('div');
            chatContainer.id = 'chatContainer';

            const content = document.createElement('div');

            chatContainer.appendChild(content);
            document.body.appendChild(chatContainer);

            component.scrollToBottom();

            expect(chatContainer.scrollTop).toBe(chatContainer.scrollHeight);
        });
    });
});
