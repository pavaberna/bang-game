import express from "express"
import cors from "cors"
import { z } from "zod"
import { hash, compare } from "./util/hash"
import jwt from "jsonwebtoken"

import { GameSchema, UserSchema, CardSchema } from "./model"
import { save, load } from "./util/db"
import { createDeck, getCharacters, getRoles } from "./util/bang"

type Card = z.infer<typeof CardSchema>

const server = express()
const serverPassword = "asfashhasfkvasuQ"

server.use(cors())
server.use(express.json())

const SignupRequestSchema = z.object({
  name: z.string().min(3),
  password: z.string().min(3),
})

server.post("/api/signup", async (req, res) => {
  const result = SignupRequestSchema.safeParse(req.body)
  if (!result.success)
    return res.sendStatus(400)
  const { name, password } = result.data

  const users = await load("users", UserSchema.array())
  if (!users)
    return res.sendStatus(500)

  const userExists = users.some(user => user.name === name)
  if (userExists)
    return res.sendStatus(409)

  const id = Math.random()
  const hashedPassword = await hash(password)
  users.push({ id, name, password: hashedPassword })

  const isCreated = await save("users", users, UserSchema.array())
  if (!isCreated)
    return res.sendStatus(500)

  return res.json({ id })
})

const LoginRequestSchema = z.object({
  name: z.string().min(3),
  password: z.string().min(3),
})

server.post("/api/login", async (req, res) => {
  const result = LoginRequestSchema.safeParse(req.body)
  if (!result.success)
    return res.sendStatus(400)
  const { name, password } = result.data

  const users = await load("users", UserSchema.array())
  if (!users)
    return res.sendStatus(500)

  const user = users.find(user => user.name === name)
  if (!user)
    return res.sendStatus(401)

  const isCorrect = await compare(password, user.password)
  if (!isCorrect)
    return res.sendStatus(401)

  const token = jwt.sign({ name: user.name }, serverPassword)

  return res.json({ token })
})

const Headers = z.object({
  auth: z.string(),
})

const safeVerify = <Schema extends z.ZodTypeAny>(
  token: string, schema: Schema
): z.infer<typeof schema> | null => {
  try {
    const tokenPayload = jwt.verify(token, serverPassword)
    return schema.parse(tokenPayload)
  } catch (error) {
    return null
  }
}

server.use(async (req, res, next) => {
  const result = Headers.safeParse(req.headers)
  if (!result.success)
    return next()

  const { auth } = result.data
  if (!auth)
    return next()

  const tokenPayload = safeVerify(auth, z.object({ name: z.string() }))
  if (!tokenPayload)
    return next()

  const users = await load("users", UserSchema.omit({ password: true }).array())
  if (!users)
    return res.sendStatus(500)

  const user = users.find(user => user.name === tokenPayload.name)
  if (!user)
    return next()
  res.locals.user = user
  next()
})

type User = z.infer<typeof UserSchema>

server.post("/api/game", async (req, res) => {
  const user = res.locals.user as User
  if (!user)
    return res.sendStatus(401)

  const id = Math.floor(Math.random() * 10000)
  const newGame = {
    id,
    admin: user.name,
    hasStarted: false,
    requests: [],
    joinedUsers: [],
    players: [],
    communityCards: [],
    usedCards: [],
    logs: [],
    unusedCards: []
  }

  const games = await load("games", GameSchema.array())
  if (!games)
    return res.sendStatus(500)

  games.push(newGame)

  const saveResult = await save("games", games, GameSchema.array())
  if (!saveResult.success)
    return res.sendStatus(500)

  res.json({ id })
})

const JoinRequestSchema = z.object({
  id: z.number(),
})

server.post("/api/join", async (req, res) => {
  const user = res.locals.user as Omit<User, 'password'>
  if (!user)
    return res.sendStatus(401)

  const result = JoinRequestSchema.safeParse(req.body)
  if (!result.success)
    return res.sendStatus(400)
  const { id } = result.data

  const games = await load("games", GameSchema.array())
  if (!games)
    return res.sendStatus(500)

  const gameToUpdate = games.find(game => game.id === id)
  if (!gameToUpdate)
    return res.sendStatus(404)

  if (
    gameToUpdate.requests.find(player => player.name === user.name) ||
    gameToUpdate.joinedUsers.find(player => player.name === user.name)
  ) return res.json({ id })


  if (gameToUpdate.admin === user.name) {
    gameToUpdate.joinedUsers.push(user)
  } else {
    gameToUpdate.requests.push(user)
  }

  const saveResult = await save("games", games
    .map(game => game.id === id ? gameToUpdate : game), GameSchema.array())

  if (!saveResult.success)
    return res.sendStatus(500)

  res.json({ id })
})

