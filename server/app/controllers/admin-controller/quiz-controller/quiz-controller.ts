import { QuizObjects } from '@app/classes/database-types/quiz-objects/quiz-objects';
import { QUESTION_BANK_COLLECTION, QUESTION_COLLECTION, QUIZ_COLLECTION } from '@app/controllers/database-constants';
import { DatabaseService } from '@app/services/database-service/database.service';
import { ALLOWED_KEYS_FOR_QUIZ, IDFilter, QuestionFilter, QuizQueryFilter } from '@app/services/database-service/options/options';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

const INTERNAL_ERROR_MSG = 'Umm, we fucked up...';

@Service()
export class QuizController {
    router: Router;
    constructor(private databaseService: DatabaseService) {
        this.configureRouter();
    }
    private configureRouter(): void {
        this.router = Router();
        this.router.post('/', async (req, res) => {
            const obj = req.body.body;
            if (!obj || !obj.title || !obj.description || !obj.duration || !obj.questions || obj.questions.length === 0) {
                res.status(StatusCodes.BAD_REQUEST).send();
                return;
            }
            const quiz = new QuizObjects(obj.title, obj.description, obj.questions);
            quiz.setDuration(obj.duration);

            this.databaseService
                .insertOneObject(QUIZ_COLLECTION, quiz)
                .then(() => {
                    res.status(StatusCodes.CREATED).send();
                })
                .catch((/* err */) => {
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(INTERNAL_ERROR_MSG);
                });
        });
        this.router.patch('/:id', async (req, res) => {
            if (!req.body.body || !req.params.id) {
                res.status(StatusCodes.BAD_REQUEST).send();
                return;
            }
            const obj = await this.databaseService.getObjectByID(QUIZ_COLLECTION, req.params.id);
            if (obj === '') {
                res.status(StatusCodes.BAD_REQUEST).send();
            }
            const reqOBJ: QuizQueryFilter = {
                $set: {
                    lastModification: new Date(),
                },
            };

            ALLOWED_KEYS_FOR_QUIZ.forEach((key) => {
                if (req.body.body[key] !== undefined) {
                    let shouldChange: boolean;
                    switch (key) {
                        case 'visible':
                            shouldChange = typeof req.body.body[key] === 'boolean';
                            break;
                        case 'duration':
                            shouldChange = typeof req.body.body[key] === 'number';
                            break;
                        case 'questions':
                            shouldChange =
                                Array.isArray(req.body.body[key]) && req.body.body[key].length >= 1 && typeof req.body.body[key][0] === 'string';
                            break;
                        default:
                            shouldChange = typeof req.body.body[key] === 'string';
                    }
                    if (shouldChange) {
                        // the '$set' attribute has an unknown type, so I can allow myself to put an 'any' (aka thrust me bro)
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (reqOBJ.$set as any)[key] = req.body.body[key];
                    }
                }
            });
            if (reqOBJ.$set.questions) {
                // search questions to validate
                const questionFilter: IDFilter = {
                    id: {
                        $in: reqOBJ.$set.questions,
                    },
                };
                const questions = await this.databaseService.getCollection(QUESTION_COLLECTION, questionFilter);
                if (questions.length !== reqOBJ.$set.questions.length) {
                    res.status(StatusCodes.FAILED_DEPENDENCY).send();
                    return;
                }
            }
            await this.databaseService.updateObject(QUIZ_COLLECTION, req.params.id, reqOBJ);
            res.status(StatusCodes.OK).send();
        });
        this.router.delete('/:id', async (req, res) => {
            if (!req.params.id) {
                res.status(StatusCodes.BAD_REQUEST).send();
                return;
            }
            // search for question first:
            const quiz = await this.databaseService.getObjectByID(QUIZ_COLLECTION, req.params.id);
            if (quiz === '') {
                res.status(StatusCodes.NO_CONTENT).send();
                return;
            }
            // make sure you don't delete a question referred in the question bank
            let questionsOfQuiz: string[] = JSON.parse(quiz).questions;
            const questionBankFilter: QuestionFilter = {
                question: {
                    $in: questionsOfQuiz,
                },
            };
            const questionsReferredInQB = await this.databaseService.getCollection(QUESTION_BANK_COLLECTION, questionBankFilter);
            const questionsToNotDelete: string[] = [];
            for (const question of questionsReferredInQB) {
                questionsToNotDelete.push(JSON.parse(JSON.stringify(question)).question);
            }
            questionsOfQuiz = questionsOfQuiz.filter((question) => {
                return !questionsToNotDelete.includes(question);
            });
            for (const question of questionsOfQuiz) {
                await this.databaseService.deleteObject(QUESTION_COLLECTION, question, {});
            }
            await this.databaseService.deleteObject(QUIZ_COLLECTION, req.params.id, {});
            res.status(StatusCodes.ACCEPTED).send();
        });
    }
}
