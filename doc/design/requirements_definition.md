# 要件定義書: TRPGシナリオ「3つしか記憶できない「走れメロス」」ゲームエンジン

## 1. プロジェクト概要

TRPGのシナリオ「3つしか記憶できない「走れメロス」」を支えるゲームエンジンの開発を行う.
このゲームエンジンは, Webアプリケーションとして実装され, フロントエンドにReact, バックエンドにAWS Lambdaを使用する.

## 2. システム構成

### 2.1 フロントエンド
- 使用技術: React, React Router
- 主要機能:
  - ユーザーインターフェース提供
  - ゲームフローの管理
  - APIとの通信

### 2.2 バックエンド
- 使用技術: AWS Lambda, Amazon DynamoDB, Amazon Bedrock
- 主要機能:
  - 物語生成
  - 記憶管理
  - データ永続化

## 3. 機能要件

### 3.1 フロントエンド

#### 3.1.1 トップ画面
- タイトル表示
- ゲーム開始ボタン
- ゲームのあらすじ表示

#### 3.1.2 ゲーム画面
- 物語テキスト表示
- 記憶選択ボタン
- 決定ボタン

#### 3.1.3 ゲームフロー管理
- 初期化API呼び出し
- 物語生成API呼び出し
- 記憶選択の制御（3つまで）

### 3.2 バックエンド

#### 3.2.1 初期化API (POST:/init)
- 初期物語の生成
- 初期記憶の生成
- チャットIDの発行

#### 3.2.2 物語生成API (POST:/story/{chat_id})
- 選択された記憶に基づく物語の続きを生成
- 新しい記憶の生成
- 物語終了判定

#### 3.2.3 データ永続化
- 物語履歴のDynamoDBへの保存
- 記憶のDynamoDBへの保存

## 4. 非機能要件

### 4.1 パフォーマンス
- API応答時間: 10秒以内

### 4.2 セキュリティ
- HTTPS通信の使用
- 任意の文言を外部からAIに渡せないようにする


### 4.3 可用性
- 稼働率: 99.9%

### 4.4 拡張性
- プロンプトやパラメータは変更が容易であること

## 5. インターフェース仕様

### 5.1 フロントエンド-バックエンド間API

#### 5.1.1 初期化API (POST:/init)
リクエスト:
- なし

レスポンス:
```json
{
  "chat_id": "string",
  "story": "string",
  "memories": {
    0: "string",
    1: "string"
  },
  "epoch_ms": number
}
```

#### 5.1.2 物語生成API (POST:/story/{chat_id})
リクエスト:
```json
{
  "memories": [0, 1, 2],
  "epoch_ms": number
}
```

レスポンス:
```json
{
  "chat_id": "string",
  "story": "string",
  "memories": {
    0: "string",
    1: "string"
  },
  "is_story_ended": boolean,
  "epoch_ms": number
}
```

## 6. データモデル

### 6.1 DynamoDB テーブル構造

#### 6.1.1 STORY_HISTORY_TABLE

| フィールド名 | 型 | 説明 |
|--------------|----|----|
| chat_id | String | チャットの識別子 (Partition Key) |
| epoch_ms | Number | タイムスタンプ (ミリ秒) (Sort Key) |
| story | String | 物語テキスト |
| memories | Map | 記憶 (インデックスをキーとする辞書) |
| timestamp | String | ISO8601形式のタイムスタンプ |
| ttl_key | Number | レコードの有効期限 (秒) |

#### 6.1.2 MASTER_TABLE

| フィールド名 | 型 | 説明 |
|--------------|----|----|
| command | String | 設定キー (Partition Key) |
| version | String | 設定値の版 (PartiSorttion Key) |
| value | String | 設定値 |

## 7. 制約事項

- 記憶は常に3つまでしか保持できない
- 物語生成はAmazon Bedrockを使用する
- フロントエンドの状態管理にはReact Hooksを使用する

## 8. 用語と定義

| 日本語 | 英語 (変数名) | 定義 |
|--------|----------------|------|
| チャットID | chat_id | チャットを識別する一意の識別子 ${uuid4}-${epoch_ms} |
| 物語 | story | 本ゲームの物語 生成する文章 |
| 記憶 | memories | 物語に関連する重要な情報や出来事 |