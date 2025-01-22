import { HISTORY_COLLECTION } from '@app/controllers/database-constants';
import { DatabaseService } from '@app/services/database-service/database.service';
import { Message } from '@common/message';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class HistoryControllerService {
    router: Router;
    constructor(private databaseService: DatabaseService) {
        this.configureRouter();
    }
    configureRouter(): void {
        this.router = Router();

        this.router.get('/', async (req, res) => {
            const history = await this.databaseService.getCollection(HISTORY_COLLECTION, {});
            if (history.length !== 0) {
                const message: Message = {
                    title: '',
                    body: JSON.stringify(history),
                };
                res.status(StatusCodes.OK).send(message);
            } else {
                res.status(StatusCodes.NO_CONTENT).send();
            }
        });

        this.router.delete('/', async (req, res) => {
            this.databaseService.deleteMany(HISTORY_COLLECTION, {});
            res.status(StatusCodes.ACCEPTED).send();
        });
    }
}
