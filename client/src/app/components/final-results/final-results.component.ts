import { ChangeDetectorRef, Component, DoCheck, Input, OnInit } from '@angular/core';
import { TOGGLE_TYPES } from '@common/constant';
import { ChoicesObj, QuestionObj } from '@common/message';

@Component({
    selector: 'app-final-results',
    templateUrl: './final-results.component.html',
    styleUrls: ['./final-results.component.scss'],
})
export class FinalResultsComponent implements OnInit, DoCheck {
    @Input() answers: Map<string, number[]> = new Map(); // question name to histogram
    @Input() questions: QuestionObj[];

    questionNames: string[] = [];
    totalVotes: number[][] = [];
    choices: ChoicesObj[][] = [];

    currentAnswer: [string, number[], ChoicesObj[]];
    histogramIndex: number = 0;

    constructor(private readonly cdr: ChangeDetectorRef) {}

    ngDoCheck(): void {
        if (this.questions && this.questions.length === 0) {
            this.ngOnInit();
        }
    }

    ngOnInit(): void {
        for (const questionID of this.answers.keys()) {
            const question: QuestionObj = this.questions.find((question) => {
                return question.question === questionID;
            }) as QuestionObj;
            const choices = question?.choices as ChoicesObj[];
            const type: string = question?.type as string;
            const results: number[] = this.answers.get(questionID) as number[];
            this.questionNames.push(questionID);
            this.totalVotes.push(results);
            if (choices.length !== 0 && type === 'MCQ') {
                this.choices.push(choices);
            } else {
                this.choices.push([
                    { choice: '0 %', isCorrect: false },
                    { choice: '50 %', isCorrect: true },
                    { choice: '100 %', isCorrect: true },
                ]);
            }
        }
        this.cdr.detectChanges();
    }
    changeHistogramIndex(index: number) {
        this.histogramIndex = index;
    }
    toggle(index: number) {
        if (index === TOGGLE_TYPES[0]) {
            this.toggleBackHistogram();
        }
        if (index === TOGGLE_TYPES[1]) {
            this.toggleHistogram();
        }
    }
    private toggleHistogram() {
        this.histogramIndex++;
        if (this.histogramIndex >= this.questionNames.length) {
            this.histogramIndex = 0;
        }
        this.cdr.detectChanges();
    }
    private toggleBackHistogram() {
        this.histogramIndex--;
        if (this.histogramIndex < 0) {
            this.histogramIndex = this.questionNames.length - 1;
        }
        this.cdr.detectChanges();
    }
}
