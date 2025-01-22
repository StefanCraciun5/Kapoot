import { Component, DoCheck, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { QuizInterface } from '@app/classes/quiz/quiz-interface';
import { QuizStates } from '@app/classes/reducer/states';
import { QuizRenderer } from '@app/classes/renderer/quiz-renderer/quiz-renderer';
import { AlertService } from '@app/services/alert-service/alert.service';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { ToggleService } from '@app/services/toggle-service/toggle.service';
import { Validator } from '@app/services/validation-service/validator.service';

@Component({
    selector: 'app-admin-quiz',
    templateUrl: './admin-quiz.component.html',
    styleUrls: ['./admin-quiz.component.scss'],
})
export class AdminQuizComponent implements OnInit, DoCheck {
    @Input() quizRenderer: QuizRenderer;
    @Input() communicationService: CommunicationService;
    toggler: ToggleService = new ToggleService();

    constructor(
        private readonly router: Router,
        private alertService: AlertService,
    ) {}

    ngDoCheck(): void {
        if (!this.quizRenderer) {
            return;
        }
        if (this.quizRenderer.state.dirty && !this.toggler.state) {
            this.toggler.toggle();
        }
    }
    ngOnInit() {
        this.renderField();
    }
    renderField() {
        const inCreation = this.quizRenderer === undefined || this.quizRenderer.id === '0';
        while (this.toggler.state !== inCreation) {
            this.toggler.toggle();
        }
    }

    async save() {
        if (!this.quizRenderer.state.dirty) {
            this.toggler.toggle();
            return;
        }
        if (this.quizRenderer.id !== '0') {
            this.updateQuiz();
        } else {
            this.createQuiz();
        }
    }
    async delete() {
        if (window.confirm('Voulez vous supprimer le questionnaire?')) {
            if (this.quizRenderer.state.dirty) {
                if (window.confirm('Voulez avez fait des changements au questionnaire. Voulez vous toujours procéder à la suppression? ')) {
                    await this.quizRenderer.delete();
                    this.redirectTo('/admin');
                }
                return;
            }
            await this.quizRenderer.delete();
            this.redirectTo('/admin');
        }
    }
    private async refreshPage() {
        window.location.reload();
    }
    private redirectTo(path: string) {
        this.router.navigate([path]);
    }
    private async updateQuiz() {
        this.quizRenderer.doSomething(QuizStates.SaveQuiz, {});
        const reqOBJ = this.quizRenderer.state.quizState;
        const quizRessource = `admin/quiz/${reqOBJ.quiz.id}`;
        const quizInterface: QuizInterface = {
            description: reqOBJ.description ?? reqOBJ.quiz.description,
            duration: reqOBJ.duration ?? reqOBJ.quiz.duration,
            id: reqOBJ.quiz.id,
            lastModification: reqOBJ.quiz.lastModification,
            questionIDs: reqOBJ.questions ?? reqOBJ.quiz.questionIDs,
            title: reqOBJ.title ?? reqOBJ.quiz.title,
            visibility: reqOBJ.visible ?? reqOBJ.quiz.visibility,
        };
        if (!Validator.validateQuiz(quizInterface)) {
            this.alertService.showError('Format invalid', 'Erreur');
            return;
        }
        if (!(await this.quizRenderer.patch(JSON.parse(JSON.stringify(reqOBJ)), quizRessource))) {
            reqOBJ.questions = reqOBJ.quiz.questionIDs;
            reqOBJ.duration = reqOBJ.quiz.duration;
            reqOBJ.title = reqOBJ.quiz.title;
            reqOBJ.visible = reqOBJ.quiz.visibility;
            reqOBJ.description = reqOBJ.quiz.description;
            await this.quizRenderer.createQuiz(reqOBJ);
            this.redirectTo('/admin');
            return;
        }
        await this.refreshPage();
    }
    private async createQuiz() {
        this.quizRenderer.doSomething(QuizStates.CreateQuiz, {});
        const quizOBJ = this.quizRenderer.state.quizState;
        quizOBJ.description = quizOBJ.description ?? quizOBJ.quiz.description;
        quizOBJ.duration = quizOBJ.duration ?? quizOBJ.quiz.duration;
        quizOBJ.questions = quizOBJ.questions ?? quizOBJ.quiz.questionIDs;
        quizOBJ.title = quizOBJ.title ?? quizOBJ.quiz.title;
        quizOBJ.visible = quizOBJ.visible ?? quizOBJ.quiz.visibility;
        const quizInterface: QuizInterface = {
            description: quizOBJ.description ?? '',
            duration: quizOBJ.duration,
            id: '',
            lastModification: new Date(),
            questionIDs: quizOBJ.questions,
            title: quizOBJ.title,
            visibility: quizOBJ.visible,
        };
        if (!Validator.validateQuiz(quizInterface)) {
            this.alertService.showError('Format invalid', 'Erreur');
            return;
        }
        await this.quizRenderer.createQuiz(quizOBJ);
        this.redirectTo('/admin');
    }
}
