import { z } from "zod"

type Response<Data> = {
    success: true
    status: number
    data: Data
} | {
    success: false
    status: number | null
}

type Params = {
    url: string
    method: "GET" | "POST" | "PATCH" | "DELETE"
    data?: any
}
const baseUrl = "http://localhost:3000"

export const safeFetch = async <Schema extends z.ZodTypeAny>(
    params: Params,
    schema: Schema
): Promise<Response<z.infer<typeof schema>>> => {

    let response;
    try {
        const { url, method, data } = params
        response = await fetch(baseUrl + url, {
            method,
            headers: data ? {
                'Content-Type': "application/JSON"
            } : {},
            body: data ? JSON.stringify(data) : undefined
        })
    } catch (error) {
        return { success: false, status: null }
    }

    if (response.status > 299) return { success: false, status: response.status }

    let json;
    try {
        json = await response.json()
    } catch (error) {
        return { success: false, status: response.status }
    }

    const result = schema.safeParse(json)
    if (!result.success) return { success: false, status: response.status }

    return { data: result.data, success: true, status: response.status }
}