"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var fastify_1 = __importDefault(require("fastify"));
var swagger_1 = require("@fastify/swagger");
var swagger_ui_1 = require("@fastify/swagger-ui");
var ts_json_schema_generator_1 = require("ts-json-schema-generator");
var routes_1 = require("./routes");
var dotenv = __importStar(require("dotenv"));
var start = function () {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var server, config, schema, fastifyOptions;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    dotenv.config();
                    server = (0, fastify_1["default"])();
                    console.log();
                    config = {
                        path: '../../node_modules/shared/src/models/*',
                        tsconfig: './tsconfig.json',
                        type: "*"
                    };
                    schema = (0, ts_json_schema_generator_1.createGenerator)(config).createSchema(config.type);
                    return [4 /*yield*/, server.register(swagger_1.fastifySwagger, {
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
                                        "in": 'header'
                                    }
                                }
                            }
                        })];
                case 1:
                    _b.sent();
                    server.register(swagger_ui_1.fastifySwaggerUi, {
                        routePrefix: '/docs'
                    });
                    (0, routes_1.registerRoutes)(server, schema);
                    return [4 /*yield*/, server.ready()];
                case 2:
                    _b.sent();
                    server.swagger();
                    fastifyOptions = {
                        host: "localhost",
                        port: Number.parseInt((_a = process.env.PORT) !== null && _a !== void 0 ? _a : "3000")
                    };
                    return [4 /*yield*/, server.listen(fastifyOptions)];
                case 3:
                    _b.sent();
                    console.log("Server listening on http://".concat(fastifyOptions.host, ":").concat(fastifyOptions.port, "/docs"));
                    return [2 /*return*/];
            }
        });
    });
};
start();
