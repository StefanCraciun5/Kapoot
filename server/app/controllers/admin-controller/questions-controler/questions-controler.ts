import { QuestionBankObject } from '@app/classes/database-types/question-bank-object/question-bank-object';
import { QuestionObjects } from '@app/classes/database-types/question-objects/question-objects';
import { QUESTION_BANK_COLLECTION, QUESTION_COLLECTION, QUIZ_COLLECTION } from '@app/controllers/database-constants';
import { DatabaseService } from '@app/services/database-service/database.service';
import {
    ALLOWED_KEYS_FOR_QUESTION,
    IDFilter,
    QuestionFilter,
    QuestionQueryFilter,
    QuizQueryFilter,
} from '@app/services/database-service/options/options';
import { INTERNAL_ERROR_MSG, MAX_CHOICES_PER_MCQ, MIN_CHOICES_PER_MCQ } from '@common/constant';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

export const createPatchFilter = (req: QuestionQueryFilter): QuestionQueryFilter => {
    const reqOBJ: QuestionQueryFilter = {
        $set: {},
    };
    ALLOWED_KEYS_FOR_QUESTION.forEach((key) => {
        switch (key) {
            case 'type':
            case 'question':
                if (typeof req.$set[key] === 'string') {
                    reqOBJ.$set[key] = req.$set[key];
                }
                break;
            case 'points':
                if (typeof req.$set[key] === 'number') {
                    reqOBJ.$set[key] = req.$set[key];
                }
                break;
            case 'choices':
                if (!req.$set[key]) {
                    return;
                }
                if (
                    req.$set[key].length >= MIN_CHOICES_PER_MCQ &&
                    req.$set[key].length <= MAX_CHOICES_PER_MCQ &&
                    req.$set[key][0].choice &&
                    req.$set[key][0].isCorrect !== undefined
                ) {
                    reqOBJ.$set[key] = req.$set[key].map((choice) => {
                        return {
                            choice: choice.choice,
                            isCorrect: choice.isCorrect,
                        };
                    });
                }
                break;
        }
    });
    return reqOBJ;
};

@Service()
export class QuestionsController {
    router: Router;
    constructor(private databaseService: DatabaseService) {
        this.configureRouter();
    }
    configureRouter(): void {
        this.router = Router();
        this.router.post('/', async (req, res) => {
            const obj = req.body.body;
            if (!obj || !obj.type || !obj.question || !obj.points || (obj.type === 'MCQ' && (!obj.choices || obj.choices.length === 0))) {
                res.status(StatusCodes.BAD_REQUEST).send();
                return;
            }
            const questionJson = {
                type: obj.type,
                question: obj.question,
                points: obj.points,
                id: '',
            };
            const question = new QuestionObjects(questionJson);
            this.databaseService
                .insertOneObject(QUESTION_COLLECTION, question)
                .then(() => {
                    res.status(StatusCodes.CREATED).send(question.getID());
                })
                .catch(() => {
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(INTERNAL_ERROR_MSG);
                });
        });
        // eslint-disable-next-line complexity
        this.router.patch('/:quizID/:questionID', async (req, res) => {
            if (!req.body.body || !req.params.quizID || !req.params.questionID) {
                res.status(StatusCodes.BAD_REQUEST).send();
                return;
            }
            const obj = await this.databaseService.getObjectByID(QUESTION_COLLECTION, req.params.questionID);
            if (obj === '') {
                res.status(StatusCodes.BAD_REQUEST).send();
                return;
            }
            const request: QuestionQueryFilter = {
                $set: { ...req.body.body },
            };
            if (
                request.$set.choices === undefined &&
                request.$set.question === undefined &&
                request.$set.points === undefined &&
                request.$set.type === undefined
            ) {
                res.status(StatusCodes.BAD_REQUEST).send();
                return;
            }
            const reqOBJ = createPatchFilter(request);
            reqOBJ.$set.lastModified = new Date();
            const questionBankFilter: IDFilter = {
                id: {
                    $in: [req.params.questionID],
                },
            };
            const newQuestionJson = {
                type: reqOBJ.$set.type || JSON.parse(obj).type,
                question: reqOBJ.$set.question || JSON.parse(obj).question,
                points: reqOBJ.$set.points || JSON.parse(obj).points,
                choices: reqOBJ.$set.choices || JSON.parse(obj).choices,
                id: '',
            };

            const newQuestion = new QuestionObjects(newQuestionJson);
            // copy on write if the question is modified in the question bank
            if (req.params.quizID === 'question-bank') {
                // get from question bank
                const questionQuery: QuestionFilter = {
                    question: {
                        $in: [req.params.questionID],
                    },
                };
                const questionBank = await this.databaseService.getCollection(QUESTION_BANK_COLLECTION, questionQuery);
                if (questionBank.length === 0) {
                    res.status(StatusCodes.BAD_REQUEST).send();
                    return;
                }
                // insert a copy question in the db
                await this.databaseService.insertOneObject(QUESTION_COLLECTION, newQuestion);
                // delete the old instance
                await this.databaseService.deleteObject(QUESTION_BANK_COLLECTION, '', questionQuery);
                // add the new one
                const qbInstance = new QuestionBankObject(newQuestion.getID());
                await this.databaseService.insertOneObject(QUESTION_BANK_COLLECTION, qbInstance);
                res.status(StatusCodes.OK).send();
                return;
            }
            if ((await this.databaseService.getCollection(QUESTION_BANK_COLLECTION, questionBankFilter)).length !== 0) {
                // create a copy
                await this.databaseService.insertOneObject(QUESTION_COLLECTION, newQuestion);
                // get collection of quizzes and change the value to which the quiz points to
                const quiz = JSON.parse(await this.databaseService.getObjectByID(QUIZ_COLLECTION, req.params.quizID));
                const quizQuestions = quiz.questions;
                const newQuestions: string[] = [];
                for (const question of quizQuestions) {
                    if (question === JSON.parse(obj).id) {
                        newQuestions.push(newQuestion.getID());
                    } else {
                        newQuestions.push(question);
                    }
                }
                const query: QuizQueryFilter = {
                    $set: {
                        questions: newQuestions,
                        lastModification: new Date(),
                    },
                };
                await this.databaseService.updateObject(QUIZ_COLLECTION, quiz.id, query);
            } else {
                // write
                await this.databaseService.updateObject(QUESTION_COLLECTION, req.params.questionID, reqOBJ);
            }
            res.status(StatusCodes.OK).send();
        });
        this.router.delete('/:id', async (req, res) => {
            if (!req.params.id) {
                res.status(StatusCodes.BAD_REQUEST).send();
                return;
            }
            // search for question first:
            const question = await this.databaseService.getObjectByID(QUESTION_COLLECTION, req.params.id);
            if (question === '') {
                res.status(StatusCodes.NO_CONTENT).send();
                return;
            }
            await this.databaseService.deleteObject(QUESTION_COLLECTION, req.params.id, {});
            res.status(StatusCodes.ACCEPTED).send();
        });
    }
}
