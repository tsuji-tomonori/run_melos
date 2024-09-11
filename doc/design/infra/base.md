# インフラ基本設計書

## 1. 概要

このインフラ構成は, AWS CDKを使用して構築されたサーバーレスアプリケーションのためのものです.主要なコンポーネントには, API Gateway, Lambda関数, DynamoDBテーブル, IAMロールが含まれています.

## 2. 主要コンポーネント

### 2.1 API Gateway

- 名称: run-melos-rest-api
- エンドポイント: HTTPS
- ステージ: v1

### 2.2 Lambda関数

1. init関数
   - ランタイム: Python 3.11
   - メモリ: 512MB
   - タイムアウト: 30秒

2. story関数
   - ランタイム: Python 3.11
   - メモリ: 512MB
   - タイムアウト: 30秒

### 2.3 DynamoDBテーブル

1. masterテーブル
   - パーティションキー: command (文字列)
   - ソートキー: version (文字列)

2. story_historyテーブル
   - パーティションキー: chat_id (文字列)
   - ソートキー: epoch_ms (数値)
   - TTL設定: ttl_key

### 2.4 IAMロール

- Lambda関数用のIAMロール（基本的な実行ロールに加えて, DynamoDBアクセス権限を付与）

## 3. アーキテクチャ図

![architecture](../architecture.drawio.svg)

## 4. セキュリティ

- API GatewayはHTTPSエンドポイントを使用
- Lambda関数はIAMロールによって最小権限の原則に基づいてアクセス制御
- DynamoDBテーブルはLambda関数からのみアクセス可能

## 5. スケーラビリティ

- API GatewayとLambda関数は自動的にスケール
- DynamoDBはオンデマンドキャパシティモードを使用し, 自動的にスケール

## 6. 監視とロギング

- Lambda関数のログはCloudWatch Logsに保存（保持期間: 90日）
- API GatewayのログはCloudWatch Logsに設定可能

## 7. コスト最適化

- サーバーレスアーキテクチャにより, 使用量に応じた課金
- DynamoDBのオンデマンドキャパシティモードにより, 使用量に応じた課金

## 8. 今後の検討事項

- バックアップ戦略の策定
- 詳細なモニタリングとアラートの設定
- パフォーマンスチューニング（必要に応じて）