import { Component, Input, OnInit } from '@angular/core';
import { QuestionContexts } from '@app/classes/contexts-of-creation/question-contexts';
import { MCQuestion, Option } from '@app/classes/question/question-interfaces';
import { QuestionRenderer } from '@app/classes/renderer/question-renderer/question-renderer';
import { QuizRenderer } from '@app/classes/renderer/quiz-renderer/quiz-renderer';
import { CommunicationService } from '@app/services/communication-service/communication.service';

const DEFAULT_POINTS = 10;
const EMPTY_DEFAULT_CHOICES: Option[] = [
    { choice: '', isCorrect: false },
    { choice: '', isCorrect: false },
];
const EMPTY_MCQUESTION: MCQuestion = {
    id: '',
    question: '',
    points: DEFAULT_POINTS,
    type: '',
    lastModified: new Date(),
    choices: EMPTY_DEFAULT_CHOICES,
};
@Component({
    selector: 'app-add-qcm',
    templateUrl: './add-qcm.component.html',
    styleUrls: ['./add-qcm.component.scss'],
})
export class AddQCMComponent implements OnInit {
    @Input() quizRenderer: QuizRenderer;
    renderer: QuestionRenderer;
    readonly context: QuestionContexts = QuestionContexts.CreateContext;
    constructor(private readonly communicationService: CommunicationService) {}
    ngOnInit(): void {
        this.renderer = new QuestionRenderer(this.communicationService);
        this.renderer.setUpDefaultQuestion(EMPTY_MCQUESTION);
    }
}
