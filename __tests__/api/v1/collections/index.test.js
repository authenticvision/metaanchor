import api from '@/pages/api/v1/collections/[csn]/[anchor]'
import { createMocks } from 'node-mocks-http'

import { createTestContext } from '@/__tests__/__helpers'

const ctx = createTestContext()

describe('/api/v1/collections/[csn]/[anchor]', () => {
	it('responds with a 405 if using wrong method', async () => {
		const { req, res } = createMocks({
			method: 'POST',
			query: {
				csn: 'BEEF',
				anchor: '0x505def45449ab0da5a5d58456298c4e2634c698cccc30f6259e3c6695c664731'
			}
		})

		await api(req, res)
		const data = await res._getJSONData()

		expect(res.statusCode).toEqual(405)
	})

	it('responds with a 404 if csn does not exist', async () => {
		const { req, res } = createMocks({
			method: 'GET',
			query: {
				csn: 'BEEF',
				anchor: '0x505def45449ab0da5a5d58456298c4e2634c698cccc30f6259e3c6695c664731'
			}
		})

		await api(req, res)
		const data = await res._getJSONData()

		expect(res.statusCode).toEqual(404)
		expect(data).toEqual({
			message: 'CSN does not exists on our records'
		})
	})

	it('responds with the name, description based on contract settings', async () => {
		const wallet = await ctx.db.wallet.create({
			data: {
				address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' // this is the first hardhat testing wallet
			}
		})

		const contract = await ctx.db.contract.create({
			data: {
				csn: 'BEEF',
				name: 'Deadbeef',
				address: '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
				network: 'local-test',
				settings: {
					NFT_NAME: "DigitalSoul [ANCHOR_SHORT]", // Tests the contract-wise settings including Variables
					NFT_DESCRIPTION: "Contract is deployed at [CONTRACT_ADDRESS] as '[COLLECTION_NAME]'" // 
				},
				owner: {
					connect: {
						id: wallet.id
					}
				}
			}
		})

		const nft = await ctx.db.NFT.create({
			data: {
				slid: 'TEST',
				anchor: '0x505def45449ab0da5a5d58456298c4e2634c698cccc30f6259e3c6695c664731',
				metadata: {
					"some": "value"
				},
				contract: {
					connect: {
						id: contract.id
					}
				}
			}
		})

		const { req, res } = createMocks({
			method: 'GET',
			query: {
				csn: 'BEEF',
				anchor: '0x505def45449ab0da5a5d58456298c4e2634c698cccc30f6259e3c6695c664731'
			}
		})

		await api(req, res)
		const data = await res._getJSONData()

		expect(data).toEqual({
			name: 'DigitalSoul 0x505d…4731',
			description: "Contract is deployed at 0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF as 'Deadbeef'",
			some: "value"
		})
	})

	it('responds with replaced nft.private_data variables', async () => {
		const wallet = await ctx.db.wallet.create({
			data: {
				address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' // this is the first hardhat testing wallet
			}
		})

		const contract = await ctx.db.contract.create({
			data: {
				csn: 'BEEF',
				name: 'Deadbeef',
				address: '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
				network: 'local-test',
				settings: {
					NFT_NAME: "DigitalSoul #[MY_PRIVATE_VALUE]", // Tests the contract-wise settings including Variables
					NFT_DESCRIPTION: "Contract is deployed at [CONTRACT_ADDRESS] as '[COLLECTION_NAME]'" // 
				},
				owner: {
					connect: {
						id: wallet.id
					}
				}
			}
		})

		const nft = await ctx.db.NFT.create({
			data: {
				slid: 'TEST',
				anchor: '0x505def45449ab0da5a5d58456298c4e2634c698cccc30f6259e3c6695c664731',
				metadata: {
					"some": "value",
					"attributes": [{
						"type": "SuperFancy",
						"value": "[MY_PRIVATE_VALUE]"
					}]
				},
				privateData: {
					"my_private_value": "002"
				},
				contract: {
					connect: {
						id: contract.id
					}
				}
			}
		})

		const { req, res } = createMocks({
			method: 'GET',
			query: {
				csn: 'BEEF',
				anchor: '0x505def45449ab0da5a5d58456298c4e2634c698cccc30f6259e3c6695c664731'
			}
		})

		await api(req, res)
		const data = await res._getJSONData()

		expect(data).toEqual({
			name: 'DigitalSoul #002',
			description: "Contract is deployed at 0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF as 'Deadbeef'",
			some: "value",
			attributes: [{
				type: "SuperFancy",
				value: "002"
			}]
		})
	})
})