server.get("/api/game/:id", async (req, res) => {
  const user = res.locals.user as Omit<User, 'password'>
  if (!user)
    return res.sendStatus(401)

  const games = await load("games", GameSchema.array())
  if (!games)
    return res.sendStatus(500)

  const id = req.params.id
  const game = games.find(game => game.id === +id)
  if (!game)
    return res.sendStatus(404)

  return res.json(game)
})

const AuthorizeRequest = z.object({
  gameId: z.number(),
  userId: z.number(),
})

server.post("/api/authorize", async (req, res) => {
  const user = res.locals.user as Omit<User, 'password'>
  if (!user)
    return res.sendStatus(401)

  const result = AuthorizeRequest.safeParse(req.body)
  if (!result.success)
    return res.sendStatus(400)

  const games = await load("games", GameSchema.array())
  if (!games)
    return res.sendStatus(500)

  const id = result.data.gameId
  const gameToUpdate = games.find(game => game.id === +id)
  if (!gameToUpdate)
    return res.sendStatus(404)

  if (gameToUpdate.admin !== user.name)
    return res.sendStatus(403)

  const userId = result.data.userId
  const userToAuth = gameToUpdate.requests.find(player => player.id === userId)
  if (!userToAuth)
    return res.sendStatus(400)

  gameToUpdate.requests = gameToUpdate.requests.filter(player => player.id !== userId)
  gameToUpdate.joinedUsers.push(userToAuth)

  const saveResult = await save("games", games
    .map(game => game.id === id ? gameToUpdate : game), GameSchema.array())

  if (!saveResult.success)
    return res.sendStatus(500)

  res.json(saveResult)
})

server.delete("/api/game/:gameId/:username", async (req, res) => {
  const user = res.locals.user as Omit<User, 'password'>
  if (!user)
    return res.sendStatus(401)

  const games = await load("games", GameSchema.array())
  if (!games)
    return res.sendStatus(500)

  const id = req.params.gameId
  const gameToUpdate = games.find(game => game.id === +id)
  if (!gameToUpdate)
    return res.sendStatus(404)

  const username = req.params.username
  const playerToDelete = gameToUpdate.joinedUsers.find(user => user.name === username)
  if (!playerToDelete)
    return res.sendStatus(404)

  const canDelete = playerToDelete.name === user.name || gameToUpdate.admin === user.name
  if (!canDelete)
    return res.sendStatus(403)

  gameToUpdate.joinedUsers = gameToUpdate.joinedUsers.filter(user => user.name !== username)

  const saveResult = await save("games", games
    .map(game => game.id === +id ? gameToUpdate : game), GameSchema.array())

  if (!saveResult.success)
    return res.sendStatus(500)

  res.json(saveResult)
})

// id (game) -> 200/400/500
server.post("/api/start/:gameId", async (req, res) => {
  const user = res.locals.user as Omit<User, 'password'>
  if (!user)
    return res.sendStatus(401)

  const games = await load("games", GameSchema.array())
  if (!games)
    return res.sendStatus(500)

  const id = req.params.gameId
  const gameToUpdate = games.find(game => game.id === +id)
  if (!gameToUpdate)
    return res.sendStatus(404)

  const canStart = gameToUpdate.admin === user.name &&
    gameToUpdate.joinedUsers.length <= 7 &&
    4 <= gameToUpdate.joinedUsers.length
  if (!canStart)
    return res.sendStatus(403)

  gameToUpdate.hasStarted = true
  gameToUpdate.requests = []

  const numberOfPlayers = gameToUpdate.joinedUsers.length
  const roles = getRoles(numberOfPlayers)
  const characters = getCharacters(numberOfPlayers)
  const deck = createDeck()
  gameToUpdate.players = gameToUpdate.joinedUsers.map((user, index) => {
    const role = roles[index]
    const character = characters[index]
    const life = role.name === "Sheriff" ? character.life + 1 : character.life
    const drawnCards = deck.splice(0, life)
    return {
      name: user.name,
      role,
      character,
      isRevealed: role.name === "Sheriff",
      life,
      isActive: role.name === "Sheriff",
      cardsInHand: drawnCards,
      inventoryCards: [],
      playedCards: [],
    }
  })

  gameToUpdate.joinedUsers = []

  gameToUpdate.unusedCards = deck

  const saveResult = await save("games", games
    .map(game => game.id === +id ? gameToUpdate : game), GameSchema.array())

  if (!saveResult.success)
    return res.sendStatus(500)

  res.json(saveResult)
})

