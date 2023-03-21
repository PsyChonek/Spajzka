import * as dotenv from 'dotenv';
import fastify, { FastifyListenOptions } from "fastify"
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import { createGenerator } from "ts-json-schema-generator";
// import { registerRoutes } from './routes.js';

dotenv.config()
const server = fastify()

const config = {
    path: 'src/models/*.ts',
    tsconfig: './tsconfig.json',
    type: "*",
}

const schema = createGenerator(config).createSchema(config.type);

await server.register(fastifySwagger, {
    swagger: {
        info: {
            title: 'Spajzka API',
            description: 'Spajzka API documentation',
            version: '0.1.0'
        },
        host: 'localhost',
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
        securityDefinitions: {
            apiKey: {
                type: 'apiKey',
                name: 'apiKey',
                in: 'header'
            }
        }
    }
})

server.register(fastifySwaggerUi, {
    routePrefix: '/docs'
})

// registerRoutes(server, schema);

await server.ready()
server.swagger()

const fastifyOptions: FastifyListenOptions = {
    host: "localhost",
    port: Number.parseInt(process.env.PORT ?? "3000")
}

await server.listen(fastifyOptions)

console.log(`Server listening on https://${fastifyOptions.host}:${fastifyOptions.port}`)