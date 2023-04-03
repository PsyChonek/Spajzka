import fastify, { FastifyListenOptions } from "fastify"
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import { registerRoutes } from './routes';
import * as path from 'path'
import * as dotenv from 'dotenv'
// @ts-ignore
import { schema } from '@psychonek/shared';

var start = async function () {
    dotenv.config()
    const server = fastify()

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

    registerRoutes(server, schema);

    await server.ready()
    server.swagger()

    const fastifyOptions: FastifyListenOptions = {
        host: "127.0.0.1",
        port: Number.parseInt(process.env.PORT ?? "3000")
    }

    await server.listen(fastifyOptions)

    console.log(`Server listening on http://${fastifyOptions.host}:${fastifyOptions.port}/docs`)
}

start()