server.get("/api/init", async (req, res) => {
  const user = res.locals.user as Omit<User, 'password'>
  if (!user)
    return res.sendStatus(401)

  const games = await load("games", GameSchema.array())
  if (!games)
    return res.sendStatus(500)

  const gamesOfUser = games.filter(game => (
    game.requests.some(player => player.name === user.name) ||
    game.joinedUsers.some(player => player.name === user.name) ||
    game.players.some(player => player.name === user.name)
  )).map(game => game.id)

  res.json({
    name: user.name,
    gameIds: gamesOfUser
  })
})

const LifeRequest = z.object({
  value: z.number()
})

server.post("/api/game/life/:gameId/:playerName", async (req, res) => {
  const user = res.locals.user as Omit<User, 'password'>
  if (!user)
    return res.sendStatus(401)

  const result = LifeRequest.safeParse(req.body)
  if (!result.success)
    return res.sendStatus(400)
  const { value } = result.data

  const games = await load("games", GameSchema.array())
  if (!games)
    return res.sendStatus(500)

  const id = req.params.gameId
  const gameToUpdate = games.find(game => game.id === +id)
  if (!gameToUpdate)
    return res.sendStatus(404)

  const playerName = req.params.playerName
  if (playerName !== user.name)
    return res.sendStatus(403)
  const player = gameToUpdate.players
    .find(player => player.name === playerName)

  if (!player)
    return res.sendStatus(404)

  player.life += value
  gameToUpdate.logs = [
    {
      playerName,
      interaction: `Élet módosítás (${value})`
    },
    ...gameToUpdate.logs
  ]
  const saveResult = await save("games", games
    .map(game => game.id === +id ? gameToUpdate : game), GameSchema.array())

  if (!saveResult.success)
    return res.sendStatus(500)

  res.json(saveResult)
})

const MoveRequestSchema = z.object({
  cardId: z.number(),
  fromPlayer: z.string().nullable(),
  fromPlace: z.union([
    z.literal("hand"),
    z.literal("inventory"),
    z.literal("played"),
    z.literal("unused"),
    z.literal("community"),
    z.literal("used"),
  ]),
  targetPlayerName: z.string().nullable(),
  targetPlace: z.union([
    z.literal("hand"),
    z.literal("inventory"),
    z.literal("played"),
    z.literal("unused"),
    z.literal("community"),
    z.literal("used"),
  ]),
  targetIndex: z.number(),
})

type MoveRequest = z.infer<typeof MoveRequestSchema>

