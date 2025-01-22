import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, DoCheck, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { QuestionContexts } from '@app/classes/contexts-of-creation/question-contexts';
import { MCQuestion, Option } from '@app/classes/question/question-interfaces';
import { QuestionPayload } from '@app/classes/reducer/question-reducer/question-reducer';
import { QuestionStates } from '@app/classes/reducer/states';
import { QuestionRenderer } from '@app/classes/renderer/question-renderer/question-renderer';
import { Validator } from '@app/services/validation-service/validator.service';
import { MAX_OPTIONS, MIN_OPTIONS, MIN_POINTS } from '@common/constant';

@Component({
    selector: 'app-question-edit',
    templateUrl: './question-edit.component.html',
    styleUrls: ['./question-edit.component.scss'],
})
export class QuestionEditComponent implements OnInit, DoCheck {
    @Input() renderer: QuestionRenderer;
    @Input() context: QuestionContexts;
    @Output() switchQuestionTypeEvent = new EventEmitter();
    @Output() saveEvent = new EventEmitter();
    @Output() deleteEvent = new EventEmitter();
    @Input() isQCM: boolean;
    questionOBJ: MCQuestion;
    question: string;
    points: number;
    options: Option[];
    readonly createContext = QuestionContexts.CreateContext;

    ngOnInit() {
        this.questionOBJ = this.renderer.render();
        this.question = this.questionOBJ.question;
        this.points = this.questionOBJ.points;
        this.options = this.questionOBJ.choices;
    }

    ngDoCheck(): void {
        this.validateOptions();
    }
    // Function to handle drag and drop of options
    drop(event: CdkDragDrop<string[]>): void {
        moveItemInArray(this.options, event.previousIndex, event.currentIndex);
        this.options = this.trackOptionsModification();
    }
    deleteOption(id: number) {
        if (this.options.length === MIN_OPTIONS) {
            return;
        }
        this.options = this.options.filter((option, index) => {
            return index !== id;
        });
        this.options = this.trackOptionsModification();
    }
    addOption() {
        if (this.options.length === MAX_OPTIONS) {
            return;
        }
        this.options.push({ choice: '', isCorrect: false });
        this.options = this.trackOptionsModification();
    }
    trackQuestionChanges() {
        const payload: QuestionPayload = {
            question: this.question,
            questionOBJ: this.questionOBJ,
        };
        this.renderer.doSomething(QuestionStates.UpdateQuestionQuestion, payload);
        if (this.renderer.render()) {
            return this.renderer.render().question as string;
        }
        return '';
    }
    trackPointsChanges() {
        const payload: QuestionPayload = {
            points: this.points,
            questionOBJ: this.questionOBJ,
        };
        this.renderer.doSomething(QuestionStates.UpdateQuestionPoints, payload);
        if (this.renderer.render()) {
            return this.renderer.render().points;
        }
        return this.points;
    }
    trackOptionsModification() {
        const payload: QuestionPayload = {
            choices: this.options,
            questionOBJ: this.questionOBJ,
        };
        this.renderer.doSomething(QuestionStates.UpdateQuestionChoices, payload);
        if (this.renderer.render()) {
            return this.renderer.render().choices;
        }
        return this.options;
    }

    switchQuestionType() {
        const payload: QuestionPayload = {
            type: !this.isQCM ? 'MCQ' : 'LAQ',
            questionOBJ: this.questionOBJ,
        };
        this.renderer.doSomething(QuestionStates.UpdateQuestionType, payload);
        if (this.renderer.render()) {
            return this.renderer.render().choices;
        }
        this.switchQuestionTypeEvent.emit();
        return this.options;
    }

    validateOptions(): boolean {
        this.questionOBJ.question = this.question;
        this.questionOBJ.points = this.points;
        this.questionOBJ.choices = this.options;
        // return true;
        return Validator.validateQuestion(this.questionOBJ, this.isQCM);
    }
    saveQuestion() {
        this.saveEvent.emit();
    }
    deleteQuestion() {
        this.deleteEvent.emit();
    }

    clearQuestion() {
        if (this.context === this.createContext) {
            this.isQCM = false;
            this.question = '';
            this.points = MIN_POINTS;
            this.options = [
                { isCorrect: false, choice: '' },
                { isCorrect: false, choice: '' },
            ];
        }
    }
}
