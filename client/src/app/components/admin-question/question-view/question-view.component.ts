import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MCQuestion } from '@app/classes/question/question-interfaces';
import { QuestionRenderer } from '@app/classes/renderer/question-renderer/question-renderer';
import { ToggleService } from '@app/services/toggle-service/toggle.service';

@Component({
    selector: 'app-question-view',
    templateUrl: './question-view.component.html',
    styleUrls: ['./question-view.component.scss'],
})
export class QuestionViewComponent implements OnInit {
    @Input() renderer: QuestionRenderer;
    @Input() questionNumber: number;
    @Input() toggler: ToggleService;
    @Input() isInQuestionBank: boolean;
    QCM: boolean;
    @Output() addToQBEvent = new EventEmitter<void>();
    questionOBJ: MCQuestion;
    question: string;
    points: number;
    optionsNum: number;
    formattedDate: string | undefined;

    ngOnInit(): void {
        this.questionOBJ = this.renderer.render();
        this.question = this.questionOBJ.question;
        this.points = this.questionOBJ.points;
        this.optionsNum = this.questionOBJ.choices.length;
        this.QCM = (this.questionOBJ.type === 'MCQ');
        if (this.isInQuestionBank) {
            this.formattedDate = new Date(this.questionOBJ.lastModified as Date).toLocaleDateString();
        }
    }
    addToQuestionBank() {
        this.addToQBEvent.emit();
    }
}
