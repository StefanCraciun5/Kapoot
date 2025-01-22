import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MCQuestion } from '@app/classes/question/question-interfaces';
import { QuizInterface } from '@app/classes/quiz/quiz-interface';
import { QuizStates } from '@app/classes/reducer/states';
import { QuestionRenderer } from '@app/classes/renderer/question-renderer/question-renderer';
import { QuizRenderer } from '@app/classes/renderer/quiz-renderer/quiz-renderer';
import { BankDialogComponent } from '@app/components/bank-dialog/bank-dialog.component';
import { AlertService } from '@app/services/alert-service/alert.service';
import { AuthService } from '@app/services/auth-service/auth.service';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { Validator } from '@app/services/validation-service/validator.service';
import { INDEX_OF_ID } from '@common/constant';

@Component({
    selector: 'app-quiz-page',
    templateUrl: './quiz-page.component.html',
    styleUrls: ['./quiz-page.component.scss'],
})
export class QuizPageComponent implements OnInit {
    quizRenderer: QuizRenderer;
    questionIDs: string[];
    private id: string;
    // eslint-disable-next-line max-params
    constructor(
        readonly communicationService: CommunicationService,
        private readonly router: Router,
        private readonly authGuard: AuthService,
        private matDialogue: MatDialog,
        public alertService: AlertService,
    ) {}

    async ngOnInit(): Promise<void> {
        const receivedMessage = history.state?.data;
        await this.initialize();
        // perform treatment (split in two objects 1 is a quiz, the other is an array of questions)
        if (receivedMessage) {
            const quizOBJ: QuizInterface = {
                description: receivedMessage?.description,
                duration: receivedMessage?.duration,
                id: '', // don't care
                lastModification: new Date(), // don't care
                questionIDs: [], // don't care for now
                title: receivedMessage?.title,
                visibility: true, // don't care
            };
            const questions: MCQuestion[] = [];
            const questionOBJs = receivedMessage?.questions;
            if (questionOBJs !== undefined) {
                for (const questionOBJ of questionOBJs) {
                    const question: MCQuestion = {
                        choices: questionOBJ.choices,
                        id: '', // don't care
                        lastModified: new Date(), // don't care,
                        type: '',
                        points: questionOBJ.points,
                        question: questionOBJ?.question,
                    };
                    questions.push(question);
                }
            }
            await this.getQuizInfo(quizOBJ, questions);
            return;
        }
        await this.getQuizInfo();
    }
    async initialize(): Promise<void> {
        const isLoggedIn = await this.authGuard.isLoggedIn();
        if (!isLoggedIn) {
            this.router.navigate(['/login']);
            return;
        }
        this.id = this.router.url.split('/')[INDEX_OF_ID];
    }
    async getQuizInfo(importedData?: QuizInterface, questions?: MCQuestion[]) {
        this.quizRenderer = new QuizRenderer(this.communicationService, this.id);
        await this.quizRenderer.initialize();
        if (importedData && questions && questions.length !== 0) {
            // create the quiz;
            const questionIDs: string[] = [];
            for (const question of questions) {
                const questionID = await QuestionRenderer.createQuestion(
                    question,
                    question.type === 'MCQ',
                    'admin/question',
                    this.communicationService,
                );
                questionIDs.push(questionID);
            }
            importedData.questionIDs = questionIDs;
            this.quizRenderer.doSomething(QuizStates.Initialize, { quizOBJ: importedData });
            this.quizRenderer.state.makeDirty();
            this.questionIDs = questionIDs;
        }
        if (this.quizRenderer) {
            this.questionIDs = this.quizRenderer.render().questionIDs;
        }
    }

    openModal() {
        const dialogRef = this.matDialogue.open(BankDialogComponent);
        dialogRef.afterClosed().subscribe(async (selectedQuestions: MCQuestion[]) => {
            for (const question of selectedQuestions) {
                // verify if name already exists
                if (await Validator.validateIsAlreadyInQuiz(question, this.quizRenderer, this.communicationService)) {
                    this.alertService.showError(`"${question.question}" existe déjà`, 'Erreur');
                    return;
                }
                await this.quizRenderer.addQuestion(question.id);
                this.alertService.showSuccess('La question a été importée', 'Succès');
            }
        });
    }

    getId(): string {
        return this.id;
    }
}
