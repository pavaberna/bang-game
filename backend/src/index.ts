import express from "express"
import cors from "cors"
import { z } from "zod"

import { GameSchema, UserSchema } from "./model"
import { save, load } from "./util/db"

const server = express()

server.use(cors())
server.use(express.json())

// name -> id
server.post("/api/signup")

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