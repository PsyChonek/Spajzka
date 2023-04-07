import { Item } from './models/item'

export const registerRoutes = (server: any) => {
    server.route({
        method: 'GET',
        url: '/item/:id',
        schema: {
            description: 'Get item by id',
            tags: ['item'],
            summary: 'Get item by id',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'number' }
                }
            },
            response: {
                200: {
                    $ref: 'Item'
                }
            }
        },
        handler: (req: any, reply: any) => {
            reply.send()
        }
    })

    server.route({
        method: 'GET',
        url: '/item',
        schema: {
            tags: ['item'],
            summary: 'Get items',
            response: {
                200: {
                    type: 'array',
                    items: {
                        $ref: 'Item'
                    }
                }
            }
        },
        handler: (req: any, reply: any) => {
            const items: Item[] = [{ id: 1, name: 'test', price: 1, isOnBuylist: true, amount: 1 }, { id: 2, name: 'test2', price: 2, isOnBuylist: false, amount: 2 }]

            reply.send(items)
        }
    })
}