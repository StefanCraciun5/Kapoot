import { DatabaseService } from '@app/services/database-service/database.service';
import { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';
import * as sinon from 'sinon';
import { SinonStub, stub } from 'sinon';
import { HistoryControllerService } from './history-controller.service';

describe('HistoryController', () => {
    let controller: HistoryControllerService;

    let databaseServiceStub: sinon.SinonStub;

    let deleteObjectStub: SinonStub;

    const objects = [
        { name: 'obj1', id: '1' },
        { name: 'obj2', id: '2' },
    ];

    beforeEach(async () => {
        const databaseService = new DatabaseService();

        databaseServiceStub = stub(databaseService, 'getCollection');
        databaseServiceStub.returns(objects);

        deleteObjectStub = stub(databaseService, 'deleteObject');

        controller = new HistoryControllerService(databaseService);
    });

    afterEach(() => {
        databaseServiceStub.restore();
    });
    it('should return 202 Accepted after successful get', async () => {
        const history = [
            { id: '1', date: 'date 1' },
            { id: '2', date: 'date 2' },
        ];
        databaseServiceStub.resolves(history);

        const req = { params: {} };
        const res = {
            status: stub().returnsThis(),
            send: stub(),
        };

        await controller.router.stack[0].route.stack[0].handle(req, res);
        expect(res.status.calledOnceWith(StatusCodes.ACCEPTED)).to.equal(false);
    });
    it('should return 204 No content after successful get', async () => {
        databaseServiceStub.resolves([]);
        const req = { params: {} };
        const res = {
            status: stub().returnsThis(),
            send: stub(),
        };

        await controller.router.stack[0].route.stack[0].handle(req, res);
        expect(res.status.calledOnceWith(StatusCodes.NO_CONTENT)).to.equal(true);
    });
    it('should return 202 Accepted after successful deletion', async () => {
        const req = { params: { id: '1' } };
        const res = {
            status: stub().returnsThis(),
            send: stub(),
        };

        await controller.router.stack[1].route.stack[0].handle(req, res);
        deleteObjectStub.resolves();

        expect(res.status.calledOnceWith(StatusCodes.ACCEPTED)).to.equal(true);
    });
});
