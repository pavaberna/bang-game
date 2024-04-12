import { z } from "zod"
import { safeFetch } from "../http/safeFetch"
import { GameSchema } from "../model"

export const signup = (name: string, password: string) => safeFetch({
    method: "POST",
    path: "/api/signup",
    data: { name, password }
}, z.object({ id: z.number() }))

export const login = (name: string, password: string) => safeFetch({
    method: "POST",
    path: "/api/login",
    data: { name, password }
}, z.object({ token: z.string() }))

export const createGame = () => safeFetch({
    method: "POST",
    path: "/api/game",
    data: {}
}, z.object({ id: z.number() }))

export const joinGame = (id: number) => safeFetch({
    method: "POST",
    path: "/api/join",
    data: { id }
}, z.object({ id: z.number() }))

export const getGame = (id: number) => safeFetch({
    method: "GET",
    path: "/api/game/" + id,
}, GameSchema)

export const authorize = (gameId: number, userId: number) => safeFetch({
    method: "POST",
    path: "/api/authorize",
    data: { gameId, userId }
}, z.object({ success: z.boolean() }))

export const deleteUserFromGame = (gameId: number, username: string) => safeFetch({
    method: "DELETE",
    path: "/api/game/" + gameId + "/" + username,
}, z.object({ success: z.boolean() }))

export const startGame = (id: number) => safeFetch({
    method: "POST",
    path: "/api/start/" + id,
    data: {}
}, z.object({ success: z.boolean() }))

export const init = () => safeFetch({
    method: "GET",
    path: "/api/init",
}, z.object({ name: z.string(), gameIds: z.number().array() }))

export const updateLife = (gameID: number, playerName: string, value: number) => safeFetch({
    method: "POST",
    path: `/api/game/life/${gameID}/${playerName}`,
    data: { value }
}, z.object({ success: z.boolean() }))

type MoveData = {
    cardId: number,
    fromPlayer: string | null,
    fromPlace: "hand" | "inventory" | "played" | "unused" | "community" | "used"
    targetPlayerName: string | null,
    targetPlace: "hand" | "inventory" | "played" | "unused" | "community" | "used"
    targetIndex: number
}

export const moveCard = (gameId: number, moveData: MoveData) => safeFetch({
    method: "POST",
    path: `/api/game/move/${gameId}`,
    data: moveData
}, z.object({ success: z.boolean() }))