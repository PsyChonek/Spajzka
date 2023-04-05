import { Item } from './models/item'

export const registerRoutes = (server: any, schema: any) => {
    server.get('/item', {
        schema: {
            description: 'Get item',
            tags: ['item'],
            summary: 'Get item',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        item: schema.definitions![Item.name] as JSON
                    }
                }
            }
        }
    }, (req: any, reply: any) => {
        reply.send({ item: new Item() })
    })
}