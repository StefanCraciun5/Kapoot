import { Component, Input } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';
import { NEXT_ANSWER, NEXT_USERNAME } from '@common/constant';

@Component({
    selector: 'app-evaluating-laq',
    templateUrl: './evaluating-laq.component.html',
    styleUrls: ['./evaluating-laq.component.scss'],
})
export class EvaluatingLAQComponent {
    @Input() answersLAQ: string[];
    currentUsernameIndex: number = 0;
    currentAnswerIndex: number = 1;
    lastAnswer: boolean;
    pointsChosen: number;

    constructor(public socketService: SocketClientService) {
        this.pointsChosen = 0;
    }

    validateAnswer(): void {
        this.socketService.send('validateLAQ', {
            username: this.answersLAQ[this.currentUsernameIndex],
            percentage: this.pointsChosen / 100,
        });

        if (this.answersLAQ.length > this.currentUsernameIndex + NEXT_USERNAME) {
            this.currentUsernameIndex += NEXT_USERNAME;
            this.currentAnswerIndex += NEXT_ANSWER;
        } else {
            this.socketService.send('allPlayerAnswered');
        }
    }
}
