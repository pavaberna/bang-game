import { safeFetch } from "../http/safeFetch"
import { z } from "zod"

export const signup = (name: string, password: string) =>
    safeFetch({
        method: "POST",
        url: "/api/signup",
        data: { name, password }
    }, z.object({ id: z.number() }))