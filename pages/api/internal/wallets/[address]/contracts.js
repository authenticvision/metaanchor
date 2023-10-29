import { getServerSession } from "next-auth/next"
import { authOptions } from "@/pages/api/auth/[...nextauth]"

import prisma from '@/lib/prisma'

const allowedMethods = ['GET']

export default async function handle(req, res) {
	const session = await getServerSession(req, res, authOptions)
	if (!session) {
		return res.status(401).json({ message: 'Unauthorized' })
	}

	let errorMsg

	if (!allowedMethods.includes(req.method) || req.method == 'OPTIONS') {
		return res.status(405).json({ message: 'Method not allowed.' })
	}

	const { address } = req.query

	if (!address) {
		return res.status(400).json({ message: 'Missing required parameters' })
	}

	const wallet = await prisma.wallet.findUnique({
		where: {
			address
		}
	})

	if (!wallet) {
		return res.status(404).json({ message: 'Wallet does not exists' })
	}

	const contracts = await prisma.contract.findMany({
		where: {
			ownerId: wallet.id
		}
	})

	res.json({ contracts })
}
