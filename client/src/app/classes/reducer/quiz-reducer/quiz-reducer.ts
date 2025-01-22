import { QuizCaretaker } from '@app/classes/modification-memento/caretaker/quiz-caretaker';
import { QuizMemento, QuizState } from '@app/classes/modification-memento/mementos/quiz-memento';
import { QuizInterface } from '@app/classes/quiz/quiz-interface';
import { QuizStates } from '@app/classes/reducer/states';
import { QuizRenderer } from '@app/classes/renderer/quiz-renderer/quiz-renderer';
import { CondenserService } from '@app/services/condenser-service/condenser-service';

// const MIN_DURATION = 10;

export interface QuizPayload {
    quizOBJ?: QuizInterface;
    title?: string;
    description?: string;
    questionIDs?: string[];
    duration?: number;
    visibility?: boolean;
}
export interface QuizReducerOBJ {
    action: QuizStates;
    payload: QuizPayload;
}

export class QuizReducer {
    constructor(
        private readonly mementoPattern: QuizCaretaker,
        private readonly rendererActions: QuizRenderer,
    ) {}

    reduce(action: QuizStates, payload: QuizPayload) {
        switch (action) {
            case QuizStates.Initialize:
                this.handleInitialize(payload);
                break;
            case QuizStates.SaveQuiz:
                this.handleSaveQuiz();
                break;
            case QuizStates.UpdateQuizTitle:
                this.handleUpdateQuizTitle(payload);
                break;
            case QuizStates.UpdateQuizDescription:
                this.handleUpdateQuizDescription(payload);
                break;
            case QuizStates.UpdateQuizDuration:
                this.handleUpdateQuizDuration(payload);
                break;
            case QuizStates.UpdateQuizQuestions:
                this.handleUpdateQuizQuestions(payload);
                break;
            case QuizStates.UpdateQuizVisibility:
                this.handleUpdateQuizVisibility(payload);
                break;
            case QuizStates.CreateQuiz:
                this.handleCreateQuiz();
                break;
            default:
                return;
        }
    }

    private handleInitialize(payload: QuizPayload) {
        if (!payload.quizOBJ) return;
        const memento = new QuizMemento({ quiz: payload.quizOBJ, action: QuizStates.Initialize });
        this.mementoPattern.initialize(memento);
    }

    private handleSaveQuiz() {
        if (this.mementoPattern.mementos.length <= 1) {
            return;
        }
        const condensedMemento = CondenserService.condenseQuiz(this.mementoPattern.mementos);
        this.mementoPattern.mementos = [];
        this.mementoPattern.initialize(condensedMemento);
    }

    private handleUpdateQuizTitle(payload: QuizPayload) {
        if (payload.title === undefined || !payload.quizOBJ) {
            return;
        }
        const newState: QuizState = {
            quiz: payload.quizOBJ,
            action: QuizStates.UpdateQuizTitle,
            title: payload.title,
        };
        this.updateQuiz(newState);
    }

    private handleUpdateQuizDescription(payload: QuizPayload) {
        if (!payload.description || !payload.quizOBJ) {
            return;
        }
        const newState: QuizState = {
            quiz: payload.quizOBJ,
            action: QuizStates.UpdateQuizDescription,
            description: payload.description,
        };
        this.updateQuiz(newState);
    }

    private handleUpdateQuizDuration(payload: QuizPayload) {
        if (!payload.duration || !payload.quizOBJ) {
            return;
        }
        const newState: QuizState = {
            quiz: payload.quizOBJ,
            action: QuizStates.UpdateQuizDuration,
            duration: payload.duration,
        };
        this.updateQuiz(newState);
    }

    private handleUpdateQuizQuestions(payload: QuizPayload) {
        if (!payload.questionIDs || !payload.quizOBJ) {
            return;
        }
        const newState: QuizState = {
            quiz: payload.quizOBJ,
            action: QuizStates.UpdateQuizQuestions,
            questions: payload.questionIDs,
        };
        this.updateQuiz(newState);
    }

    private handleUpdateQuizVisibility(payload: QuizPayload) {
        if (payload.visibility === undefined || !payload.quizOBJ) {
            return;
        }
        const newState: QuizState = {
            quiz: payload.quizOBJ,
            action: QuizStates.UpdateQuizVisibility,
            visible: payload.visibility,
        };
        this.updateQuiz(newState);
    }

    private handleCreateQuiz() {
        if (this.mementoPattern.mementos.length <= 1) return;
        const condensedMemento = CondenserService.condenseQuiz(this.mementoPattern.mementos);

        condensedMemento.quizState.title = condensedMemento.quizState.title ?? condensedMemento.quizState.quiz.title;
        condensedMemento.quizState.description = condensedMemento.quizState.description ?? condensedMemento.quizState.quiz.description;
        condensedMemento.quizState.duration = condensedMemento.quizState.duration ?? condensedMemento.quizState.quiz.duration;
        condensedMemento.quizState.questions = condensedMemento.quizState.questions ?? condensedMemento.quizState.quiz.questionIDs;
        condensedMemento.quizState.visible = condensedMemento.quizState.visible ?? condensedMemento.quizState.quiz.visibility;

        if (
            !condensedMemento.quizState.title ||
            !condensedMemento.quizState.description ||
            !condensedMemento.quizState.questions ||
            condensedMemento.quizState.questions.length === 0
        ) {
            return;
        }

        condensedMemento.quizState.action = QuizStates.CreateQuiz;
        this.mementoPattern.mementos = [];
        this.mementoPattern.initialize(condensedMemento);
    }

    private updateQuiz(newState: QuizState) {
        const memento: QuizMemento = new QuizMemento(newState);
        memento.makeDirty();
        this.rendererActions.restore(memento);
        this.mementoPattern.backup();
    }
}
