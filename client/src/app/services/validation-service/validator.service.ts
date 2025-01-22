import { MCQuestion } from '@app/classes/question/question-interfaces';
import { QuizInterface } from '@app/classes/quiz/quiz-interface';
import { QuestionRenderer } from '@app/classes/renderer/question-renderer/question-renderer';
import { QuizRenderer } from '@app/classes/renderer/quiz-renderer/quiz-renderer';
import { BankService } from '@app/services/bank-service/bank-service';
import { CommunicationService } from '@app/services/communication-service/communication.service';

const MIN_CHOICES = 2;
const MAX_CHOICES = 4;
const MIN_POINTS = 10;
const MAX_POINTS = 100;
const MIN_DURATION = 10;
const MAX_DURATION = 60;

export class Validator {
    // eslint-disable-next-line complexity
    static validateQuestion(question: MCQuestion, isQcm: boolean): boolean {
        // validate title
        if (question === undefined) {
            return false;
        }
        if (question.question === undefined || question.question === '') {
            return false;
        }
        if (isQcm) {
            // validate choice length
            if (question.choices === undefined || question.choices.length < MIN_CHOICES || question.choices.length > MAX_CHOICES) {
                return false;
            }
            // validate choices
            let atLeastOneValid = false;
            let allIsValid = true;
            for (const option of question.choices) {
                if (option.choice === undefined || option.choice === '') {
                    return false;
                }
                atLeastOneValid ||= option.isCorrect;
                allIsValid &&= option.isCorrect;
            }
            if (!atLeastOneValid || allIsValid) {
                return false;
            }
        }
        // validate points
        return question.points >= MIN_POINTS && question.points <= MAX_POINTS;
    }

    static validateQuiz(quiz: QuizInterface): boolean {
        // validate title
        if (quiz.title === undefined || quiz.title === '') {
            return false;
        }
        // validate duration
        if (quiz.duration === undefined || quiz.duration < MIN_DURATION || quiz.duration > MAX_DURATION) {
            return false;
        }
        // validate question length
        if (!quiz.questionIDs || quiz.questionIDs.length === 0) {
            return false;
        }
        // validate visibility
        return quiz.visibility !== undefined;
    }

    static validateQuizJSON(quiz: JSON): boolean {
        const quizOBJ: QuizInterface = {
            title: JSON.parse(JSON.stringify(quiz)).title,
            description: JSON.parse(JSON.stringify(quiz)).description,
            duration: JSON.parse(JSON.stringify(quiz)).duration,
            questionIDs: JSON.parse(JSON.stringify(quiz)).questions,
            lastModification: JSON.parse(JSON.stringify(quiz)).lastModification,
            id: JSON.parse(JSON.stringify(quiz)).id,
            visibility: JSON.parse(JSON.stringify(quiz)).visible,
        };
        return Validator.validateQuiz(quizOBJ);
    }

    static async validateIsAlreadyInQuestionBank(question: MCQuestion, communicationService: CommunicationService): Promise<boolean> {
        const questionEntries: string[] = JSON.parse(await BankService.getBankQuestions(communicationService));
        const questionIDs: string[] = questionEntries.map((entry: string) => {
            return JSON.parse(JSON.stringify(entry)).question;
        });
        for (const id of questionIDs) {
            const name = JSON.parse(await QuestionRenderer.getQuestion(id, communicationService)).question;
            if (name === question.question) {
                return true;
            }
        }
        return false;
    }

    static async validateIsAlreadyInQuiz(
        question: MCQuestion,
        quizRenderer: QuizRenderer,
        communicationService: CommunicationService,
    ): Promise<boolean> {
        const questions = quizRenderer.state.quizState.questions ?? quizRenderer.state.quizState.quiz.questionIDs;
        const questionNames: string[] = [];
        for (const questionID of questions) {
            const questionName = JSON.parse(await QuestionRenderer.getQuestion(questionID, communicationService)).question;
            questionNames.push(questionName); // get the question name instead of the ID
        }
        return questionNames.includes(question.question);
    }
}
