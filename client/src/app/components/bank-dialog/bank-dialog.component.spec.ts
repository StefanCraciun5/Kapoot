import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MCQuestion } from '@app/classes/question/question-interfaces';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { BankDialogComponent } from './bank-dialog.component';

interface QuestionSelection {
    question: MCQuestion;
    selected: boolean;
}

describe('BankDialogComponent', () => {
    let component: BankDialogComponent;
    let fixture: ComponentFixture<BankDialogComponent>;
    let dialogRef: MatDialogRef<BankDialogComponent>;

    beforeEach(async () => {
        dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

        await TestBed.configureTestingModule({
            declarations: [BankDialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: dialogRef },
                { provide: CommunicationService, useValue: {} }, // Mock CommunicationService
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BankDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should close dialog with questions when questions is not empty', () => {
        const question: MCQuestion = {
            id: 'id 1',
            question: 'question',
            points: 10,
            choices: [],
            type: 'LAQ',
            lastModified: new Date(),
        };
        const questions: MCQuestion[] = [question, question];

        component.closeDialog(questions);

        expect(dialogRef.close).toHaveBeenCalled();
    });
    it('should select question', () => {
        const questionOBJ: MCQuestion = {
            id: 'id 1',
            question: 'question',
            points: 10,
            choices: [],
            type: 'LAQ',
            lastModified: new Date(),
        };
        const questions: QuestionSelection[] = [
            { question: questionOBJ, selected: false },
            { question: questionOBJ, selected: false },
        ];
        component.questions = questions;
        component.toggleSelect(0);

        expect(component.questions[0].selected).toBe(true);
    });
    it('should export question', () => {
        const questionOBJ: MCQuestion = {
            id: 'id 1',
            question: 'question',
            points: 10,
            choices: [],
            type: 'LAQ',
            lastModified: new Date(),
        };
        const questions: QuestionSelection[] = [
            { question: questionOBJ, selected: true },
            { question: questionOBJ, selected: false },
        ];
        component.questions = questions;
        const spy = spyOn(component, 'closeDialog');
        component.export();
        expect(spy).toHaveBeenCalled();
    });
});
