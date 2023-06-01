import { Item } from "src/models/item";
import { ItemService } from "src/services/itemService";

export const itemRoutes = (server: any) => {
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

}