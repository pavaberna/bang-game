import { z } from "zod"

export const UserSchema = z.object({
    id: z.number(),
    name: z.string(),
});

export const RoleSchema = z.object({
    name: z.union([
        z.literal("Sherif"),
        z.literal("Deputy"),
        z.literal("Renegade"),
        z.literal("Bandit"),
    ]),
    imgUrl: z.string().url(),
});

export const CharacterSchema = z.object({
    name: z.string(),
    url: z.string(),
    description: z.string(),
    imgUrl: z.string().url(),
});

export const CardSchema = z.object({
    isIstant: z.boolean(),
    title: z.string(),
    imgUrl: z.string().url(),
    description: z.object({
        imgurl: z.string().url(),
        text: z.string(),
    }),
    signature: z.object({
        number: z.string(),
        sign: z.string(),
    })
});

export const PlayerSchema = z.object({
    userId: z.number(),
    role: RoleSchema,
    isRevealed: z.boolean(),
    character: CharacterSchema,
    life: z.number(),
    inventoryCards: CardSchema.array(),
    cardsInHand: CardSchema.array(),
    playedCards: CardSchema.array(),
    isActive: z.boolean(),
});

export const LogSchema = z.object({
    playerName: z.string(),
    interaction: z.string()
})

export const GameSchema = z.object({
    id: z.number(),
    admin: z.number(),
    requests: UserSchema.array(),
    player: PlayerSchema.array(),
    unusedCards: CardSchema.array(),
    communityCards: CardSchema.array(),
    usedCards: CardSchema.array(),
    logs: LogSchema.array(),
});
