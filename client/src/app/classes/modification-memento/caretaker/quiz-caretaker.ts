import { QuizMemento } from '@app/classes/modification-memento/mementos/quiz-memento';
import { QuizRenderer } from '@app/classes/renderer/quiz-renderer/quiz-renderer';

export class QuizCaretaker {
    mementos: QuizMemento[] = [];

    constructor(private readonly originator: QuizRenderer) {}

    backup(): void {
        const memento = this.originator.save();
        // don't stack up duplicated requests
        if (this.mementos.length > 0 && this.mementos[this.mementos.length - 1].quizState.action === memento.quizState.action) {
            this.mementos[this.mementos.length - 1] = memento;
            return;
        }
        this.mementos.push(this.originator.save());
    }

    undo(): void {
        if (this.mementos.length > 1) {
            return;
        }
        const memento = this.mementos.pop();
        this.originator.restore(memento as QuizMemento);
    }
    initialize(memento: QuizMemento): void {
        if (this.mementos.length === 0) {
            this.mementos.push(memento);
        } else {
            this.mementos[0] = memento;
        }
        this.originator.restore(memento);
    }
    getHead() {
        return this.mementos[this.mementos.length - 1];
    }
}
