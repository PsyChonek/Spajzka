import { ObjectId } from 'mongodb'
import { DatabaseService } from './services/databaseService'
import { Item } from './models/item'
import { ItemCollection } from './collections/itemCollection'
import { UserCollection } from './collections/userCollection'
import { ItemService } from './services/itemService'
import { UserService } from './services/userService'

export const registerRoutes = (server: any) => {

    // Get user items by user id
    server.route({
        method: 'GET',
        url: '/user/:userKey/items',
        schema: {
            tags: ['User'],
            summary: 'Get user items by user id',
            params: {
                type: 'object',
                properties: {
                    userKey: { type: 'string' }
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

            var items: Item[] = await itemsService.getItems(req.params.userKey);

            reply.send(items);
        }
    })

    // Store item to database, response with item id
    server.route({
        method: 'POST',
        url: '/user/:userKey/item',
        schema: {
            tags: ['User'],
            summary: 'Store item to database',
            params: {
                type: 'object',
                properties: {
                    userKey: { type: 'string' }
                }
            },
            body: {
                $ref: 'Item'
            },
            response: {
                200: {
                    type: 'string'
                }
            }
        },
        handler: async (req: any, reply: any) => {
            var itemsService = new ItemService();

            var insertedId: string | null = await itemsService.storeItem(req.params.userKey, req.body);

            if (insertedId == null) {
                reply.code(500).send();
                return;
            }

            reply.send(insertedId);
        }
    })

    // Add user to group
    server.route({
        method: 'POST',
        url: '/user/:userKey/group/:groupKey',
        schema: {
            tags: ['User'],
            summary: 'Add user to group',
            params: {
                type: 'object',
                properties: {
                    userKey: { type: 'string' },
                    groupKey: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'string'
                }
            }
        },
        handler: async (req: any, reply: any) => {
            var userService = new UserService();

            var result: boolean = await userService.addUserToGroup(req.params.groupKey, req.params.userKey);

            if (result == false) {
                reply.code(500).send();
            }
            else {
                reply.send();
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
                    type: 'string'
                }
            }
        },
        handler: async (req: any, reply: any) => {
            var userService = new UserService();

            var result: string | null = await userService.createUser(req.body);

            if (result == null) {
                reply.code(500).send();
                return;
            }

            reply.send(result);
        }
    })

}