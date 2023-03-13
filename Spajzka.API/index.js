const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Load express and expose
app.use(express.json());
app.listen(3001, () => {
    console.log(`Server Started at ${3001}`)
})


const m2s = require('mongoose-to-swagger');
const Item = require('./schema/item.ts')


// Swagger setup
swaggerOptions = {
    swaggerDefinition: {
        components: {
            schemas: Item
        },
        info: {
            title: 'Spajzka API',
            description: 'Spajzka API Information',
            contact: {
                name: "Spajzka"
            },

            servers: ["http://localhost:3001"]
        },
        basePath: "/api"
    },
    apis: ["./routes/routes.ts"]
}

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Connect to DB
const mongoConnectionsString = process.env.CONNECTION_STRING;
mongoose.connect(mongoConnectionsString)
const db = mongoose.connection;

db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to Database'));

// const Item = require('./schema/item.ts');
//
// const data = new Item({
//     name: "Okurka",
//     price: 10,
//     description: "Okurka",
//     image: "Okurka",
//     amount: 10,
//     isOnBuylist: true
// });
//
// data.save();

// Load routes
const routes = require('./routes/routes.ts');
app.use('/api', routes);
