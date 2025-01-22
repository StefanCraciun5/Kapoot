import { QUESTION_BANK_COLLECTION, QUESTION_COLLECTION, QUIZ_COLLECTION } from '@app/controllers/database-constants';
import { DatabaseService } from '@app/services/database-service/database.service';
import { IDFilter } from '@app/services/database-service/options/options';
import { INTERNAL_ERROR_MSG } from '@common/constant';
import { Message } from '@common/message';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class DatabaseController {
    router: Router;
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly options: IDFilter,
    ) {
        this.configureRouter();
    }
    private configureRouter(): void {
        this.router = Router();
        this.router.get('/quiz', async (req, res) => {
            this.databaseService
                .getCollection(QUIZ_COLLECTION, this.options)
                .then((objs) => {
                    if (objs.length !== 0) {
                        const message: Message = {
                            title: '',
                            body: JSON.stringify(objs),
                        };
                        res.status(StatusCodes.OK).send(message);
                    } else {
                        res.status(StatusCodes.NO_CONTENT).send();
                    }
                })
                .catch(() => {
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(INTERNAL_ERROR_MSG);
                });
        });
        this.router.get('/quiz/:id', async (req, res) => {
            // will always have a parameter, otherwise, wouldn't be in this route
            const quizID = req.params.id;
            this.databaseService
                .getObjectByID(QUIZ_COLLECTION, quizID)
                .then((obj) => {
                    if (!obj) {
                        res.status(StatusCodes.NO_CONTENT).send();
                    } else {
                        const message: Message = {
                            title: '',
                            body: obj,
                        };
                        res.status(StatusCodes.OK).send(message);
                    }
                })
                .catch(() => {
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(INTERNAL_ERROR_MSG);
                });
        });
        this.router.get('/quiz/:id/question', async (req, res) => {
            // will always have a parameter, otherwise, wouldn't be in this route
            const quizID = req.params.id;
            this.databaseService
                .getObjectByID(QUIZ_COLLECTION, quizID)
                .then((obj) => {
                    if (!obj) {
                        res.status(StatusCodes.NO_CONTENT).send();
                    } else {
                        const questions = JSON.parse(obj).questions;
                        const filterOptions: IDFilter = { id: { $in: questions } };
                        this.databaseService
                            .getCollection(QUESTION_COLLECTION, filterOptions)
                            .then((objs) => {
                                if (objs.length !== 0) {
                                    const message: Message = {
                                        title: '',
                                        body: JSON.stringify(objs),
                                    };
                                    res.status(StatusCodes.OK).send(message);
                                } else {
                                    res.status(StatusCodes.NO_CONTENT).send();
                                }
                            })
                            .catch(() => {
                                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(INTERNAL_ERROR_MSG);
                            });
                    }
                })
                .catch(() => {
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(INTERNAL_ERROR_MSG);
                });
        });
        this.router.get('/question/:id', async (req, res) => {
            const questionID = req.params.id;
            this.databaseService
                .getObjectByID(QUESTION_COLLECTION, questionID)
                .then((obj) => {
                    if (!obj) {
                        res.status(StatusCodes.NO_CONTENT).send();
                    } else {
                        const message: Message = {
                            title: '',
                            body: obj,
                        };
                        res.status(StatusCodes.OK).send(message);
                    }
                })
                .catch(() => {
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(INTERNAL_ERROR_MSG);
                });
        });
        this.router.get('/question-bank', async (req, res) => {
            const questions = await this.databaseService.getCollection(QUESTION_BANK_COLLECTION, {});
            if (questions.length !== 0) {
                const message: Message = {
                    title: '',
                    body: JSON.stringify(questions),
                };
                res.status(StatusCodes.OK).send(message);
            } else {
                res.status(StatusCodes.NO_CONTENT).send();
            }
        });
    }
}
