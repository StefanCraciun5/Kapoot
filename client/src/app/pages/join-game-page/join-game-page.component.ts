import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';
import { NUMBER_OF_RANDOM_QUESTIONS } from '@common/constant';
import { QuestionObj } from '@common/message';
import { Player } from '@common/player';

export enum GameState {
    Code, // 0
    Username, // 1
    Joined, // 2
    PreQuizCount, // 3
    Question, // 4
    Transition, // 5
    Result, // 6
    OrgLeft, // 7
}

@Component({
    selector: 'app-join-game-page',
    templateUrl: './join-game-page.component.html',
    styleUrls: ['./join-game-page.component.scss'],
})
// eslint-disable-next-line no-undef
export class JoinGamePageComponent implements OnInit, OnDestroy {
    gameState: GameState;
    sound: Howl;
    roomId: string; // Room ID to join
    username: string;
    chatEnabled: boolean = false;
    count: number;
    invalidUsername: boolean;
    invalidCode: boolean;
    // Final results objects
    answers: Map<string, number[]> = new Map();
    questions: QuestionObj[];
    answeredPlayers: Player[];
    players: Player[];
    // Question pour verifier la reponse
    lastQuestionAns: QuestionObj;
    event: KeyboardEvent;
    isOrganisateur: boolean = false;
    countingDown: boolean = false;
    isLastQuestion: boolean = false;
    isFinal: boolean = false;
    currentQuestionNumber: number = 0;

    constructor(
        public socketService: SocketClientService,
        private readonly router: Router,
    ) {
        this.sound = new Howl({
            src: ['./assets/vine-boom.mp3'], // Specify the path to your sound file
            volume: 1.0, // Set the volume (0.0 to 1.0)
        });
    }

    get socketId() {
        return this.socketService.socket.id ? this.socketService.socket.id : '';
    }

    handleKeyEvent(event: KeyboardEvent) {
        this.event = event;
    }

    ngOnDestroy(): void {
        this.socketService.disconnect();
    }
    async ngOnInit() {
        const state = history.state;
        if (state && state.isRandomGame) {
            await this.reconnectToRoom(state.roomId.toString());
        } else {
            await this.connect();
            this.gameState = GameState.Code;
        }
    }

    async connect() {
        if (!this.socketService.isSocketAlive()) {
            this.socketService.connect();
            this.configureBaseSocketFeatures();
        }
    }
    async reconnectToRoom(roomId: string) {
        this.socketService.connect();
        this.socketService.send('forceJoin', roomId);
        this.configureBaseSocketFeatures();
    }

    configureBaseSocketFeatures(): void {
        this.socketService.on('connect', () => {
            // eslint-disable-next-line no-console
            console.log(`Connexion par WebSocket sur le socket ${this.socketId}`);
        });
        this.socketService.on('joined', (roomId: string) => {
            if (roomId) {
                this.roomId = roomId;
                this.invalidCode = false;
                this.gameState = GameState.Username;
            } else {
                this.invalidCode = true;
            }
        });
        this.socketService.on('validated', (joined: boolean) => {
            if (joined) {
                this.gameState = GameState.Joined;
                this.invalidUsername = false;
                this.chatEnabled = true;
            } else {
                this.invalidUsername = true;
                this.invalidCode = false;
            }
        });
        this.socketService.on('forcedJoin', (roomId: string) => {
            if (roomId) {
                this.roomId = roomId;
                this.invalidCode = false;
                this.invalidUsername = false;
                this.chatEnabled = true;
                this.username = 'organisateur ';
                this.isOrganisateur = true;
                this.socketService.send('startQuiz', roomId);
            }
        });
        this.socketService.on('preQuizStarted', () => {
            this.gameState = GameState.PreQuizCount;
        });

        this.socketService.on('questionView', () => {
            this.countingDown = false;
            this.gameState = GameState.Question;
            this.isLastQuestion = ++this.currentQuestionNumber === NUMBER_OF_RANDOM_QUESTIONS;
        });
        this.socketService.on('transitionView', () => {
            this.gameState = GameState.Transition;
            if (this.isLastQuestion) {
                this.isFinal = true;
                this.socketService.send('finishRandomQuiz');
            }
        });
        this.socketService.on('finishedQuizQuestions', (questions: QuestionObj[]) => {
            this.questions = questions;
        });
        this.socketService.on('finishedQuizInfo', (serializedMap: string) => {
            const receivedEntries = JSON.parse(serializedMap);
            const receivedMap = new Map<string, number[]>(receivedEntries);
            this.answers = receivedMap;
        });
        this.socketService.on('resultView', () => {
            this.gameState = GameState.Result;
        });
        this.socketService.on('nextQuestionCountdown', (count: number) => {
            this.countingDown = true || count;
        });
        this.socketService.on('players', (players: Player[]) => {
            this.players = players;
            let nConnected = 0;
            let nFinalAnswer = 0;

            this.players.forEach((player) => {
                if (player.isConnected) {
                    nConnected++;
                }
                if (player.isFinal) {
                    nFinalAnswer++;
                }
            });
            if (nFinalAnswer === nConnected - 1) {
                if (this.isOrganisateur) {
                    this.socketService.send('allPlayerAnswered');
                }
            }
        });
        this.socketService.on('banned', () => {
            this.invalidUsername = true;
            this.socketService.disconnect();
            this.router.navigate(['/home']);
        });
        this.socketService.on('organizerDisconnected', () => {
            this.gameState = GameState.OrgLeft;
        });
        this.socketService.on('panicSound', () => {
            this.playSound();
        });
    }

    onCodeSent(code: string) {
        this.roomId = code;
        this.socketService.send('joinRoom', this.roomId);
    }
    onUserNameSent(userName: string) {
        this.username = userName.toLowerCase();
        this.socketService.send('validateUsername', { roomId: this.roomId, username: this.username });
    }

    quit() {
        if (this.gameState <= GameState.Joined) {
            this.leaveRoom();
            return;
        }
        this.forfeitGame();
    }

    onGameStart(): void {
        this.gameState = GameState.Question;
    }
    playSound() {
        this.sound.play();
    }

    randomNextQuestion() {
        this.socketService.send('launchQuestion');
    }

    private leaveRoom(): void {
        this.socketService.send('leaveRoom');
        this.router.navigate(['/']);
    }

    private forfeitGame(): void {
        this.socketService.send('forfeit');
        this.router.navigate(['/']);
    }
}
