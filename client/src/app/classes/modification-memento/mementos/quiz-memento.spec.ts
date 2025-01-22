import { QuizMemento } from './quiz-memento';
import { QuizStates } from '@app/classes/reducer/states';

describe('QuestionMemento', () => {
    it('should make the memento dirty', () => {
        const initialMockQuizState = {
            quiz: {
                id: '1',
                title: 'Initial Mock Quiz',
                description: 'Initial Mock Quiz Description',
                lastModification: new Date(),
                questionIDs: ['q1', 'q2'],
                duration: 10,
                visibility: true,
            },
            action: QuizStates.UpdateQuizTitle,
            title: 'Initial Updated Title',
            duration: 15,
        };

        const questionMemento = new QuizMemento(initialMockQuizState);
        expect(questionMemento.dirty).toBe(false);

        questionMemento.makeDirty();
        expect(questionMemento.dirty).toBe(true);
    });
});
