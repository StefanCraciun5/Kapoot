import { Component, OnInit } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';
import { QuestionObj } from '@common/message';

@Component({
    selector: 'app-game-transition',
    templateUrl: './game-transition.component.html',
    styleUrls: ['./game-transition.component.scss'],
})
export class GameTransitionComponent implements OnInit {
    isCorrect: boolean;
    nextQuestionCountdown: number;
    lastQuestionAns: QuestionObj;
    questionEnd: boolean;
    LAQBonus: number;

    constructor(public socketService: SocketClientService) {}

    ngOnInit(): void {
        this.configureBaseSocketFeatures();
        this.nextQuestionCountdown = -1;
        this.LAQBonus = 0;
    }

    configureBaseSocketFeatures(): void {
        this.socketService.on('answerValidated', (goodAnswer: boolean) => {
            this.questionEnd = true;
            this.isCorrect = goodAnswer;
        });
        this.socketService.on('nextQuestionCountdown', (count: number) => {
            this.nextQuestionCountdown = count;
        });
        this.socketService.on('correctAnswerQuestion', (question: QuestionObj) => {
            this.lastQuestionAns = question;
        });
        this.socketService.on('startQuestion', () => {
            this.questionEnd = false;
        });
        this.socketService.on('LAQPoints', (points: string) => {
            this.LAQBonus = Number(points) ?? 0;
        });
    }
}
