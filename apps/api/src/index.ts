import fastify, { FastifyListenOptions } from "fastify"
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
        type: "*",
        expose: "export",
        schemaId: "auto",
    }

    // @ts-ignore
    const schema = createGenerator(config).createSchema(config.type);
    
    const wholeSchema = {
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
            },
            definitions: schema.definitions
        }
    }
    
    // @ts-ignore
    await server.register(fastifySwagger, wholeSchema)

    server.register(fastifySwaggerUi, {
        routePrefix: '/docs'
    })


    registerRoutes(server,wholeSchema);
    
    // Save the schema to a file
    const fs = require('fs');
    fs.writeFileSync(path.join(__dirname, 'schema.json'), JSON.stringify(wholeSchema, null, 2));
    
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