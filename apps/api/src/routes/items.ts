export const itemRoutes = (server: any) => {
	// Create item
	server.route({
		method: "POST",
		url: "/items",
		schema: {
			tags: ["Items"],
			summary: "Store item to database",
			body: {
				$ref: "CreateItemInput",
			},
			response: {
				201: {
					$ref: "CreateItemOutput",
				},
			},
		},
		handler: async (req: any, reply: any) => {
			try {
				// Logic for creating an item
			} catch (error) {
				reply.status(500).send({ error: "Internal Server Error" });
			}
		},
	});

	// Get item
	server.route({
		method: "GET",
		url: "/items/:id",
		schema: {
			tags: ["Items"],
			summary: "Get item by item id",
			params: {
				type: "object",
				properties: {
					id: { type: "string", format: "uuid" }, // Validate ID as a UUID
				},
				required: ["id"],
			},
			response: {
				200: {
					$ref: "GetItemOutput",
				},
			},
		},
		handler: async (req: any, reply: any) => {
			try {
				// Logic for fetching an item by ID
			} catch (error) {
				reply.status(500).send({ error: "Internal Server Error" });
			}
		},
	});

	// Update item
	server.route({
		method: "PUT",
		url: "/items/:id",
		schema: {
			tags: ["Items"],
			summary: "Update item",
			params: {
				type: "object",
				properties: {
					id: { type: "string", format: "uuid" }, // Validate ID as a UUID
				},
				required: ["id"],
			},
			body: {
				$ref: "UpdateItemInput",
			},
			response: {
				200: {
					$ref: "UpdateItemOutput",
				},
			},
		},
		handler: async (req: any, reply: any) => {
			try {
				// Logic for updating an item
			} catch (error) {
				reply.status(500).send({ error: "Internal Server Error" });
			}
		},
	});

	// Delete item
	server.route({
		method: "DELETE",
		url: "/items/:id",
		schema: {
			tags: ["Items"],
			summary: "Remove item from database",
			params: {
				type: "object",
				properties: {
					id: { type: "string", format: "uuid" }, // Validate ID as a UUID
				},
				required: ["id"],
			},
			response: {
				200: {
					$ref: "DeleteItemOutput",
				},
			},
		},
		handler: async (req: any, reply: any) => {
			try {
				// Logic for deleting an item
			} catch (error) {
				reply.status(500).send({ error: "Internal Server Error" });
			}
		},
	});
};
