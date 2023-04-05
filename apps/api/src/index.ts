﻿import fastify, { FastifyListenOptions } from "fastify"
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import { registerRoutes } from './routes';
import * as path from 'path'
import * as dotenv from 'dotenv'
import { createGenerator } from "ts-json-schema-generator";

var start = async function () {
    dotenv.config()
    const server = fastify()

    const modelPath = 'src\\models\\*.ts';

    const config = {
        path: modelPath,
        tsconfig: './tsconfig.json',
        type: "*"
    }

    const schema = createGenerator(config).createSchema(config.type);

    await server.register(fastifySwagger, {
        swagger: {
            info: {
                title: 'Spajzka API',
                description: 'Spajzka API documentation',
                version: '0.1.0'
            },
            host: '127.0.0.1:3010',
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

    const json = server.swagger({ yaml: true })
    console.log(json)
    require('fs').writeFileSync('./swagger.yml', json)


    const fastifyOptions: FastifyListenOptions = {
        host: "127.0.0.1",
        port: 3010
    }

    await server.listen(fastifyOptions)

    console.log(`Server listening on http://${fastifyOptions.host}:${fastifyOptions.port}/docs`)
}

start()