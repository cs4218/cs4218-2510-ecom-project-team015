export const orderSeed = [
	{
		_id: "66f9427fdb0119d9234c0004",
		products: ["66db427fdb0119d9234b27f1", "66db427fdb0119d9234b27f1"],
		payment: {
			provider: "braintree",
			success: true,
			message: "Approved",
			transaction: {
				id: "bt_txn_9h3j2k",
				type: "sale",
				amount: "159.98",
				currencyIsoCode: "USD",
				status: "submitted_for_settlement",
				creditCard: {
					last4: "1111",
					cardType: "Visa",
				},
			},
			params: {
				transaction: {
					amount: "159.98",
					paymentMethodNonce: "fake-valid-nonce",
					options: { submitForSettlement: "true" },
					type: "sale",
				},
			},
			errors: { validationErrors: {}, errorCollections: {} },
		},
		buyer: "66db427fdb0119d9234c1003",
		status: "Not Processed",
		createdAt: new Date("2024-09-20T11:00:00.000Z"),
		updatedAt: new Date("2024-09-20T11:00:00.000Z"),
		__v: 0,
	},
];
