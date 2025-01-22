import { QuestionMemento } from '@app/classes/modification-memento/mementos/question-memento';
import { QuestionStates } from '@app/classes/reducer/states';
import { QuestionRenderer } from '@app/classes/renderer/question-renderer/question-renderer';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { QuestionCaretaker } from './question-caretaker';

export class QuestionCaretakerMock {
    initialize(memento: QuestionMemento): void {
        if (memento.dirty) {
            return;
        }
        return;
    }

    backup(): void {
        return;
    }
}

describe('QuestionCaretaker', () => {
    let questionCaretaker: QuestionCaretaker;
    let questionRenderer: QuestionRenderer;
    let communicationService: CommunicationService;

    const mockQuestionState = {
        questionID: '1',
        action: QuestionStates.Initialize,
    };

    beforeEach(() => {
        questionRenderer = new QuestionRenderer(communicationService);
        questionCaretaker = new QuestionCaretaker(questionRenderer);
    });

    it('should backup a memento', () => {
        spyOn(questionRenderer, 'save').and.callThrough();

        questionCaretaker.backup();

        expect(questionRenderer.save).toHaveBeenCalled();
        expect(questionCaretaker.mementos.length).toBe(1);
    });

    it('should not stack up duplicated requests', () => {
        const mockMemento = new QuestionMemento(mockQuestionState);

        spyOn(questionRenderer, 'save').and.returnValue(mockMemento);

        questionCaretaker.backup();
        questionCaretaker.backup();

        expect(questionRenderer.save).toHaveBeenCalledTimes(3);
        expect(questionCaretaker.mementos.length).toBe(1);
    });

    it('should undo a memento', () => {
        const mockMemento = new QuestionMemento(mockQuestionState);

        spyOn(questionRenderer, 'restore');

        questionCaretaker.initialize(mockMemento);
        questionCaretaker.undo();

        expect(questionRenderer.restore).toHaveBeenCalledWith(mockMemento);
        expect(questionCaretaker.mementos.length).toBe(0);
    });

    it('should not undo a memento if there is more than one in the stack', () => {
        const mockMemento1 = new QuestionMemento(mockQuestionState);
        const mockMemento2 = new QuestionMemento(mockQuestionState);

        spyOn(questionCaretaker, 'initialize');
        spyOn(questionCaretaker.mementos, 'pop').and.returnValues(mockMemento2, mockMemento1);
        questionCaretaker.mementos.push(mockMemento1, mockMemento2);
        questionCaretaker.undo();

        expect(questionCaretaker.mementos.length).toBe(2);
        expect(questionCaretaker.initialize).not.toHaveBeenCalledWith(mockMemento1);
    });

    it('should initialize with a memento', () => {
        const mockMemento = new QuestionMemento(mockQuestionState);

        spyOn(questionRenderer, 'restore');

        questionCaretaker.initialize(mockMemento);

        expect(questionCaretaker.mementos.length).toBe(1);
        expect(questionRenderer.restore).toHaveBeenCalledWith(mockMemento);
    });

    it('should get the head of mementos', () => {
        const mockMemento = new QuestionMemento(mockQuestionState);

        questionCaretaker.initialize(mockMemento);

        const head = questionCaretaker.getHead();

        expect(head).toEqual(mockMemento);
    });

    it('should initialize with a memento when mementos are not empty', () => {
        const initialMockQuizState = {
            questionID: '1',
            action: QuestionStates.Initialize,
        };

        const initialMockMemento = new QuestionMemento(initialMockQuizState);

        const updatedMockQuizState = {
            questionID: '2',
            action: QuestionStates.Initialize,
        };
        const updatedMockMemento = new QuestionMemento(updatedMockQuizState);

        spyOn(questionRenderer, 'restore');
        questionCaretaker.initialize(initialMockMemento);
        questionCaretaker.initialize(updatedMockMemento);

        expect(questionCaretaker.mementos.length).toBe(1);
        expect(questionRenderer.restore).toHaveBeenCalledWith(updatedMockMemento);
    });
});
