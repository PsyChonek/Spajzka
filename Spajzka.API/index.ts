import Fastify, {FastifyInstance, RouteShorthandOptions} from 'fastify'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from "@fastify/swagger-ui";
import {Server, IncomingMessage, ServerResponse} from 'http'
import * as dotenv from 'dotenv'
import fileDirName from './tools/meta.js';

const {__dirname, __filename} = fileDirName(import.meta);

dotenv.config()

import {createGenerator} from "ts-json-schema-generator";

export class Item {
    id: number = 0;
    name: string = '';
}

const config = {
    path: __filename,
    tsconfig: __dirname + '/tsconfig.json'
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
    routePrefix: '/documentation',
    uiConfig: {
        docExpansion: 'full',
        deepLinking: false
    },
    uiHooks: {
        onRequest: function (request, reply, next) {
            next()
        },
        preHandler: function (request, reply, next) {
            next()
        }
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => {
        return swaggerObject
    },
    transformSpecificationClone: true
})

const itemSchema = schema.definitions![Item.name] as any

fastify.post('/test', {
    schema: {
        body: itemSchema,
        response: {
            200: itemSchema
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

