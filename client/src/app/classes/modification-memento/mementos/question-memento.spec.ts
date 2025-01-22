import { QuestionMemento } from '@app/classes/modification-memento/mementos/question-memento';
import { QuestionStates } from '@app/classes/reducer/states';

describe('QuestionMemento', () => {
    it('should make the memento dirty', () => {
        const initialState = {
            questionID: '1',
            action: QuestionStates.Initialize,
        };

        const questionMemento = new QuestionMemento(initialState);
        expect(questionMemento.dirty).toBe(false);

        questionMemento.makeDirty();
        expect(questionMemento.dirty).toBe(true);
    });
});
