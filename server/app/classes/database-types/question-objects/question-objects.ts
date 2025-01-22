import { ChoiceInterface } from '@app/classes/database-types/choice-interface/choice-interface';
import { GenericObject } from '@app/classes/database-types/generic-objects/generic-object';
import { v4 } from 'uuid';

export interface QuestionJSON {
    id: string;
    type: string;
    question: string;
    points: number;
    choices?: ChoiceInterface[];
}
export class QuestionObjects implements GenericObject {
    readonly id: string;
    question: string;
    points: number;
    choices: ChoiceInterface[];
    readonly type?: string;
    constructor(question: QuestionJSON) {
        this.question = question.question;
        this.points = question.points;
        this.choices = question.choices;
        const type = question.type;

        if (!type) {
            this.type = this.choices.length !== 0 ? 'MCQ' : 'LAQ';
        }
        this.id = v4();
    }
    getID(): string {
        return this.id;
    }
    toJSON(): JSON {
        const question: QuestionJSON = {
            id: this.id,
            type: this.type,
            question: this.question,
            points: this.points,
        };
        if (this.type === 'MCQ') {
            question.choices = this.choices;
        }
        return JSON.parse(JSON.stringify(question));
    }
}
