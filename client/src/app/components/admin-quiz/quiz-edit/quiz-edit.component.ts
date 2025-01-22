import { Component, DoCheck, Input, OnInit } from '@angular/core';
import { QuizStates } from '@app/classes/reducer/states';
import { QuizRenderer } from '@app/classes/renderer/quiz-renderer/quiz-renderer';

@Component({
    selector: 'app-quiz-edit',
    templateUrl: './quiz-edit.component.html',
    styleUrls: ['./quiz-edit.component.scss'],
})
// eslint-disable-next-line no-undef
export class QuizEditComponent implements OnInit, DoCheck {
    @Input() quizRenderer: QuizRenderer;
    title: string;
    description: string;
    formattedDate: string;
    duration: number;
    visible: boolean;
    private isInitialized = false;

    ngDoCheck() {
        if (this.quizRenderer.render().title !== '' && !this.isInitialized) {
            this.ngOnInit();
            this.isInitialized = true;
        }
    }

    ngOnInit() {
        this.title = this.quizRenderer.render().title;
        this.description = this.quizRenderer.render().description;
        this.formattedDate = new Date(this.quizRenderer.render().lastModification).toLocaleDateString();
        this.duration = this.quizRenderer.render().duration;
        this.visible = this.quizRenderer.render().visibility;
    }

    trackTitleChanges() {
        this.quizRenderer.doSomething(QuizStates.UpdateQuizTitle, { quizOBJ: this.quizRenderer.render(), title: this.title });
        this.title = this.quizRenderer.render().title;
    }
    trackDescriptionChanges() {
        this.quizRenderer.doSomething(QuizStates.UpdateQuizDescription, { quizOBJ: this.quizRenderer.render(), description: this.description });
        this.description = this.quizRenderer.render().description;
    }
    trackDurationChanges() {
        this.quizRenderer.doSomething(QuizStates.UpdateQuizDuration, { quizOBJ: this.quizRenderer.render(), duration: this.duration });
        this.duration = this.quizRenderer.state.quizState.duration as number;
    }
    trackVisibilityChanges() {
        this.visible = !this.visible;
        this.quizRenderer.doSomething(QuizStates.UpdateQuizVisibility, { quizOBJ: this.quizRenderer.render(), visibility: this.visible });
        this.visible = this.quizRenderer.state.quizState.visible as boolean;
    }
}
