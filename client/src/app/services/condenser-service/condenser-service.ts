import { QuestionMemento, QuestionState } from '@app/classes/modification-memento/mementos/question-memento';
import { QuizMemento, QuizState } from '@app/classes/modification-memento/mementos/quiz-memento';
import { QuestionStates, QuizStates } from '@app/classes/reducer/states';

export class CondenserService {
    static condenseQuestion(mementos: QuestionMemento[]) {
        const foundActions: QuestionStates[] = [];
        const lastMementos: QuestionMemento[] = [];

        for (let index = mementos.length - 1; index >= 0; index--) {
            if (!mementos[index].dirty && lastMementos.length >= 3) {
                break;
            }

            if (!foundActions.includes(mementos[index].questionState.action)) {
                foundActions.push(mementos[index].questionState.action);
                lastMementos.push(mementos[index]);
            }

            if (mementos[index].questionState.action === QuestionStates.CreateQuestion) {
                // If a create action is found, continue to collect mementos
                continue;
            }
        }

        const defaultState: QuestionState = {
            questionID: lastMementos[0].questionState.questionID,
            action: QuestionStates.Save,
        };

        const condensedMemento: QuestionMemento = new QuestionMemento(defaultState);

        for (const memento of lastMementos) {
            switch (memento.questionState.action) {
                case QuestionStates.UpdateQuestionChoices:
                    condensedMemento.questionState.choices = memento.questionState.choices;
                    break;
                case QuestionStates.UpdateQuestionPoints:
                    condensedMemento.questionState.points = memento.questionState.points;
                    break;
                case QuestionStates.UpdateQuestionQuestion:
                    condensedMemento.questionState.question = memento.questionState.question;
                    break;
                case QuestionStates.UpdateQuestionType:
                    condensedMemento.questionState.type = memento.questionState.type;
                    break;
            }
        }
        return condensedMemento;
    }
    static condenseQuiz(mementos: QuizMemento[]): QuizMemento {
        const foundActions: QuizStates[] = [];
        const lastMementos: QuizMemento[] = [];
        for (let index = mementos.length - 1; index >= 0; index--) {
            if (!mementos[index].dirty && lastMementos.length >= QuizStates.UpdateQuizVisibility - QuizStates.UpdateQuizTitle + 1) {
                break;
            }
            if (!foundActions.includes(mementos[index].quizState.action)) {
                foundActions.push(mementos[index].quizState.action);
                lastMementos.push(mementos[index]);
            }
            if (mementos[index].quizState.action === QuizStates.CreateQuiz) {
                // If a create action is found, continue to collect mementos
                continue;
            }
        }
        const finalState: QuizState = {
            quiz: lastMementos[0].quizState.quiz,
            action: QuizStates.SaveQuiz,
        };
        for (const memento of lastMementos) {
            switch (memento.quizState.action) {
                case QuizStates.UpdateQuizQuestions:
                    finalState.questions = memento.quizState.questions;
                    break;
                case QuizStates.UpdateQuizDuration:
                    finalState.duration = memento.quizState.duration;
                    break;
                case QuizStates.UpdateQuizDescription:
                    finalState.description = memento.quizState.description;
                    break;
                case QuizStates.UpdateQuizTitle:
                    finalState.title = memento.quizState.title;
                    break;
                case QuizStates.UpdateQuizVisibility:
                    finalState.visible = memento.quizState.visible;
                    break;
            }
        }
        const condensedMemento: QuizMemento = new QuizMemento(finalState);
        return condensedMemento;
    }
}
