import { QuestionBankObject } from '@app/classes/database-types/question-bank-object/question-bank-object';
import { QUESTION_BANK_COLLECTION, QUESTION_COLLECTION } from '@app/controllers/database-constants';
import { DatabaseService } from '@app/services/database-service/database.service';
import { IDFilter, QuestionFilter } from '@app/services/database-service/options/options';
import { Message } from '@common/message';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';
import { QUESTION_MISMATCH } from '@common/constant';

@Service()
export class QuestionBankController {
    router: Router;
    constructor(private databaseService: DatabaseService) {
        this.configureRouter();
    }
    configureRouter(): void {
        this.router = Router();
        this.router.delete('/:id', async (req, res) => {
            if (!req.params.id) {
                res.status(StatusCodes.BAD_REQUEST).send();
                return;
            }
            // search for question first:
            const filter: QuestionFilter = {
                question: {
                    $in: [req.params.id],
                },
            };
            const question = await this.databaseService.getCollection(QUESTION_BANK_COLLECTION, filter);
            if (question.length === 0) {
                res.status(StatusCodes.NO_CONTENT).send();
                return;
            }
            await this.databaseService.deleteObject(QUESTION_BANK_COLLECTION, '', filter);
            res.status(StatusCodes.ACCEPTED).send();
        });
        this.router.get('/', async (req, res) => {
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
        this.router.post('/', async (req, res) => {
            if (!req.body || !req.body.body || !req.body.body.question) {
                res.status(StatusCodes.BAD_REQUEST).send();
                return;
            }
            const question = req.body.body.question;
            const filter: IDFilter = {
                id: {
                    $in: [question],
                },
            };
            if ((await this.databaseService.getCollection(QUESTION_COLLECTION, filter)).length === 0) {
                res.status(StatusCodes.CONFLICT).send(QUESTION_MISMATCH);
                return;
            }
            const questionBankElement = new QuestionBankObject(question);
            await this.databaseService.insertOneObject(QUESTION_BANK_COLLECTION, questionBankElement);
            res.status(StatusCodes.CREATED).send();
        });
    }
}
