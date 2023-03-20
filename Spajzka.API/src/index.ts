import Fastify, { FastifyInstance, RouteShorthandOptions } from 'fastify';
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from "@fastify/swagger-ui";
import { Server, IncomingMessage, ServerResponse } from 'http';
import { createGenerator } from "ts-json-schema-generator";
import * as dotenv from 'dotenv';
import { Item } from './item.js';

const fastify: FastifyInstance = Fastify({})
dotenv.config()

const config = {
    path: 'src/index.ts',
    tsconfig: './tsconfig.json'
}

const schemaGenerator = createGenerator(config);
const schema = schemaGenerator.createSchema('Item');


fastify.register(fastifySwagger, {
    swagger:
    {
        info: {
            title: 'Spajzka API',
            description: 'Spajzka API',
            version: '0.1.0'
        }

    }
})

fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs'
})

const itemSchema = schema.definitions![Item.name] as any

fastify.get('/item/:id', {
    schema: {
        params: {
            type: 'object',
            properties: {
                id: { type: 'number' }
            }
        },
        response: {
            200: { type: 'object', properties: itemSchema.properties }
        }
    }
}, async (request: any, reply: any) => {
    return { id: 1, name: 'test' }
})


const start = async () => {
    try {

        await fastify.listen({
            port: Number.parseInt(process.env.PORT ?? '3000')
        })

        const address = fastify.server.address()
        const port = typeof address === 'string' ? address : address?.port

        fastify

    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start()

console.log(`Swagger is running on port http://localhost:${Number.parseInt(process.env.PORT ?? '3000')}/docs`);