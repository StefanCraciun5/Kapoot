import { GenericObject } from '@app/classes/database-types/generic-objects/generic-object';
import { Filter } from '@app/services/database-service/options/options';
import { Db, MongoClient } from 'mongodb';
import * as process from 'process';

const connectionErrorMSG = "Couldn't connect to database";
export class DatabaseService {
    client: MongoClient;
    database: Db;
    private readonly uri: string;
    constructor() {
        this.uri = `mongodb+srv://${process.env.MONGO_USERNAME || 'cstefang'}:${
            process.env.MONGO_PASSWORD || 'projet3'
        }@clusterprojet3.zbyro.mongodb.net/`;
    }
    /*this.uri = `mongodb+srv://${process.env.MONGO_USERNAME || 'team107'}:${
            process.env.MONGO_PASSWORD || 'team107PW'
        }@atlascluster.xfdj1vk.mongodb.net/?retryWrites=true&w=majority`;
    */

    /*this.uri = `mongodb+srv://${process.env.MONGO_USERNAME || 'cstefang'}:${
            process.env.MONGO_PASSWORD || 'projet3'
        }@clusterprojet3.zbyro.mongodb.net/`;
    }*/    
    //mongodb+srv://cstefang:<db_password>@clusterprojet3.zbyro.mongodb.net/
    async connectToDatabase(uri?: string): Promise<void> {
        try {
            this.client = new MongoClient(uri ? uri : this.uri);
            await this.client.connect();
            this.database = this.client.db(process.env.DB_NAME || 'kapoot');
        } catch (e) {
            throw new Error(connectionErrorMSG);
        }
    }

    async insertOneObject(collectionName: string, instance: GenericObject) {
        await this.database.collection(collectionName).insertOne(instance);
    }
    async getCollection(collectionName: string, filter: Filter): Promise<string[]> {
        const collection = await this.database.collection(collectionName).find(filter).toArray();
        if (!collection || collection.length === 0) {
            return [];
        }
        return collection.map((col) => {
            return JSON.parse(JSON.stringify(col));
        });
    }
    async getObjectByID(collectionName: string, id: string): Promise<string> {
        const query = { id };
        const object = await this.database.collection(collectionName).findOne(query);
        if (!object) {
            return '';
        }
        return JSON.stringify(object);
    }
    async updateObject(collectionName: string, id: string, setQuery: Filter) {
        await this.database.collection(collectionName).updateOne({ id }, setQuery);
    }
    async deleteObject(collectionName: string, id: string, setQuery: Filter) {
        if (id === '') {
            await this.database.collection(collectionName).deleteOne(setQuery);
        } else {
            await this.database.collection(collectionName).deleteOne({ id }, setQuery);
        }
    }
    async deleteMany(collectionName: string, setQuery: Filter) {
        await this.database.collection(collectionName).deleteMany(setQuery);
    }
}
