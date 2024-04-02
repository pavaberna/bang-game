import React, { useState, useEffect } from 'react';
import { getGame, authorize, deleteUserFromGame } from '../api';
import { GameSchema } from '../model';
import { z } from 'zod';

type Game = z.infer<typeof GameSchema>;

interface GameComponentProps {
    gameId: number;
    loggedInUserName: string;
    onBack?: () => void;
}

const Game: React.FC<GameComponentProps> = ({ gameId, loggedInUserName, onBack }) => {
    const [game, setGame] = useState<Game | null>(null);

    useEffect(() => {
        const intervalId = setInterval(async () => {
            const response = await getGame(gameId);
            if (!response.success) return;
            setGame(response.data);
        }, 500);
    });

    const addPlayer = async (playerId: number): Promise<void> => {
        authorize(gameId, playerId);
    };

    const deletePlayer = async (username: string) => {
        deleteUserFromGame(gameId, username);
    };

    const emitBack = (): void => {
        if (onBack) {
            onBack();
        }
    };

    return (
        <>
            {!game && (
                <div className='flex justify-center'>
                    <div className="loading loading-spinner loading-lg"></div>
                </div>
            )}

            {game && !game.hasStarted && (
                <div className='flex flex-col items-center py-16'>
                    <div className="card bg-secondary text-secondary-content w-[300px]">

                        {game.joinedUsers.length > 8 || game.joinedUsers.length < 4 || loggedInUserName !== game.admin && (
                            <div className='flex justify-center my-8'>
                                <div className="loading loading-spinner loading-lg"></div>
                            </div>
                        )}

                        {game.joinedUsers.length <= 8 && game.joinedUsers.length >= 4 && loggedInUserName === game.admin && (
                            <div className='flex justify-center my-8'>
                                <button className="btn btn-primary">Start game</button>
                            </div>
                        )}
                        <div className='divider'>Joined players</div>
                        {game.joinedUsers.map(user => (
                            <div key={user.id} className="p-2 my-2 mx-3 rounded-sm bg-primary text-primary-content font-bold flex justify-between items-center">
                                <span>{user.name}</span>
                                {loggedInUserName === game.admin && loggedInUserName !== user.name && (
                                    <button className="btn btn-sm" onClick={() => deletePlayer(user.name)}>Kick</button>
                                )}
                                {loggedInUserName === user.name && (
                                    <button className="btn btn-sm" onClick={() => deletePlayer(user.name)}>Leave</button>
                                )}
                            </div>
                        ))}
                        <div className="divider">Waiting in lobby...</div>
                        {game.requests.map(user => (
                            <div key={user.id} className="p-2 my-2 mx-3 rounded-sm bg-primary text-primary-content font-bold flex justify-between items-center">
                                <span>{user.name}</span>
                                {loggedInUserName === game.admin && (
                                    <button className="btn btn-sm" onClick={() => addPlayer(user.id)}>Add</button>
                                )}
                            </div>
                        ))}
                        <div className='p-2'>
                            <button onClick={() => emitBack()} className='btn w-full btn-error'>Back to menu</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Game;
