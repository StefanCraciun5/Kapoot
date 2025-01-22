import { ClientController } from '@app/controllers/client-controller/client-controller';
import { QUESTION_COLLECTION } from '@app/controllers/database-constants';
import { DatabaseService } from '@app/services/database-service/database.service';
import { expect } from 'chai';
import { Router } from 'express';
import * as sinon from 'sinon';
import { SinonStub, stub } from 'sinon';

describe('ClientController', () => {
    let controller: ClientController;
    let databaseService: DatabaseService;
    let router: Router;
    let getObjectIDStub: SinonStub;
    const mockQuestions = [
        { id: '1', question: '1', points: 10, choices: [{ choice: '1', isCorrect: true }] },
        { id: '2', question: '2', points: 20, choices: [{ choice: '1', isCorrect: false }] },
    ];

    beforeEach(() => {
        databaseService = new DatabaseService();
        getObjectIDStub = stub(databaseService, 'getObjectByID');

        controller = new ClientController(databaseService);
        router = controller.router;
    });
    afterEach(() => {
        sinon.restore();
    });

    describe('GET /game/quiz', () => {
        it('GET should work correctly working', async () => {
            const req = {
                params: { game: '999', quiz: 'quiz' },
                // Add params here
            };
            const res = { json: sinon.stub(), status: stub().returnsThis(), send: stub() };

            await router.stack[1].route.stack[0].handle(req, res);
            expect(res.json.calledOnce).to.equal(true);
        });
    });
    it('POST should work correctly working params: game/quiz', async () => {
        const req = {
            body: { params: { game: '999', quiz: 'quiz' } },
            // Add params here
        };
        const res = { json: sinon.stub(), status: stub().returnsThis(), send: stub() };

        await router.stack[2].route.stack[0].handle(req, res);
        expect(res.send.calledOnce).to.equal(true);
    });

    it('GET should work correctly params: game/quiz/questions', async () => {
        const req = {
            body: { params: { game: '999', quiz: 'quiz', question: '12' } },
            // Add params here
        };
        const res = { json: sinon.stub(), status: stub().returnsThis(), send: stub() };

        await router.stack[3].route.stack[0].handle(req, res);
        expect(res.json.calledOnce).to.equal(true);
    });
    it('POST should work correctly params: game/quiz/questions', async () => {
        const req = {
            body: { params: { game: '999', quiz: 'quiz', question: '12' } },
            // Add params here
        };
        const res = { json: sinon.stub(), status: stub().returnsThis(), send: stub() };

        await router.stack[4].route.stack[0].handle(req, res);
        expect(res.send.calledOnce).to.equal(true);
    });
    it('should send correct response for valid request', async () => {
        const requestBody = JSON.stringify({
            questionId: '1',
            selectedAnswers: [{ choice: '1', isCorrect: true }],
        });
        const req = {
            body: {
                body: requestBody,
            },
        };
        JSON.parse(req.body.body);
        const res = {
            json: sinon.stub(),
            status: sinon.stub().returnsThis(),
        };
        getObjectIDStub.withArgs(QUESTION_COLLECTION).resolves(JSON.stringify(mockQuestions[0]));

        await router.stack[5].route.stack[0].handle(req, res);

        expect(res.json.called).to.equal(true);
        expect(res.json.calledWith({ hasGoodAnswer: true, correctAnswers: [{ choice: '1', isCorrect: true }] })).to.equal(true);
    });
    it('should send correct response for valid request for all cases ', async () => {
        const requestBody = JSON.stringify({
            questionId: '2',
            selectedAnswers: [{ choice: '1', isCorrect: false }],
        });
        const req = {
            body: {
                body: requestBody,
            },
        };
        JSON.parse(req.body.body);
        const res = {
            json: sinon.stub(),
            status: sinon.stub().returnsThis(),
        };
        getObjectIDStub.withArgs(QUESTION_COLLECTION).resolves(JSON.stringify(mockQuestions[1]));

        await router.stack[5].route.stack[0].handle(req, res);

        expect(res.json.called).to.equal(true);
        expect(res.json.calledWith({ hasGoodAnswer: true })).to.equal(false);
    });
    it('should fail gracefully ', async () => {
        const requestBody = JSON.stringify({
            questionId: '2',
        });
        const req = {
            body: {
                body: requestBody,
            },
        };
        JSON.parse(req.body.body);
        const res = {
            json: sinon.stub(),
            status: sinon.stub().returnsThis(),
        };
        getObjectIDStub.withArgs(QUESTION_COLLECTION).rejects(new Error());

        await router.stack[5].route.stack[0].handle(req, res);

        expect(res.json.called).to.equal(false);
    });
});
