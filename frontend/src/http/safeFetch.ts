import { z } from 'zod';

type Response<Data> =
    | {
        success: true;
        status: number;
        data: Data;
    }
    | {
        success: false;
        status: number | null;
    };

type Params = {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
};

const baseUrl = 'http://localhost:3000';

export const safeFetch = async <Schema extends z.ZodTypeAny>(
    params: Params,
    schema: Schema
): Promise<Response<z.infer<typeof schema>>> => {
    const token = localStorage.getItem('token')
    let response;
    try {
        const { path, method, data } = params;
        response = await fetch(baseUrl + path, {
            method,
            headers: data
                ? {
                    'Content-Type': 'application/JSON',
                    'auth': token || "",
                }
                : { 'auth': token || "", },
            body: data ? JSON.stringify(data) : undefined,
        });
    } catch (error) {
        return {
            success: false,
            status: null,
        };
    }

    if (response.status > 299)
        return {
            success: false,
            status: response.status,
        };

    let json;
    try {
        json = await response.json();
    } catch (error) {
        return {
            success: false,
            status: response.status,
        };
    }

    const result = schema.safeParse(json);
    if (!result.success)
        return {
            success: false,
            status: response.status,
        };

    return {
        success: true,
        status: response.status,
        data: result.data,
    };
};

