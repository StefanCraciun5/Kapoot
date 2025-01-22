import { QuizCaretaker } from '@app/classes/modification-memento/caretaker/quiz-caretaker';
import { QuizMemento, QuizState } from '@app/classes/modification-memento/mementos/quiz-memento';
import { QuizInterface } from '@app/classes/quiz/quiz-interface';
import { QuizPayload, QuizReducer } from '@app/classes/reducer/quiz-reducer/quiz-reducer';
import { QuizStates } from '@app/classes/reducer/states';
import { CommunicationService } from '@app/services/communication-service/communication.service';

const QUIZ_RESSOURCE_PATH = 'admin/quiz';

/*
    Dear maintainer,
    When I coded this class, only God and I knew what was going on.
    Now, only God knows.
    Increment this counter as a warning for the next reader:

        Total hours wasted here: 36
*/

export class QuizRenderer {
    state: QuizMemento;
    private readonly caretaker: QuizCaretaker;
    private quizReducer: QuizReducer;

    constructor(
        private readonly communicationService: CommunicationService,
        readonly id?: string,
    ) {
        this.caretaker = new QuizCaretaker(this);
        this.quizReducer = new QuizReducer(this.caretaker, this);
    }

    static async staticDelete(id: string, communicationService: CommunicationService) {
        if (!id) {
            return;
        }
        return new Promise<void>((resolve) => {
            communicationService.delete(`${QUIZ_RESSOURCE_PATH}/${id}`).subscribe({
                next: () => {
                    resolve();
                },
                error: () => {
                    resolve();
                },
            });
        });
    }
    static async toggleVisibility(id: string, desiredStatus: boolean, communicationService: CommunicationService) {
        if (!id) {
            return;
        }
        const body = JSON.parse(JSON.stringify({ visible: desiredStatus }));
        const path = `${QUIZ_RESSOURCE_PATH}/${id}`;
        return new Promise<boolean>((resolve) => {
            communicationService.patch({ title: '', body }, path).subscribe({
                next: () => {
                    resolve(true);
                },
                error: () => {
                    resolve(false);
                },
            });
        });
    }
    async initialize() {
        if (!this.id) {
            return;
        }
        const quiz: QuizInterface = {
            id: '0',
            title: '',
            description: '',
            lastModification: new Date(),
            questionIDs: [],
            duration: 10,
            visibility: true,
        };
        if (this.id !== '0') {
            const quizOBJ = await this.getQuiz();
            if (quizOBJ) {
                quiz.id = this.id;
                quiz.title = JSON.parse(quizOBJ).title;
                quiz.description = JSON.parse(quizOBJ).description;
                quiz.lastModification = JSON.parse(quizOBJ).lastModification;
                quiz.questionIDs = JSON.parse(quizOBJ).questions;
                quiz.duration = JSON.parse(quizOBJ).duration;
                quiz.visibility = JSON.parse(quizOBJ).visible;
            }
        }
        this.doSomething(QuizStates.Initialize, { quizOBJ: quiz });
    }

    setUpDefaultQuestion(quiz: QuizInterface) {
        this.doSomething(QuizStates.Initialize, { quizOBJ: quiz });
    }

    render(): QuizInterface {
        // returns the question at the top of the heap
        return this.state.quizState.quiz;
    }

    doSomething(action: QuizStates, payload: QuizPayload) {
        this.quizReducer.reduce(action, payload);
    }

    restore(memento: QuizMemento): void {
        this.state = memento;
    }

    save(): QuizMemento {
        return this.state;
    }
    addQuestion(questionID: string) {
        const currentQuestions = this.state.quizState.quiz.questionIDs;
        currentQuestions.push(questionID);
        this.doSomething(QuizStates.UpdateQuizQuestions, { quizOBJ: this.state.quizState.quiz, questionIDs: currentQuestions });
    }
    removeQuestion(questionID: string) {
        const currentQuestions = this.state.quizState.quiz.questionIDs;
        const newQuestions = currentQuestions.filter((question) => {
            return question !== questionID;
        });
        this.doSomething(QuizStates.UpdateQuizQuestions, { quizOBJ: this.state.quizState.quiz, questionIDs: newQuestions });
    }
    async createQuiz(quizOBJ: QuizState) {
        if (!quizOBJ.title || !quizOBJ.description || !quizOBJ.questions || quizOBJ.questions.length === 0 || !quizOBJ.duration) {
            return;
        }
        await this.post(JSON.parse(JSON.stringify(quizOBJ)), QUIZ_RESSOURCE_PATH);
    }
    async patch(body: string, path: string) {
        return new Promise<boolean>((resolve) => {
            this.communicationService.patch({ title: '', body }, path).subscribe({
                next: () => {
                    resolve(true);
                },
                error: () => {
                    resolve(false);
                },
            });
        });
    }
    async delete() {
        await QuizRenderer.staticDelete(this.id as string, this.communicationService);
    }
    private async getQuiz(): Promise<string> {
        return new Promise<string>((resolve) => {
            this.communicationService.basicGet(`${QUIZ_RESSOURCE_PATH}/${this.id}`).subscribe({
                next: (res) => {
                    resolve(res.body);
                },
                error: () => {
                    resolve('');
                },
            });
        });
    }
    private async post(body: string, path: string): Promise<void> {
        return new Promise((resolve) => {
            this.communicationService.adminPost({ title: '', body }, path).subscribe({
                next: () => {
                    resolve();
                },
                error: () => {
                    resolve();
                },
            });
        });
    }
}
