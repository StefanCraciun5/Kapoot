import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { QuestionMemento, QuestionState } from '@app/classes/modification-memento/mementos/question-memento';
import { QuizMemento } from '@app/classes/modification-memento/mementos/quiz-memento';
import { MCQuestion } from '@app/classes/question/question-interfaces';
import { QuizInterface } from '@app/classes/quiz/quiz-interface';
import { QuestionStates, QuizStates } from '@app/classes/reducer/states';
import { QuestionRenderer } from '@app/classes/renderer/question-renderer/question-renderer';
import { QuizRenderer } from '@app/classes/renderer/quiz-renderer/quiz-renderer';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { of } from 'rxjs';
import { QuestionListComponent } from './question-list.component';

describe('QuestionListComponent', () => {
    let component: QuestionListComponent;
    let fixture: ComponentFixture<QuestionListComponent>;
    let communicationService: CommunicationService;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [QuestionListComponent],
            providers: [CommunicationService],
            imports: [HttpClientTestingModule],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(QuestionListComponent);
        component = fixture.componentInstance;
        communicationService = TestBed.inject(CommunicationService);

        const mockQuizInterface: QuizInterface = {
            id: '1',
            title: 'quiz 1',
            questionIDs: [],
            description: 'description 1',
            lastModification: new Date(),
            visibility: true,
            duration: 30,
        };
        const mockQuizState = {
            quiz: mockQuizInterface,
            action: QuizStates.CreateQuiz,
        };
        const mockQuizMemento: QuizMemento = new QuizMemento(mockQuizState);
        const quizRenderer = new QuizRenderer(communicationService, mockQuizInterface.id);
        quizRenderer.state = mockQuizMemento;

        component.quizRenderer = quizRenderer;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call loadQuestions method', () => {
        const loadQuestionsSpy = spyOn(component, 'loadQuestions').and.callThrough();
        component.ngOnInit();
        expect(loadQuestionsSpy).toHaveBeenCalled();
    });

    it('should load questions and create question renderers', async () => {
        const questionIDs = ['1', '2', '3'];
        component.questions = questionIDs;

        const mockQuizInterface: QuizInterface = {
            id: '1',
            title: 'quiz 1',
            questionIDs: [],
            description: 'description 1',
            lastModification: new Date(),
            visibility: true,
            duration: 30,
        };
        spyOn(communicationService, 'basicGet').and.returnValue(of({ title: '', body: JSON.stringify(mockQuizInterface) }));
        await component.loadQuestions();

        expect(component.questionRenderers.length).toBe(questionIDs.length);
        expect(component.renderedQuestions.length).toBe(questionIDs.length);
    });
    it('should update questionRenderers array and call trackQuestionModifications', () => {
        const mockDropEvent: CdkDragDrop<string[]> = {
            previousIndex: 0,
            currentIndex: 1,
        } as CdkDragDrop<string[]>;

        const trackQuestionModificationsSpy = spyOn<unknown>(component, 'trackQuestionModifications');

        component.drop(mockDropEvent);

        expect(trackQuestionModificationsSpy).toHaveBeenCalled();
    });
    it('should remove questions of a specified type when remove is true', async () => {
        const questionLAQ: MCQuestion = {
            id: '1',
            question: 'lol',
            choices: [],
            type: 'LAQ',
            points: 10,
            lastModified: new Date(),
        };
        const questionMCQ: MCQuestion = {
            id: '1',
            question: 'lol',
            choices: [],
            type: 'MCQ',
            points: 10,
            lastModified: new Date(),
        };
        component.renderedQuestions = [questionLAQ, questionMCQ];

        const mockQuestionState: QuestionState = {
            questionID: '1',
            action: QuestionStates.CreateQuestion,
        };
        const mockQuestionMemento: QuestionMemento = new QuestionMemento(mockQuestionState);
        const questionRenderer = new QuestionRenderer(communicationService, '1');
        questionRenderer.state = mockQuestionMemento;
        component.questionRenderers = [questionRenderer, questionRenderer];

        await component.filter('MCQ', true);

        expect(component.questionRenderers.length).toBe(1);
        expect(component.questionRenderers[0].state.questionState.questionID).toBe('1');
    });
});
