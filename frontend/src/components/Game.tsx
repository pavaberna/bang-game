import { useState, useEffect } from 'react';
import { authorize, getGame, deleteUserFromGame, startGame } from '../api';
import { GameSchema, UserSchema } from '../model';
import { z } from 'zod';

type Game = z.infer<typeof GameSchema>;
type User = z.infer<typeof UserSchema>;

type Props = {
    gameId: number;
    loggedInUserName: string;
    back: () => void;
}

const Game = ({ gameId, loggedInUserName, back }: Props) => {

    const [game, setGame] = useState<Game | null>(null);

    useEffect(() => {
        setInterval(async () => {
            const response = await getGame(gameId);
            if (!response.success) return;
            setGame(response.data);
        }, 500);
    }, []);

    const addPlayer = async (playerId: number): Promise<void> => {
        authorize(gameId, playerId);
    };

    const deletePlayer = async (username: string) => {
        deleteUserFromGame(gameId, username);
    };

    const initGame = async () => {
        startGame(gameId);
    };

    const identifyUser = (index: number, item: Omit<User, "password">) => {
        return item.id
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
                    <div className="card bg-secondary text-secondary-content w-[300px]">

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

                        <div className='divider'>Joined players</div>
                        {game.joinedUsers.map(user => (
                            <div key={user.id} className="p-2 my-2 mx-3 rounded-sm bg-primary text-primary-content font-bold flex justify-between items-center">
                                <span>{user.name}</span>
                                {(loggedInUserName === game.admin && loggedInUserName !== user.name) && (
                                    <button onClick={() => deletePlayer(user.name)} className="btn btn-sm" >Kick</button>
                                )}
                                {(loggedInUserName === user.name) && (
                                    <button onClick={() => deletePlayer(user.name)} className="btn btn-sm" >Leave</button>
                                )}
                            </div>
                        ))}
                        <div className="divider">Waiting in lobby...</div>
                        {game.requests.map(user => (
                            <div key={user.id} className="p-2 my-2 mx-3 rounded-sm bg-primary text-primary-content font-bold flex justify-between items-center">
                                <span>{user.name}</span>
                                {(loggedInUserName === game.admin) && (
                                    <button onClick={() => addPlayer(user.id)} className="btn btn-sm" >Add</button>
                                )}
                            </div>
                        ))}
                        <div className='p-2'>
                            <button onClick={back} className='btn w-full btn-error'>Back to menu</button>
                        </div>
                    </div>
                </div>
            )}

            {(game && game.hasStarted) && (
                <>
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
                                <p>{player.life}</p>
                                <div className='divider'>Cards</div>
                                {player.cardsInHand.map((card) => (
                                    <>
                                        {player.name === loggedInUserName && (
                                            <span>{card.title}</span>
                                        )}
                                        {player.name !== loggedInUserName && (
                                            <span>*****</span>
                                        )}
                                    </>
                                ))}
                            </div>
                        ))}
                    </div>
                    <button onClick={back} className='btn btn-error my-5'>Back to menu</button>

                </>
            )}
        </>
    );
};

export default Game;
