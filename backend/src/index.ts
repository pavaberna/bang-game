import express from "express"
import { z } from "zod"
import cors from "cors"

import { GameSchema, UserSchema } from "./model"
import { save, load } from "./util"

const server = express();


server.use(cors());
server.use(express.json());

// name -> id
server.post("/api/signup", async (req, res) => {
});

// name -> id
server.post("/api/login", async (req, res) => {
});

// groupsize, id -> 200/400/500
server.post("/api/game", async (req, res) => {
});

// id (user) id (game) -> 200/400/500
server.post("/api/join", async (req, res) => {
    // added to requests
});

// id (game) -> game
server.get("/api/state/:id", async (req, res) => {
});

// id (user) id (game) -> 200/400/500
server.post("/api/authorize", async (req, res) => {
    // from requests to players
});

// id (game) -> 200/400/500
server.post("/api/start", async (req, res) => {
    // last join -> role, character, isActive calculations, shuffled (unused) cards
});

// +1 / -1 -> 200/400/500
server.post("/api/game/:gameid/:playerid/life", async (req, res) => {
    // +log
});

// from array, index, to array -> 200/400/500
server.post("/api/game/:gameid/:playerid/move", async (req, res) => {
    // +log
});

server.post("/api/game/:gameid/reveal", async (req, res) => {
});

server.delete("/api/game/:gameid", async (req, res) => {
});

// cardsInHand -> inventoryCards
// cardsInHand -> playedCards
// cardsInHand -> usedCards
// inventoryCards -> usedCards
// inventoryCards -> cardsInHand
// playedCards -> usedCards

// unusedCards -> cardsInHand
// cardsInHand (other) -> cardsInHand
// unusedCards -> playedCards
// playedCards -> cardsInHand

// unusedCards -> communityCards
// communityCards -> cardsInHand

// life up/down




/* const roles = [
    "Sheriff",
    "Renegade",
    "Bandit",
    "Bandit",
    "Deputy",
    "Bandit",
    "Deputy",
] */

server.listen(3000);