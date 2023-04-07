﻿import fastify, { FastifyListenOptions } from "fastify"
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import { fastifyCors } from "@fastify/cors"
import { registerRoutes } from './routes';
import * as dotenv from 'dotenv'
import { createGenerator } from "ts-json-schema-generator";

var start = async function () {

    console.log()
    console.log('Starting server...')

    dotenv.config()
    const server = fastify()

    const modelPath = 'src\\models\\*.ts';

    const config = {
        path: modelPath,
        tsconfig: './tsconfig.json',
        type: "*",
    }

    const schema = createGenerator(config).createSchema(config.type);

    for (const key in schema.definitions) {
        const newSchema = Object.assign({}, schema.definitions[key] ,{$id: key})
        server.addSchema(newSchema)
    }

    await server.register(fastifySwagger, {
        swagger: {
            info: {
                title: 'Spajzka API',
                description: 'Spajzka API documentation',
                version: '0.1.0'
            },
            host: 'localhost:3010',
            schemes: ['http', 'https'],
            consumes: ['application/json'],
            produces: ['application/json'],
            securityDefinitions: {
                apiKey: {
                    type: 'apiKey',
                    name: 'apiKey',
                    in: 'header'
                }
            }
        },
        refResolver: {
            buildLocalReference(json, baseUri, fragment, i) {
                return `${json.$id}Model`
            }
        }
    }
    )

    server.register(fastifyCors, {
        origin: 'http://localhost:3000',
        methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Access-Control-Allow-Origin', 'Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers'],
        preflightContinue: false,
        optionsSuccessStatus: 204
    })

    server.register(fastifySwaggerUi, {
        routePrefix: '/docs'
    })

    registerRoutes(server);

    await server.ready()
    server.swagger()

    const fastifyOptions: FastifyListenOptions = {
        host: "localhost",
        port: 3010,
    }

    await server.listen(fastifyOptions)

    console.log(`Server listening on http://${fastifyOptions.host}:${fastifyOptions.port}/docs`)
}

start()