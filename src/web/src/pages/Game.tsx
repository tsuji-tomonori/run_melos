import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchStory } from '../services/api';
import StoryDisplay from '../components/StoryDisplay';
import MemoryButton from '../components/MemoryButton';

interface LocationState {
    story: string;
    memories: string[];
}

const Game: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { story: initialStory, memories: initialMemories } = location.state as LocationState;
    const [story, setStory] = useState<string>(initialStory);
    const [memories, setMemories] = useState<string[]>(initialMemories);
    const [selectedMemories, setSelectedMemories] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showMemoryButtons, setShowMemoryButtons] = useState<boolean>(false);
    const [isStoryEnded, setIsStoryEnded] = useState<boolean>(false); // 物語の完結を管理するステート
    const [storyCompleted, setStoryCompleted] = useState<boolean>(false); // 物語の表示が完了したかどうかを示すステート

    const toggleMemory = (memory: string) => {
        if (selectedMemories.includes(memory)) {
            setSelectedMemories(selectedMemories.filter((m) => m !== memory));
        } else if (selectedMemories.length < 3) {
            setSelectedMemories([...selectedMemories, memory]);
        }
    };

    const confirmMemories = async () => {
        if (selectedMemories.length !== 3) {
            alert('3つの記憶を選んでください。');
            return;
        }

        setIsLoading(true);
        setShowMemoryButtons(false); // 新しいストーリーを表示するので、記憶ボタンを非表示
        setStoryCompleted(false); // 新しいストーリーを表示するので、完了状態をリセット

        try {
            const data = await fetchStory(location.pathname.split('/')[2], selectedMemories);
            setStory(data.story);
            setMemories(data.memories);
            setSelectedMemories([]);
            setIsStoryEnded(data.is_story_ended); // ストーリーが終了したかどうかを設定
        } finally {
            setIsLoading(false);
        }
    };

    const handleComplete = () => {
        setStoryCompleted(true); // 物語の表示が完了したときに完了状態に設定
        if (!isStoryEnded) {
            setShowMemoryButtons(true);  // 物語が完結していない場合のみ記憶ボタンを表示する
        }
    };

    return (
        <div className="game">
            <StoryDisplay story={story} onComplete={handleComplete} isStoryEnded={isStoryEnded} />
            {isStoryEnded && (
                <div>
                    <button onClick={() => navigate('/')}>Homeへ戻る</button>
                </div>
            )}
            {!isStoryEnded && showMemoryButtons && storyCompleted && (
                <div className="memories">
                    {memories.map((memory) => (
                        <MemoryButton
                            key={memory}
                            memory={memory}
                            isActive={selectedMemories.includes(memory)}
                            toggleMemory={toggleMemory}
                        />
                    ))}
                </div>
            )}
            {isLoading ? (
                <div className="loading-spinner">Loading...</div>
            ) : (
                !isStoryEnded && showMemoryButtons && storyCompleted && <button className="confirm-button" onClick={confirmMemories}>決定</button>
            )}
        </div>
    );
};

export default Game;
