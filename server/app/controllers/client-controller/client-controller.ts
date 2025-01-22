import { QUESTION_COLLECTION } from '@app/controllers/database-constants';
import { DatabaseController } from '@app/controllers/database-controller/database.controler';
import { DatabaseService } from '@app/services/database-service/database.service';
import { IDFilter } from '@app/services/database-service/options/options';
import { ChoicesObj, QuestionObj, QuizObj } from '@common/message';
import { Router } from 'express';
import { Service } from 'typedi';

interface VisibleFilter extends IDFilter {
    visible?: {
        $eq: boolean;
    };
}

@Service()
export class ClientController {
    router: Router;
    readonly databaseController: DatabaseController;
    private quizData: QuizObj;
    private questions: QuestionObj;
    constructor(private readonly databaseService: DatabaseService) {
        const filter: VisibleFilter = {
            visible: {
                $eq: true,
            },
        };
        this.databaseController = new DatabaseController(databaseService, filter);
        this.configureRouter();
    }
    configureRouter() {
        this.router = Router();
        this.router.use('/', this.databaseController.router);

        this.router.get('/game/quiz', async (req, res) => {
            const jsonObj = { title: '', body: JSON.stringify(this.quizData) };
            res.json(jsonObj);
        });
        this.router.post('/game/quiz', async (req, res) => {
            this.quizData = req.body.body;
            res.send('Questions data stored successfully');
        });
        this.router.get('/game/quiz/questions', async (req, res) => {
            const jsonObj = { title: '', body: JSON.stringify(this.questions) };
            res.json(jsonObj);
        });
        this.router.post('/game/quiz/questions', async (req, res) => {
            this.questions = req.body.body;
            res.send('Questions data stored successfully');
        });
        this.router.post('/game/validate', async (req, res) => {
            try {
                const { questionId, selectedAnswers } = JSON.parse(req.body.body);
                let hasGoodAnswer = false;
                const question = await this.databaseService.getObjectByID(QUESTION_COLLECTION, questionId);
                const questionObj = JSON.parse(question);
                const correctAnswers = questionObj.choices.filter((choice: ChoicesObj) => choice.isCorrect === true);
                const selectedGoodAnswers = selectedAnswers.filter((choice: ChoicesObj) => choice.isCorrect === true);

                const wrongAnswer = selectedAnswers.filter((choice: ChoicesObj) => choice.isCorrect === false);

                if (wrongAnswer.length === 0 && correctAnswers.length === selectedGoodAnswers.length) {
                    hasGoodAnswer = true;
                }

                res.json({ hasGoodAnswer, correctAnswers });
            } catch (error) {
                // Intentionally empty catch block
            }
        });
    }
}
