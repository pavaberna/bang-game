import { z } from "zod"
import safeFetch from "../http/safeFetch"
import { GameSchema } from "../model"

export const signup = (name: string, password: string) => safeFetch({
    method: "POST",
    path: "http://localhost:3000/api/signup",
    data: { name, password }
}, z.object({ id: z.number() }))

export const login = (name: string, password: string) => safeFetch({
    method: "POST",
    path: "http://localhost:3000/api/login",
    data: { name, password }
}, z.object({ token: z.string() }))

export const createGame = () => safeFetch({
    method: "POST",
    path: "http://localhost:3000/api/game",
    data: {}
}, z.object({ id: z.number() }))

export const joinGame = (id: number) => safeFetch({
    method: "POST",
    path: "http://localhost:3000/api/join",
    data: { id }
}, z.object({ id: z.number() }))

export const getGame = (id: number) => safeFetch({
    method: "GET",
    path: "http://localhost:3000/api/game/" + id,
}, GameSchema)

export const authorize = (gameId: number, userId: number) => safeFetch({
    method: "POST",
    path: "http://localhost:3000/api/authorize",
    data: { gameId, userId }
}, z.object({ success: z.boolean() }))

export const deleteUserFromGame = (gameId: number, username: string) => safeFetch({
    method: "DELETE",
    path: "http://localhost:3000/api/game/" + gameId + "/" + username,
}, z.object({ success: z.boolean() }))