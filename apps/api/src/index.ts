﻿import fastify, { FastifyListenOptions } from "fastify"
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import { registerRoutes } from './routes';
import * as path from 'path'
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

    // @ts-ignore
    const schema = createGenerator(config).createSchema(config.type);

    
    
    const fs = require('fs');
    fs.writeFileSync(path.join(__dirname, 'schemaOLD.json'), JSON.stringify(schema.definitions, null, 2));
    
    const schemaFromFile = JSON.parse(fs.readFileSync(path.join(__dirname, 'schema.json'), 'utf8'));
    
    server.addSchema(schemaFromFile)
    
    // @ts-ignore
    await server.register(fastifySwagger, {
        swagger: {
            info: {
                title: 'Spajzka API',
                description: 'Spajzka API documentation',
                version: '0.1.0'
            },
            host: '127.0.0.1:3010',
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
                return `${json.$id}Model` || `my-fragment-${i}`
            }
        }
    }
    )

    server.register(fastifySwaggerUi, {
        routePrefix: '/docs'
    })

    registerRoutes(server);

    await server.ready()
    server.swagger()

    const fastifyOptions: FastifyListenOptions = {
        host: "127.0.0.1",
        port: 3010
    }

    await server.listen(fastifyOptions)

    console.log(`Server listening on http://${fastifyOptions.host}:${fastifyOptions.port}/docs`)
}

start()