import bcrypt from "bcrypt"

export const hash = async (data: string) => {
    const salt = await bcrypt.genSalt(10)
    const hashed = await bcrypt.hash(data, salt)
    return hashed
}

export const compare = async (data: string, hash: string) => {
    return await bcrypt.compare(data, hash)
}