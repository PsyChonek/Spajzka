import { MongoClient, ObjectId } from "mongodb";

export class DatabaseService {
    private static _instance: DatabaseService;
    private _client: MongoClient;

    public isConnected: string = '';

    private constructor() {
        this._client = new MongoClient(process.env.CONNECTION_STRING || '');
        this._client.connect().then(() => {
            console.log('Connected to MongoDB');
            this.isConnected = 'Connected to MongoDB';
        }).catch((err) => {
            console.log('Error connecting to MongoDB', err);
            this.isConnected = 'Error connecting to MongoDB ' + err;
        }
        );
    }

    public static get instance(): DatabaseService {
        if (!DatabaseService._instance) {
            DatabaseService._instance = new DatabaseService();
        }

        return DatabaseService._instance;
    }

    public get client(): MongoClient {

        return this._client;
    }

    // Get user ObjectID from database by key string
    public async getUserObjectId(key: string): Promise<ObjectId | null>{
        var result = null;
        await this.client.db(process.env.DATABASE).collection('users').findOne({ key: key }).then((user) => {
            if (user != null) {
                result = user._id;
            }
        }).catch((err) => {
            console.log('Error getting user', err);
        });

        return result;
    }
}