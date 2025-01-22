import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BankService } from '@app/services/bank-service/bank-service';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { DataService } from '@app/services/data-service/data.service';
import { QUESTION_BANK_MIN_QUESTIONS } from '@common/constant';
import { QuestionObj, QuizObj } from '@common/message';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'start-quiz-modal',
    templateUrl: './start-quiz-modal.component.html',
    styleUrls: ['./start-quiz-modal.component.scss'],
})
export class StartQuizModalComponent implements OnInit {
    quizzes: QuizObj[];
    selectedQuiz: QuizObj | null = null;
    questions: QuestionObj[];
    roomId: string;
    isRandomModeAvailable: boolean;

    constructor(
        private readonly communicationService: CommunicationService,
        private readonly dataService: DataService,
        private dialogRef: MatDialogRef<StartQuizModalComponent>,
        private readonly router: Router,
    ) {
        this.quizzes = [];
        this.questions = [];
    }

    closeDialog(): void {
        this.dialogRef.close();
    }

    async ngOnInit(): Promise<void> {
        this.loadQuizzes();
        this.checkIsRandomModeAvailable();
    }

    loadQuizzes(): void {
        this.communicationService.basicGet('client/quiz').subscribe({
            next: (res) => {
                for (const obj of JSON.parse(res.body)) {
                    if (obj.visible) {
                        this.quizzes.push(obj);
                    }
                }
            },
            error: () => {
                this.quizzes = [];
            },
        });
    }

    onQuizClick(index: number): void {
        if (this.selectedQuiz && this.selectedQuiz.id === this.quizzes[index].id) {
            this.selectedQuiz = null;
            this.questions = [];
        } else {
            this.selectedQuiz = this.quizzes[index];
            this.loadQuestions(this.selectedQuiz.id);
        }
    }

    async loadQuestions(id: string): Promise<void> {
        this.questions = [];
        const res = await firstValueFrom(this.communicationService.basicGet(`client/quiz/${id}/question`));
        if (res) {
            this.questions = JSON.parse(res.body);
        }
    }

    isQuizSelected(index: number): boolean {
        return this.selectedQuiz !== null && this.selectedQuiz.id === this.quizzes[index].id;
    }

    testGame(): void {
        if (this.selectedQuiz !== null) {
            this.dataService.setSharedQuiz(this.selectedQuiz).subscribe();
            this.dataService.setSharedQuestions(this.questions).subscribe();
            this.communicationService.basicGet(`client/quiz/${this.selectedQuiz.id}`).subscribe({
                next: (res) => {
                    const quiz = JSON.parse(res.body);
                    if (quiz) {
                        this.closeDialog();
                        this.router.navigate(['/player-view']);
                    }
                },
            });
        }
    }

    startGame(): void {
        if (this.selectedQuiz !== null) {
            this.dataService.setSharedQuiz(this.selectedQuiz);
            this.communicationService.basicGet(`client/quiz/${this.selectedQuiz.id}`).subscribe({
                next: (res) => {
                    const quiz = JSON.parse(res.body);
                    if (quiz) {
                        this.closeDialog();
                        this.router.navigate(['/waiting-room', { quizId: this.selectedQuiz ? this.selectedQuiz.id : null }]);
                    }
                },
            });
        }
    }
    randomGame(): void {
        this.closeDialog();
        this.router.navigate(['/waiting-room', { quizId: "0" }]);
    }

    private async checkIsRandomModeAvailable() {
        const questionsInQB = JSON.parse(await BankService.getBankQuestions(this.communicationService));
        if ([...questionsInQB].length < 5) {
            this.isRandomModeAvailable = false;
        } else {
            let MCQCount = 0;
            for (const question of [...questionsInQB]) {
                const qOBJ = await this.getQuestion(question.question);
                const type = JSON.parse(JSON.parse(JSON.stringify(qOBJ)).body).type;
                console.log(type);
                if (type === 'MCQ') {
                    MCQCount++;
                }
            }
            console.log(MCQCount);
            this.isRandomModeAvailable = MCQCount >= QUESTION_BANK_MIN_QUESTIONS;
        }
    }

    private getQuestion(id: string): Promise<string> {
        return new Promise<string>((resolve) => {
            this.communicationService.basicGetString(`client/question/${id}`).subscribe({
                next: (res) => resolve(res),
                error: () => resolve(''),
            });
        });
    }
}
