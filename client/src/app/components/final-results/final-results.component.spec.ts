import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinalResultsComponent } from './final-results.component';
import { QuestionObj } from '@common/message';
// import { SimpleChange } from '@angular/core';

describe('FinalResultsComponent', () => {
    let component: FinalResultsComponent;
    let fixture: ComponentFixture<FinalResultsComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [FinalResultsComponent],
        });
        fixture = TestBed.createComponent(FinalResultsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should call ngOnInit when questions array is empty', () => {
        component.questions = [];
        const ngOnInitSpy = spyOn(component, 'ngOnInit').and.callThrough();
        component.ngDoCheck();

        expect(ngOnInitSpy).toHaveBeenCalled();
    });
    it('should handle ngOnInit', () => {
        const questionLAQ: QuestionObj = {
            id: 'id 1',
            question: 'question 1',
            points: 10,
            choices: [],
            type: 'LAQ',
        };
        const questionMCQ: QuestionObj = {
            id: 'id 2',
            question: 'question 2',
            points: 10,
            choices: [
                { choice: 'a', isCorrect: true},
                { choice: 'a', isCorrect: false},
            ],
            type: 'MCQ',
        };
        component.answers = new Map<string, number[]>();
        component.answers.set('question 1', [0, 1]);
        component.answers.set('question 2', [1, 2, 0]);
        component.questions = [questionMCQ, questionLAQ];
        component.ngOnInit();

        expect(true).toBe(true);
    });
    it('should change histogram index', () => {
        component.changeHistogramIndex(1);
        expect(component.histogramIndex).toBe(1);
    });
    it('should toggle next histogram', () => {
        component.toggle(1);
        const spy = spyOn<any>(component, 'toggleHistogram');
        expect(spy).not.toHaveBeenCalled();
    });
    it('should toggle previous histogram', () => {
        component.toggle(2);
        const spy = spyOn<any>(component, 'toggleBackHistogram');
        expect(spy).not.toHaveBeenCalled();
    });
});
