import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, DoCheck, Input, OnInit } from '@angular/core';
import { QuestionContexts } from '@app/classes/contexts-of-creation/question-contexts';
import { MCQuestion } from '@app/classes/question/question-interfaces';
import { QuizStates } from '@app/classes/reducer/states';
import { QuestionRenderer } from '@app/classes/renderer/question-renderer/question-renderer';
import { QuizRenderer } from '@app/classes/renderer/quiz-renderer/quiz-renderer';
import { CommunicationService } from '@app/services/communication-service/communication.service';

@Component({
    selector: 'app-question-list',
    templateUrl: './question-list.component.html',
    styleUrls: ['./question-list.component.scss'],
})
export class QuestionListComponent implements OnInit, DoCheck {
    @Input() path: string;
    @Input() questions: string[] = [];
    @Input() questionsMod: string[] | undefined;
    @Input() quizRenderer: QuizRenderer;

    readonly context = QuestionContexts.EditContext;
    questionRenderers: QuestionRenderer[];
    renderedQuestions: MCQuestion[];
    private lastRenderedQuestions: string[] = [];
    constructor(readonly communicationService: CommunicationService) {}

    async ngDoCheck(): Promise<void> {

        if (this.quizRenderer === undefined) {
            return;
        }
        const rendererQuestions = this.quizRenderer.state.quizState.questions;
        if (rendererQuestions === undefined) {
            return;
        }
        if (JSON.stringify(rendererQuestions) !== JSON.stringify(this.lastRenderedQuestions)) {
            this.lastRenderedQuestions = [...rendererQuestions]; // stops some infinite loop
            this.questions = [...rendererQuestions];
            await this.ngOnInit();
        }
    }

    async ngOnInit(): Promise<void> {
        this.questionRenderers = [];
        this.renderedQuestions = [];
        await this.loadQuestions();
    }
    async loadQuestions() {
        const list = this.questions;
        for (const questionID of list) {
            const index = list.indexOf(questionID);
            const renderer = await this.createQuestionRenderer(index, questionID);
            this.questionRenderers.push(renderer);
            const mcq = renderer.render();
            this.renderedQuestions.push(mcq);
        }
    }
    drop(event: CdkDragDrop<string[]>): void {
        moveItemInArray(this.questionRenderers, event.previousIndex, event.currentIndex);
        if (this.quizRenderer !== undefined) {
            this.questions = this.questionRenderers.map((render) => {
                return render.render().id;
            });
            this.trackQuestionModifications(); // updates the quiz renderer
        }
    }
    private trackQuestionModifications(): void {
        this.quizRenderer.doSomething(QuizStates.UpdateQuizQuestions, { quizOBJ: this.quizRenderer.render(), questionIDs: this.questions });
    }

    async filter(type: string, remove: boolean) {
        const questionIDsToFilter: [string, number][] = [];
        this.renderedQuestions.forEach((question, index) => {
            if (question.type === type) {
                questionIDsToFilter.push([question.id, index]);
            }
        });
        for (const pair of questionIDsToFilter) {
            if (remove) {
                const index = this.questionRenderers.findIndex((questionRenderer) => {
                    return questionRenderer.state.questionState.questionID === pair[0];
                });
                this.questionRenderers.splice(index, 1);
            } else {
                const renderer = await this.createQuestionRenderer(pair[1], pair[0]);
                this.questionRenderers.push(renderer);
            }
        }
    }

    private async createQuestionRenderer(indexInQuestionList: number, questionID: string): Promise<QuestionRenderer> {
        const renderer = new QuestionRenderer(this.communicationService, questionID);
        await renderer.initialize();
        if (this.questionsMod) {
            (renderer.state.state.questionOBJ as MCQuestion).lastModified = new Date(this.questionsMod[indexInQuestionList]);
        }
        return renderer;
    }
}
