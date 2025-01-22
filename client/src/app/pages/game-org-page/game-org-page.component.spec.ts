import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';
import { ChoicesObj, QuestionObj } from '@common/message';
import { Player } from '@common/player';
import { Socket } from 'socket.io-client';
import { GameOrgPageComponent, GameState } from './game-org-page.component';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('GameOrgPageComponent', () => {
    let component: GameOrgPageComponent;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;
    let route: ActivatedRoute;
    let disconnectSpy: jasmine.Spy;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;
        route = new ActivatedRoute();
        route.snapshot = { params: { quizId: 'quizId' } } as unknown as ActivatedRouteSnapshot;
        disconnectSpy = spyOn(socketServiceMock, 'disconnect').and.stub(); // stub to prevent actual disconnection

        await TestBed.configureTestingModule({
            declarations: [GameOrgPageComponent],
            providers: [
                { provide: SocketClientService, useValue: socketServiceMock },
                { provide: ActivatedRoute, useValue: route },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        const fixture = TestBed.createComponent(GameOrgPageComponent);
        component = fixture.componentInstance;
        component.socketService = socketServiceMock;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should get the id of the socket', () => {
        socketServiceMock.socket.id = '1234';
        expect(disconnectSpy).not.toHaveBeenCalled();
        expect(socketServiceMock).toBe(component.socketService);
        const socketId = component.socketId;
        expect(socketId).toEqual('1234');
    });

    describe('Receiving events', () => {
        it('should handle connect event', () => {
            const consoleSpy = spyOn(console, 'log').and.callThrough();
            socketHelper.peerSideEmit('connect');
            expect(consoleSpy).toHaveBeenCalled();
        });
        it('should handle createdRoom event', () => {
            const roomId = '1234';
            socketHelper.peerSideEmit('createdRoom', roomId);
            expect(component.roomId).toBe(roomId);
        });
        it('should handle gameStarted event', () => {
            socketHelper.peerSideEmit('gameStarted');
            expect(component.gameState).toBe(GameState.Game);
        });
        it('should handle finishedQuizQuestions event', () => {
            const choicesObj: ChoicesObj[] = [
                { choice: 'A', isCorrect: true },
                { choice: 'B', isCorrect: false },
                { choice: 'C', isCorrect: true },
            ];
            const expectedQuestion: QuestionObj = {
                question: 'expectedQuestion',
                points: 30,
                choices: choicesObj,
                type: 'MCQ',
                id: 'question2',
            };

            const expectedQuestions = [expectedQuestion];

            component.questions = [];
            socketHelper.peerSideEmit('finishedQuizQuestions', expectedQuestions);

            expect(component.questions).toEqual(expectedQuestions);
        });
        it('', () => {
            const answers = new Map<string, number[]>();
            answers.set('p1', [1, 1, 0, 0]);
            answers.set('p2', [1, 1, 1, 0]);
            socketHelper.peerSideEmit('finishedQuizInfo', JSON.stringify(Array.from(answers)));
            expect(component.answers).toEqual(answers);
        });
        it('should handle players event', () => {
            const organisateur: Player = {
                username: 'organisateur',
                points: -1,
                goodAnswer: false,
                isFinal: false,
                isConnected: true,
                nBonus: -1,
                isSubmitted: false,
                isMuted: false,
                isAnswering: false,
            };
            const player: Player = {
                username: 'player1',
                points: 0,
                goodAnswer: false,
                isFinal: true,
                isConnected: true,
                nBonus: 0,
                isSubmitted: false,
                isMuted: false,
                isAnswering: false,
            };
            const players = [organisateur, player];
            socketHelper.peerSideEmit('players', players);
            expect(component.players.length).toBe(2);
        });
        it('should handle gameEnded event', () => {
            socketHelper.peerSideEmit('gameEnded');
            expect(component.gameState).toBe(GameState.GameEnd);
        });
    });
    describe('Emitting event', () => {
        it('should send createRoom event to the server', () => {
            const spy = spyOn(component.socketService, 'send');
            const eventName = 'createRoom';
            const quizId = 'quizId';
            component.quizId = quizId;
            component.createRoom();
            expect(spy).toHaveBeenCalledWith(eventName, quizId);
        });
        it('should send startQuiz event to the server', () => {
            const spy = spyOn(component.socketService, 'send');
            const eventName = 'startQuiz';
            const roomId = '1234';
            component.roomId = roomId;
            component.onGameStart();
            expect(spy).toHaveBeenCalledWith(eventName, roomId);
            expect(component.gameState).toBe(GameState.Game);
        });
        it('should send startPreQuizTimer event to the server', () => {
            const spy = spyOn(component.socketService, 'send');
            const eventName = 'startPreQuizTimer';
            const roomId = '1234';
            component.roomId = roomId;
            component.onPreGameStart();
            expect(spy).toHaveBeenCalledWith(eventName, roomId);
            expect(component.gameState).toBe(GameState.PreGameTimer);
        });
    });
});
