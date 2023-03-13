const express = require('express');
const router = express.Router()

module.exports = router;

/**
 * @swagger
 * /live:
 *  get:
 *      description: API live test
 *      tags: [Tools]
 *      responses:
 *          '200':
 *            description: A successful response
 */
router.get('/live', (req, res) => {
    res.send('API is live')
})


/**
 * @swagger
 * /items:
 *  get:
 *    description: Get all items
 *    tags: [Items]
 *    responses:
 *     '200':
 *      description: A successful response
 *      content:
 *      application/json:
 *      schema:
 *       $ref: '#/components/schemas/Item'
 */
router.get('/items', (req, res) => {
    res.send('Get all items')
})