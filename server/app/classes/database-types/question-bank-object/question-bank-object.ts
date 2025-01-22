import { GenericObject } from '@app/classes/database-types/generic-objects/generic-object';

export class QuestionBankObject implements GenericObject {
    private readonly lastMod: Date;
    constructor(private readonly question: string) {
        this.lastMod = new Date();
    }
    toJSON(): JSON {
        const obj = {
            lastModification: this.lastMod,
            question: this.question,
        };
        return JSON.parse(JSON.stringify(obj));
    }
}
