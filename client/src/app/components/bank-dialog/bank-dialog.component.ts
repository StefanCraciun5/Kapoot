import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MCQuestion } from '@app/classes/question/question-interfaces';
import { QuestionRenderer } from '@app/classes/renderer/question-renderer/question-renderer';
import { BankService } from '@app/services/bank-service/bank-service';
import { CommunicationService } from '@app/services/communication-service/communication.service';

interface QuestionSelection {
    question: MCQuestion;
    selected: boolean;
}
@Component({
    selector: 'app-bank-dialog',
    templateUrl: './bank-dialog.component.html',
    styleUrls: ['./bank-dialog.component.scss'],
})

// from game-list
export class BankDialogComponent implements OnInit {
    questions: QuestionSelection[];
    anythingSelected: boolean;

    constructor(
        private readonly communicationService: CommunicationService,
        private dialogRef: MatDialogRef<BankDialogComponent>,
    ) {
        this.questions = [];
        this.anythingSelected = false;
    }

    closeDialog(questions: MCQuestion[]): void {
        if (!questions || questions.length === 0) {
            this.dialogRef.close();
            return;
        }
        this.dialogRef.close(questions);
    }

    async ngOnInit(): Promise<void> {
        const questionIDs = JSON.parse(await BankService.getBankQuestions(this.communicationService));
        for (const questionID of questionIDs) {
            const question = new QuestionRenderer(this.communicationService, JSON.parse(JSON.stringify(questionID)).question);
            await question.initialize();
            this.questions.push({ question: question.state.questionState.questionOBJ as MCQuestion, selected: false });
        }
    }
    toggleSelect(index: number) {
        this.questions[index].selected = !this.questions[index].selected;
        this.anythingSelected = this.questions[index].selected;
        for (const question of this.questions) {
            this.anythingSelected ||= question.selected;
            if (this.anythingSelected) {
                return;
            }
        }
    }
    export() {
        const selectedQuestions = this.questions.filter((question) => {
            return question.selected;
        });
        this.closeDialog(
            selectedQuestions.map((question) => {
                return question.question;
            }),
        );
    }
}
