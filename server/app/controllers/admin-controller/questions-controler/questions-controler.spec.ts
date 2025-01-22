import { QUESTION_COLLECTION } from '@app/controllers/database-constants';
import { DatabaseService } from '@app/services/database-service/database.service';
import { QuestionQueryFilter } from '@app/services/database-service/options/options';
import { expect } from 'chai';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as sinon from 'sinon';
import { SinonStub, SinonStubbedInstance, stub } from 'sinon';
import { QuestionsController, createPatchFilter } from './questions-controler';

interface Request {
    [key: string]: unknown; // Allow additional properties with any type
    $set: {
        question?: string;
        points?: number;
        choices?: { choice: string; isCorrect: boolean }[] | null; // Define the type for choices
    };
}

describe('createPatchFilter', () => {
    it('should correctly create patch filter for valid input', () => {
        const req = {
            $set: {
                question: 'Sample Question',
                points: 10,
                choices: [
                    { choice: 'Choice 1', isCorrect: true },
                    { choice: 'Choice 2', isCorrect: false },
                ],
            },
        };
        const expectedResult = {
            $set: {
                question: 'Sample Question',
                points: 10,
                choices: [
                    { choice: 'Choice 1', isCorrect: true },
                    { choice: 'Choice 2', isCorrect: false },
                ],
            },
        };

        expect(createPatchFilter(req)).to.deep.equal(expectedResult); // Using deep.equal() for deep equality comparison
    });

    it('should correctly handle default case when no allowed keys match', () => {
        const req: Request = {
            // Use the defined interface for type safety
            $set: {
                foo: 'bar', // a key that is not in ALLOWED_KEYS_FOR_QUESTION
            },
        } as Request;
        const result = createPatchFilter(req);
        // Assert that result.$set is an empty object as it should be for unknown keys
        expect(result.$set).to.deep.equal({});
    });

    it('should correctly handle choices when req.$set[key] is null', () => {
        const req: Request = {
            // Use the defined interface for type safety
            $set: {
                question: 'Sample Question',
                points: 10,
                choices: null, // setting choices to null
            },
        };
        const result = createPatchFilter(req);
        // Assert that result.$set.choices is undefined as it should be when choices are null
        expect(result.$set.choices).to.equal(undefined);
    });
    it('should correctly handle choices when there are too many', () => {
        const req: Request = {
            // Use the defined interface for type safety
            $set: {
                question: 'Sample Question',
                points: 10,
                choices: [
                    { choice: 'Choice 1', isCorrect: true },
                    { choice: 'Choice 2', isCorrect: false },
                    { choice: 'Choice 3', isCorrect: false },
                    { choice: 'Choice 4', isCorrect: false },
                    { choice: 'Choice 5', isCorrect: false },
                ],
            },
        };
        const result = createPatchFilter(req);
        // Assert that result.$set.choices is undefined as it should be when choices are null
        expect(result.$set.choices).to.equal(undefined);
    });
    it('should correctly handle choices when there are too few', () => {
        const req: Request = {
            // Use the defined interface for type safety
            $set: {
                question: 'Sample Question',
                points: 10,
                choices: [{ choice: 'Choice 1', isCorrect: true }],
            },
        };
        const result = createPatchFilter(req);
        // Assert that result.$set.choices is undefined as it should be when choices are null
        expect(result.$set.choices).to.equal(undefined);
    });
    it('should correctly handle choices when isCorrect is undefined ', () => {
        const req: Request = {
            // Use the defined interface for type safety
            $set: {
                question: 'Sample Question',
                points: 10,
                choices: [{ choice: 'Choice 1', isCorrect: undefined }],
            },
        };
        const result = createPatchFilter(req);
        // Assert that result.$set.choices is undefined as it should be when choices are null
        expect(result.$set.choices).to.equal(undefined);
    });
    it('should correctly handle default case when no allowed keys match', () => {
        const req: unknown = {
            $set: {
                foo: 'bar', // An unknown property
            },
        };

        const forEachSpy = sinon.spy(Array.prototype, 'forEach');

        createPatchFilter(req as QuestionQueryFilter);

        sinon.assert.calledOnce(forEachSpy); // Assert that forEach was called only once

        forEachSpy.restore(); // Restore the original Array.prototype.forEach
    });
});

