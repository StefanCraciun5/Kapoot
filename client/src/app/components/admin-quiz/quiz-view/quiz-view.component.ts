import { OnInit, Component, Input, EventEmitter, Output } from '@angular/core';
import { QuizRenderer } from '@app/classes/renderer/quiz-renderer/quiz-renderer';

@Component({
    selector: 'app-quiz-view',
    templateUrl: './quiz-view.component.html',
    styleUrls: ['./quiz-view.component.scss'],
})
// eslint-disable-next-line no-undef
export class QuizViewComponent implements OnInit {
    @Input() quizRenderer: QuizRenderer;
    @Output() switchModeEvent = new EventEmitter();
    formattedDate: string;
    duration: number;
    ngOnInit() {
        this.formattedDate = new Date(this.quizRenderer.render().lastModification).toLocaleDateString();
        this.duration = this.quizRenderer.state.quizState.duration ? this.quizRenderer.state.quizState.duration : this.quizRenderer.render().duration;
    }
    switchToEditMode() {
        this.switchModeEvent.emit();
    }
}
