// imports
import { Flashcore } from '@roboplay/robo.js'
import { Snowflake } from 'discord.js'

/**
 * Returns random index value from array
 * @param arr
 * @returns array element
 */
const randomFromArray = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)]

/**
 * Player profile typing
 */
export type PlayerProfile = {
	id: Snowflake | number
	wallet: number
	bank: number
	timer: unknown
}

/**
 * Create player profile with ID
 * @param id
 * @param guild
 */
export const createPlayerProfile = async (id: Snowflake, guild: Snowflake) => {
	const userProfile: PlayerProfile = {
		id,
		wallet: 500,
		bank: 500,
		timer: null
	}
	await Flashcore.set(`${id}_${guild}`, JSON.stringify(userProfile))
}

/**
 *  View player profile with ID
 * @param id
 * @param guild
 */
export const getPlayerProfile = async (id: Snowflake, guild: Snowflake) => {
	const data = await Flashcore.get(`${id}_${guild}`)
	return data ? JSON.parse(data as string) : undefined
}

/**
 * Withdraw Player's Money
 * @param amount
 * @param id
 * @param guild
 */
export const withdrawPlayerMoney = async (amount: number, id: Snowflake, guild: Snowflake) => {
	const userProfile: PlayerProfile = JSON.parse(await Flashcore.get(`${id}_${guild}`))
	if (userProfile.bank < amount) return '**Insufficient funds** in your bank to complete the withdrawal'
	userProfile.wallet += amount
	userProfile.bank -= amount
	await Flashcore.set(`${id}_${guild}`, JSON.stringify(userProfile))
	return `You withdrew **$${amount}** credits from your bank to your wallet.`
}

/**
 * Deposit Player's Money
 * @param amount
 * @param id
 * @param guild
 */
export const depositPlayerMoney = async (amount: number, id: Snowflake, guild: Snowflake) => {
	const userProfile: PlayerProfile = JSON.parse(await Flashcore.get(`${id}_${guild}`))
	if (userProfile.wallet < amount) return 'Apologies, your wallet **balance is too low** for this deposit'
	userProfile.wallet -= amount
	userProfile.bank += amount
	await Flashcore.set(`${id}_${guild}`, JSON.stringify(userProfile))
	return `Your wallet is a little lighter now, but your bank balance increased by **$${amount}** credits.`
}

/**
 * Transfers money from one bank ac to another
 * @param amount
 * @param sender
 * @param receiver
 * @param guild
 */
export const sharePlayerMoney = async (amount: number, sender: Snowflake, receiver: Snowflake, guild: Snowflake) => {
	// get profiles
	const senderProfile: PlayerProfile = JSON.parse(await Flashcore.get(`${sender}_${guild}`))
	const receiverProfile: PlayerProfile = (await Flashcore.get(`${receiver}_${guild}`))
		? JSON.parse(await Flashcore.get(`${receiver}_${guild}`))
		: undefined

	// not same
	if (sender == receiver) {
		return "Oops, you **can't send credits to yourself**. Please select a different recipient."
	}

	// balance check
	if (senderProfile.wallet < amount) {
		return "Your generosity is admirable, but **you don't have enough credits** in your wallet to share."
	}

	// no profile
	if (!receiverProfile) {
		return `<@${receiver}> Haven't created their player profile yet :(`
	}

	// check balance
	if (senderProfile.wallet < amount) {
		return 'You must have enough credits in you wallet!'
	}

	// ++ receiver balance
	receiverProfile.wallet += amount
	await Flashcore.set(`${receiver}_${guild}`, JSON.stringify(receiverProfile))

	// -- sender balance
	senderProfile.wallet -= amount
	await Flashcore.set(`${sender}_${guild}`, JSON.stringify(senderProfile))

	// return status
	return `Successfully! Sent \` $${amount} \` to <@${receiver}> from <@${sender}>'s Wallet!`
}

/**
 * Roll dice game
 * @param number
 * @param amount
 * @param id
 * @param guild
 */
export const rollDiceGame = async (num: number, amount: number, id: Snowflake, guild: Snowflake) => {
	// get player
	const playerProfile: PlayerProfile = JSON.parse(await Flashcore.get(`${id}_${guild}`))
	const dices: number[] = [1, 2, 3, 4, 5, 6]

	// balance check
	if (playerProfile.wallet < amount) {
		return 'Sorry, your wallet balance is **insufficient** for this game.'
	}

	// num check
	if (!dices.includes(num)) {
		num = randomFromArray(dices)
	}

	// win num
	const winNum = randomFromArray(dices)
	let win = false

	// if win
	if (winNum == num) {
		win = true
		playerProfile.wallet += amount
	}

	// if not win
	if (winNum !== num) {
		win = false
		playerProfile.wallet -= amount
	}

	// save results
	await Flashcore.set(`${id}_${guild}`, JSON.stringify(playerProfile))

	// return status
	return `The dice landed on \` ${winNum} \`. You **${(win
		? 'Won'
		: 'Loose'
	).toUpperCase()}** total **$${amount}** credits.`
}