// from array, index, to array -> 200/400/500
server.post("/api/game/move/:gameId", async (req, res) => {
  const user = res.locals.user as Omit<User, 'password'>
  if (!user)
    return res.sendStatus(401)

  const result = MoveRequestSchema.safeParse(req.body)
  if (!result.success)
    return res.sendStatus(400)
  const moveRequest = result.data

  const games = await load("games", GameSchema.array())
  if (!games)
    return res.sendStatus(500)

  const id = req.params.gameId
  const gameToUpdate = games.find(game => game.id === +id)
  if (!gameToUpdate)
    return res.sendStatus(404)

  const cardId = moveRequest.cardId
  let cardToMove: Card | null = null
  if (moveRequest.fromPlayer) {
    const fromPlayer = gameToUpdate.players.find(player => player.name === moveRequest.fromPlayer)
    if (!fromPlayer)
      return res.sendStatus(404)
    if (moveRequest.fromPlace === "hand") {
      const card = fromPlayer.cardsInHand.find(card => card.id === cardId)
      if (!card)
        return res.sendStatus(404)
      fromPlayer.cardsInHand = fromPlayer.cardsInHand.filter(card => card.id !== cardId)
      cardToMove = card
    }
    if (moveRequest.fromPlace === "inventory") {
      const card = fromPlayer.inventoryCards.find(card => card.id === cardId)
      if (!card)
        return res.sendStatus(404)
      fromPlayer.inventoryCards = fromPlayer.inventoryCards.filter(card => card.id !== cardId)
      cardToMove = card
    }
    if (moveRequest.fromPlace === "played") {
      const card = fromPlayer.playedCards.find(card => card.id === cardId)
      if (!card)
        return res.sendStatus(404)
      fromPlayer.playedCards = fromPlayer.playedCards.filter(card => card.id !== cardId)
      cardToMove = card
    }
  } else {
    if (moveRequest.fromPlace === "unused") {
      const card = gameToUpdate.unusedCards.find(card => card.id === cardId)
      if (!card)
        return res.sendStatus(404)
      gameToUpdate.unusedCards = gameToUpdate.unusedCards.filter(card => card.id !== cardId)
      cardToMove = card
    }
    if (moveRequest.fromPlace === "used") {
      const card = gameToUpdate.usedCards.find(card => card.id === cardId)
      if (!card)
        return res.sendStatus(404)
      gameToUpdate.usedCards = gameToUpdate.usedCards.filter(card => card.id !== cardId)
      cardToMove = card
    }
    if (moveRequest.fromPlace === "community") {
      const card = gameToUpdate.communityCards.find(card => card.id === cardId)
      if (!card)
        return res.sendStatus(404)
      gameToUpdate.communityCards = gameToUpdate.communityCards.filter(card => card.id !== cardId)
      cardToMove = card
    }
  }

  if (!cardToMove)
    return res.sendStatus(404)

  const index = moveRequest.targetIndex
  if (moveRequest.targetPlayerName) {
    const targetPlayer = gameToUpdate.players.find(player => player.name === moveRequest.targetPlayerName)
    if (!targetPlayer)
      return res.sendStatus(404)
    if (moveRequest.targetPlace === "hand") {
      if (index > targetPlayer.cardsInHand.length)
        return res.sendStatus(400)
      targetPlayer.cardsInHand.splice(index, 0, cardToMove)
    }
    if (moveRequest.targetPlace === "played") {
      if (index > targetPlayer.playedCards.length)
        return res.sendStatus(400)
      targetPlayer.playedCards.splice(index, 0, cardToMove)
    }
    if (moveRequest.targetPlace === "inventory") {
      if (index > targetPlayer.playedCards.length)
        return res.sendStatus(400)
      targetPlayer.inventoryCards.splice(index, 0, cardToMove)
    }
  } else {
    if (moveRequest.targetPlace === "community") {
      if (index > gameToUpdate.communityCards.length)
        return res.sendStatus(400)
      gameToUpdate.communityCards.splice(index, 0, cardToMove)
    }
    if (moveRequest.targetPlace === "used") {
      if (index > gameToUpdate.communityCards.length)
        return res.sendStatus(400)
      gameToUpdate.usedCards.splice(index, 0, cardToMove)
    }
    if (moveRequest.targetPlace === "unused") {
      if (index > gameToUpdate.communityCards.length)
        return res.sendStatus(400)
      gameToUpdate.unusedCards.splice(index, 0, cardToMove)
    }
  }

  const formatMove = (move: MoveRequest): string => {
    return `
      Kártya átmozgatva (${moveRequest.cardId})
    `.trim()
  }

  gameToUpdate.logs = [
    {
      playerName: user.name,
      interaction: formatMove(moveRequest)
    },
    ...gameToUpdate.logs
  ]

  const saveResult = await save("games", games
    .map(game => game.id === +id ? gameToUpdate : game), GameSchema.array())

  if (!saveResult.success)
    return res.sendStatus(500)

  res.json(saveResult)

})

server.post("/api/game/:gameid/reveal")

server.delete("/api/game/:gameid")

server.listen(3000)