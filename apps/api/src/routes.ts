import { Item } from './models/item'

export const registerRoutes = (server: any) => {
    server.route({
        method: 'GET',
        url: '/item',
        schema: {
            tags: ['Item'],
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
            const items: Item[] = [
                { id: 1, name: 'test', price: 1, isOnBuylist: true, amount: 1 },
                { id: 2, name: 'test2', price: 2, isOnBuylist: false, amount: 2 },
                { id: 3, name: 'test3', price: 3, isOnBuylist: true, amount: 3 }
            ]

            reply.send(items)
        }
    })

    server.route({
        method: 'GET',
        url: '/user/:id',
        schema: {
            tags: ['User'],
            summary: 'Get user by id',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'number' }
                }
            },
            response: {
                200: {
                    $ref: 'User'
                }
            }
        },
        handler: (req: any, reply: any) => {
            const user = {
                id: 1,
                name: 'test'
            }

            reply.send(user)
        }
    })
}