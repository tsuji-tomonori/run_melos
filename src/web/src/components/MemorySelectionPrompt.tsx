import React from 'react';

// 記憶を選ぶためのプロンプトを表示するコンポーネント
const MemorySelectionPrompt: React.FC = () => {
    return (
        <div className="memory-selection-prompt">
            <p>保持する記憶を3つ選ぼう</p>
        </div>
    );
};

export default MemorySelectionPrompt;
