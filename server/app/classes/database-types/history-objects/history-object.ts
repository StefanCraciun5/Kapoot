import { GenericObject } from '@app/classes/database-types/generic-objects/generic-object';
import { HistoryObj } from '@common/message';

export class HistoryObject implements GenericObject {
    private readonly date: Date;
    private readonly title: string;
    private readonly maxPoints: number;
    private readonly players: number;
    constructor(history: HistoryObj) {
        this.date = history.date;
        this.title = history.title;
        this.maxPoints = history.maxPoints;
        this.players = history.players;
    }
    toJSON(): JSON {
        const obj: HistoryObj = {
            title: this.title,
            date: this.date,
            maxPoints: this.maxPoints,
            players: this.players,
        };
        return JSON.parse(JSON.stringify(obj));
    }
}
