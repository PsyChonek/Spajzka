import Fastify, {FastifyInstance, RouteShorthandOptions} from 'fastify'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from "@fastify/swagger-ui";
import {Server, IncomingMessage, ServerResponse} from 'http'
import * as dotenv from 'dotenv'

dotenv.config()

import {createGenerator} from "ts-json-schema-generator";

export class Item {
    id: number = 0;
    name: string = '';
}

const config = {
    path: 'src/index.ts',
    tsconfig: './tsconfig.json'
}

const schemaGenerator = createGenerator(config);
const schema = schemaGenerator.createSchema('Item');
const fastify: FastifyInstance = Fastify({})

fastify.register(fastifySwagger, {
    swagger:
        {
            info: {
                title: 'Spajzka API',
                description: 'Spajzka API',
                version: '0.1.0'
            },
        }
})

fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs'
})

const itemSchema = schema.definitions![Item.name] as any

fastify.get('/item', {
    schema: {
        response: {
            200: {
                type: 'array',
                items: itemSchema
            }
        }
    }
}, async (request, reply) => {
})

const start = async () => {
    try {
        await fastify.listen({port: Number.parseInt(process.env.PORT ?? '3000')})

        const address = fastify.server.address()
        const port = typeof address === 'string' ? address : address?.port

    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start()

console.log(`Server is running on port ${Number.parseInt(process.env.PORT ?? '3000')}`);