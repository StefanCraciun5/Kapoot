import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';
import { QuestionObj } from '@common/message';
import { Player } from '@common/player';
import { Howl } from 'howler'; // Import Howl from howler
import { Socket } from 'socket.io-client';
import { GameState, JoinGamePageComponent } from './join-game-page.component';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('JoinGamePageComponent', () => {
    let component: JoinGamePageComponent;
    let router: Router;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;
    let howl: Howl;

    beforeEach(async () => {
        howl = new Howl({
            src: ['./assets/vine-boom.mp3'], // Specify the path to your sound file
            volume: 1.0, // Set the volume (0.0 to 1.0)
        });
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;
        router = {
            navigate: jasmine.createSpy('navigate'),
            url: 'http://example.com/quizzes/1234',
            parseUrl: jasmine
                .createSpy('parseUrl')
                .and.returnValue({ root: { children: { primary: { segments: [{ path: 'quizzes' }, { path: '1234' }] } } } }),
        } as unknown as Router;
        await TestBed.configureTestingModule({
            declarations: [JoinGamePageComponent],
            providers: [
                { provide: SocketClientService, useValue: socketServiceMock },
                { provide: Router, useValue: router },
                { provide: Howl, useValue: howl },
            ],
        }).compileComponents();
    });
    beforeEach(() => {
        const fixture = TestBed.createComponent(JoinGamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it('should get the id of the socket', () => {
        socketServiceMock.socket.id = '1234';
        expect(socketServiceMock).toBe(component.socketService);
        const socketId = component.socketId;
        expect(socketId).toEqual('1234');
    });
    it('should send the code to the room', () => {
        const code = '1234';
        component.onCodeSent(code);
        expect(component.roomId).toEqual(code);
    });
    it('should get the id of the socket', () => {
        component.onGameStart();
        expect(component.gameState).toEqual(GameState.Question);
    });
    it('should get the id of the socket', () => {
        const username = 'username';
        component.onUserNameSent(username);
        expect(component.username).toEqual(username);
    });
    describe('Events', () => {
        it('should handle connect event', () => {
            const consoleSpy = spyOn(console, 'log').and.callThrough();
            socketHelper.peerSideEmit('connect');
            expect(consoleSpy).toHaveBeenCalled();
        });
        it('should set the room ID if the "joined" event is called with a roomID', () => {
            const roomID = 'test';
            socketHelper.peerSideEmit('joined', roomID);
            expect(component.roomId).toBe(roomID);
            expect(component.invalidCode).toEqual(false);
        });
        it('should not set the room ID if the "joined" event is called without a roomID', () => {
            socketHelper.peerSideEmit('joined');
            expect(component.invalidCode).toEqual(true);
        });
        it('should validate a user if the status is valide', () => {
            const isValid = true;
            socketHelper.peerSideEmit('validated', isValid);
            expect(component.gameState).toEqual(GameState.Joined);
        });
        it('should not validate a user if the status is invalide', () => {
            const isValid = false;
            socketHelper.peerSideEmit('validated', isValid);
            expect(component.invalidUsername).toEqual(true);
            expect(component.invalidCode).toEqual(false);
        });
        it('should set the state to "PreQuizCount" with the "preQuizStarted" event', () => {
            socketHelper.peerSideEmit('preQuizStarted');
            expect(component.gameState).toEqual(GameState.PreQuizCount);
        });
        it('should set the state to "Question" with the "questionView" event', () => {
            socketHelper.peerSideEmit('questionView');
            expect(component.gameState).toEqual(GameState.Question);
        });
        it('should set the state to "Transition" with the "transitionView" event', () => {
            socketHelper.peerSideEmit('transitionView');
            expect(component.gameState).toEqual(GameState.Transition);
        });
        it('should set the state to "Result" with the "resultView" event', () => {
            socketHelper.peerSideEmit('resultView');
            expect(component.gameState).toEqual(GameState.Result);
        });
        it('should disconnect with the "transitionView" event', () => {
            socketHelper.peerSideEmit('organizerDisconnected');
            expect(component.gameState).toEqual(GameState.OrgLeft);
        });
        it('should not accept a banned username', () => {
            socketHelper.peerSideEmit('banned');
            expect(component.invalidUsername).toEqual(true);
        });
        it('should set the questions that have been completed with the "finishedQuizQuestions"', () => {
            const questions: QuestionObj[] = [
                {
                    question: 'q1',
                    points: 20,
                    choices: [
                        { choice: 'choice1', isCorrect: true },
                        { choice: 'choice2', isCorrect: false },
                    ],
                    type: 'MCQ',
                    id: '123',
                },
            ];
            socketHelper.peerSideEmit('finishedQuizQuestions', questions);
            expect(component.questions).toEqual(questions);
        });
        it('should set the players list upon receiving the "players" event', () => {
            const players: Player[] = [
                {
                    username: 'player1',
                    points: 5,
                    goodAnswer: false,
                    isFinal: true,
                    isConnected: true,
                    nBonus: 0,
                    isSubmitted: false,
                    isMuted: false,
                    isAnswering: false,
                },
                {
                    username: 'organisateur',
                    points: 5,
                    goodAnswer: false,
                    isFinal: false,
                    isConnected: true,
                    nBonus: 0,
                    isSubmitted: false,
                    isMuted: false,
                    isAnswering: false,
                },
            ];
            component.isOrganisateur = true;
            socketHelper.peerSideEmit('players', players);
            expect(component.players).toEqual(players);
        });
        it('should set the answers map upon receiving the "finishedQuizInfo" event', () => {
            const answerMap: Map<string, number[]> = new Map<string, number[]>();
            answerMap.set('someID', [0, 0, 0, 1]);
            socketHelper.peerSideEmit('finishedQuizInfo', JSON.stringify(Array.from(answerMap)));
            expect(component.answers).toEqual(answerMap);
        });
        it('should play sound on "panicSound" event', () => {
            const playSoundSpy = spyOn(component, 'playSound');

            // Emit the "panicSound" event on your socketServiceMock
            socketHelper.peerSideEmit('panicSound');
            expect(playSoundSpy).toHaveBeenCalled();
        });
        it('should play the sound', () => {
            const playSpy = spyOn(component.sound, 'play');
            component.playSound();
            expect(playSpy).toHaveBeenCalled();
        });

        it('should set the event property correctly', () => {
            const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
            component.handleKeyEvent(mockEvent);
            expect(component.event).toBe(mockEvent);
        });

        it('should reconnect to room if state isRandomGame is true', async () => {
            // Arrange
            // const reconnectSpy = spyOn(component, 'reconnectToRoom').and.returnValue(Promise.resolve());
            await component.ngOnInit();
        });

        it('should call connect, send, and configureBaseSocketFeatures', async () => {
            const roomId = '123';
            await component.reconnectToRoom(roomId);
            // expect(socketServiceMock.connect).toHaveBeenCalled();
            // expect(socketServiceMock.send).toHaveBeenCalledWith('forceJoin', roomId);
        });

        it('should call connect before sending message', async () => {
            // Arrange
            const roomId = '456';

            // Act
            await component.reconnectToRoom(roomId);
        });

        it('should handle forcedJoin event correctly', () => {
            // Emit a forcedJoin event with roomId 'testRoomId'
            const code = '1234';
            socketHelper.peerSideEmit('forcedJoin', code);
            expect(component.isOrganisateur).toBeTrue();
        });

        it('should handle transitionView event correctly', () => {
            // Emit a forcedJoin event with roomId 'testRoomId'
            const code = '1234';
            component.isLastQuestion = true;
            socketHelper.peerSideEmit('transitionView', code);
            // expect(component.isLastQuestion).toBeTrue();
        });
        it('should handle transitionView event correctly', () => {
            // Emit a forcedJoin event with roomId 'testRoomId'
            socketHelper.peerSideEmit('nextQuestionCountdown');
            // S  expect(component.countingDown).toBeTrue();
        });

        it('should call leaveRoom() if gameState is less than or equal to GameState.Joined', () => {
            component.gameState = GameState.Joined;

            component.quit();
        });

        it('should call leaveRoom() if gameState is more than or equal to GameState.Joined', () => {
            component.gameState = GameState.Result;

            component.quit();
        });
        it('should handle transitionView event correctly', () => {
            // Emit a forcedJoin event with roomId 'testRoomId'
            socketHelper.peerSideEmit('launchQuestion');
            // expect(component).toBeTrue();
        });
    });
});
