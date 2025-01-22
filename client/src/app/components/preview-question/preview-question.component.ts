import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';
import { COUNTDOWN_ENDED } from '@common/constant';
import { QuestionObj } from '@common/message';

@Component({
    selector: 'app-preview-question',
    templateUrl: './preview-question.component.html',
    styleUrls: ['./preview-question.component.scss'],
})
export class PreviewQuestionComponent implements OnInit {
    @Input() currentIndexQuestion: number;
    @Input() previewQuestion: QuestionObj;
    @Input() questionOver: boolean;
    @Output() startNextQuestion = new EventEmitter();
    @Output() skipNextQuestion = new EventEmitter();
    @Output() showResults = new EventEmitter();
    shouldSkip: boolean = false;

    nextQuestionCooldown: number;

    constructor(private readonly socketService: SocketClientService) {
        this.nextQuestionCooldown = COUNTDOWN_ENDED;
    }

    ngOnInit(): void {
        this.handleSockets();
    }

    handleSockets() {
        this.socketService.on('nextQuestionCountdown', (count: number) => {
            this.nextQuestionCooldown = count;
        });
        this.socketService.on('newCurrentQst', () => {
            this.nextQuestionCooldown = COUNTDOWN_ENDED;
        });
    }

    nextQuestion() {
        if (this.previewQuestion) {
            this.startNextQuestion.emit();
        } else {
            this.showResults.emit();
        }
        this.shouldSkip = false;
    }

    skipQuestion() {
        this.skipNextQuestion.emit();
        this.shouldSkip = !this.shouldSkip;
    }
}
