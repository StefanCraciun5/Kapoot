import { Location } from '@angular/common';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { QuestionContexts } from '@app/classes/contexts-of-creation/question-contexts';
import { MCQuestion } from '@app/classes/question/question-interfaces';
import { QuestionStates, QuizStates } from '@app/classes/reducer/states';
import { QuestionRenderer } from '@app/classes/renderer/question-renderer/question-renderer';
import { QuizRenderer } from '@app/classes/renderer/quiz-renderer/quiz-renderer';
import { QuestionEditComponent } from '@app/components/admin-question/question-edit/question-edit.component';
import { AlertService } from '@app/services/alert-service/alert.service';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { ToggleService } from '@app/services/toggle-service/toggle.service';
import { Validator } from '@app/services/validation-service/validator.service';
import { CREATE_QUESTION_PATH, MIN_POINTS, QUIZ_URI_RESSOURCE_INDEX } from '@common/constant';

@Component({
    selector: 'app-admin-question',
    templateUrl: './admin-question.component.html',
    styleUrls: ['./admin-question.component.scss'],
})
export class AdminQuestionComponent implements OnInit {
    @Input() questionRenderer: QuestionRenderer;
    @Input() defaultState: boolean;
    @Input() context: QuestionContexts;
    @Input() quizRenderer: QuizRenderer;
    @Input() questionNumber: number;
    @ViewChild('editQuestion') editQuestion: QuestionEditComponent;
    isQcm: boolean;
    toggler: ToggleService;
    question: MCQuestion;

    constructor(
        private readonly location: Location,
        private readonly alertService: AlertService,
        private readonly communicationService: CommunicationService,
    ) {}

    ngOnInit(): void {
        this.initialize();
        this.isQcm = this.questionRenderer.state.state.questionOBJ?.type === 'MCQ';
    }

    initialize(): void {
        this.toggler = new ToggleService();
        while (this.toggler.state !== this.defaultState) {
            this.toggler.toggle();
        }
    }
    async addToQuestionBank() {
        const existsInQB = await Validator.validateIsAlreadyInQuestionBank(
            this.questionRenderer.state.questionState.questionOBJ as MCQuestion,
            this.communicationService,
        );
        if (existsInQB) {
            this.alertService.showError('La question existe déjà dans la banque', 'Erreur');
            return;
        }
        await this.questionRenderer.addToQuestionBank(this.questionRenderer.state.questionState.questionID);
        this.alertService.showSuccess(`Ajouté "${this.questionRenderer.state.questionState.questionOBJ?.question}" à la banque de`, 'Succès');
    }
    toggleQuestionType() {
        this.isQcm = !this.isQcm;
    }
    async save() {
        if (this.questionRenderer.state.dirty) {
            switch (this.context) {
                case QuestionContexts.EditContext: {
                    this.questionRenderer.doSomething(QuestionStates.Save, {});
                    const questionMemento = this.questionRenderer.state;
                    const quizID = this.location.path().split('/')[QUIZ_URI_RESSOURCE_INDEX];
                    await this.questionRenderer.patch(questionMemento.questionState, quizID ? quizID : 'question-bank');
                    this.refreshPage();
                    break;
                }
                case QuestionContexts.CreateContext: {
                    if (this.quizRenderer && this.quizRenderer.state === undefined) {
                        return;
                    }
                    this.saveQuestionState();
                    if (!Validator.validateQuestion(this.question, this.isQcm)) {
                        this.alertService.showError('La question est invalide', 'Erreur');
                        this.questionRenderer.doSomething(QuestionStates.Save, {});
                        return;
                    }
                    if (this.quizRenderer) {
                        this.saveInQuiz();
                    } else {
                        this.saveInQuestionBank();
                    }
                    break;
                }
                default:
                    break;
            }
        } else {
            this.toggler.toggle();
        }
    }
    async delete() {
        this.questionRenderer.doSomething(QuestionStates.DeleteQuestion, { questionOBJ: this.questionRenderer.render() });
        if (!this.questionRenderer.state.questionState.questionID) {
            this.alertService.showError("Ne peut pas supprimer une question qui n'existe pas", 'Erreur');
            return;
        }
        if (this.quizRenderer) {
            this.quizRenderer.removeQuestion(this.questionRenderer.state.questionState.questionID);
            this.quizRenderer.doSomething(QuizStates.UpdateQuizQuestions, { questionIDs: this.quizRenderer.state.quizState.questions });
            this.questionRenderer.revertToEmptyQuestion();
            this.alertService.showSuccess('a été supprimé', 'Succès');
        } else {
            await this.questionRenderer.deleteQuestionFromBank(this.questionRenderer.state.questionState.questionID);
            this.refreshPage();
        }
    }
    private refreshPage() {
        window.location.reload();
    }
    private saveQuestionState() {
        if (this.question === undefined) {
            this.question = {
                choices: [],
                id: '',
                lastModified: new Date(),
                points: MIN_POINTS,
                question: '',
                type: '',
            };
        }
        this.questionRenderer.doSomething(QuestionStates.Save, {});
        this.question.question = this.questionRenderer.state.questionState.question ?? this.question.question;
        this.question.choices = this.questionRenderer.state.questionState.choices ?? this.question.choices;
        this.question.points = this.questionRenderer.state.questionState.points ?? this.question.points;
    }
    private async saveInQuiz() {
        if (await Validator.validateIsAlreadyInQuiz(this.question, this.quizRenderer, this.communicationService)) {
            this.alertService.showError('La question existe déjà', 'Erreur');
            this.questionRenderer.doSomething(QuestionStates.Save, {});
            return;
        }
        const newQuestionID = await this.questionRenderer.createQuestion(this.question, this.isQcm, CREATE_QUESTION_PATH);
        if (newQuestionID === '') {
            return;
        }
        await this.quizRenderer.addQuestion(newQuestionID);
        this.editQuestion.clearQuestion();
    }
    private async saveInQuestionBank() {
        if (await Validator.validateIsAlreadyInQuestionBank(this.question, this.communicationService)) {
            this.alertService.showError('La question existe déjà', 'Erreur');
            this.questionRenderer.doSomething(QuestionStates.Save, {});
            return;
        }
        const newQuestionID = await this.questionRenderer.createQuestion(this.question, this.isQcm, CREATE_QUESTION_PATH);
        if (newQuestionID === '') {
            return;
        }
        await this.questionRenderer.addToQuestionBank(newQuestionID);
        this.refreshPage();
    }
}
