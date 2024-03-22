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

export const safeFetch = async <Schema extends z.ZodTypeAny>(
    params: Params,
    schema: Schema
): Promise<Response<z.infer<typeof schema>>> => {

    try {
        const { url, method, data } = params
        const response = await fetch(url, {
            method,
            headers: data ? {
                'Content-Type': "application/JSON"
            } : {},
            body: data ? JSON.stringify(data) : undefined
        })

        if (response.status >= 299) return { success: false, status: response.status }

        const json = await response.json()

        const result = schema.safeParse(json)

        if (!result.success) return { success: false, status: response.status }

        return { data: result.data, success: true, status: response.status }

    } catch (error) {
        return { success: false, status: null }
    }
}