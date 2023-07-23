import { User } from "src/models/user";
import { UserService } from "../services/userService";
import { Group } from "src/models/group";
import { ItemService } from "../services/itemService";
import { Item } from "src/models/item";

export const userRoutes = (server: any) => {
    const userService = new UserService();

    // User create 
    server.route({
        method: 'POST',
        url: '/user',
        schema: {
            tags: ['User'],
            summary: 'Create user',
            body: {
                $ref: 'User',
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

    // User login

    // User logout

    // User update

    // User delete

    // User get

    // User find
    server.route({
        method: 'GET',
        url: '/user/:userId',
        schema: {
            tags: ['User'],
            summary: 'Get user by user id',
            params: {
                type: 'object',
                properties: {
                    userId: { type: 'string' }
                }
            },
            response: {
                200: {
                    $ref: 'User'
                }
            }
        },
        handler: async (req: any, reply: any) => {
            var user = await userService.getUser(req.params.userId);

            if (user == null) {
                reply.code(500).send();
                return;
            }
            else {
                reply.send(user);
            }
        }
    })

    // Users get groups 
    server.route({
        method: 'GET',
        url: '/user/:userId/groups',
        schema: {
            tags: ['User'],
            summary: 'Get user groups',
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
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' }
                        }
                    }
                }
            }
        },
        handler: async (req: any, reply: any) => {
            var result: Group[] | null = await userService.getUserGroups(req.params.userId);

            if (result == null) {
                reply.code(500).send();
            }
            else {
                reply.send(result);
            }
        }
    })

    // User get items
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
}