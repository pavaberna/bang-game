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

// name -> id
const SignUpRequestSchema = z.object({
  name: z.string().min(3),
  password: z.string().min(3)
})


server.post("/api/signup", async (req, res) => {
  const result = SignUpRequestSchema.safeParse(req.body)
  if (!result.success) return res.sendStatus(400).json(result.error.issues)

  const postData = result.data
  const { name, password } = postData

  const users = await load("users", UserSchema.array())
  if (!users) return res.sendStatus(500)

  const userAlreadyExists = users.some(user => user.name === name)
  if (userAlreadyExists) return res.sendStatus(409)

  const id = Math.random()
  const hashedPassword = await hash(password)
  users.push({ id, name, password: hashedPassword })

  const isSuccessful = await save("users", users, UserSchema.array())
  if (!isSuccessful) return res.sendStatus(500)

  return res.json({ id })
})

const LoginRequestSchema = z.object({
  name: z.string().min(3),
  password: z.string().min(3)
})

// name -> id
server.post("/api/login", async (req, res) => {
  const result = LoginRequestSchema.safeParse(req.body)
  if (!result.success) return res.sendStatus(400).json(result.error.issues)

  const { name, password } = result.data

  const users = await load("users", UserSchema.array())
  if (!users) return res.sendStatus(500)

  const user = users.find(user => user.name === name)
  if (!user) return res.sendStatus(401)

  const isAuthenticated = await compare(password, user.password)
  if (!isAuthenticated) return res.sendStatus(401)

  const token = jwt.sign({ name: user.name }, serverPassword, { expiresIn: "1h" })

  return res.json({ token })
})

const Headers = z.object({
  auth: z.string()
})

// id -> 200/400/500
server.post("/api/game", async (req, res) => {
  const result = Headers.safeParse(req.headers)
  if (!result.success) return res.sendStatus(401)

  const { auth } = result.data

  let tokenPayload;

  try {
    tokenPayload = jwt.verify(auth, serverPassword)
  } catch (error) {
    return res.sendStatus(401)
  }

  res.json({ msg: "ok" })
})

// id (user), id (game) -> 200/400/500
server.post("/api/join") // added to requests

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