import { QuizMemento } from '@app/classes/modification-memento/mementos/quiz-memento';
import { QuizStates } from '@app/classes/reducer/states';
import { QuizRenderer } from '@app/classes/renderer/quiz-renderer/quiz-renderer';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { QuizCaretaker } from './quiz-caretaker';

export class QuizCaretakerMock {
    mementos: QuizMemento[] = [];
    originator: QuizRenderer;

    constructor(originator?: QuizRenderer) {
        this.originator = originator as QuizRenderer;
    }
    backup(): void {
        const mockMemento: QuizMemento = this.createMockMemento();
        this.mementos.push(mockMemento);
    }

    undo(): void {
        if (this.mementos.length > 0) {
            this.mementos.pop();
        }
    }

    initialize(memento: QuizMemento): void {
        if (this.mementos.length === 0) {
            this.mementos.push(memento);
        } else {
            this.mementos[0] = memento;
        }
    }

    getHead(): QuizMemento | undefined {
        return this.mementos[this.mementos.length - 1];
    }

    private createMockMemento(): QuizMemento {
        return new QuizMemento({
            action: QuizStates.CreateQuiz,
            quiz: { title: 'test', visibility: true, duration: 0, id: 'Id', description: '', questionIDs: [], lastModification: new Date() },
        });
    }
}

describe('QuizCaretaker', () => {
    let quizCaretaker: QuizCaretaker;
    let quizRenderer: QuizRenderer;
    let communicationService: CommunicationService;

    const mockQuizState = {
        quiz: {
            id: '1',
            title: 'Mock Quiz',
            description: 'Mock Quiz Description',
            lastModification: new Date(),
            questionIDs: ['q1', 'q2'],
            duration: 10,
            visibility: true,
        },
        action: QuizStates.UpdateQuizTitle,
        title: 'Updated Title',
        duration: 15,
    };
    beforeEach(() => {
        quizRenderer = new QuizRenderer(communicationService);
        quizCaretaker = new QuizCaretaker(quizRenderer);
    });

    it('should backup a memento', () => {
        spyOn(quizRenderer, 'save').and.callThrough();

        quizCaretaker.backup();

        expect(quizRenderer.save).toHaveBeenCalled();
        expect(quizCaretaker.mementos.length).toBe(1);
    });

    it('should not stack up duplicated requests', () => {
        spyOn(quizRenderer, 'save').and.returnValue(new QuizMemento(mockQuizState));

        quizCaretaker.backup();
        quizCaretaker.backup();

        expect(quizRenderer.save).toHaveBeenCalledTimes(3);
        expect(quizCaretaker.mementos.length).toBe(1);
    });

    it('should undo a memento', () => {
        spyOn(quizRenderer, 'restore');

        quizCaretaker.backup();
        quizCaretaker.undo();

        expect(quizRenderer.restore).toHaveBeenCalled();
        expect(quizCaretaker.mementos.length).toBe(0);
    });

    it('should undo when there are more than one mementos', () => {
        const mockMemento1 = new QuizMemento(mockQuizState);
        const mockMemento2 = new QuizMemento(mockQuizState);
        spyOn(quizCaretaker, 'initialize');
        spyOn(quizCaretaker.mementos, 'pop').and.returnValues(mockMemento2, mockMemento1);

        quizCaretaker.mementos.push(mockMemento1, mockMemento2);

        quizCaretaker.undo();

        expect(quizCaretaker.mementos.length).toBe(2);
        expect(quizCaretaker.initialize).not.toHaveBeenCalledWith(mockMemento1);
    });

    it('should initialize with a memento', () => {
        const mockMemento = new QuizMemento(mockQuizState);
        spyOn(quizRenderer, 'restore');
        quizCaretaker.initialize(mockMemento);

        expect(quizCaretaker.mementos.length).toBe(1);
        expect(quizRenderer.restore).toHaveBeenCalledWith(mockMemento);
    });

    it('should get the head of mementos', () => {
        const mockMemento = new QuizMemento(mockQuizState);
        quizCaretaker.initialize(mockMemento);

        const head = quizCaretaker.getHead();

        expect(head).toEqual(mockMemento);
    });

    it('should initialize with a memento when mementos are not empty', () => {
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

        const initialMockMemento = new QuizMemento(initialMockQuizState);

        const updatedMockQuizState = {
            quiz: {
                id: '1',
                title: 'Updated Mock Quiz',
                description: 'Updated Mock Quiz Description',
                lastModification: new Date(),
                questionIDs: ['q3', 'q4'],
                duration: 20,
                visibility: false,
            },
            action: QuizStates.UpdateQuizDescription,
            description: 'Updated Description',
            duration: 25,
        };
        const updatedMockMemento = new QuizMemento(updatedMockQuizState);

        spyOn(quizRenderer, 'restore');
        quizCaretaker.initialize(initialMockMemento);
        quizCaretaker.initialize(updatedMockMemento);

        expect(quizCaretaker.mementos.length).toBe(1);
        expect(quizRenderer.restore).toHaveBeenCalledWith(updatedMockMemento);
    });
});
