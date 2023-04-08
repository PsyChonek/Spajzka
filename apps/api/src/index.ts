import fastify, { FastifyListenOptions } from "fastify"
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
    
    const fastifyOptions: FastifyListenOptions = {
        host: process.env.HOST || 'api.vazacdaniel.com',
        port: Number.parseInt(process.env.PORT || '3010'),
    }

    const schema = createGenerator(config).createSchema(config.type);

    for (const key in schema.definitions) {
        const newSchema = Object.assign({}, schema.definitions[key] ,{$id: key})
        server.addSchema(newSchema)
    }


    var swaggerHost: string;

    if (process.env.NODE_ENV === 'development') {
        swaggerHost = `${fastifyOptions.host}:${fastifyOptions.port}`
    }
    else {
        swaggerHost = `${fastifyOptions.host}`
    }


    await server.register(fastifySwagger, {
        swagger: {
            info: {
                title: 'Spajzka API',
                description: 'Spajzka API documentation',
                version: '0.1.0'
            },
            host: swaggerHost,
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

    // Register CORS 
    // TODO: Investigate how to set up CORS properly
    server.register(fastifyCors, {
        origin: true,
    })

    server.register(fastifySwaggerUi, {
        routePrefix: '/docs'
    })

    registerRoutes(server);

    await server.ready()
    server.swagger()


    await server.listen(fastifyOptions)

    console.log(`Server listening on http://${fastifyOptions.host}:${fastifyOptions.port}/docs`)
}

start()