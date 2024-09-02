import React, { useState, useEffect } from 'react';

interface StoryDisplayProps {
    story: string;
    onComplete: () => void; // すべてのページが表示された後のコールバック
}

const StoryDisplay: React.FC<StoryDisplayProps> = ({ story, onComplete }) => {
    const [displayedText, setDisplayedText] = useState<string[]>([]);
    const [page, setPage] = useState<number>(0);
    const [currentText, setCurrentText] = useState<string>('');
    const [isTyping, setIsTyping] = useState<boolean>(true);

    const SENTENCES_PER_PAGE = 5;  // 1ページあたりの文数

    useEffect(() => {
        // 文章を「。」で分割し、「。」の後に「」」がある場合、その「」」を含める
        const sentences = story.split(/(?<=。(?!」))|(?<=。」)/g)
            .filter(Boolean)
            .map(sentence => sentence.trim());
        setDisplayedText(sentences);
        setPage(0); // ストーリーが更新されたらページをリセット
        setCurrentText(''); // 現在のテキストもリセット
        setIsTyping(true); // タイピング状態をリセット
    }, [story]);

    useEffect(() => {
        // タイプライター風アニメーションの実装
        if (isTyping && displayedText.length > 0) {
            let index = -1; // 0からだとなぜか2文字目から取得されたため
            const currentSentences = displayedText.slice(page * SENTENCES_PER_PAGE, (page + 1) * SENTENCES_PER_PAGE).join('');
            const interval = setInterval(() => {
                if (index + 1 < currentSentences.length) {
                    index++;
                    setCurrentText((prev) => prev + currentSentences[index]);
                } else {
                    setIsTyping(false);
                    clearInterval(interval);
                    // 全文表示が完了したときにコールバックを呼び出す
                    if ((page + 1) * SENTENCES_PER_PAGE >= displayedText.length) {
                        onComplete();
                    }
                }
            }, 30);

            return () => clearInterval(interval);
        }
    }, [displayedText, page, isTyping]);

    const nextPage = () => {
        if ((page + 1) * SENTENCES_PER_PAGE < displayedText.length) {
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
            <p>{currentText}</p>
            <div className="pagination-buttons">
                {page > 0 && <button onClick={prevPage} style={{ marginRight: 'auto' }}>戻る</button>}
                {((page + 1) * SENTENCES_PER_PAGE < displayedText.length || isTyping) && (
                    <button style={{ marginLeft: 'auto' }} onClick={nextPage}>次へ</button>
                )}
            </div>
        </div>
    );
};

export default StoryDisplay;
