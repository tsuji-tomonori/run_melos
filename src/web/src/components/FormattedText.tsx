import React from 'react';

// 物語の1行を表し、ルビと改行を処理するコンポーネント
interface FormattedTextProps {
    text: string;
}

const FormattedText: React.FC<FormattedTextProps> = ({ text }) => {
    // ルビ付きテキストをHTMLのルビタグに変換する関数
    const convertRubyText = (text: string): React.ReactNode[] => {
        const regex = /<<([^|]+)\|([^>>]+)>>/g; // <<漢字|ふりがな>> の形式を見つける正規表現
        const parts: React.ReactNode[] = [];

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

    // 各行を <p> タグでラップし、それぞれにインデントを適用
    return (
        <>
            {text.split('\n').map((line, index) => (
                <p key={index} className="formatted-line">
                    {convertRubyText(line)}
                </p>
            ))}
        </>
    );
};

export default FormattedText;
