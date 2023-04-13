import { Item } from './models/item'
import { DatabaseService } from './services/databaseService'
import { ItemService } from './services/itemService'
import { UserService } from './services/userService'

export const registerRoutes = (server: any) => {

    // Get user items by user id
    server.route({
        method: 'GET',
        url: '/user/:userId/items',
        schema: {
            tags: ['User'],
            summary: 'Get user items by user id',
            params: {
                type: 'object',
                properties: {
                    userId: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'array',
                    items: {
                        $ref: 'Item'
                    }
                }
            }
        },
        handler: async (req: any, reply: any) => {
            var itemsService = new ItemService();

            var items: Item[] | null = await itemsService.getItems(req.params.userId);

            if (items == null) {
                reply.code(500).send();
                return;
            }

            reply.send(items);
        }
    })

    // Store item to database, response with item id
    server.route({
        method: 'POST',
        url: '/user/:userId/item',
        schema: {
            tags: ['User'],
            summary: 'Store item to database',
            params: {
                type: 'object',
                required: ['userId'],
                properties: {
                    userId: { type: 'string' }
                }
            },
            body: {
                $ref: 'Item'
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' }
                    }
                }
            }
        },
        handler: async (req: any, reply: any) => {
            var itemsService = new ItemService();

            var insertedId: string | null = await itemsService.storeItem(req.params.userId, req.body);

            if (insertedId == null) {
                reply.code(500).send();
                return;
            }

            const response = {
                id: insertedId
            }

            reply.send(response);
        }
    })

    // Add user to group
    server.route({
        method: 'POST',
        url: '/user/:userId/group/:groupName',
        schema: {
            tags: ['User'],
            summary: 'Add user to group',
            params: {
                type: 'object',
                required: ['userId'],
                properties: {
                    userId: { type: 'string' },
                    groupName: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' }
                    }
                }
            }
        },
        handler: async (req: any, reply: any) => {
            var userService = new UserService();

            var result: string | null = await userService.addUserToGroup(req.params.groupName, req.params.userId);

            const response = {
                id: result
            }

            if (result == null) {
                reply.code(500).send();
            }
            else {
                reply.send(response);
            }
        }
    })

    // Create user
    server.route({
        method: 'POST',
        url: '/user',
        schema: {
            tags: ['User'],
            summary: 'Create user',
            body: {
                $ref: 'User'
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' }
                    }
                }
            }
        },
        handler: async (req: any, reply: any) => {
            var userService = new UserService();

            var result: string | null = await userService.createUser(req.body);

            const response = {
                id: result
            }

            if (result == null)
                reply.code(500).send();
            else
                reply.send(response);
        }
    })

    // Remove item from database
    server.route({
        method: 'DELETE',
        url: '/user/:userId/item/:itemId',
        schema: {
            tags: ['User'],
            summary: 'Remove item from database',
            params: {
                type: 'object',
                properties: {
                    itemId: { type: 'string' }
                }
            },
            response: {
                200: {
                }
            }
        },
        handler: async (req: any, reply: any) => {
            var itemsService = new ItemService();

            var result: boolean = await itemsService.deleteItem(req.params.userId, req.params.itemId);

            const response = {
                id: result
            }

            if (result == false) {
                reply.code(500).send();
            }
            else {
                reply.send();
            }
        }
    })

    // Create group
    server.route({
        method: 'POST',
        url: '/group',
        schema: {
            tags: ['Group'],
            summary: 'Create group',
            body: {
                $ref: 'Group'
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' }
                    }
                }
            }
        },
        handler: async (req: any, reply: any) => {
            var userService = new UserService();

            var result: string | null = await userService.createGroup(req.body);

            const response = {
                id: result
            }

            if (result == null)
                reply.code(500).send();
            else
                reply.send(response);
        }
    })

    // Update item
    server.route({
        method: 'PUT',
        url: '/user/:userId/item',
        schema: {
            tags: ['User'],
            summary: 'Update item',
            params: {
                type: 'object',
                properties: {
                    userId: { type: 'string' }
                }
            },
            body: {
                $ref: 'Item'
            },
            response: {
                200: {
                }
            }
        },
        handler: async (req: any, reply: any) => {
            var itemsService = new ItemService();

            var result: boolean = await itemsService.updateItem(req.params.userId, req.body);

            if (result == false) {
                reply.code(500).send();
            }
            else {
                reply.send();
            }
        }
    })

    // Check if server can connect to database¨
    server.route({
        method: 'GET',
        url: '/health',
        schema: {
            tags: ['Health'],
            summary: 'Check if server can connect to database',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' }
                    }
                }
            }
        },
        handler: async (req: any, reply: any) => {

            var result = {
                status: "OK"
            }

            const { MongoClient, ServerApiVersion } = require('mongodb');
            const uri = process.env.CONNECTION_STRING;
            const client = new MongoClient(uri, {
                serverApi: {
                    version: ServerApiVersion.v1,
                    strict: true,
                    deprecationErrors: true,
                }
            });

            try {
                // Connect the client to the server	(optional starting in v4.7) 
                await client.connect();
                // Send a ping to confirm a successful connection
                await client.db("admin").command({ ping: 1 });
                result.status = "Pinged your deployment. You successfully connected to MongoDB!";
            }
            catch (e) {
                result.status = "Error connecting to MongoDB: " + e;
            }
            finally {
                // Ensures that the client will close when you finish/error
                await client.close();
            }


            reply.send(result);
        }
    })
}
