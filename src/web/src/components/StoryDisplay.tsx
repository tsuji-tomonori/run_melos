import React, { useState, useEffect } from 'react';

interface StoryDisplayProps {
    story: string;
    onComplete: () => void; // すべてのページが表示された後のコールバック
    isStoryEnded: boolean; // 物語が完結したかどうかを示すフラグ
}

// ルビ付きテキストをHTMLのルビタグに変換する関数
const convertRubyText = (text: string): React.ReactNode => {
    const regex = /<<([^|]+)\|([^>>]+)>>/g; // <<漢字|ふりがな>> の形式を見つける正規表現
    const parts = [];

    let lastIndex = 0;
    let match;

    // マッチする部分をループして処理
    while ((match = regex.exec(text)) !== null) {
        const [fullMatch, kanji, furigana] = match;
        const startIndex = match.index;

        // マッチする部分の前の通常のテキストを追加
        if (startIndex > lastIndex) {
            parts.push(text.slice(lastIndex, startIndex));
        }

        // ルビ部分をHTMLの<ruby>タグ形式に変換
        parts.push(
            <ruby key={startIndex}>
                {kanji}
                <rt>{furigana}</rt>
            </ruby>
        );

        lastIndex = regex.lastIndex;
    }

    // 最後のマッチ部分以降のテキストを追加
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts;
};

const StoryDisplay: React.FC<StoryDisplayProps> = ({ story, onComplete, isStoryEnded }) => {
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

        // 物語が完結している場合、「完」を最後に追加
        if (isStoryEnded) {
            sentences.push('完');
        }

        setDisplayedText(sentences);
        setPage(0); // ストーリーが更新されたらページをリセット
        setCurrentText(''); // 現在のテキストもリセット
        setIsTyping(true); // タイピング状態をリセット
    }, [story, isStoryEnded]);

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
            <p>{convertRubyText(currentText)}</p> {/* ここでルビを表示 */}
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
