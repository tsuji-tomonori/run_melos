import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchStory } from '../services/api';
import StoryDisplay from '../components/StoryDisplay';
import MemoryButton from '../components/MemoryButton';
import LoadingSpinner from '../components/LoadingSpinner';
import HomeButton from '../components/HomeButton';
import MemorySelectionPrompt from '../components/MemorySelectionPrompt';

interface LocationState {
    story: string;
    memories: { [index: number]: string };
    epoch_ms: number;
}

const Game: React.FC = () => {
    const location = useLocation();

    const { story: initialStory, memories: initialMemories, epoch_ms: initialEpochMs } = location.state as LocationState;
    const [story, setStory] = useState<string>(initialStory);
    const [memories, setMemories] = useState<{ [index: string]: string }>(initialMemories);
    const [selectedMemories, setSelectedMemories] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showMemoryButtons, setShowMemoryButtons] = useState<boolean>(false);
    const [isStoryEnded, setIsStoryEnded] = useState<boolean>(false); // 物語の完結を管理するステート
    const [storyCompleted, setStoryCompleted] = useState<boolean>(false); // 物語の表示が完了したかどうかを示すステート
    const [epochMs, setEpochMs] = useState<number>(initialEpochMs);

    // 記憶のインデックスを選択する処理
    const toggleMemory = (index: string) => {
        if (selectedMemories.includes(index)) {
            setSelectedMemories(selectedMemories.filter((i) => i !== index));
        } else if (selectedMemories.length < 3) {
            setSelectedMemories([...selectedMemories, index]);
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
            const data = await fetchStory(location.pathname.split('/')[2], selectedMemories, epochMs); // memoriesはnumber[]
            setStory(data.story);
            setMemories(data.memories);
            setSelectedMemories([]);
            setIsStoryEnded(data.is_story_ended); // ストーリーが終了したかどうかを設定
            setEpochMs(data.epoch_ms); // 新しいepoch_msを更新
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
            {isStoryEnded && storyCompleted && ( // 物語が終了し、すべての物語が表示された後にのみ表示
                <HomeButton />
            )}
            {!isStoryEnded && showMemoryButtons && storyCompleted && (
                <div className="memories">
                    <MemorySelectionPrompt /> {/* 記憶選択の文言を追加 */}
                    {Object.entries(memories).map(([index, memory]) => (
                        <MemoryButton
                            key={index}
                            memory={memory}
                            isActive={selectedMemories.includes(index)}
                            toggleMemory={() => toggleMemory(index)}
                        />
                    ))}
                </div>
            )}
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                !isStoryEnded && showMemoryButtons && storyCompleted && <button className="confirm-button" onClick={confirmMemories}>決定</button>
            )}
        </div>
    );
};

export default Game;
