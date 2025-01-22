import { QuizObjects } from '@app/classes/database-types/quiz-objects/quiz-objects';
import { QUESTION_BANK_COLLECTION, QUESTION_COLLECTION, QUIZ_COLLECTION } from '@app/controllers/database-constants';
import { DatabaseService } from '@app/services/database-service/database.service';
import { ALLOWED_KEYS_FOR_QUIZ } from '@app/services/database-service/options/options';
import { expect } from 'chai';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { SinonStub, stub } from 'sinon';
import { QuizController } from './quiz-controller';

describe('QuizController', () => {
    let controller: QuizController;
    let router: Router;
    let databaseServiceStub: SinonStub;
    let postObjectStub: SinonStub;
    let patchObjectStub: SinonStub;
    let getCollectionStub: SinonStub;
    let deleteObjectStub: SinonStub;

    beforeEach(() => {
        const databaseService = new DatabaseService();
        databaseServiceStub = stub(databaseService, 'getObjectByID');
        getCollectionStub = stub(databaseService, 'getCollection');
        postObjectStub = stub(databaseService, 'insertOneObject');
        patchObjectStub = stub(databaseService, 'updateObject');
        deleteObjectStub = stub(databaseService, 'deleteObject');
        controller = new QuizController(databaseService);
        router = controller.router;
    });

    afterEach(() => {
        // databaseServiceStub.restore();
    });

    it('should return 400 Bad Request if request body is missing', async () => {
        // Simulate a request with missing body
        const req = { body: {} };
        const res = { status: stub().returnsThis(), send: stub() };

        // Call the route handler directly
        await router.stack[0].route.stack[0].handle(req, res);

        // Verify that the response is 400 Bad Request

        expect(res.status.calledWith(StatusCodes.BAD_REQUEST)).to.equal(true);
        expect(res.send.calledOnce).to.equal(true);
    });

    it('should return 400 Bad Request if request body is incomplete', async () => {
        // Simulate a request with incomplete body
        const req = { body: { body: { title: 'Quiz Title', description: 'Quiz Description' } } };
        const res = { status: stub().returnsThis(), send: stub() };

        // Call the route handler directly
        await router.stack[0].route.stack[0].handle(req, res);

        // Verify that the response is 400 Bad Request
        expect(res.status.calledWith(StatusCodes.BAD_REQUEST)).to.equal(true);
        expect(res.send.calledOnce).to.equal(true);
    });

    it('should return 201 Created if request body is valid', async () => {
        // Simulate a request with valid body
        const req = {
            body: {
                body: {
                    title: 'Quiz Title',
                    description: 'Quiz Description',
                    duration: 10,
                    questions: ['questionId1', 'questionId2'],
                },
            },
        };
        const res = { status: stub().returnsThis(), send: stub() };
        const quiz = new QuizObjects('test', 'obj.description', ['q1', '12']);
        postObjectStub.resolves(quiz);

        // Call the route handler directly
        await router.stack[0].route.stack[0].handle(req, res);

        // Verify that the response is 201 Created
        expect(res.status.calledWith(StatusCodes.CREATED)).to.equal(true);
        expect(res.send.calledOnce).to.equal(true);
    });

    // PATCH
    it('should return 400 Bad Request if request body or id is missing', async () => {
        // Simulate a request with missing body and id
        const req = { body: {}, params: {} };
        const res = { status: stub().returnsThis(), send: stub() };

        // Call the route handler directly
        await router.stack[1].route.stack[0].handle(req, res);

        // Verify that the response is 400 Bad Request
        expect(res.status.calledWith(StatusCodes.BAD_REQUEST)).to.equal(true);
        expect(res.send.calledOnce).to.equal(true);
    });

    it('should return 400 Bad Request if quiz with the given id does not exist', async () => {
        // Simulate a request with a nonexistent id
        const req = {
            body: { body: { params: { id: '999' } } },
            params: { id: '999' }, // Add params here
        };
        const res = { status: stub().returnsThis(), send: stub() };

        // Call the route handler directly
        databaseServiceStub.withArgs(QUIZ_COLLECTION, req.params.id).resolves('');

        await router.stack[1].route.stack[0].handle(req, res);
        // Verify that the response is 400 Bad Request
        expect(res.status.calledWith(StatusCodes.BAD_REQUEST)).to.equal(true);
    });
    it('should return 200 OK if quiz with the given id does exist', async () => {
        // Simulate a request with a nonexistent id
        const req = {
            body: { body: { params: { id: '999' } } },
            params: { id: '999' }, // Add params here
        };
        const res = { status: stub().returnsThis(), send: stub() };

        // Call the route handler directly
        // Stub the behavior of databaseServiceStub
        patchObjectStub.resolves();

        await router.stack[1].route.stack[0].handle(req, res);
        // Verify that the response is 400 Bad Request
        expect(res.status.calledWith(StatusCodes.OK)).to.equal(true);
        expect(res.send.calledOnce).to.equal(true);
    });

    it('switch case should work for all keys and should return 424 if there is not the same number of questions in the collection', async () => {
        // Simulate a request with a nonexistent id
        const req = {
            body: {
                body: {
                    visible: true,
                    duration: 10,
                    questions: ['q1', 'q2'],
                    intru: 'sdfd',
                    params: { id: '999' },
                },
            },
            params: { id: '999' }, // Add params here
        };

        const res = { status: stub().returnsThis(), send: stub() };
        getCollectionStub.withArgs(QUESTION_COLLECTION).resolves(['q1', 'q2', 'q3']);

        // Call the route handler
        await router.stack[1].route.stack[0].handle(req, res);

        // Your existing assertions
        expect(typeof req.body.body.visible).to.equal('boolean');
        expect(typeof req.body.body.duration).to.equal('number');

        expect(Array.isArray(req.body.body.questions)).to.equal(true);
        expect(req.body.body.questions.length).to.be.greaterThan(1);
        expect(req.body.body.questions.every((item: unknown) => typeof item === 'string')).to.equal(true);

        expect(res.status.calledWith(StatusCodes.FAILED_DEPENDENCY)).to.equal(true);
    });
    it('switch case should work even when default is a number', async () => {
        // Simulate a request with a nonexistent id
        const req = {
            body: {
                body: {
                    questions: ['q1', 'q2'],

                    description: 5,
                },
            },
            params: { id: '999' }, // Add params here
        };
        let shouldChange: boolean;

        ALLOWED_KEYS_FOR_QUIZ.forEach(async (key) => {
            switch (key) {
                default:
                    if (typeof req.body.body[key as keyof typeof req.body.body] === 'string') {
                        shouldChange = true;
                    } else {
                        shouldChange = false;
                    }
            }
        });
        const res = { status: stub().returnsThis(), send: stub() };
        getCollectionStub.withArgs(QUESTION_COLLECTION).resolves(['q1', 'q2']);

        // Call the route handler
        await router.stack[1].route.stack[0].handle(req, res);

        // Your existing assertions

        expect(shouldChange).to.equal(false);
    });

    /// //////////////delete
    it('should return 400 Bad Request if id is missing', async () => {
        const req = { params: {} };
        const res = { status: stub().returnsThis(), send: stub() };

        await router.stack[2].route.stack[0].handle(req, res);

        expect(res.status.calledWith(StatusCodes.BAD_REQUEST)).to.equal(true);
        expect(res.send.calledOnce).to.equal(true);
    });

    it('should return 204 No Content if quiz with the given id does not exist', async () => {
        const req = { params: { id: 'nonexistentId' } };
        const res = { status: stub().returnsThis(), send: stub() };

        databaseServiceStub.withArgs(QUIZ_COLLECTION, req.params.id).resolves('');

        await router.stack[2].route.stack[0].handle(req, res);

        expect(res.status.calledWith(StatusCodes.NO_CONTENT)).to.equal(true);
        expect(res.send.calledOnce).to.equal(true);
    });
    it('should delete quiz and associated questions if they are not referred in question bank collection', async () => {
        // Mock data and setup

        const req = {
            params: { id: 'quizId' },
        };
        const res = { status: stub().returnsThis(), send: stub() };

        // Mock databaseService.getCollection to return questions referred in question bank
        const quizObject = {
            title: 'test',
            description: 'obj.description',
            questions: ['q1', 'q2'],
            id: '695e95e0-5b74-4b46-abdb-9716d0128e8a',
            visible: true,
            duration: 0,
            lastModification: '2024-02-12T07:34:34.797Z',
        };
        databaseServiceStub.withArgs(QUIZ_COLLECTION, req.params.id).resolves(JSON.stringify(quizObject));
        const questionsReferredInQB = [{ question: 'q4' }, { question: 'q5' }]; // Mocked response
        getCollectionStub.withArgs(QUESTION_BANK_COLLECTION).resolves(questionsReferredInQB);

        deleteObjectStub.withArgs(QUIZ_COLLECTION, req.params.id, {});

        await router.stack[2].route.stack[0].handle(req, res);
        expect(deleteObjectStub.calledWith(QUESTION_COLLECTION, 'q1', {})).to.equal(true);
        expect(deleteObjectStub.calledWith(QUESTION_COLLECTION, 'q2', {})).to.equal(true);

        expect(res.status.calledWith(StatusCodes.ACCEPTED)).to.equal(true);
        expect(res.send.calledOnce).to.equal(true);
    });
});
