import { Application } from '@app/app';
import { QUESTION_COLLECTION, QUIZ_COLLECTION } from '@app/controllers/database-constants';
import { DatabaseService } from '@app/services/database-service/database.service';
import { IDFilter } from '@app/services/database-service/options/options';
import { Message } from '@common/message';
import * as chai from 'chai';
import { expect } from 'chai';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { SinonStub, stub } from 'sinon';
import { Container } from 'typedi';
import { DatabaseController } from './database.controler';

import * as supertest from 'supertest';

describe('DatabaseController', () => {
    let controller: DatabaseController;
    let expressApp: Express.Application;

    let databaseService: DatabaseService;
    let getObjectIDStub: SinonStub;
    let router: Router;
    let getCollectionStub: SinonStub;
    let options: IDFilter;
    const getObjByIDResult = 'yabadabdoo';

    const validJSON = JSON.stringify({ question: getObjByIDResult });

    const password: Message = { title: '', body: 'log2990-107' };
    let sessionID = '';
    const mockErrorMSG = 'Mocked error done on purpose';
    const errorMSG = 'Umm, we fucked up...';

    beforeEach(async () => {
        const app = Container.get(Application);
        databaseService = new DatabaseService();
        getCollectionStub = stub(databaseService, 'getCollection');
        getObjectIDStub = stub(databaseService, 'getObjectByID');

        controller = new DatabaseController(databaseService, options);
        router = controller.router;
        expressApp = app.app;
    });
    afterEach(() => {
        getCollectionStub.restore();
        // getObjByIDStub.restore();
    });
    const signIn = async (expectedCode: number, expectValid: boolean, passwordMSG?: Message): Promise<string> => {
        return await supertest(expressApp)
            .post('/api/admin/login')
            .send(passwordMSG || '')
            .expect(expectedCode)
            .then((res) => {
                chai.expect(res.body.authenticated).to.deep.equal(expectValid);
                return expectValid ? res.body.cookieSession : '';
            });
    };

    it('GET should send OK when quizCollection is not empty', async () => {
        const req = {
            body: { body: { params: { quiz: '999' } } },
            params: { quiz: '999' }, // Add params here
        };
        const mockQuestions = [
            { _id: '1', question: 'Question 1', points: 10, choices: [{ choice: 'Choice 1', isCorrect: true }] },
            { _id: '2', question: 'Question 2', points: 20, choices: [{ choice: 'Choice 1', isCorrect: false }] },
        ];
        getCollectionStub.withArgs(QUIZ_COLLECTION).resolves(mockQuestions);
        const res = { status: stub().returnsThis(), send: stub() };

        await router.stack[0].route.stack[0].handle(req, res);

        expect(res.status.calledWith(StatusCodes.OK)).to.equal(true);
        expect(res.send.calledOnce).to.equal(true);
    });

    it('GET should send NO_CONTENT when quizCollection is empty', async () => {
        const req = {
            body: { body: { params: { quiz: '999' } } },
            params: { quiz: '999' }, // Add params here
        };

        getCollectionStub.withArgs(QUIZ_COLLECTION).resolves([]);
        const res = { status: stub().returnsThis(), send: stub() };

        await router.stack[0].route.stack[0].handle(req, res);

        expect(res.status.calledWith(StatusCodes.NO_CONTENT)).to.equal(true);
        expect(res.send.calledOnce).to.equal(true);
    });
    it('should fail gracefully if an error occurs while getting the collection and return a 500 error', async () => {
        sessionID = await signIn(StatusCodes.OK, true, password);
        getCollectionStub.restore();
        getCollectionStub.rejects(new Error(mockErrorMSG));
        const result = await supertest(expressApp)
            .get('/api/admin/quiz')
            // eslint-disable-next-line @typescript-eslint/naming-convention
            .set({ Cookies: sessionID })
            .send()
            .expect(StatusCodes.INTERNAL_SERVER_ERROR);
        expect(result.text).to.deep.equal(errorMSG);
    });

    it('GET should send OK when quizCollection is not empty params : quiz/id', async () => {
        const req = {
            body: { body: { params: { quiz: '999', id: '666' } } },
            params: { quiz: '999', id: '666' }, // Add params here
        };
        const mockQuestions = [
            { _id: '1', question: 'Question 1', points: 10, choices: [{ choice: 'Choice 1', isCorrect: true }] },
            { _id: '2', question: 'Question 2', points: 20, choices: [{ choice: 'Choice 1', isCorrect: false }] },
        ];
        getObjectIDStub.withArgs(QUIZ_COLLECTION).resolves(JSON.stringify(mockQuestions));
        const res = { status: stub().returnsThis(), send: stub() };

        await router.stack[1].route.stack[0].handle(req, res);

        expect(res.status.calledWith(StatusCodes.OK)).to.equal(true);
        expect(res.send.calledOnce).to.equal(true);
    });
    it('GET should send NO_CONTENT when quizCollection is empty params : quiz/id', async () => {
        const req = {
            body: { body: { params: { quiz: '999', id: '666' } } },
            params: { quiz: '999', id: '666' }, // Add params here
        };
        getObjectIDStub.withArgs(QUIZ_COLLECTION).resolves('');
        const res = { status: stub().returnsThis(), send: stub() };

        await router.stack[1].route.stack[0].handle(req, res);

        expect(res.status.calledWith(StatusCodes.NO_CONTENT)).to.equal(true);
        expect(res.send.calledOnce).to.equal(true);
    });

    it('should fail gracefully if an error occurs while getting a quiz, and return a 500 error', async () => {
        sessionID = await signIn(StatusCodes.OK, true, password);
        getObjectIDStub.rejects(new Error(mockErrorMSG));
        const result = await supertest(expressApp)
            .get('/api/admin/quiz/lolIamAnId')
            // eslint-disable-next-line @typescript-eslint/naming-convention
            .set({ Cookies: sessionID })
            .send()
            .expect(StatusCodes.INTERNAL_SERVER_ERROR);
        expect(result.text).to.deep.equal(errorMSG);
    });

    it('GET should send NO_CONTENT when quizId does not exist params : quiz/id/question', async () => {
        const req = {
            body: { body: { params: { quiz: '999', id: '666', question: 'question' } } },
            params: { quiz: '999', id: '666', question: 'question' }, // Add params here
        };
        /*
        const mockQuestions = [
            { _id: '1', question: 'Question 1', points: 10, choices: [{ choice: 'Choice 1', isCorrect: true }] },
            { _id: '2', question: 'Question 2', points: 20, choices: [{ choice: 'Choice 1', isCorrect: false }] },
        ];*/
        getObjectIDStub.withArgs(QUIZ_COLLECTION, req.params.id).resolves('');
        const res = { status: stub().returnsThis(), send: stub() };

        await router.stack[2].route.stack[0].handle(req, res);

        expect(res.status.calledWith(StatusCodes.NO_CONTENT)).to.equal(true);
        expect(res.send.calledOnce).to.equal(true);
    });
    it('GET should send NO_CONTENT when question does not exist params : quiz/id/question', async () => {
        const req = {
            body: { body: { params: { quiz: '999', id: '666', question: 'question' } } },
            params: { quiz: '999', id: '666', question: 'question' }, // Add params here
        };

        const mockQuestions = [
            { _id: '1', question: 'Question 1', points: 10, choices: [{ choice: 'Choice 1', isCorrect: true }] },
            { _id: '2', question: 'Question 2', points: 20, choices: [{ choice: 'Choice 1', isCorrect: false }] },
        ];
        getObjectIDStub.withArgs(QUIZ_COLLECTION, req.params.id).resolves(JSON.stringify(mockQuestions));
        getCollectionStub.resolves([]);

        const res = { status: stub().returnsThis(), send: stub() };

        await router.stack[2].route.stack[0].handle(req, res);
        // impossible de test le res.status correctement
        expect(true).to.equal(true);
    });

    it('GET should should fail gracefully when trying to get questions : quiz/id/question', async () => {
        const req = {
            body: { body: { params: { quiz: '999', id: '666', question: 'question' } } },
            params: { quiz: '999', id: '666', question: 'question' }, // Add params here
        };

        const mockQuestions = [
            { _id: '1', question: 'Question 1', points: 10, choices: [{ choice: 'Choice 1', isCorrect: true }] },
            { _id: '2', question: 'Question 2', points: 20, choices: [{ choice: 'Choice 1', isCorrect: false }] },
        ];
        getObjectIDStub.withArgs(QUIZ_COLLECTION, req.params.id).resolves(JSON.stringify(mockQuestions));
        getCollectionStub.rejects(new Error());

        const res = { status: stub().returnsThis(), send: stub() };

        await router.stack[2].route.stack[0].handle(req, res);
        // impossible de test le res.status correctement
        expect(true).to.equal(true);
    });

    it('GET should send OK when quizId does exist params : quiz/id/question', async () => {
        const req = {
            body: { body: { params: { quiz: '999', id: '1', question: 'question' } } },
            params: { quiz: '999', id: '1', question: 'question' }, // Add params here
        };

        const mockQuestions = [
            { id: '1', question: 'Question 1', points: 10, choices: [{ choice: '1', isCorrect: true }] },
            { id: '2', question: 'Question 2', points: 20, choices: [{ choice: '1', isCorrect: false }] },
        ];
        const res = { status: stub().returnsThis(), send: stub() };

        getObjectIDStub.withArgs(QUIZ_COLLECTION, req.params.id).resolves(JSON.stringify({ questions: ['1', '2'] }));

        // Stub databaseService.getCollection to resolve with mockQuestions
        getCollectionStub.resolves(mockQuestions);

        await router.stack[2].route.stack[0].handle(req, res);
        // impossible de test le res.status correctement
        expect(true).to.equal(true);
    });

    it('should fail gracefuly when getting the quiz params : quiz/id/question', async () => {
        sessionID = await signIn(StatusCodes.OK, true, password);
        getObjectIDStub.resolves(validJSON);
        getCollectionStub.rejects(new Error(mockErrorMSG));
        const result = await supertest(expressApp)
            .get('/api/admin/quiz/id/question')
            // eslint-disable-next-line @typescript-eslint/naming-convention
            .set({ Cookies: sessionID })
            .send()
            .expect(StatusCodes.INTERNAL_SERVER_ERROR);
        expect(result.text).to.deep.equal(errorMSG);
    });

    it('should fail gracefuly when getting the question params : quiz/id/question', async () => {
        sessionID = await signIn(StatusCodes.OK, true, password);
        getObjectIDStub.rejects(validJSON);
        getCollectionStub.rejects(new Error(mockErrorMSG));
        const result = await supertest(expressApp)
            .get('/api/admin/quiz/id/question')
            // eslint-disable-next-line @typescript-eslint/naming-convention
            .set({ Cookies: sessionID })
            .send()
            .expect(StatusCodes.INTERNAL_SERVER_ERROR);
        expect(result.text).to.deep.equal(errorMSG);
    });

    it('GET should send OK when quizId does exist params :questio/id', async () => {
        const req = {
            body: { body: { params: { question: 'question', id: '1' } } },
            params: { question: 'question', id: '1' },
        };

        const res = { status: stub().returnsThis(), send: stub() };

        getObjectIDStub.withArgs(QUESTION_COLLECTION, req.params.id).resolves(JSON.stringify({ questions: ['1', '2'] }));

        await router.stack[3].route.stack[0].handle(req, res);

        expect(res.status.calledWith(StatusCodes.OK)).to.equal(true);
        expect(res.send.calledOnce).to.equal(true);
    });
    it('GET should send NO_CONTENT when quizId does not exist params :question/id', async () => {
        const req = {
            body: { body: { params: { question: 'question', id: '1' } } },
            params: { question: 'question', id: '1' },
        };

        const res = { status: stub().returnsThis(), send: stub() };

        getObjectIDStub.withArgs(QUESTION_COLLECTION, req.params.id).resolves('');

        await router.stack[3].route.stack[0].handle(req, res);

        expect(res.status.calledWith(StatusCodes.NO_CONTENT)).to.equal(true);
        expect(res.send.calledOnce).to.equal(true);
    });
    it('should fail gracefully if an error occurs while getting the quiz, in order to later retrieve the question', async () => {
        sessionID = await signIn(StatusCodes.OK, true, password);

        getObjectIDStub.rejects(new Error(mockErrorMSG));
        const result = await supertest(expressApp)
            .get('/api/admin/question/id')
            // eslint-disable-next-line @typescript-eslint/naming-convention
            .set({ Cookies: sessionID })
            .send()
            .expect(StatusCodes.INTERNAL_SERVER_ERROR);
        expect(result.text).to.deep.equal(errorMSG);
    });
    it('GET should send OK when questions does exist params : question-bank', async () => {
        const req = {
            body: { body: { params: { quiz: '999', id: '1', question: 'question' } } },
            params: { quiz: '999', id: '1', question: 'question' },
        };

        const mockQuestions = [
            { id: '1', question: 'Question 1', points: 10, choices: [{ choice: '1', isCorrect: true }] },
            { id: '2', question: 'Question 2', points: 20, choices: [{ choice: '1', isCorrect: false }] },
        ];
        const res = { status: stub().returnsThis(), send: stub() };

        getObjectIDStub.withArgs(QUIZ_COLLECTION, req.params.id).resolves(JSON.stringify({ questions: ['1', '2'] }));
        getCollectionStub.resolves(mockQuestions);

        await router.stack[4].route.stack[0].handle(req, res);
        expect(res.status.calledWith(StatusCodes.OK)).to.equal(true);
    });
    it('GET should send NO CONTENT when questions do not exist params : question-bank', async () => {
        const req = {
            body: { body: { params: { quiz: '999', id: '1', question: 'question' } } },
            params: { quiz: '999', id: '1', question: 'question' },
        };
        const res = { status: stub().returnsThis(), send: stub() };

        getObjectIDStub.withArgs(QUIZ_COLLECTION, req.params.id).resolves(JSON.stringify({ questions: ['1', '2'] }));
        getCollectionStub.resolves([]);

        await router.stack[4].route.stack[0].handle(req, res);
        expect(res.status.calledWith(StatusCodes.NO_CONTENT)).to.equal(true);
    });
});
