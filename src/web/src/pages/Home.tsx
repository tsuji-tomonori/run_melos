import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initGame } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner'; // ローディング表示用コンポーネントをインポート

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState<boolean>(false); // ローディング状態を管理するステート
    const [isGameStarted, setIsGameStarted] = useState<boolean>(false); // ゲーム開始ボタンがクリックされたかどうかを管理するステート

    const startGame = async () => {
        setIsLoading(true); // ローディング表示を開始
        setIsGameStarted(true); // ボタンの色を変えるためにステートを更新
        try {
            const data = await initGame();
            // epoch_msもstateとして渡す
            navigate(`/game/${data.chat_id}`, { state: { story: data.story, memories: data.memories, epoch_ms: data.epoch_ms } });
        } finally {
            setIsLoading(false); // API呼び出し完了後にローディング表示を停止
        }
    };

    return (
        <div className="home">
            <h1>3つまでしか記憶が残らない走れメロス</h1>
            <p>
                プレイヤーであるあなたはメロスになり切り、太宰治による短編小説「走れメロス」の物語を進めていきます。
                ただし、覚えておける内容は3つまで。
                果たしてメロスは無事にセリヌンティウスを救えるのか?
            </p>
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <button
                    onClick={startGame}
                    className={`start-game-button ${isGameStarted ? 'active' : ''}`} // ボタンのクラスを動的に変更
                >
                    ゲームを開始
                </button>
            )}
        </div>
    );
};

export default Home;
