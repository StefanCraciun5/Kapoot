import { QuestionBankController } from '@app/controllers/admin-controller/question-bank-controller/question-bank-controller';
import { QuestionsController } from '@app/controllers/admin-controller/questions-controler/questions-controler';
import { QuizController } from '@app/controllers/admin-controller/quiz-controller/quiz-controller';
import { DatabaseController } from '@app/controllers/database-controller/database.controler';
import { AuthenticationService } from '@app/services/authentication-service/authentication.service';
import { DatabaseService } from '@app/services/database-service/database.service';
import { NextFunction, Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';
import { v4 } from 'uuid';
import { HistoryControllerService } from './history-controller/history-controller.service';

const COOKIE_NAME = 'kapoot';
const PING_MSG = { ping: 'pong' };
const UNAUTHORIZED_MSG = 'who is u?'; // for debugging purposes, delete later

@Service()
export class AdminController {
    router: Router;
    private databaseController: DatabaseController;
    private questionsController: QuestionsController;
    private questionBankController: QuestionBankController;
    private quizController: QuizController;
    private historyController: HistoryControllerService;
    private sessionIDs: string[] = [];

    constructor(databaseService: DatabaseService) {
        this.databaseController = new DatabaseController(databaseService, {}); // no restrictions
        this.questionsController = new QuestionsController(databaseService);
        this.questionBankController = new QuestionBankController(databaseService);
        this.quizController = new QuizController(databaseService);
        this.historyController = new HistoryControllerService(databaseService);
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();
        const isAuth = (req: Request, res: Response, next: NextFunction) => {
            const userSession = req.headers.cookies;
            if (userSession && this.sessionIDs.includes(userSession.toString())) {
                next();
            } else {
                res.status(StatusCodes.UNAUTHORIZED).send(UNAUTHORIZED_MSG);
            }
        };
        // for paths :
        // POST     '/question'
        // PATCH    '/question/:quizID/:questionID'
        // DELETE   '/question/:id'
        this.router.use('/question', isAuth, this.questionsController.router);
        // for paths :
        // GET      '/question-bank'
        // POST     '/question-bank'
        // DELETE   '/question-bank/:id'
        this.router.use('/question-bank', isAuth, this.questionBankController.router);
        // for paths :
        // POST     '/quiz'
        // PATCH    '/quiz/id'
        // DELETE   '/quiz/id'
        this.router.use('/quiz', isAuth, this.quizController.router);
        this.router.use('/history', this.historyController.router);

        /* Authentication methods */
        this.router.get('/ping', isAuth, (req, res) => {
            res.status(StatusCodes.OK).send(PING_MSG);
        });
        this.router.post('/login', (req: Request, res: Response) => {
            const password = req.body.body;
            if (!password) {
                res.status(StatusCodes.BAD_REQUEST).send({ authenticated: false });
                return;
            }
            if (AuthenticationService.authenticate(password)) {
                const newSessionId = v4();
                res.cookie(COOKIE_NAME, newSessionId);
                this.sessionIDs.push(newSessionId);
                res.status(StatusCodes.OK).send({ authenticated: true, cookieSession: newSessionId });
            } else {
                res.status(StatusCodes.UNAUTHORIZED).send({ authenticated: false });
            }
        });
        this.router.post('/logout', (req, res) => {
            const userSessionID = req.headers.cookies;
            if (userSessionID && this.sessionIDs.includes(userSessionID.toString())) {
                this.sessionIDs.filter((val) => {
                    return val !== userSessionID;
                });
                res.status(StatusCodes.OK).send();
            } else {
                res.status(StatusCodes.NO_CONTENT).send();
            }
        });
        // Database GET methods that are common with the clients available GET methods
        // (keep at the bottom of middlewares)
        this.router.use('/', isAuth, this.databaseController.router); // needs auth because some access is restricted
    }
}
