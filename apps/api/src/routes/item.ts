import { Item } from "src/models/item";
import { ItemService } from "../services/itemService";

export const itemRoutes = (server: any) => {

    const itemsService = new ItemService();

    // Create item
    server.route({
        method: 'POST',
        url: '/item',
        schema: {
            tags: ['Item'],
            summary: 'Store item to database',
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

    // Get item

    // Update item
    server.route({
        method: 'PUT',
        url: '/item',
        schema: {
            tags: ['Item'],
            summary: 'Update item',
            body: {
                $ref: 'Item'
            },
            response: {
                200: {
                }
            }
        },
        handler: async (req: any, reply: any) => {
            var result: boolean = await itemsService.updateItem(req.body);

            if (result == false) {
                reply.code(500).send();
            }
            else {
                reply.send();
            }
        }
    })

    // Delete item
    server.route({
        method: 'DELETE',
        url: '/item/:itemId',
        schema: {
            tags: ['Item'],
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
            var result: boolean = await itemsService.deleteItem(req.params.itemId);

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
}