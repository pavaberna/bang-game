import express from "express"
import cors from "cors"
import { Schema, z } from "zod"
import fs from "fs/promises"
import { hash } from "./util/hash"

import { GameSchema, UserSchema } from "./model"
import { save, load } from "./util/db"

const server = express()

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


// name -> id
server.post("/api/login")

// id -> 200/400/500
server.post("/api/game")

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