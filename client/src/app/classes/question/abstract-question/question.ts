import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export abstract class Question {
    formattedDate: string; // Add this property
    lastModified: Date;
    constructor(
        public question: string,
        readonly id: number,
    ) {
        this.updateQuestionModTime();
    }
    clone(): import('@app/classes/question/question-interfaces').MCQuestion {
        throw new Error('Method not implemented.');
    }
    getQuestion(): string {
        return this.question;
    }
    changeQuestion(newQuestion: string): boolean {
        if (newQuestion.length !== 0) {
            this.question = newQuestion;
            this.updateQuestionModTime();
            return true;
        }
        return false;
    }
    getDateOfLastMod(): Date {
        return this.lastModified;
    }
    updateQuestionModTime(): void {
        this.lastModified = new Date();
    }
    abstract getAnswer(): string;
}
