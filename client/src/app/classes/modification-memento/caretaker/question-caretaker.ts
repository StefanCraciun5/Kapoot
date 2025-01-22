import { QuestionMemento } from '@app/classes/modification-memento/mementos/question-memento';
import { QuestionRenderer } from '@app/classes/renderer/question-renderer/question-renderer';

export class QuestionCaretaker {
    mementos: QuestionMemento[] = [];

    constructor(private readonly originator: QuestionRenderer) {}

    backup(): void {
        const memento = this.originator.save();
        // don't stack up duplicated requests
        if (this.mementos.length > 0 && this.mementos[this.mementos.length - 1].questionState.action === memento.questionState.action) {
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
        this.originator.restore(memento as QuestionMemento);
    }
    initialize(memento: QuestionMemento): void {
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
