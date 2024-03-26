import bcrypt from "bcrypt"

/* const hashed1 = brypt.hashSync("alma", salt)
console.log(hashed1)

const hashed2 = brypt.hashSync("alma1", salt)
console.log(hashed2)

const hashed3 = brypt.hashSync("alma", salt)
console.log(hashed3) */

export const hash = async (data: string) => {
    const salt = await bcrypt.genSalt(10)
    const hashed = await bcrypt.hash(data, salt)
    return hashed
}

export const compare = async (data: string, hash: string) => {
    return await bcrypt.compare(data, hash)
}