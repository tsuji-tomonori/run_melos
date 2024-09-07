import React, { useState, useEffect } from 'react';
import FormattedText from './FormattedText';

interface StoryDisplayProps {
    story: string;
    onComplete: () => void; // すべてのページが表示された後のコールバック
    isStoryEnded: boolean; // 物語が完結したかどうかを示すフラグ
}

const StoryDisplay: React.FC<StoryDisplayProps> = ({ story, onComplete, isStoryEnded }) => {
    const [displayedText, setDisplayedText] = useState<string[]>([]);
    const [page, setPage] = useState<number>(0);
    const [currentText, setCurrentText] = useState<string>('');
    const [isTyping, setIsTyping] = useState<boolean>(true);

    const PAGE_BREAK = '---'; // --- で区切るための文字列

    useEffect(() => {
        // 物語を "---" で分割し、各セクションをページに対応させる
        const sections = story.split(PAGE_BREAK).map(section => section.trim());

        // 物語が完結している場合、「完」を最後に追加
        if (isStoryEnded) {
            sections.push('完');
        }

        setDisplayedText(sections);
        setPage(0); // ストーリーが更新されたらページをリセット
        setCurrentText(''); // 現在のテキストもリセット
        setIsTyping(true); // タイピング状態をリセット
    }, [story, isStoryEnded]);

    useEffect(() => {
        // タイプライター風アニメーションの実装
        if (isTyping && displayedText.length > 0) {
            let index = -1; // 0からだとなぜか2文字目から取得されたため
            const currentSection = displayedText[page];
            const interval = setInterval(() => {
                if (index + 1 < currentSection.length) {
                    index++;
                    setCurrentText((prev) => prev + currentSection[index]);
                } else {
                    setIsTyping(false);
                    clearInterval(interval);
                    // 全文表示が完了したときにコールバックを呼び出す
                    if (page + 1 >= displayedText.length) {
                        onComplete();
                    }
                }
            }, 30);

            return () => clearInterval(interval);
        }
    }, [displayedText, page, isTyping]);

    const nextPage = () => {
        if (page + 1 < displayedText.length) {
            setPage((prev) => prev + 1);
            setCurrentText('');
            setIsTyping(true);
        } else if (!isTyping) {
            onComplete(); // すべてのページが表示されたらコールバックを呼び出す
        }
    };

    const prevPage = () => {
        if (page > 0) {
            setPage((prev) => prev - 1);
            setCurrentText('');
            setIsTyping(true);
        }
    };

    return (
        <div className="story-display">
            {/* FormattedText コンポーネントに currentText をそのまま渡す */}
            <FormattedText text={currentText} />
            <div className="pagination-buttons">
                {page > 0 && <button onClick={prevPage} style={{ marginRight: 'auto' }}>戻る</button>}
                {(page + 1 < displayedText.length || isTyping) && (
                    <button style={{ marginLeft: 'auto' }} onClick={nextPage}>次へ</button>
                )}
            </div>
        </div>
    );
};

export default StoryDisplay;
