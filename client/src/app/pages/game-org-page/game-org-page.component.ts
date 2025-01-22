import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';
import { QuestionObj } from '@common/message';
import { Player } from '@common/player';

export enum GameState {
    Wait,
    PreGameTimer,
    Game,
    Result,
    GameEnd,
    EvaluatingLAQ,
}

@Component({
    selector: 'app-game-org-page',
    templateUrl: './game-org-page.component.html',
    styleUrls: ['./game-org-page.component.scss'],
    providers: [SocketClientService],
})
export class GameOrgPageComponent implements OnInit, OnDestroy {
    gameState: GameState;
    roomId: string;
    username: string;
    quizId: string;
    isCreator: boolean;
    isRandomGame: boolean;

    answersLAQ: string[];

    // Final
    answers: Map<string, number[]> = new Map(); // questionId to histogram
    questions: QuestionObj[];
    players: Player[];

    constructor(
        public socketService: SocketClientService,
        private readonly activatedRoute: ActivatedRoute,
        private readonly router: Router
    ) {
        this.quizId = this.activatedRoute.snapshot.params['quizId'];
        this.username = 'Organisateur';
    }

    get socketId() {
        return this.socketService.socket.id ? this.socketService.socket.id : '';
    }

    ngOnInit(): void {
        this.gameState = GameState.Wait;
        this.isCreator = true;
        this.connect();
    }

    ngOnDestroy(): void {
        this.socketService.disconnect();
    }

    connect() {
        if (!this.socketService.isSocketAlive()) {
            this.socketService.connect();
            this.configureBaseSocketFeatures();
            this.createRoom();
        }
    }

    configureBaseSocketFeatures(): void {
        this.socketService.on('connect', () => {
            // eslint-disable-next-line no-console
            console.log(`Connexion par WebSocket sur le socket ${this.socketId}`);
        });
        this.socketService.on('createdRoom', (roomId: string) => {
            this.roomId = roomId;
        });
        this.socketService.on('gameStarted', () => {
            this.gameState = GameState.Game;
        });
        this.socketService.on('finishedQuizQuestions', (questions: QuestionObj[]) => {
            this.gameState = GameState.Result;
            this.questions = questions;
        });
        this.socketService.on('finishedQuizInfo', (serializedMap: string) => {
            const receivedEntries = JSON.parse(serializedMap);
            const receivedMap = new Map<string, number[]>(receivedEntries);
            this.answers = receivedMap;
        });
        this.socketService.on('players', (players: Player[]) => {
            this.players = players;
        });
        this.socketService.on('gameEnded', () => {
            this.gameState = GameState.GameEnd;
        });
        this.socketService.on('isRandomGameAns', (isRandom: boolean) => {
            this.isRandomGame = isRandom;
        });
        this.socketService.on('evaluating', (answers: string[]) => {
            this.gameState = GameState.EvaluatingLAQ;
            this.answersLAQ = [...answers];
        });
        this.socketService.on('orgView', () => {
            this.gameState = GameState.Game;
        });
    }
    createRoom(): void {
        this.socketService.send('createRoom', this.quizId);
    }
    onGameStart() {
        if (this.isRandomGame) {
            this.router.navigate(['/join-game'], { state: { isRandomGame: true, roomId: this.roomId } });
        }
        else {
            this.socketService.send('startQuiz', this.roomId);
            this.gameState = GameState.Game;
        }
    }
    onPreGameStart() {
        this.socketService.send('startPreQuizTimer', this.roomId);
        this.gameState = GameState.PreGameTimer;
        this.socketService.send('isRandomGame');
    }
    quit() {
        this.socketService.send('leaveRoom');
        this.router.navigate(['/']);
    }
}
