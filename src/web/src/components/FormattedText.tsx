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

    // 改行の処理（単純に改行コードが存在する場合の処理）
    const textWithRuby = convertRubyText(text);

    return (
        <>
            {textWithRuby}
            <br /> {/* 1行ごとに改行を追加 */}
        </>
    );
};

export default FormattedText;
