import { QuizStates } from '@app/classes/reducer/states';
import { QuizInterface } from '@app/classes/quiz/quiz-interface';
import { Memento } from './memento-interface';

export interface QuizState {
    quiz: QuizInterface;
    action: QuizStates;
    title?: string;
    description?: string;
    questions?: string[];
    visible?: boolean;
    duration?: number;
}
// export class QuizMemento {
//     private dirtyBit = false;
//     constructor(private readonly state: QuizState) {}
//     get dirty() {
//         return this.dirtyBit;
//     }
//     get quizState(): QuizState {
//         return this.state;
//     }
//     makeDirty() {
//         this.dirtyBit = true;
//     }
// }

export class QuizMemento extends Memento {
    readonly state: QuizState;
    constructor(state: QuizState) {
        super();
        this.state = state;
    }
    get quizState(): QuizState {
        return this.state as QuizState;
    }
}