describe('QuestionsController', () => {
    let controller: QuestionsController;
    let router: Router;
    let databaseServiceStub: SinonStub;
    // let postObjectStub: SinonStub;
    // let patchObjectStub: SinonStub;
    let getObjectIDStub: SinonStub;
    // let deleteObjectStub: SinonStub;

    beforeEach(async () => {
        const databaseService = new DatabaseService();

        // Stub the behavior of databaseService.getCollection() to return the mock database
        databaseServiceStub = stub(databaseService, 'getCollection');
        // postObjectStub = stub(databaseService, 'insertOneObject');
        // patchObjectStub = stub(databaseService, 'updateObject');
        getObjectIDStub = stub(databaseService, 'getObjectByID');
        // deleteObjectStub = stub(databaseService, 'deleteObject');

        // Mock database containing some predefined questions
        const mockQuestions = [
            { id: '1', question: 'Question 1', points: 10, choices: [{ choice: 'Choice 1', isCorrect: true }] },
            { id: '2', question: 'Question 2', points: 20, choices: [{ choice: 'Choice 1', isCorrect: false }] },
        ];
        databaseServiceStub.withArgs(QUESTION_COLLECTION).resolves(mockQuestions);

        controller = new QuestionsController(databaseService);
        router = controller.router;
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('QuestionsController', () => {
        // let controller: QuestionsController;
        let databaseServiceStubPatch: SinonStubbedInstance<DatabaseService>;

        beforeEach(() => {
            // Create a stub for the database service
            databaseServiceStubPatch = {
                getObjectByID: stub(),
                getCollection: stub(), // Example data for demonstration
                insertOneObject: stub(),
                updateObject: stub(),
                deleteObject: stub(),
            } as SinonStubbedInstance<DatabaseService>;

            // Create the controller with the stubbed database service
            controller = new QuestionsController(databaseServiceStubPatch);
        });

        describe('PATCH /:quizID/:questionID', () => {
            it('should return 400 Bad Request if required parameters are missing', async () => {
                const req = { body: { body: {} }, params: {} };
                const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

                await router.stack[1].route.stack[0].handle(req, res);

                expect(res.status.calledWith(StatusCodes.BAD_REQUEST)).to.equal(true);
                expect(res.send.calledOnce).to.equal(true);
            });

            it('should return 400 Bad Request if request body does not contain valid fields for update', async () => {
                const req = {
                    body: { body: { params: { quizID: '999', questionID: '999' } } },
                    params: { quizID: '999', questionID: '999' }, // Add params here
                };
                const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

                // Stub the behavior of getObjectByID to resolve with an empty string
                getObjectIDStub.resolves(req.body.body.params.questionID);
                await router.stack[1].route.stack[0].handle(req, res);

                // Assert that status 400 Bad Request is returned
                expect(res.status.calledWith(StatusCodes.BAD_REQUEST)).to.equal(true);
                expect(res.send.calledOnce).to.equal(true);
            });
            it('should return 400 Bad Request if question ID is not found in the mock database', async () => {
                const req = {
                    body: { body: { params: { quizID: '999', questionID: '999' } } },
                    params: { quizID: '999', questionID: '999' }, // Add params here
                };
                const res = { status: sinon.stub().returnsThis(), send: sinon.stub() };

                // Stub the behavior of getObjectByID to resolve with an empty string
                getObjectIDStub.withArgs(QUESTION_COLLECTION, req.params.questionID).resolves('');

                await router.stack[1].route.stack[0].handle(req, res);

                // Assert that status 400 Bad Request is returned
                expect(res.status.calledWith(StatusCodes.BAD_REQUEST)).to.equal(true);
                expect(res.send.calledOnce).to.equal(true);
            });
        });
    });
});
