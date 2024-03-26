import { safeFetch } from "../http/safeFetch"
import { z } from "zod"

export const signup = (name: string, password: string) => safeFetch({
    url: "/api/signup",
    method: "POST",
    data: { name, password }
}, z.object({ id: z.number() }))


export const login = (name: string, password: string) => safeFetch({
    url: "/api/login",
    method: "POST",
    data: { name, password }
}, z.object({ token: z.string() }))


export const createGame = () => safeFetch({
    url: "/api/game",
    method: "POST",
    data: {}
}, z.object({ msg: z.string() }))