import { QuestionCaretaker } from '@app/classes/modification-memento/caretaker/question-caretaker';
import { QuestionMemento, QuestionState } from '@app/classes/modification-memento/mementos/question-memento';
import { MCQuestion } from '@app/classes/question/question-interfaces';
import { QuestionPayload, QuestionReducer } from '@app/classes/reducer/question-reducer/question-reducer';
import { QuestionStates } from '@app/classes/reducer/states';
import { BankService } from '@app/services/bank-service/bank-service';
import { CommunicationService } from '@app/services/communication-service/communication.service';

const QUESTION_RESSOURCE_PATH = 'admin/question';
const QUESTION_BANK_PATH = 'admin/question-bank';

/*
    Dear maintainer,
    When I coded this class, only God and I knew what was going on.
    Now, only God knows.
    Increment this counter as a warning for the next reader:

        Total hours wasted here: 40
*/

export class QuestionRenderer {
    state: QuestionMemento;
    private readonly caretaker: QuestionCaretaker;
    private questionReducer: QuestionReducer;
    constructor(
        readonly communicationService: CommunicationService,
        private id?: string,
    ) {
        this.caretaker = new QuestionCaretaker(this);
        this.questionReducer = new QuestionReducer(this.caretaker, this);
    }
    static async getQuestion(id: string, communicationService: CommunicationService) {
        return new Promise<string>((resolve) => {
            communicationService.basicGet(`${QUESTION_RESSOURCE_PATH}/${id}`).subscribe({
                next: (res) => {
                    resolve(res.body);
                },
            });
        });
    }
    static async createQuestion(question: MCQuestion, isQcm: boolean, currentURI: string, communicationService: CommunicationService) {
        const requestOBJ = {
            question: question.question,
            points: question.points,
            type: isQcm ? 'MCQ' : 'LAQ',
            choices: isQcm ? question.choices : [],
        };
        return new Promise<string>((resolve) => {
            communicationService.adminPost({ title: '', body: JSON.parse(JSON.stringify(requestOBJ)) }, currentURI).subscribe({
                next: (res) => {
                    resolve(res.body as string);
                },
                error: () => {
                    resolve('');
                },
            });
        });
    }
    async initialize() {
        if (!this.id) {
            return;
        }
        const questionOBJ = await QuestionRenderer.getQuestion(this.id, this.communicationService);
        const question: MCQuestion = {
            id: this.id,
            question: JSON.parse(questionOBJ).question,
            points: JSON.parse(questionOBJ).points,
            lastModified: JSON.parse(questionOBJ).lastModified,
            choices: JSON.parse(questionOBJ).choices,
            type: JSON.parse(questionOBJ).type,
        };
        this.doSomething(QuestionStates.Initialize, { questionOBJ: question });
    }
    setUpDefaultQuestion(question: MCQuestion) {
        this.doSomething(QuestionStates.Initialize, { questionOBJ: question });
    }
    render(): MCQuestion {
        // returns the question at the top of the heap
        return this.state.questionState.questionOBJ as MCQuestion;
    }
    doSomething(action: QuestionStates, payload: QuestionPayload) {
        this.questionReducer.reduce({ action, payload });
    }
    restore(memento: QuestionMemento): void {
        this.state = memento;
    }
    revertToEmptyQuestion() {
        this.caretaker.mementos = [];
        const emptyQuestion: MCQuestion = {
            id: '',
            question: '',
            points: 10,
            lastModified: new Date(),
            choices: [
                { choice: '', isCorrect: false },
                { choice: '', isCorrect: false },
            ],
            type: '',
        };
        this.doSomething(QuestionStates.Initialize, { questionOBJ: emptyQuestion });
    }
    save(): QuestionMemento {
        return this.state;
    }
    async patch(state: QuestionState, quizID: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.communicationService
                .patch({ title: '', body: JSON.parse(JSON.stringify({ ...state })) }, `${QUESTION_RESSOURCE_PATH}/${quizID}/${this.id}`)
                .subscribe({
                    next: () => {
                        resolve(true);
                    },
                    error: () => {
                        resolve(false);
                    },
                });
        });
    }
    async createQuestion(state: MCQuestion, isQcm: boolean, currentURI: string): Promise<string> {
        return await QuestionRenderer.createQuestion(state, isQcm, currentURI, this.communicationService);
    }
    async addToQuestionBank(questionID: string) {
        await BankService.addToQuestionBank(questionID, this.communicationService);
    }
    async deleteQuestionFromBank(id: string) {
        const requestPath = `${QUESTION_BANK_PATH}/${id}`;
        return new Promise<void>((resolve) => {
            this.communicationService.delete(requestPath).subscribe({
                next: () => {
                    resolve();
                },
            });
        });
    }
}
