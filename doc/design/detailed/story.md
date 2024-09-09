# story

## 処理概要

このLambda関数は, 生成AIを用いて物語と記憶を生成する.
ユーザーからのリクエストを受け取り, BedrockランタイムAPIを使用して新しい物語の続きを生成し, その結果をDynamoDBに保存する.
また, 過去の物語履歴や記憶を取得し, 新しい記憶を生成する.

## 用語と定義

| 日本語 | 英語 (変数名) | 定義 |
|--------|----------------|------|
| チャットID | chat_id | チャットを識別する一意の識別子 ${uuid4}-${epoch_ms} |
| 物語 | story | 本ゲームの物語 生成する文章 |
| 記憶 | memories | 物語に関連する重要な情報や出来事 |

## I/O

### 入力 (イベント)

| フィールド | 型 | 説明 |
|------------|-----|------|
| pathParameters.chat-id | string | URLエンコードされたチャットID |
| body.memories | list[int] | 使用する記憶のインデックスリスト <br> 生成AIに任意の値を与えないため, 数字のみを受け付ける |
| body.epoch_ms | int | 前回の物語生成時のエポックミリ秒 |

### DynamoDB書き込み内容 (STORY_HISTORY_TABLE)

| フィールド名 | 型 | 説明 |
|--------------|----|----|
| chat_id | String | チャットの識別子 |
| epoch_ms | Number | タイムスタンプ (ミリ秒) |
| story | String | 生成された物語 |
| memories | Map | この時点の物語で使用する記憶 (インデックスをキーとする辞書) |
| timestamp | String | ISO8601形式のタイムスタンプ |
| TTL | Number | レコードの有効期限 (秒)<br>1時間とする |

### レスポンス (body)

| フィールド名 | 型 | 説明 |
|--------------|----|----|
| chat_id | String | チャットの識別子 |
| story | String | 生成された物語テキスト |
| memories | Map | 新しく生成された記憶 |
| is_story_ended | Boolean | 物語が終了したかどうか |
| epoch_ms | Number | タイムスタンプ (ミリ秒) |


## シーケンス図

```mermaid
sequenceDiagram
    participant C as クライアント
    participant L as Lambda関数
    participant B as Bedrock Runtime
    participant M as MASTER_TABLE
    participant S as STORY_HISTORY_TABLE

    C->>L: リクエスト(chat_id, memories, epoch_ms)
    L->>M: プロンプトパラメータ取得
    M-->>L: プロンプトパラメータ
    L->>M: プロンプトテキスト取得
    M-->>L: プロンプトテキスト
    L->>M: ループ回数取得
    M-->>L: ループ回数
    L->>M: モデルID取得
    M-->>L: モデルID
    L->>M: 出力フォーマット取得
    M-->>L: 出力フォーマット
    L->>S: 過去の記憶取得
    S-->>L: 過去の記憶
    L->>S: 物語履歴取得
    S-->>L: 物語履歴
    L->>B: 物語生成リクエスト
    B-->>L: 生成された物語
    L->>S: 新しい物語と更新された記憶を保存
    L-->>C: レスポンス(story, memories, is_story_ended, epoch_ms)
```

## フローチャート図

```mermaid
graph TD
    A[開始] --> B[環境変数の読み込み]
    B --> C[リクエストパラメータの解析]
    C --> D[マスターテーブルからの設定取得]
    D --> E[過去の記憶と物語履歴の取得]
    E --> F[AIモデルへのプロンプト作成]
    F --> G{AIモデル呼び出し}
    G -->|成功| H[レスポンスの解析]
    G -->|失敗| I{リトライ回数超過?}
    I -->|はい| J[エラーレスポンス]
    I -->|いいえ| G
    H --> K[新しい物語と記憶の保存]
    K --> L[レスポンス作成]
    L --> M[終了]
    J --> M
```