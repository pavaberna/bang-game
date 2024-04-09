import express from "express"
import cors from "cors"
import { z } from "zod"
import { hash, compare } from "./util/hash"
import jwt from "jsonwebtoken"

import { GameSchema, UserSchema } from "./model"
import { save, load } from "./util/db"
import { createDeck, getCharacters, getRoles } from "./util/bang"

const server = express()
const serverPassword = "dghsdskasdasf"

server.use(cors())
server.use(express.json())

const SignUpRequestSchema = z.object({
  name: z.string().min(3),
  password: z.string().min(3)
})

server.post("/api/signup", async (req, res) => {
  const result = SignUpRequestSchema.safeParse(req.body)
  if (!result.success)
    return res.sendStatus(400).json(result.error.issues)

  const postData = result.data
  const { name, password } = postData

  const users = await load("users", UserSchema.array())
  if (!users)
    return res.sendStatus(500)

  const userAlreadyExists = users.some(user => user.name === name)
  if (userAlreadyExists)
    return res.sendStatus(409)

  const id = Math.random()
  const hashedPassword = await hash(password)
  users.push({ id, name, password: hashedPassword })

  const isSuccessful = await save("users", users, UserSchema.array())
  if (!isSuccessful)
    return res.sendStatus(500)

  return res.json({ id })
})

const LoginRequestSchema = z.object({
  name: z.string().min(3),
  password: z.string().min(3)
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

  const token = jwt.sign({ name: user.name }, serverPassword, { expiresIn: "1h" })

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
    unusedCards: [],
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
  const user = res.locals.user as Omit<User, "password">
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

  const saveResult = await save("games", games.map(game => game.id === id ? gameToUpdate : game), GameSchema.array())

  if (!saveResult.success)
    return res.sendStatus(500)

  res.json({ id })
})

// id (game) -> game
server.get("/api/game/:id", async (req, res) => {
  const user = res.locals.user as Omit<User, "password">
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
  const user = res.locals.user as Omit<User, "password">
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

  if (gameToUpdate.admin !== user.name) {
    return res.sendStatus(403)
  }

  const userId = result.data.userId
  const userToAuth = gameToUpdate.requests.find(player => player.id === userId)
  if (!userToAuth)
    return res.sendStatus(400)

  gameToUpdate.requests = gameToUpdate.requests.filter(player => player.id !== userId)
  gameToUpdate.joinedUsers.push(userToAuth)

  const saveResult = await save("games", games.map(game => game.id === id ? gameToUpdate : game), GameSchema.array())

  if (!saveResult.success)
    return res.sendStatus(500)

  res.json(saveResult)
})

server.delete("/api/game/:gameid/:username", async (req, res) => {
  const user = res.locals.user as Omit<User, "password">
  if (!user)
    return res.sendStatus(401)

  const games = await load("games", GameSchema.array())
  if (!games)
    return res.sendStatus(500)

  const id = req.params.gameid
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

  const saveResult = await save("games", games.map(game => game.id === +id ? gameToUpdate : game), GameSchema.array())

  if (!saveResult.success)
    return res.sendStatus(500)

  res.json(saveResult)
})

// id (game) -> 200/400/500
server.post("/api/start/:gameId", async (req, res) => {
  const user = res.locals.user as Omit<User, "password">
  if (!user)
    return res.sendStatus(401)

  const games = await load("games", GameSchema.array())
  if (!games)
    return res.sendStatus(500)

  const id = req.params.gameId
  const gameToUpdate = games.find(game => game.id === +id)
  if (!gameToUpdate)
    return res.sendStatus(404)

  const canStart = gameToUpdate.admin === user.name && gameToUpdate.joinedUsers.length <= 7 && gameToUpdate.joinedUsers.length >= 4
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

  const saveResult = await save("games", games.map(game => game.id === +id ? gameToUpdate : game), GameSchema.array())

  if (!saveResult.success)
    return res.sendStatus(500)

  res.json(saveResult)

})

// last join -> role, character, isActive calculations, shuffled (unused) cards
/* 
  "Sheriff",
  "Renegade",
  "Bandit",
  "Bandit",
  "Deputy",
  "Bandit",
  "Deputy",
*/

// +1 / -1 -> 200/400/500
server.post("/api/game/:gameid/:playerid/life") // +log

// from array, index, to array -> 200/400/500
server.post("/api/game/:gameid/:playerid/move") // +log

server.post("/api/game/:gameid/reveal")

server.delete("/api/game/:gameid")

server.listen(3000)