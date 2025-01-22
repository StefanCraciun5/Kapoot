import { MCQuestion, Option } from '@app/classes/question/question-interfaces';
import { QuestionStates } from '@app/classes/reducer/states';
import { Memento } from './memento-interface';

export interface QuestionState {
    questionID: string;
    action: QuestionStates;
    question?: string;
    points?: number;
    choices?: Option[];
    questionOBJ?: MCQuestion;
    type?: string;
}

// export class QuestionMemento implements IMemento {
//     private dirtyBit = false;
//     constructor(readonly state: QuestionState) {}
//     get dirty() {
//         return this.dirtyBit;
//     }
//     get questionState(): QuestionState {
//         return this.state;
//     }
//     makeDirty() {
//         this.dirtyBit = true;
//     }
// }

export class QuestionMemento extends Memento {
    readonly state: QuestionState;
    constructor(state: QuestionState) {
        super();
        this.state = state;
    }
    get questionState(): QuestionState {
        return this.state as QuestionState;
    }
}
