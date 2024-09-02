import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchStory } from '../services/api';
import StoryDisplay from '../components/StoryDisplay';
import MemoryButton from '../components/MemoryButton';

interface LocationState {
    story: string;
    memories: string[];
}

const Game: React.FC = () => {
    const location = useLocation();
    const { story: initialStory, memories: initialMemories } = location.state as LocationState;
    const [story, setStory] = useState<string>(initialStory);
    const [memories, setMemories] = useState<string[]>(initialMemories);
    const [selectedMemories, setSelectedMemories] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showMemoryButtons, setShowMemoryButtons] = useState<boolean>(false);

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
        setShowMemoryButtons(false); // ここで一旦記憶ボタンを非表示

        try {
            const data = await fetchStory(location.pathname.split('/')[2], selectedMemories);
            setStory(data.story); // ここで新しいストーリーをセット
            setMemories(data.memories);
            setSelectedMemories([]);
            handleComplete(); // ストーリーが更新された後にhandleCompleteを呼び出して初期化
        } finally {
            setIsLoading(false);
        }
    };

    // 全てのページが表示された後に呼び出されるコールバック関数
    const handleComplete = () => {
        setShowMemoryButtons(true);  // 記憶ボタンを表示する
    };

    return (
        <div className="game">
            <StoryDisplay story={story} onComplete={handleComplete} />
            {showMemoryButtons && (
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
                showMemoryButtons && <button className="confirm-button" onClick={confirmMemories}>決定</button>
            )}
        </div>
    );
};

export default Game;
