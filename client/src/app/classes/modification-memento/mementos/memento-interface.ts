// import { QuizState } from '@app/classes/modification-memento/mementos/quiz-memento';
// import { QuestionState } from '@app/classes/modification-memento/mementos/question-memento';
// // export interface IMemento {
// //     readonly state: QuizState | QuestionState;
// //     dirty: boolean;
// //     makeDirty(): void;
// // }

export abstract class Memento {
    private dirtyBit = false;
    get dirty() {
        return this.dirtyBit;
    }
    makeDirty() {
        this.dirtyBit = true;
    }
}
