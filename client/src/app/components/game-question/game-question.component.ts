import { Component, HostListener, OnInit } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';
import { FOUND_INDEX } from '@common/constant';
import { ChoicesObj, QuestionObj } from '@common/message';

@Component({
    selector: 'app-game-question',
    templateUrl: './game-question.component.html',
    styleUrls: ['./game-question.component.scss'],
})
export class GameQuestionComponent implements OnInit {
    question: QuestionObj;
    timer: number;
    choices: ChoicesObj[] = [];
    selectedChoices: ChoicesObj[] = [];
    points: number;
    nextQuestionCalled: boolean = false;
    answers: number[];
    previousAnswers: number[];
    questionElement: HTMLElement;
    LAQanswer: string = '';
    activeElement = document.getElementById('input-message') as HTMLInputElement;

    constructor(public socketService: SocketClientService) {}

    ngOnInit(): void {
        this.configureBaseSocketFeatures();
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyEvent(event: KeyboardEvent) {
        const activeElement = document.getElementById('input-message') as HTMLInputElement;
        if (activeElement !== document.activeElement) {
            if (Number(event.key) && Number(event.key) <= this.choices.length && this.question.type === 'MCQ') {
                event.preventDefault();
                const positionAnswer = Number(event.key) - 1;
                this.onChoiceClick(this.choices[positionAnswer]);
            }
            if (event.key === 'Enter') {
                event.preventDefault();
                this.submitAnswer();
            }
        }
    }

    handleLAQInputChanges(value: string) {
        this.socketService.send('typeLAQ');
    }

    configureBaseSocketFeatures(): void {
        this.socketService.on('answerValidated', (goodAnswer: boolean) => {
            if (goodAnswer) {
                this.points += this.question.points;
            }
        });
        this.socketService.on('newCurrentQst', (question: QuestionObj) => {
            this.question = question;
            this.nextQuestionCalled = true;
            this.choices = question.choices;
            this.answers = Array(this.choices.length).fill(0);
        });
        this.socketService.on('countdown', (count: number) => {
            this.timer = count;
            if (this.timer === 0) {
                this.submitAnswer();
            }
        });
    }
    
    submitAnswer(): void {
        console.log('submit');
        // correct LAQ answer
        if (this.question.type === 'LAQ' && this.isAnswerLengthCorrect()) {
            this.socketService.send('submitLAQAnswer', this.LAQanswer);
            // LAQ answer longer than 200 caracters
        } else if (this.question.type === 'LAQ' && !this.isAnswerLengthCorrect() && this.timer !== 0) {
            return;
            // LAQ answer longer than 200 caracters and timer had ended
        } else if (this.question.type === 'LAQ' && !this.isAnswerLengthCorrect() && this.timer === 0) {
            this.socketService.send('submitLAQAnswer', '');
        } else if (this.question.type === 'MCQ') {
            this.socketService.send('submitAnswer', this.answers);
        }
        this.LAQanswer = '';
        this.selectedChoices = [];
    }

    onChoiceClick(choice: ChoicesObj): void {
        const index = this.selectedChoices.findIndex((selectedChoice) => selectedChoice === choice);
        if (index !== FOUND_INDEX) {
            this.selectedChoices.splice(index, 1);
        } else {
            this.selectedChoices.push(choice);
        }
        this.setAnswers();
    }

    isChoiceSelected(choice: ChoicesObj): boolean {
        return this.selectedChoices.includes(choice);
    }

    setAnswers(): void {
        this.previousAnswers = [...this.answers];
        this.answers.fill(0);
        this.selectedChoices.forEach((choice) => {
            const index = this.choices.indexOf(choice);
            this.answers[index] = 1;
        });

        const resultAnswer: number[] = [];

        for (let i = 0; i < this.answers.length; i++) {
            resultAnswer.push(this.answers[i] - this.previousAnswers[i]);
        }
        this.socketService.send('sendLiveChoices', resultAnswer);
    }

    isAnswerLengthCorrect(): boolean {
        return this.LAQanswer.length <= 200;
    }
}
