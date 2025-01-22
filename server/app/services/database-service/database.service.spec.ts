import { GenericObject } from '@app/classes/database-types/generic-objects/generic-object';
import { DatabaseService } from '@app/services/database-service/database.service';
import { expect } from 'chai';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as sinon from 'sinon';
import { SinonStub } from 'sinon';
// import { MongoClient } from 'mongodb';

describe('DatabaseService', () => {
    // const collection = 'dummyCollection';
    const errorMSG = "Couldn't connect to database";
    const invalidURI = 'invalidURI';
    const objects = [
        { name: 'obj1', id: '1' },
        { name: 'obj2', id: '2' },
    ];
    const collectionName = 'collection Test';
    const invalidCollection = 'invalid collection';
    let dbService: DatabaseService;
    let mongoServer: MongoMemoryServer;
    let logMock: SinonStub;
    let uri: string;
    beforeEach(async () => {
        // eslint-disable-next-line no-console
        logMock = sinon.stub(console, 'log').returns();
        dbService = new DatabaseService();
        mongoServer = await MongoMemoryServer.create();
        uri = mongoServer.getUri();
        await dbService.connectToDatabase(uri);
        await dbService.database.createCollection(collectionName);
        await dbService.database.collection(collectionName).insertMany(objects);
    });
    afterEach(async () => {
        await mongoServer.stop();
        logMock.restore();
    });
    it('should successfully connect to the database', async () => {
        expect(async () => {
            await dbService.connectToDatabase(uri);
        }).to.not.throw(new Error(errorMSG));
    });
    it('should fail gracefully if an error occurs upon connection', async () => {
        dbService.connectToDatabase(invalidURI).catch((err) => {
            expect(err).to.deep.equal(errorMSG);
        });
    });
    it('should successfully retrieve a collection', async () => {
        const collection = await dbService.getCollection(collectionName, {});
        expect(collection.length).to.equal(objects.length);
    });
    it('should return an empty array of strings if the collection is non-existent', async () => {
        const collection = await dbService.getCollection(invalidCollection, {});
        expect(collection.length).to.equal(0);
    });
    it('should return an empty array of strings if the collection is empty', async () => {
        const collection = await dbService.getCollection(collectionName, { id: { $in: ['3'] } });
        expect(collection.length).to.equal(0);
    });
    it('should successfully insert an object that implements Generic Object into a collection', async () => {
        class SomeObj implements GenericObject {
            toJSON(): JSON {
                const obj = {
                    name: 'obj3',
                    id: '3',
                };
                return JSON.parse(JSON.stringify(obj));
            }
        }
        await dbService.insertOneObject(collectionName, new SomeObj());
        const collection = await dbService.getCollection(collectionName, {});
        expect(collection.length).to.equal(objects.length + 1);
    });
    it('should successfully get an object by its ID', async () => {
        const obj = await dbService.getObjectByID(collectionName, '1');
        expect(JSON.parse(obj).name).to.equal(objects[0].name);
    });
    it('should return an empty string if ID is not found', async () => {
        const obj = await dbService.getObjectByID(collectionName, '3');
        expect(obj).to.equal('');
    });
    it('should update the object', async () => {
        await dbService.updateObject(collectionName, '1', { $set: { name: 'nouveauNom' } });

        const updatedObjectString = await dbService.getObjectByID(collectionName, '1');
        expect(JSON.parse(updatedObjectString).name).to.equal('nouveauNom');
    });
    it('should not delete an object if id does not exists', async () => {
        await dbService.deleteObject(collectionName, '', {});
        const collection = await dbService.getCollection(collectionName, {});
        expect(collection.length).to.equal(objects.length - 1);
    });
    it('should delete an object if id exists', async () => {
        await dbService.deleteObject(collectionName, '1', { $in: { name: 'obj2' } });
        const collection = await dbService.getCollection(collectionName, {});
        expect(collection.length).to.equal(objects.length - 1);
    });
});
