import { DatabaseService } from '@app/services/database-service/database.service';
import { expect } from 'chai';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as sinon from 'sinon';
import { SinonStub, stub } from 'sinon';
import { QuestionBankController } from './question-bank-controller';

describe('QuestionBankController', () => {
    let controller: QuestionBankController;
    let router: Router;
    let databaseServiceStub: sinon.SinonStub;

    let deleteObjectStub: SinonStub;
    let postObjectStub: SinonStub;

    const objects = [
        { name: 'obj1', id: '1' },
        { name: 'obj2', id: '2' },
    ];

    beforeEach(async () => {
        const databaseService = new DatabaseService();

        // Stub the behavior of databaseService.getCollection() to return the mock database
        databaseServiceStub = stub(databaseService, 'getCollection');
        databaseServiceStub.returns(objects);

        // Stub the behavior of databaseService.deleteObject() and store it in deleteObjectStub
        deleteObjectStub = stub(databaseService, 'deleteObject');
        postObjectStub = stub(databaseService, 'insertOneObject');

        // Create the controller instance
        controller = new QuestionBankController(databaseService);

        // Get the router from the controller
        router = controller.router;
    });

    afterEach(() => {
        databaseServiceStub.restore();
    });
    it('should return 400 Bad Request if questionID is missing', async () => {
        // Mock request and response objects
        const req = { params: {} };
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
    it('should return 204 No Content when question list is empty', async () => {
        // Stub the behavior of databaseService.getCollection() to return an empty array
        databaseServiceStub.returns([]);

        // Mock request and response objects
        const req = { params: { id: '1' } }; // Include params with a questionID property
        const res = {
            status: sinon.stub().returnsThis(),
            send: sinon.stub(),
        };

        // Call the route handler directly
        await controller.router.stack[0].route.stack[0].handle(req, res);

        // Assert that status 204 No Content is returned
        expect(res.status.calledOnceWith(StatusCodes.NO_CONTENT)).to.equal(true);
        // Assert that send method is called
        // expect(res.send.calledOnce).to.equal(true);
    });

    it('should return 202 Accepted after successful deletion', async () => {
        // Mock the behavior of databaseService.deleteObject() to resolve

        // Mock request and response objects
        const req = { params: { id: '1' } };
        const res = {
            status: stub().returnsThis(),
            send: stub(),
        };

        await controller.router.stack[0].route.stack[0].handle(req, res);
        deleteObjectStub.resolves();

        expect(res.status.calledOnceWith(StatusCodes.ACCEPTED)).to.equal(true);
        expect(res.send.calledOnce).to.equal(true);
    });
    it('should return 200 OK with questions if they exist', async () => {
        // Mock the behavior of databaseService.getCollection() to return some questions
        const questions = [
            { id: '1', question: 'Question 1' },
            { id: '2', question: 'Question 2' },
        ];
        databaseServiceStub.resolves(questions);

        // Mock request and response objects
        const req = {};
        const res = {
            status: stub().returnsThis(), // Stub the status function
            send: stub(), // Stub the send function
        };

        // Call the route handler directly
        await controller.router.stack[1].route.stack[0].handle(req, res);

        // Assert that status 200 OK is returned
        expect(res.status.calledOnceWith(StatusCodes.OK)).to.equal(true);

        // Assert that send method is called with the correct arguments
        expect(res.send.calledOnceWith({ title: '', body: JSON.stringify(questions) })).to.equal(true);
    });
    it('should return 204 No Content if no questions exist', async () => {
        // Mock the behavior of databaseService.getCollection() to return an empty array
        databaseServiceStub.resolves([]);

        // Mock request and response objects
        const req = {};
        const res = {
            status: stub().returnsThis(), // Stub the status function
            send: stub(), // Stub the send function
        };

        // Call the route handler directly
        await controller.router.stack[1].route.stack[0].handle(req, res);

        // Assert that status 204 No Content is returned
        expect(res.status.calledOnceWith(StatusCodes.NO_CONTENT)).to.equal(true);
    });
    it('should return 201 Created if a valid question is provided', async () => {
        // Mock request and response objects with a valid question in the body
        const req = { body: { body: { question: 'validQuestionID' } } };
        const res = {
            status: stub().returnsThis(), // Stub the status function
            send: stub(), // Stub the send function
        };

        // Stub the behavior of getCollection method to return an existing question
        const validQuestion = [{ id: 'validQuestionID', question: 'Valid question' }];
        postObjectStub.resolves(validQuestion);

        // Call the route handler directly
        await controller.router.stack[2].route.stack[0].handle(req, res);

        // Assert that status 201 Created is returned
        expect(res.status.calledOnceWith(StatusCodes.CREATED)).to.equal(true);
    });

    it('should return 409 Conflict if the provided question does not exist', async () => {
        // Mock request and response objects with a valid question in the body
        const req = { body: { body: { question: 'nonExistingQuestionID' } } };
        const res = {
            status: stub().returnsThis(), // Stub the status function
            send: stub(), // Stub the send function
        };

        // Stub the behavior of getCollection method to return an empty collection
        databaseServiceStub.resolves([]);

        // Call the route handler directly
        await controller.router.stack[2].route.stack[0].handle(req, res);
        // Assert that status 409 Conflict is returned
        expect(res.status.calledOnceWith(StatusCodes.CONFLICT)).to.equal(true);
    });

    it('should return 400 Bad Request if no question is provided', async () => {
        // Mock request and response objects without a question in the body
        const req = { body: { body: {} } };
        const res = {
            status: stub().returnsThis(), // Stub the status function
            send: stub(), // Stub the send function
        };

        // Call the route handler directly
        await controller.router.stack[2].route.stack[0].handle(req, res);

        // Assert that status 400 Bad Request is returned
        expect(res.status.calledOnceWith(StatusCodes.BAD_REQUEST)).to.equal(true);

        // Assert that send method is called
        expect(res.send.calledOnce).to.equal(true);
    });
});
