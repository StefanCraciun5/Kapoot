import { QuestionJSON, QuestionObjects } from '@app/classes/database-types/question-objects/question-objects';
import { QUESTION_BANK_COLLECTION, QUESTION_COLLECTION, QUIZ_COLLECTION } from '@app/controllers/database-constants';
import { DatabaseService } from '@app/services/database-service/database.service';
import { QuestionQueryFilter } from '@app/services/database-service/options/options';
import { expect } from 'chai';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as sinon from 'sinon';
import { SinonStub, stub } from 'sinon';
import { QuestionsController, createPatchFilter } from './questions-controler';

describe('QuestionsController', () => {
    let controller: QuestionsController;
    let router: Router;
    let databaseServiceStub: SinonStub;
    let postObjectStub: SinonStub;
    let patchObjectStub: SinonStub;
    let getObjectIDStub: SinonStub;
    let deleteObjectStub: SinonStub;

    const mockQuestions = [
        { id: 'q1', question: 'q1', points: 10, choices: [{ choice: 'Choice 1', isCorrect: true }] },
        { id: 'q1', question: 'q2', points: 20, choices: [{ choice: 'Choice 1', isCorrect: false }] },
    ];
    const quizObject = {
        title: 'test',
        description: 'obj.description',
        questions: ['q1', 'q2'],
        id: '695e95e0-5b74-4b46-abdb-9716d0128e8a',
        visible: true,
        duration: 0,
        lastModification: '2024-02-12T07:34:34.797Z',
    };

    beforeEach(async () => {
        const databaseService = new DatabaseService();

        // Stub the behavior of databaseService.getCollection() to return the mock database
        databaseServiceStub = stub(databaseService, 'getCollection');
        postObjectStub = stub(databaseService, 'insertOneObject');
        patchObjectStub = stub(databaseService, 'updateObject');
        getObjectIDStub = stub(databaseService, 'getObjectByID');
        deleteObjectStub = stub(databaseService, 'deleteObject');

        // Mock database containing some predefined questions
        databaseServiceStub.withArgs(QUESTION_COLLECTION).resolves(mockQuestions);

        controller = new QuestionsController(databaseService);
        router = controller.router;
    });

    afterEach(() => {
        sinon.restore();
    });
    it('should update quiz with new question ID if it matches an ID parsed from an object', async () => {
        const req = { body: { body: { question: 'q1' } }, params: { quizID: 'bank', questionID: 'existingID' } };
        const res = { status: stub().returnsThis(), send: stub() };
        const quizQuestions = quizObject.questions;
        const request: QuestionQueryFilter = {
            $set: { ...req.body.body },
        };
        const reqOBJ = createPatchFilter(request);
        reqOBJ.$set.lastModified = new Date();
        const questionJson: QuestionJSON = {
            type: 'MCQ',
            question: reqOBJ.$set.question || mockQuestions[0].question,
            points: mockQuestions[0].points,
            choices: mockQuestions[0].choices,
            id: 'q1',
        };

        const newQuestion = new QuestionObjects(questionJson);

        reqOBJ.$set.lastModified = new Date();
        getObjectIDStub.withArgs(QUESTION_COLLECTION, req.params.questionID).resolves(JSON.stringify(mockQuestions[0]));
        databaseServiceStub.resolves(mockQuestions);
        postObjectStub.withArgs(QUESTION_COLLECTION).resolves();
        getObjectIDStub.withArgs(QUIZ_COLLECTION, req.params.quizID).resolves(JSON.stringify(quizObject));

        const newQuestions: string[] = [];

        for (const question of quizQuestions) {
            if (question === JSON.parse(JSON.stringify(mockQuestions[0])).id) {
                newQuestions.push(newQuestion.getID());
            } else {
                newQuestions.push(question);
            }
        }
        await controller.router.stack[1].route.stack[0].handle(req, res);
        expect(newQuestion.question).to.equal(mockQuestions[0].question);
        expect(newQuestions.push(newQuestion.getID())).to.equal(3);
    });
    it('should update question if present in question bank and question Bank is not empty', async () => {
        const req = { body: { body: { question: 'new question' } }, params: { quizID: 'question-bank', questionID: 'existingID' } };
        const res = { status: stub().returnsThis(), send: stub() };

        getObjectIDStub.withArgs(QUESTION_COLLECTION, req.params.questionID).resolves(JSON.stringify(mockQuestions[0]));
        databaseServiceStub.resolves(mockQuestions);
        getObjectIDStub.withArgs(QUIZ_COLLECTION, req.params.quizID).resolves(JSON.stringify(quizObject));
        databaseServiceStub.withArgs(QUESTION_BANK_COLLECTION).resolves(mockQuestions);

        postObjectStub.withArgs().resolves();
        deleteObjectStub.withArgs().resolves();
        postObjectStub.withArgs().resolves();

        await controller.router.stack[1].route.stack[0].handle(req, res);
        expect(postObjectStub.calledWith()).to.equal(true);
        expect(deleteObjectStub.calledWith()).to.equal(true);
        expect(postObjectStub.calledWith()).to.equal(true);
        expect(res.status.calledWith(StatusCodes.OK)).to.equal(true);
        expect(res.send.calledOnce).to.equal(true);
    });
    it('should not update question if question bank is empty', async () => {
        const req = { body: { body: { question: 'new question' } }, params: { quizID: 'question-bank', questionID: 'existingID' } };
        const res = { status: stub().returnsThis(), send: stub() };

        getObjectIDStub.withArgs(QUESTION_COLLECTION, req.params.questionID).resolves(JSON.stringify(mockQuestions[0]));
        databaseServiceStub.resolves(mockQuestions);
        getObjectIDStub.withArgs(QUIZ_COLLECTION, req.params.quizID).resolves(JSON.stringify(quizObject));
        databaseServiceStub.withArgs(QUESTION_BANK_COLLECTION).resolves([]);

        await controller.router.stack[1].route.stack[0].handle(req, res);

        expect(res.status.calledWith(StatusCodes.BAD_REQUEST)).to.equal(true);
        expect(res.send.calledOnce).to.equal(true);
    });

    it('should update quiz with new question if the QB is not empty ', async () => {
        const req = { body: { body: { question: 'new question' } }, params: { quizID: '-bank', questionID: 'existingID' } };
        const res = { status: stub().returnsThis(), send: stub() };
        getObjectIDStub.withArgs(QUESTION_COLLECTION, req.params.questionID).resolves(JSON.stringify(mockQuestions[0]));
        databaseServiceStub.resolves(mockQuestions);
        getObjectIDStub.withArgs(QUIZ_COLLECTION, req.params.quizID).resolves(JSON.stringify(quizObject));
        databaseServiceStub.withArgs(QUESTION_BANK_COLLECTION).resolves(mockQuestions);

        patchObjectStub.withArgs(QUIZ_COLLECTION).resolves();

        await controller.router.stack[1].route.stack[0].handle(req, res);

        expect(patchObjectStub.calledWith(QUIZ_COLLECTION)).to.equal(true);
        expect(res.send.calledOnce).to.equal(true);
    });

    it('should not update quiz if QB is empty ', async () => {
        const req = { body: { body: { question: 'new question' } }, params: { quizID: '-bank', questionID: 'existingID' } };
        const res = { status: stub().returnsThis(), send: stub() };
        const quizQuestions = quizObject.questions;
        const request: QuestionQueryFilter = {
            $set: { ...req.body.body },
        };

        const reqOBJ = createPatchFilter(request);
        const questionJson: QuestionJSON = {
            question: reqOBJ.$set.question || JSON.parse(JSON.stringify(mockQuestions[0].question)),
            points: reqOBJ.$set.points || JSON.parse(JSON.stringify(mockQuestions[0].question)),
            choices: reqOBJ.$set.choices || JSON.parse(JSON.stringify(mockQuestions[0].choices)),
            id: '123',
            type: 'MCQ',
        };
        const newQuestion = new QuestionObjects(questionJson);
        reqOBJ.$set.lastModified = new Date();
        getObjectIDStub.withArgs(QUESTION_COLLECTION, req.params.questionID).resolves(JSON.stringify(mockQuestions[0]));
        databaseServiceStub.resolves(mockQuestions);
        getObjectIDStub.withArgs(QUIZ_COLLECTION, req.params.quizID).resolves(JSON.stringify(quizObject));
        databaseServiceStub.withArgs(QUESTION_BANK_COLLECTION).resolves([]);
        patchObjectStub.withArgs(QUESTION_COLLECTION).resolves();
        const newQuestions: string[] = [];

        for (const question of quizQuestions) {
            if (question === JSON.parse(JSON.stringify(mockQuestions[0])).id) {
                newQuestions.push(newQuestion.getID());
            } else {
                newQuestions.push(question);
            }
        }

        await controller.router.stack[1].route.stack[0].handle(req, res);
        expect(newQuestions.push(newQuestion.getID())).to.equal(3);
        expect(patchObjectStub.calledWith(QUESTION_COLLECTION)).to.equal(true);
        expect(res.send.calledOnce).to.equal(true);
    });

    it('should return 400 Bad Request if questionID is missing', async () => {
        // Mock request and response objects
        const req = { body: { body: {} } };
        const res = {
            status: stub().returnsThis(),
            send: stub(),
        };

        // Call the route handler directly
        await router.stack[0].route.stack[0].handle(req, res);

        // Assert that status 400 Bad Request is returned

        expect(res.status.calledOnceWith(StatusCodes.BAD_REQUEST)).to.equal(true);
        expect(res.send.calledOnce).to.equal(true);
    });

    it('should return 201 Created with question ID on successful insertion', async () => {
        const req = {
            body: {
                body: {
                    type: 'MCQ',
                    question: 'Sample Question',
                    points: 10,
                    choices: [
                        { choice: 'Choice 1', isCorrect: true },
                        { choice: 'Choice 2', isCorrect: false },
                    ],
                },
            },
        };
        const obj = req.body.body;
        const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };
        const questionJson: QuestionJSON = {
            question: obj.question,
            points: obj.points,
            choices: obj.choices,
            id: '123',
            type: obj.type,
        };
        const question = new QuestionObjects(questionJson);

        postObjectStub.resolves(question);

        await router.stack[0].route.stack[0].handle(req, res);
        res.status.withArgs(StatusCodes.CREATED).returns(res);

        // Restore the stubbed method to avoid affecting other tests
    });
    it('should create a copy if question is present in question bank', async () => {
        const req = { body: { body: { quizID: 'quizID', question: 'new question' } }, params: { quizID: 'quizID', questionID: 'existingID' } };
        const res = { status: stub().returnsThis(), send: stub() };
        getObjectIDStub.withArgs(QUESTION_COLLECTION, req.params.questionID).resolves(JSON.stringify(mockQuestions[0]));
        databaseServiceStub.withArgs(QUESTION_BANK_COLLECTION).resolves(mockQuestions);
        getObjectIDStub.withArgs(QUIZ_COLLECTION, req.params.quizID).resolves(JSON.stringify(quizObject));
        patchObjectStub.withArgs(QUIZ_COLLECTION, quizObject.id).resolves();

        await controller.router.stack[1].route.stack[0].handle(req, res);

        expect(getObjectIDStub.withArgs(QUESTION_COLLECTION, req.params.questionID).called).to.equal(true);
        expect(databaseServiceStub.withArgs(QUESTION_BANK_COLLECTION).called).to.equal(true);
        expect(getObjectIDStub.withArgs(QUIZ_COLLECTION, req.params.quizID).called).to.equal(true);
        expect(patchObjectStub.withArgs(QUIZ_COLLECTION, quizObject.id).called).to.equal(true);
        expect(res.send.calledOnce).to.equal(true);
    });
    describe('DELETE /:id', () => {
        it('should return 400 Bad Request if id is missing', async () => {
            const req = { params: {} };
            const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

            await router.stack[2].route.stack[0].handle(req, res);

            expect(res.status.calledWith(StatusCodes.BAD_REQUEST)).to.equal(true);
            expect(res.send.calledOnce).to.equal(true);
        });

        it('should return 204 No Content if question with the given id does not exist', async () => {
            const req = { params: { id: 'nonexistentId' } };
            const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

            // Stub the behavior of getObjectByID to resolve with an empty string
            getObjectIDStub.withArgs(QUESTION_COLLECTION, req.params.id).resolves('');

            await router.stack[2].route.stack[0].handle(req, res);

            expect(res.status.calledWith(StatusCodes.NO_CONTENT)).to.equal(true);
            expect(res.send.calledOnce).to.equal(true);
        });

        it('should return 202 Accepted and delete the question if it exists', async () => {
            const req = { params: { id: 'existingId' } };
            const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

            // Stub the behavior of getObjectByID to resolve with a non-empty string
            getObjectIDStub.withArgs(QUESTION_COLLECTION, req.params.id).resolves('existingQuestion');

            await router.stack[2].route.stack[0].handle(req, res);

            expect(res.status.calledWith(StatusCodes.ACCEPTED)).to.equal(true);
            expect(res.send.calledOnce).to.equal(true);

            // Ensure deleteObject was called with the correct arguments
            expect(deleteObjectStub.calledWith(QUESTION_COLLECTION, req.params.id, {})).to.equal(true);
        });
    });
});
