import React from 'react';
import { useNavigate } from 'react-router-dom';
import { initGame } from '../services/api';

const Home: React.FC = () => {
    const navigate = useNavigate();

    const startGame = async () => {
        const data = await initGame();
        navigate(`/game/${data.chat_id}`, { state: { story: data.story, memories: data.memories } });
    };

    return (
        <div className="home">
            <h1>3つまでしか記憶が残らない走れメロス</h1>
            <p>ゲームのあらすじ...</p>
            <button onClick={startGame}>ゲームを開始</button>
        </div>
    );
};

export default Home;
