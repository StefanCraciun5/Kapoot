import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';
import { ChoicesObj, QuestionObj, QuizObj } from '@common/message';
import { Player } from '@common/player';
import { Howl } from 'howler';

@Component({
    selector: 'app-game-organisateur',
    templateUrl: './game-organisateur.component.html',
    styleUrls: ['./game-organisateur.component.scss'],
})

export class GameOrganisateurComponent implements OnInit {
    @Input() roomId: string;

    // A MODIFIER
    currentQuestionIndex: number = 0;
    private sound: Howl;
    choices: ChoicesObj[] = [];

    players: Player[] = [];
    playerAnswers: number[] = [];

    quiz: QuizObj;
    questions: QuestionObj[];
    currentQuestion: QuestionObj;
    previewQuestion: QuestionObj;
    shouldSkip: boolean;
    quizOver: boolean;
    timer: number;
    nextQuestionCountdown: number;
    questionOver: boolean = true;
    isCorrecting: boolean = true;
    answers: Map<string, number[]> = new Map(); // questionId to histogram
    constructor(public socketService: SocketClientService, private readonly cdr: ChangeDetectorRef) {
        this.sound = new Howl({
            src: ['./assets/vine-boom.mp3'], // Specify the path to your sound file
            volume: 1.0, // Set the volume (0.0 to 1.0)
        });
    }

    ngOnInit(): void {
        if (!this.socketService) {
            return;
        }
        this.configureBaseSocketFeatures();
        this.shouldSkip = false;
        this.quizOver = false;
    }

    playSound() {
        this.sound.play();
    }

    nextQuestion(): void {
        this.socketService.send('launchQuestion');
    }

    skipQuestion(): void {
        this.shouldSkip = !this.shouldSkip;
        this.socketService.send('skipQuestion', +this.shouldSkip);
    }

    finishQuiz(): void {
        this.quizOver = true;
        this.socketService.send('endQuiz', this.roomId);
    }

    toggleTimer(): void {
        this.socketService.send('toggleTimer');
    }
    panicMode(): void {
        if (
            (this.currentQuestion.type === 'MCQ' && this.timer > 10) ||
            (this.currentQuestion.type === 'LAQ' && this.timer > 20)
        ) {
            this.socketService.send('panicMode');
        }
    }

    configureBaseSocketFeatures(): void {
        this.socketService.on('liveChoices', (playerAnswers: string) => {
            const response = JSON.parse(playerAnswers);
            this.playerAnswers = response.answers;
            this.players = response.players;
        });
        this.socketService.on('playerAnswers', (submitedPlayers: Player[]) => {
            this.players = submitedPlayers;
        });
        this.socketService.on('newCurrentQst', (newCurrentQst: QuestionObj) => {
            this.questionOver = false;
            this.isCorrecting = false;
            this.currentQuestion = newCurrentQst;
            this.playerAnswers = [];
            this.choices = this.currentQuestion.choices;
        });
        this.socketService.on('newPreviewQst', (newPreviewQst: QuestionObj) => {
            this.previewQuestion = newPreviewQst;
        });
        this.socketService.on('questionSkipped', (newPreviewQst: QuestionObj) => {
            this.previewQuestion = newPreviewQst;
        });
        this.socketService.on('finishedQuizQuestions', (questions: QuestionObj[]) => {
            this.questions = questions;
        });
        this.socketService.on('questionOver', (isQuestionOver: boolean) => {
            this.questionOver = isQuestionOver;
        });
        this.socketService.on('evaluating', () => {
            this.isCorrecting = true;
        });
        this.socketService.on('finishedQuizInfo', (serializedMap: string) => {
            const receivedEntries = JSON.parse(serializedMap);
            const receivedMap = new Map<string, number[]>(receivedEntries);
            this.answers = receivedMap;
        });
        this.socketService.on('countdown', (count: number) => {
            this.timer = count;
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
                if (this.currentQuestion.type === 'MCQ') {
                    this.questionOver = true;
                    this.socketService.send('allPlayerAnswered');
                } else if (this.currentQuestion.type === 'LAQ') {
                    this.socketService.send('evaluateAnswers');
                }
            }
            this.cdr.detectChanges();
        });
        this.socketService.on('nextQuestionCountdown', (count: number) => {
            this.nextQuestionCountdown = count;
        });
        this.socketService.on('inGamePlayersUpdated', (players: Player[]) => {
            this.players = players;
        });
        this.socketService.on('panicSound', () => {
            this.playSound()
        });
        this.socketService.on('updatePlayersPoints', (players: Player[]) => {
            this.players = players;
        });
    }
}
