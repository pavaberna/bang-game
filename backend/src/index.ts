import express from "express"
import cors from "cors"
import { z } from "zod"
import { hash, compare } from "./util/hash"
import jwt from "jsonwebtoken"

import { GameSchema, UserSchema } from "./model"
import { save, load } from "./util/db"

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
    return res.sendStatus(400).json(result.error.issues)

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

  const id = Math.random()
  const newGame = {
    id,
    admin: user.name,
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
server.get("/api/state/:id")

// id (user) id (game) -> 200/400/500
server.post("/api/authorize") // from requests to players

// id (game) -> 200/400/500
server.post("/api/start")
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