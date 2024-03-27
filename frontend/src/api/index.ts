import { safeFetch } from "../http/safeFetch"
import { z } from "zod"

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