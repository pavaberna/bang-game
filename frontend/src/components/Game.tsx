import { useState, useEffect } from 'react';
import { authorize, getGame, deleteUserFromGame, startGame, updateLife, moveCard } from '../api';
import { GameSchema, PlayerSchema, UserSchema } from '../model';
import { set, z } from 'zod';
import { formatId } from '../util/formatId';

type Game = z.infer<typeof GameSchema>;
type User = z.infer<typeof UserSchema>;
type Player = z.infer<typeof PlayerSchema>
type Props = {
    gameId: number;
    loggedInUserName: string;
    back: () => void;
}

const Game = ({ gameId, loggedInUserName, back }: Props) => {

    const [game, setGame] = useState<Game | null>(null);
    const [updatingLife, setUpdatingLife] = useState(false);

    useEffect(() => {
        setInterval(async () => {
            const response = await getGame(gameId);
            if (!response.success) return;
            setGame(response.data);
        }, 500);
    }, []);

    /*  const formatId1 = (id: number) => {
         return (formatId(id))
     }
  */
    const addPlayer = async (playerId: number): Promise<void> => {
        authorize(gameId, playerId);
    };

    const deletePlayer = async (username: string) => {
        deleteUserFromGame(gameId, username);
    };

    const initGame = async () => {
        startGame(gameId);
    };

    const handleUpdateLife = async (value: number) => {
        setUpdatingLife(true)
        const result = await updateLife(gameId, loggedInUserName, value)
        setUpdatingLife(false)
        if (!result.success) return
    }

    const handlePlayCard = async (cardId: number) => {
        const result = await moveCard(gameId, {
            cardId,
            fromPlayer: loggedInUserName,
            fromPlace: "hand",
            targetPlayerName: loggedInUserName,
            targetPlace: "played",
            targetIndex: 0
        })
    }

    const handleInventoryCard = async (cardId: number) => {
        const result = await moveCard(gameId, {
            cardId,
            fromPlayer: loggedInUserName,
            fromPlace: "hand",
            targetPlayerName: loggedInUserName,
            targetPlace: "inventory",
            targetIndex: 0
        })
    }

    const throwFromInventory = async (cardId: number) => {
        const result = await moveCard(gameId, {
            cardId,
            fromPlayer: loggedInUserName,
            fromPlace: "inventory",
            targetPlayerName: loggedInUserName,
            targetPlace: "used",
            targetIndex: 0
        })
    }

    const throwFromHand = async (cardId: number) => {
        const result = await moveCard(gameId, {
            cardId,
            fromPlayer: loggedInUserName,
            fromPlace: "hand",
            targetPlayerName: loggedInUserName,
            targetPlace: "used",
            targetIndex: 0
        })
    }

    const throwFromPlayed = async (cardId: number) => {
        const result = await moveCard(gameId, {
            cardId,
            fromPlayer: loggedInUserName,
            fromPlace: "played",
            targetPlayerName: loggedInUserName,
            targetPlace: "used",
            targetIndex: 0
        })
    }

    const drawFromUnused = async (cardId: number) => {
        const result = await moveCard(gameId, {
            cardId,
            fromPlayer: null,
            fromPlace: "unused",
            targetPlayerName: loggedInUserName,
            targetPlace: "hand",
            targetIndex: 0
        })
    }

    const identifyUser = (index: number, item: Omit<User, "password">) => {
        return item.id
    }

    const identifyPlayer = (index: number, player: Player) => {
        return player.name
    }


    return (
        <>
            {!game && (
                <div className='flex justify-center'>
                    <div className="loading loading-spinner loading-lg"></div>
                </div>
            )}

            {(game && !game.hasStarted) && (
                <div className='flex flex-col items-center py-16'>
                    <div className="card bg-[url('src/assets/bg.png')] bg-no-repeat bg-center bg-[length:19rem_100%] w-[300px] py-8 px-5">
                        <div className="pb-2 pt-1 opacity-80 font-extrabold text-3xl text-center">{formatId(game.id)}</div>

                        {(game.joinedUsers.length > 8 || game.joinedUsers.length < 4 || loggedInUserName !== game.admin) && (
                            <div className='flex justify-center my-8'>
                                <div className="loading loading-spinner loading-lg"></div>
                            </div>
                        )}

                        {(game.joinedUsers.length <= 8 && game.joinedUsers.length >= 4 && loggedInUserName === game.admin) && (
                            <div className='flex justify-center my-8'>
                                <button onClick={() => initGame()} className="btn btn-primary">Start game</button>
                            </div>
                        )}

                        <div className='divider text-primary text-lg'>Joined players</div>
                        {game.joinedUsers.map(user => (
                            <div key={user.id} className="p-2 my-2 mx-3 rounded-sm bg-neutral text-primary-content font-bold flex justify-between items-center">
                                <span>{user.name}</span>
                                {(loggedInUserName === game.admin && loggedInUserName !== user.name) && (
                                    <button onClick={() => deletePlayer(user.name)} className="btn btn-accent btn-sm" >Kick</button>
                                )}
                                {(loggedInUserName === user.name) && (
                                    <button onClick={() => deletePlayer(user.name)} className="btn btn-accent btn-sm" >Leave</button>
                                )}
                            </div>
                        ))}
                        <div className="divider text-primary text-lg">Waiting in lobby...</div>
                        {game.requests.map(user => (
                            <div key={user.id} className="p-2 my-2 mx-3 rounded-sm bg-primary text-primary-content font-bold flex justify-between items-center">
                                <span>{user.name}</span>
                                {(loggedInUserName === game.admin) && (
                                    <button onClick={() => addPlayer(user.id)} className="btn btn-sm" >Add</button>
                                )}
                            </div>
                        ))}
                        <div className='p-2'>
                            <button onClick={back} className='btn w-full btn-primary'>Back to menu</button>
                        </div>
                    </div>
                </div>
            )}

            {(game && game.hasStarted) && (
                <>
                    <div className='flex gap-4 flex-wrap'>
                        <div className='flex gap-4 flex-wrap'>
                            {game.players.map((player) => (
                                <div className='card card-body bg-neutral text-neutral-content'>
                                    <p>{player.character.name}</p>
                                    {('Sheriff' === player.role.name || player.name === loggedInUserName) && (
                                        <p>{player.role.name}</p>
                                    )}
                                    {('Sheriff' !== player.role.name && player.name !== loggedInUserName) && (
                                        <p>*****</p>
                                    )}
                                    {player.name === loggedInUserName && (
                                        <div className='flex justify-center gap-5 items-center'>
                                            <button onClick={() => handleUpdateLife(-1)} className='text-2xl font-extrabold'>-</button>
                                            <h1 className='text-2xl font-extrabold pb-2'>{player.life}</h1>
                                            <button onClick={() => handleUpdateLife(1)} className='text-2xl font-extrabold'>+</button>
                                        </div>
                                    )}

                                    <div className='divider text-secondary text-lg'>Kártyák</div>
                                    {player.cardsInHand.map((card) => (
                                        <>
                                            {player.name === loggedInUserName && (
                                                <>
                                                    <div className='grid grid-cols-4 gap-3 items-center'>{card.title}
                                                        <button className="btn btn-accent btn-sm" onClick={() => handlePlayCard(card.id)}>Kijátszom</button>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => handleInventoryCard(card.id)}>Lerakom</button>
                                                        <button className="btn btn-primary btn-sm" onClick={() => throwFromHand(card.id)}>Eldobom</button >
                                                    </div >
                                                </>
                                            )}
                                            {player.name !== loggedInUserName && (
                                                <p>*****</p>
                                            )}
                                        </>
                                    ))}
                                    <div className='divider text-secondary text-lg'>Felszerelés</div>
                                    {player.inventoryCards.map((card) => (
                                        <>
                                            <p className='flex justify-between'>{card.title}
                                                <button onClick={() => throwFromInventory(card.id)} className='btn btn-primary btn-sm'>Eldobom</button>
                                            </p>
                                        </>
                                    ))}
                                    <div className='divider text-secondary text-lg'>Kijátszott kártyák</div>
                                    {player.playedCards.map((card) => (
                                        <>
                                            <p className='flex justify-between'>{card.title}
                                                <button onClick={() => throwFromPlayed(card.id)} className='btn btn-primary btn-sm'>Eldobom</button>
                                            </p>
                                        </>
                                    ))}
                                </div>
                            ))}
                        </div >
                    </div >
                    <div>
                        <h1 className="divider text-secondary text-lg">Pakli</h1>
                        <button className="btn btn-secondary w-full" onClick={() => drawFromUnused(game.unusedCards[0].id)}>Húzás ({game.unusedCards.length})</button>
                        <h1 className="divider text-secondary text-lg">Dobott lapok</h1>
                        <button className="btn btn-primary w-full">Húzás ({game.usedCards.length})</button>
                        <h1 className="divider text-secondary text-lg">Logok:</h1>
                        {game.logs.map((log) => (
                            <p>{log.playerName}: {log.interaction}</p>
                        ))}
                    </div >
                    <button onClick={back} className='btn btn-error my-5'>Back to menu</button>

                </>
            )
            }
        </>
    );
};

export default Game;
