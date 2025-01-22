import { QuestionCaretaker } from '@app/classes/modification-memento/caretaker/question-caretaker';
import { QuestionMemento } from '@app/classes/modification-memento/mementos/question-memento';
import { MCQuestion, Option } from '@app/classes/question/question-interfaces';
import { QuestionStates } from '@app/classes/reducer/states';
import { QuestionRenderer } from '@app/classes/renderer/question-renderer/question-renderer';
import { CondenserService } from '@app/services/condenser-service/condenser-service';

const MIN_POINTS = 10;

export interface QuestionPayload {
    questionOBJ?: MCQuestion;
    question?: string;
    points?: number;
    choices?: Option[];
    type?: string;
}

export interface QuestionReducerObj {
    action: QuestionStates;
    payload: QuestionPayload;
}

export class QuestionReducer {
    constructor(
        private readonly mementoPattern: QuestionCaretaker,
        private readonly originator: QuestionRenderer,
    ) {}

    reduce({ action, payload }: QuestionReducerObj) {
        switch (action) {
            case QuestionStates.Initialize:
                this.initializeQuestion(payload);
                break;
            case QuestionStates.Save:
                this.saveQuestionState();
                break;
            case QuestionStates.UpdateQuestionQuestion:
                this.updateQuestionQuestion(payload);
                break;
            case QuestionStates.UpdateQuestionPoints:
                this.updateQuestionPoints(payload);
                break;
            case QuestionStates.UpdateQuestionChoices:
                this.updateQuestionChoices(payload);
                break;
            case QuestionStates.UpdateQuestionType:
                this.updateQuestionType(payload);
                break;
            case QuestionStates.CreateQuestion:
                this.createQuestion();
                break;
            case QuestionStates.DeleteQuestion:
                this.deleteQuestion(payload);
                break;
            default:
                break;
        }
    }

    initializeQuestion(payload: QuestionPayload): void {
        if (!payload.questionOBJ) {
            return;
        }
        const memento: QuestionMemento = new QuestionMemento({
            questionID: payload.questionOBJ.id,
            action: QuestionStates.Initialize,
            questionOBJ: payload.questionOBJ,
        });
        this.mementoPattern.mementos = [];
        this.mementoPattern.initialize(memento);
    }

    private handleUpdateQuestion(memento: QuestionMemento): void {
        if (!memento) {
            return;
        }
        memento.makeDirty();
        this.originator.restore(memento);
        this.mementoPattern.backup();
    }

    private saveQuestionState(): void {
        if (this.mementoPattern.mementos.length <= 1) {
            return;
        }
        const condensedMemento = CondenserService.condenseQuestion(this.mementoPattern.mementos);
        this.mementoPattern.mementos = [];
        this.mementoPattern.initialize(condensedMemento);
    }

    private updateQuestionQuestion(payload: QuestionPayload): void {
        if (!payload.question || !payload.questionOBJ) {
            return;
        }
        const memento: QuestionMemento = new QuestionMemento({
            questionID: payload.questionOBJ.id,
            action: QuestionStates.UpdateQuestionQuestion,
            question: payload.question,
        });
        this.handleUpdateQuestion(memento);
    }

    private updateQuestionPoints(payload: QuestionPayload): void {
        if (!payload.points || !payload.questionOBJ) {
            return;
        }
        const memento: QuestionMemento = new QuestionMemento({
            questionID: payload.questionOBJ.id,
            action: QuestionStates.UpdateQuestionPoints,
            points: payload.points,
        });
        this.handleUpdateQuestion(memento);
    }

    private updateQuestionChoices(payload: QuestionPayload): void {
        if (!payload.choices || !payload.questionOBJ) {
            return;
        }
        const memento: QuestionMemento = new QuestionMemento({
            questionID: payload.questionOBJ.id,
            action: QuestionStates.UpdateQuestionChoices,
            choices: payload.choices,
        });
        this.handleUpdateQuestion(memento);
    }

    private updateQuestionType(payload: QuestionPayload): void {
        if (!payload.type || !payload.questionOBJ) {
            return;
        }
        const memento: QuestionMemento = new QuestionMemento({
            questionID: payload.questionOBJ.id,
            action: QuestionStates.UpdateQuestionType,
            type: payload.type,
        });
        this.handleUpdateQuestion(memento);
    }

    private createQuestion(): void {
        if (this.mementoPattern.mementos.length <= 1) {
            return;
        }
        const condensedMemento = CondenserService.condenseQuestion(this.mementoPattern.mementos);
        if (!condensedMemento.questionState.question || !condensedMemento.questionState.choices) {
            return;
        }
        const id = 'new question baby!!!';
        const question: MCQuestion = {
            id,
            question: condensedMemento.questionState.question,
            points: condensedMemento.questionState.points ?? MIN_POINTS,
            choices: condensedMemento.questionState.choices,
            lastModified: new Date(),
            type: '',
        };
        const memento: QuestionMemento = new QuestionMemento({
            questionID: id,
            action: QuestionStates.CreateQuestion,
            questionOBJ: question,
        });
        this.mementoPattern.mementos = [];
        this.mementoPattern.initialize(memento);
    }

    private deleteQuestion(payload: QuestionPayload): void {
        if (!payload.questionOBJ) {
            return;
        }
        const memento: QuestionMemento = new QuestionMemento({
            questionID: payload.questionOBJ.id,
            action: QuestionStates.DeleteQuestion,
        });
        this.mementoPattern.mementos = [];
        this.handleUpdateQuestion(memento);
    }
}
