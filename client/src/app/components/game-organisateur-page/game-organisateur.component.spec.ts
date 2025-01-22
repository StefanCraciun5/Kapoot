import { TestBed } from '@angular/core/testing';
import { GameOrganisateurComponent } from './game-organisateur.component';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { Socket } from 'socket.io-client';
import { RouterTestingModule } from '@angular/router/testing';
import { Player } from '@common/player';
import { QuestionObj } from '@common/message';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('GameOrganisateurComponent', () => {
    let component: GameOrganisateurComponent;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;

        await TestBed.configureTestingModule({
            declarations: [GameOrganisateurComponent],
            providers: [{ provide: SocketClientService, useValue: socketServiceMock }],
            imports: [RouterTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        const fixture = TestBed.createComponent(GameOrganisateurComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should play sound when playSound() is called', () => {
        const mockHowl = jasmine.createSpyObj<Howl>('Howl', ['play']);
        component['sound'] = mockHowl;
        component.playSound();
        expect(mockHowl.play).toHaveBeenCalled();
    });

    describe('Receiving events', () => {
        it('should handle liveChoices event', () => {
            const playerAnswer = {
                answers: [0, 1],
                players: [],
            }
            component.playerAnswers = [0, 0];
            socketHelper.peerSideEmit('liveChoices', JSON.stringify(playerAnswer))
            expect(component.playerAnswers[0]).toBe(0);
            expect(component.playerAnswers[1]).toBe(1);
        });
        it('should handle playerAnswers event', () => {
            component.players = [];
            const player: Player = {
                username: 'player1',
                points: 0,
                isConnected: true,
                isFinal: true,
                goodAnswer: true,
                nBonus: 0,
                isAnswering: false,
                isMuted: false,
                isSubmitted: false,
            };
            socketHelper.peerSideEmit('playerAnswers', [player]);
            expect(component.players.length).toBe(1);
        });
        it('should handle newCurrentQst event', () => {
            const question: QuestionObj = {
                question: 'question1',
                points: 10,
                choices: [],
                id: 'id 1',
                type: 'MCQ'
            };
            socketHelper.peerSideEmit('newCurrentQst', question);
            expect(component.currentQuestion.question).toBe(question.question);
        });
        it('should handle newPreviewQst event', () => {
            const question: QuestionObj = {
                question: 'question1',
                points: 10,
                choices: [],
                id: 'id 1',
                type: 'MCQ'
            };
            socketHelper.peerSideEmit('newPreviewQst', question);
            expect(component.previewQuestion.question).toBe(question.question);
        });
        it('should handle finishedQuizQuestions event', () => {
            const question: QuestionObj = {
                question: 'question1',
                points: 10,
                choices: [],
                id: 'id 1',
                type: 'MCQ'
            };
            const questions = [question, question]
            socketHelper.peerSideEmit('finishedQuizQuestions', questions);
            expect(component.questions.length).toBe(2);
        });
        it('', () => {
            const answers = new Map<string, number[]>();
            answers.set('p1', [1, 1, 0, 0]);
            answers.set('p2', [1, 1, 1, 0]);
            socketHelper.peerSideEmit('finishedQuizInfo', JSON.stringify(Array.from(answers)));
            expect(component.answers).toEqual(answers);
        });
        it('should handle countdown event', () => {
            component.timer = 10;
            socketHelper.peerSideEmit('countdown', 9);
            expect(component.timer).toBe(9);
        });
        it('should handle nextQuestionCountdown event', () => {
            component.nextQuestionCountdown = 5;
            socketHelper.peerSideEmit('nextQuestionCountdown', 4);
            expect(component.nextQuestionCountdown).toBe(4);
        });
        it('should handle inGamePlayersUpdated event', () => {
            const player: Player = {
                username: 'player',
                points: 0,
                isConnected: true,
                isFinal: true,
                goodAnswer: false,
                nBonus: 0,
                isAnswering: false,
                isMuted: false,
                isSubmitted: false,
            };
            socketHelper.peerSideEmit('inGamePlayersUpdated', [player, player]);
            expect(component.players.length).toBe(2);
        });
        it('should handle questionSkipped event', () => {
            const questionMCQ: QuestionObj = {
                id: 'id 1',
                question: 'question 1',
                points: 10,
                choices: [],
                type: 'MCQ',
            };
            socketHelper.peerSideEmit('questionSkipped', questionMCQ);
            expect(component.previewQuestion.id).toBe('id 1');
        });
        it('should handle questionOver event', () => {
            component.questionOver = false;
            socketHelper.peerSideEmit('questionOver', true);
            expect(component.questionOver).toBe(true);
        });
        it('should handle players event with MCQ question', () => {
            const questionMCQ: QuestionObj = {
                id: 'id 1',
                question: 'question 1',
                points: 10,
                choices: [],
                type: 'MCQ',
            };
            const player: Player = {
                username: 'player1',
                points: 0,
                isConnected: true,
                isFinal: true,
                goodAnswer: true,
                nBonus: 0,
                isAnswering: false,
                isMuted: false,
                isSubmitted: false,
            };
            const organisateur: Player = {
                username: 'organisateur',
                points: 0,
                isConnected: true,
                isFinal: false,
                goodAnswer: true,
                nBonus: 0,
                isAnswering: false,
                isMuted: false,
                isSubmitted: false,
            };
            component.currentQuestion = questionMCQ;
            socketHelper.peerSideEmit('players', [organisateur, player]);
            expect(component.questionOver).toBe(true);
        });
        it('should handle players event with LAQ question', () => {
            const questionLAQ: QuestionObj = {
                id: 'id 1',
                question: 'question 1',
                points: 10,
                choices: [],
                type: 'LAQ',
            };
            const player: Player = {
                username: 'player1',
                points: 0,
                isConnected: true,
                isFinal: true,
                goodAnswer: true,
                nBonus: 0,
                isAnswering: false,
                isMuted: false,
                isSubmitted: false,
            };
            const organisateur: Player = {
                username: 'organisateur',
                points: 0,
                isConnected: true,
                isFinal: false,
                goodAnswer: true,
                nBonus: 0,
                isAnswering: false,
                isMuted: false,
                isSubmitted: false,
            };
            component.currentQuestion = questionLAQ;
            socketHelper.peerSideEmit('players', [organisateur, player]);
            expect(component.questionOver).toBe(true);
        });
        it('should handle panicSound event', () => {
            const spy = spyOn(component, 'playSound');
            socketHelper.peerSideEmit('panicSound');
            expect(spy).toHaveBeenCalled();
        });
        it('should handle updatePlayersPoints event', () => {
            const player: Player = {
                username: 'player1',
                points: 0,
                isConnected: true,
                isFinal: true,
                goodAnswer: true,
                nBonus: 0,
                isAnswering: false,
                isMuted: false,
                isSubmitted: false,
            };
            const organisateur: Player = {
                username: 'organisateur',
                points: 0,
                isConnected: true,
                isFinal: false,
                goodAnswer: true,
                nBonus: 0,
                isAnswering: false,
                isMuted: false,
                isSubmitted: false,
            };
            component.players = [];
            socketHelper.peerSideEmit('updatePlayersPoints', [organisateur, player]);
            expect(component.players.length).toBe(2);
        });
    });
    describe('Emitting event', () => {
        it('should send launchQuestion to the server', () => {
            const spy = spyOn(component.socketService, 'send');
            const event = 'launchQuestion';
            component.nextQuestion();
            expect(spy).toHaveBeenCalledWith(event);
        });
        it('should send endQuiz to the server', () => {
            const spy = spyOn(component.socketService, 'send');
            component.finishQuiz();
            expect(spy).toHaveBeenCalled();
        });
        it('should skip question', () => {
            const spy = spyOn(component.socketService, 'send');
            component.shouldSkip = false;
            component.skipQuestion();
            expect(spy).toHaveBeenCalled();
            expect(component.shouldSkip).toBe(true);
        });
        it('should send toggleTimer event', () => {
            const spy = spyOn(component.socketService, 'send');
            component.toggleTimer();
            expect(spy).toHaveBeenCalledWith('toggleTimer');
        });
        it('should send panicMode event if question is MCQ and timer is more than 10', () => {
            const spy = spyOn(component.socketService, 'send');
            const questionMCQ: QuestionObj = {
                id: 'id 1',
                question: 'question 1',
                points: 10,
                choices: [],
                type: 'MCQ',
            };
            component.currentQuestion = questionMCQ;
            component.timer = 20;
            component.panicMode();
            expect(spy).toHaveBeenCalledWith('panicMode');
        });
        it('should send panicMode event if question is LAQ and timer is more than 20', () => {
            const spy = spyOn(component.socketService, 'send');
            const questionLAQ: QuestionObj = {
                id: 'id 1',
                question: 'question 1',
                points: 10,
                choices: [],
                type: 'LAQ',
            };
            component.currentQuestion = questionLAQ;
            component.timer = 30;
            component.panicMode();
            expect(spy).toHaveBeenCalledWith('panicMode');
        });
    });
});
