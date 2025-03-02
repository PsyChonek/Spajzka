import fastify, { FastifyListenOptions } from "fastify";
import { fastifySwagger } from "@fastify/swagger";
import { fastifySwaggerUi } from "@fastify/swagger-ui";
import { fastifyCors } from "@fastify/cors";
import { toolRoutes } from "./routes/tools";
import * as dotenv from "dotenv";
import { createGenerator } from "ts-json-schema-generator";
import { groupRoutes } from "./routes/groups";
import { itemRoutes } from "./routes/items";
import { userRoutes } from "./routes/users";
import { authRoutes } from "./routes/auth";

var start = async function () {
	console.log();

	console.log("Loading environment variables...");
	console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
	dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

	console.log("Starting server...");
	const server = fastify();
	const modelPath = "src\\models\\api\\*.ts";

	const config = {
		path: modelPath,
		tsconfig: "./tsconfig.json",
		type: "*",
		jsDoc: "extended",
	};

	const fastifyOptions: FastifyListenOptions = {
		host: process.env.HOST || "",
		port: Number.parseInt(process.env.PORT || ""),
	};

	//@ts-ignore
	const schema = createGenerator(config).createSchema(config.type);

	for (const key in schema.definitions) {
		const newSchema = Object.assign({}, schema.definitions[key], { $id: key });

		server.addSchema(newSchema);
	}

	var swaggerHost: string = "";
	if (process.env.NODE_ENV === "development") {
		swaggerHost = `${fastifyOptions.host}:${fastifyOptions.port}`;
	} else if (process.env.NODE_ENV === "production") {
		swaggerHost = `${fastifyOptions.host}`;
	}

	await server.register(fastifySwagger, {
		openapi: {
			info: {
				title: "Spajzka API",
				description: "Spajzka API documentation",
				version: "0.1.0",
			},
			servers: [
				{
					url: `http://${swaggerHost}`,
				},
			],
			components: {
				securitySchemes: {
					apiKey: {
						type: "apiKey",
						name: "apiKey",
						in: "header",
					},
				},
			},
		},
		refResolver: {
			buildLocalReference(json, baseUri, fragment, i) {
				return `${json.$id}Model`;
			},
		},
	});

	// Register CORS
	// TODO: Investigate how to set up CORS properly
	server.register(fastifyCors, {
		origin: true,
	});

	server.register(fastifySwaggerUi, {
		routePrefix: "/docs",
	});

	// Register routes
	userRoutes(server);
	itemRoutes(server);
	groupRoutes(server);
	toolRoutes(server);
    authRoutes(server);

	await server.ready();
	server.swagger();

	await server.listen(fastifyOptions);

	console.log(`Server listening on http://${swaggerHost}/docs`);
};

start();
