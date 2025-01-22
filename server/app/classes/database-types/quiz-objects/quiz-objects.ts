import { v4 } from 'uuid';
import { GenericObject } from '@app/classes/database-types/generic-objects/generic-object';

interface QuizJSON {
    id: string;
    isVisible: boolean;
    title: string;
    description: string;
    lastModification: Date;
    duration: number;
    questions: string[]; // question IDs referred in database
}

export class QuizObjects implements GenericObject {
    private readonly id: string;
    private duration: number;
    private readonly visible: boolean;
    private lastModification: Date;
    constructor(
        private title: string,
        private description: string,
        private questions: string[],
    ) {
        this.id = v4();
        this.visible = true; // by default, patch requests can be deployed to toggle
        this.duration = 0;
        this.lastModification = new Date();
    }
    setDuration(duration: number): void {
        this.duration = duration;
    }
    toJSON(): JSON {
        const quiz: QuizJSON = {
            id: this.id,
            isVisible: this.visible,
            title: this.title,
            description: this.description,
            lastModification: this.lastModification,
            duration: this.duration,
            questions: this.questions,
        };
        return JSON.parse(JSON.stringify(quiz));
    }
}
