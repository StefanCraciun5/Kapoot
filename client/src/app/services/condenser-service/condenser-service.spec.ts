import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QuestionMemento } from '@app/classes/modification-memento/mementos/question-memento';
import { QuizMemento, QuizState } from '@app/classes/modification-memento/mementos/quiz-memento';
import { QuestionStates, QuizStates } from '@app/classes/reducer/states';
import { CondenserService } from './condenser-service';
// import { QuestionStates, QuizStates } from '@app/classes/reducer/states';

@Injectable({
    providedIn: 'root',
})
export class CondenserServiceMock {
    condenseQuestion(mementos: QuestionMemento[]): QuestionMemento[] {
        return mementos;
    }

    condenseQuiz(mementos: QuizMemento[]): QuizMemento[] {
        return mementos;
    }
}

describe('CondenserService', () => {
    const service = new CondenserService();

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [CondenserService],
        });
        // service = TestBed.inject(CondenserService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should condense question mementos correctly', () => {
        const option1 = { choice: 'A', isCorrect: true };
        const option2 = { choice: 'B', isCorrect: true };
        const option3 = { choice: 'C', isCorrect: true };
        const questionPoints = 20;

        const mementos: QuestionMemento[] = [
            new QuestionMemento({ action: QuestionStates.UpdateQuestionQuestion, questionID: '1', question: 'Question 1' }),
            new QuestionMemento({ action: QuestionStates.UpdateQuestionPoints, questionID: '1', points: 10 }),
            new QuestionMemento({ action: QuestionStates.UpdateQuestionChoices, questionID: '1', choices: [option1, option2, option3] }),
            new QuestionMemento({ action: QuestionStates.CreateQuestion, questionID: '2', question: 'Question 2' }),
            new QuestionMemento({ action: QuestionStates.UpdateQuestionQuestion, questionID: '2', question: 'Question 2 updated' }),
            new QuestionMemento({ action: QuestionStates.UpdateQuestionPoints, questionID: '2', points: 20 }),
        ];
        const result = CondenserService.condenseQuestion(mementos);

        expect(result).toBeTruthy();
        expect(result.questionState.questionID).toEqual('2'); // Assuming '2' is the correct questionID for the result
        expect(result.questionState.action).toEqual(QuestionStates.Save);
        expect(result.questionState.points).toEqual(questionPoints); // Check if points are correctly condensed
    });
    it('should condense question mementos correctly if we modify the choices', () => {
        const option1 = { choice: 'A', isCorrect: true };
        const option2 = { choice: 'B', isCorrect: true };
        const option3 = { choice: 'C', isCorrect: true };

        const mementos: QuestionMemento[] = [
            new QuestionMemento({ action: QuestionStates.UpdateQuestionQuestion, questionID: '1', question: 'Question 1' }),
            new QuestionMemento({ action: QuestionStates.UpdateQuestionPoints, questionID: '1', points: 10 }),
            new QuestionMemento({ action: QuestionStates.UpdateQuestionChoices, questionID: '1', choices: [option1, option2, option3] }),
            new QuestionMemento({ action: QuestionStates.CreateQuestion, questionID: '2', question: 'Question 2' }),
            new QuestionMemento({ action: QuestionStates.UpdateQuestionQuestion, questionID: '2', question: 'Question 2 updated' }),
            new QuestionMemento({ action: QuestionStates.UpdateQuestionPoints, questionID: '2', points: 20 }),
            new QuestionMemento({ action: QuestionStates.UpdateQuestionChoices, questionID: '2', choices: [option1, option2] }),
        ];
        const result = CondenserService.condenseQuestion(mementos);

        expect(result).toBeTruthy();
        expect(result.questionState.questionID).toEqual('2'); // Assuming '2' is the correct questionID for the result
        expect(result.questionState.action).toEqual(QuestionStates.Save);
        expect(result.questionState.choices).toEqual([option1, option2]); // Check if choices are correctly condensed
    });

    it('should condense quiz mementos correctly', () => {
        const mementos: QuizMemento[] = [
            new QuizMemento({
                quiz: {
                    id: '1',
                    title: 'Quiz 1',
                    description: 'Description 1',
                    lastModification: new Date(),
                    questionIDs: ['1', '2'],
                    duration: 60,
                    visibility: true,
                },
                action: QuizStates.UpdateQuizTitle,
                title: 'Updated Quiz 1 Title',
            }),
            new QuizMemento({
                quiz: {
                    id: '2',
                    title: 'Quiz 2',
                    description: 'Description 2',
                    lastModification: new Date(),
                    questionIDs: ['3', '4'],
                    duration: 90,
                    visibility: false,
                },
                action: QuizStates.UpdateQuizDescription,
                description: 'Updated Quiz 2 Description',
            }),
            new QuizMemento({
                quiz: {
                    id: '3',
                    title: 'Quiz 3',
                    description: 'Description 3',
                    lastModification: new Date(),
                    questionIDs: ['5', '6'],
                    duration: 120,
                    visibility: true,
                },
                action: QuizStates.UpdateQuizVisibility,
                visible: true,
            }),
            new QuizMemento({
                quiz: {
                    id: '4',
                    title: 'Quiz 4',
                    description: 'Description 4',
                    lastModification: new Date(),
                    questionIDs: ['7', '8'],
                    duration: 150,
                    visibility: false,
                },
                action: QuizStates.UpdateQuizQuestions,
                questions: ['Q7', 'Q8'],
            }),
            new QuizMemento({
                quiz: {
                    id: '5',
                    title: 'Quiz 5',
                    description: 'Description 5',
                    lastModification: new Date(),
                    questionIDs: ['9', '10'],
                    duration: 180,
                    visibility: true,
                },
                action: QuizStates.UpdateQuizDuration,
                duration: 180,
            }),
        ];

        const result = CondenserService.condenseQuiz(mementos);
        const quizStateDuration = 180;

        expect(result).toBeTruthy();
        expect(result.quizState.title).toEqual('Updated Quiz 1 Title');
        expect(result.quizState.description).toEqual('Updated Quiz 2 Description');
        expect(result.quizState.visible).toEqual(true);
        expect(result.quizState.questions).toEqual(['Q7', 'Q8']);
        expect(result.quizState.duration).toEqual(quizStateDuration);
        expect(result.quizState.action).toEqual(QuizStates.SaveQuiz);
    });
    it('should condense quiz mementos correctly', () => {
        const quizStateMock: QuizState = {
            quiz: {
                id: '1',
                title: 'Mock Quiz',
                description: 'Mock Quiz Description',
                lastModification: new Date(),
                questionIDs: ['1', '2'],
                duration: 60,
                visibility: true,
            },
            action: QuizStates.SaveQuiz,
            title: 'Mock Title',
            description: 'Mock Description',
            questions: ['Q1', 'Q2'],
            visible: true,
            duration: 60,
        };

        // Add mementos with different actions
        const mementos: QuizMemento[] = [
            new QuizMemento({ ...quizStateMock, action: QuizStates.UpdateQuizTitle }),
            new QuizMemento({ ...quizStateMock, action: QuizStates.UpdateQuizDescription }),
            new QuizMemento({ ...quizStateMock, action: QuizStates.UpdateQuizQuestions }),
            new QuizMemento({ ...quizStateMock, action: QuizStates.UpdateQuizVisibility }),
            new QuizMemento({ ...quizStateMock, action: QuizStates.UpdateQuizDuration }),
            new QuizMemento({ ...quizStateMock, action: QuizStates.CreateQuiz }),
        ];

        const result = CondenserService.condenseQuiz(mementos);

        expect(result).toBeTruthy();
        expect(result.quizState.action).toEqual(QuizStates.SaveQuiz);
    });
});
