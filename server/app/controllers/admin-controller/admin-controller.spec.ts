import { Application } from '@app/app';
import { ChoiceInterface } from '@app/classes/database-types/choice-interface/choice-interface';
import { AdminController } from '@app/controllers/admin-controller/admin-controller';
import { DatabaseService } from '@app/services/database-service/database.service';
import { Message } from '@common/message';
import * as chai from 'chai';
import { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';
import * as sinon from 'sinon';
import { SinonStub, SinonStubbedInstance } from 'sinon';
import * as supertest from 'supertest';
import { Container } from 'typedi';
// import { AdminController } from '@app/controllers/admin-controller/admin-controller';

describe('AdminController', () => {
    let expressApp: Express.Application;
    let dbService: SinonStubbedInstance<DatabaseService>;
    let sessionID = '';
    let insertOneStub: SinonStub;
    const errorMSG = 'Umm, we fucked up...';
    const password: Message = { title: '', body: 'log2990-107' };
    const quiz = {
        title: 'blablabla',
        body: {
            title: 'some test',
            description: 'funny questions',
            questions: ['d836d58b-559d-4507-a0a4-5579f3d7976b', 'ee525092-18a9-4e71-a01b-01874434a988'],
            visible: true,
            duration: 30,
        },
    };
    const choices: ChoiceInterface[] = [
        { choice: 'idk frl', isCorrect: true },
        { choice: 'is TS the Karen version of JS?', isCorrect: true },
    ];
    const question = {
        title: 'blablabla',
        body: {
            question: "what's the question?",
            type: 'MCQ',
            points: 30,
            choices,
        },
    };
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

    beforeEach(async () => {
        const app = Container.get(Application);
        dbService = sinon.createStubInstance(DatabaseService);
        // eslint-disable-next-line dot-notation
        // Object.defineProperty(app['adminController']['databaseService'], 'mongoInstance', { value: dbService, writable: false });
        dbService.insertOneObject.restore();
        insertOneStub = sinon.stub(dbService, 'insertOneObject').resolves();
        await dbService.connectToDatabase();
        const adminController = new AdminController(dbService);
        Object.defineProperty(app, 'adminController', { value: adminController, writable: false });
        // Object.defineProperty(app['adminController'])
        // app['adminController'] = new AdminController(dbService);
        expressApp = app.app;
    });
    afterEach(() => {
        insertOneStub.restore();
    });

    it('should return status 200 OK if POST request to login contains valid password', async () => {
        await signIn(StatusCodes.OK, true, password);
    });
    it('should return status 401 UNAUTHORIZED if POST request to login contains invalid password', async () => {
        const invalidPassword: Message = { title: '', body: 'invalid password' };
        await signIn(StatusCodes.UNAUTHORIZED, false, invalidPassword);
    });
    it('should return status 400 BAD REQUEST if POST request to login does not contain a message', async () => {
        await signIn(StatusCodes.BAD_REQUEST, false);
    });
    it('should deny access if not authenticated', async () => {
        const expectedMessage = 'who is u?';
        return supertest(expressApp)
            .get('/api/admin/ping')
            .expect(StatusCodes.UNAUTHORIZED)
            .then((res) => {
                chai.expect(res.text).to.equal(expectedMessage);
            });
    });
    it('should grant access if authenticated', async () => {
        sessionID = await signIn(StatusCodes.OK, true, password);
        const expectedMessage = { ping: 'pong' };
        return (
            supertest(expressApp)
                .get('/api/admin/ping')
                // eslint-disable-next-line @typescript-eslint/naming-convention
                .set({ Cookies: sessionID })
                .send()
                .expect(StatusCodes.OK)
                .then((res) => {
                    chai.expect(res.body).to.deep.equal(expectedMessage);
                })
        );
    });
    it('should logout if authenticated', async () => {
        sessionID = await signIn(StatusCodes.OK, true, password);
        const expectedMessage = { ping: 'pong' };
        await supertest(expressApp)
            .get('/api/admin/ping')
            // eslint-disable-next-line @typescript-eslint/naming-convention
            .set({ Cookies: sessionID })
            .expect(StatusCodes.OK)
            .then((res) => {
                chai.expect(res.body).to.deep.equal(expectedMessage);
            });
        const expectedValue = '';
        await supertest(expressApp)
            .post('/api/admin/logout')
            // eslint-disable-next-line @typescript-eslint/naming-convention
            .set({ Cookies: sessionID })
            .expect(StatusCodes.OK)
            .then((res) => {
                chai.expect(res.text).to.equal(expectedValue);
            });
    });
    it("shouldn't do anything if no sessionID is passed in headers", async () => {
        const expectedValue = '';
        return supertest(expressApp)
            .post('/api/admin/logout')
            .expect(StatusCodes.NO_CONTENT)
            .then((res) => {
                chai.expect(res.text).to.equal(expectedValue);
            });
    });
    it("shouldn't do anything if sessionID is invalid", async () => {
        const expectedValue = '';
        return (
            supertest(expressApp)
                .post('/api/admin/logout')
                // eslint-disable-next-line @typescript-eslint/naming-convention
                .set({ Cookies: 'invalid sessionID' })
                .expect(StatusCodes.NO_CONTENT)
                .then((res) => {
                    chai.expect(res.text).to.equal(expectedValue);
                })
        );
    });

    it('should return an HTTP error 400 BAD REQUEST if nothing is sent to quiz', async () => {
        sessionID = await signIn(StatusCodes.OK, true, password);
        supertest(expressApp)
            .post('/api/admin/quiz')
            // eslint-disable-next-line @typescript-eslint/naming-convention
            .set({ Cookies: sessionID })
            .send()
            .expect(StatusCodes.BAD_REQUEST)
            .then((res) => {
                chai.expect(res.text).to.deep.equal('');
            });
    });
    it('should never return a 500 error when POSTing to quiz', async () => {
        sessionID = await signIn(StatusCodes.OK, true, password);
        insertOneStub.restore();
        insertOneStub = sinon.stub(dbService, 'insertOneObject').rejects(new Error(errorMSG));
        const response = await supertest(expressApp)
            .post('/api/admin/quiz')
            // eslint-disable-next-line @typescript-eslint/naming-convention
            .set({ Cookies: sessionID })
            .send(quiz)
            .expect(StatusCodes.INTERNAL_SERVER_ERROR);
        chai.expect(response.text).to.deep.equal(errorMSG);
    });

    it('should return an HTTP error 400 BAD REQUEST if nothing is sent to question', async () => {
        sessionID = await signIn(StatusCodes.OK, true, password);
        const response = await supertest(expressApp)
            .post('/api/admin/question')
            // eslint-disable-next-line @typescript-eslint/naming-convention
            .set({ Cookies: sessionID })
            .send()
            .expect(StatusCodes.BAD_REQUEST);
        expect(response.text).to.deep.equal('');
    });
    it('it should never return a 500 error when POSTing to question', async () => {
        sessionID = await signIn(StatusCodes.OK, true, password);
        insertOneStub.restore();
        insertOneStub = sinon.stub(dbService, 'insertOneObject').rejects(new Error(errorMSG));
        const response = await supertest(expressApp)
            .post('/api/admin/question')
            // eslint-disable-next-line @typescript-eslint/naming-convention
            .set({ Cookies: sessionID })
            .send(question)
            .expect(StatusCodes.INTERNAL_SERVER_ERROR)
            .then((res) => {
                return res;
            })
            .catch((err) => {
                return err;
            });
        chai.expect(response.text).to.deep.equal(errorMSG);
    });
});
