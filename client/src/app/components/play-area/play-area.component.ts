import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '@app/services/data-service/data.service';
import { TimeService } from '@app/services/time-service/time.service';
import { BONUS_POINT, FOUND_INDEX, NULL_INDEX, ONE_SECOND, THREE_SECOND_COUNTDOWN } from '@common/constant';
import { ChoicesObj, QuestionObj, QuizObj } from '@common/message';

@Component({
    selector: 'app-play-area',
    templateUrl: './play-area.component.html',
    styleUrls: ['./play-area.component.scss'],
})
export class PlayAreaComponent implements OnInit, OnDestroy {
    quiz: QuizObj;
    questions: QuestionObj[];
    timer: number;
    points: number;
    currentQuestionIndex: number = NULL_INDEX;
    selectedChoices: ChoicesObj[] = [];
    canChoose: boolean;
    countdownSeconds: number;
    quizStarted: boolean;
    countdownInterval: ReturnType<typeof setInterval>;
    hasGoodAnswer: boolean;
    correctAnswer: ChoicesObj[];
    laqanswer: string = '';

    constructor(
        private readonly timeService: TimeService,
        private readonly dataService: DataService,
        private readonly router: Router,
    ) {}

    get time(): number {
        return this.timeService.time;
    }

    @HostListener('keydown', ['$event'])
    keyboardDetect(event: KeyboardEvent) {
        if (/^[1-9]$/.test(event.key) && this.canChoose) {
            const index = Number(event.key) - 1;
            const choice = this.questions[this.currentQuestionIndex].choices[index];
            this.onChoiceClick(choice);
        } else if (event.key === 'Enter' && this.canChoose) {
            event.preventDefault();
            this.validateAnswer();
        }
    }

    ngOnInit(): void {
        this.loadQuiz();
    }

    loadQuiz(): void {
        this.dataService.getSharedQuiz().subscribe((quiz) => {
            const quizStr = JSON.parse(quiz.body);
            const quizObj = JSON.parse(quizStr);
            this.quiz = quizObj;
            this.timer = this.quiz.duration;
            this.loadQuestions();
            this.currentQuestionIndex = -1;
            this.points = 0;
            this.canChoose = false;
            this.quizStarted = false;
            this.startCountdown(THREE_SECOND_COUNTDOWN, () => {
                this.showNextQuestion();
                this.quizStarted = true;
            });
        });
    }

    loadQuestions(): void {
        this.dataService.getSharedQuestions().subscribe((questions) => {
            const questionsStr = JSON.parse(questions.body);
            const questionsObj = JSON.parse(questionsStr);
            this.questions = questionsObj;
        });
    }

    showNextQuestion(): void {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.timeService.stopTimer();
            this.timeService.startTimer(this.timer);
            this.canChoose = true;

            if (this.countdownInterval !== undefined) {
                clearInterval(this.countdownInterval);
            }

            this.countdownInterval = setInterval(() => {
                if (this.timeService.time === 0) {
                    if (this.countdownInterval !== undefined) {
                        clearInterval(this.countdownInterval);
                    }
                    this.validateAnswer();
                }
            }, ONE_SECOND);
        } else {
            this.currentQuestionIndex = -1;
            this.startCountdown(this.countdownSeconds, () => {
                this.quitGame();
            });
        }
    }

    onChoiceClick(choice: ChoicesObj): void {
        const index = this.selectedChoices.findIndex((selectedChoice) => selectedChoice === choice);
        if (index !== FOUND_INDEX) {
            this.selectedChoices.splice(index, 1);
        } else {
            this.selectedChoices.push(choice);
        }
    }

    isChoiceSelected(choice: ChoicesObj): boolean {
        return this.selectedChoices.includes(choice);
    }

    validateAnswer(): void {
        if (this.countdownInterval !== undefined) {
            clearInterval(this.countdownInterval);
        }
        if (this.canChoose) {
            const questionId = this.questions[this.currentQuestionIndex].id;
            this.dataService.validateAnswer(questionId, this.selectedChoices).subscribe((res) => {
                const resStr = JSON.parse(JSON.stringify(res.body));
                const resObj = JSON.parse(resStr);
                this.hasGoodAnswer = resObj.hasGoodAnswer;
                this.correctAnswer = resObj.correctAnswers;

                if (this.hasGoodAnswer) {
                    this.points += this.questions[this.currentQuestionIndex].points * BONUS_POINT;
                }
                this.canChoose = false;
                this.countdownSeconds = THREE_SECOND_COUNTDOWN;
                this.startCountdown(this.countdownSeconds, () => {
                    this.showNextQuestion();
                });
                this.selectedChoices = [];
            });
        }
    }

    quitGame(): void {
        this.router.navigate(['/create-game']);
        if (this.countdownInterval !== undefined) {
            clearInterval(this.countdownInterval);
        }
        this.timeService.stopTimer();
    }

    startCountdown(seconds: number, callback: () => void): void {
        this.countdownSeconds = seconds;
        this.countdownInterval = setInterval(() => {
            if (this.countdownSeconds > 0) {
                this.countdownSeconds--;
            } else {
                clearInterval(this.countdownInterval);
                callback();
            }
        }, ONE_SECOND);
    }

    ngOnDestroy(): void {
        if (this.countdownInterval !== undefined) {
            clearInterval(this.countdownInterval);
        }
    }
}
