# パラメータシート

## 共通タグ

| キー | 値 |
|------|-----|
| ManagedBy | cdk |
| Project | run-melos |

## API Gateway

### REST API

| パラメータ | 値 |
|------------|-----|
| 論理名 | restapi |
| 説明 | run melos |
| 名前 | run-melos |
| タグ | Name: run-melos-rest-api |

### CloudWatchロール

| パラメータ | 値 |
|------------|-----|
| 論理名 | restapiCloudWatchRole |
| AssumeRolePolicyDocument | apigateway.amazonaws.comからの引き受けを許可 |
| ManagedPolicyArns | AmazonAPIGatewayPushToCloudWatchLogs |
| タグ | Name: run-melos-rest-api-CloudWatchRole |

### デプロイメント

| パラメータ | 値 |
|------------|-----|
| 論理名 | restapiDeployment |
| 説明 | run melos |
| RestApiId | REST APIのリソース参照 |

### ステージ

| パラメータ | 値 |
|------------|-----|
| 論理名 | restapiDeploymentStage |
| DeploymentId | デプロイメントのリソース参照 |
| StageName | v1 |
| タグ | Name: run-melos-rest-api-DeploymentStage.v1 |

## DynamoDB

### マスターテーブル

| パラメータ | 値 |
|------------|-----|
| 論理名 | tablemaster |
| 属性定義 | command (S), version (S) |
| キースキーマ | command (HASH), version (RANGE) |
| BillingMode | PAY_PER_REQUEST |
| タグ | Name: run-melos-table-master |

### ストーリー履歴テーブル

| パラメータ | 値 |
|------------|-----|
| 論理名 | tablestoryhistory |
| 属性定義 | chat_id (S), epoch_ms (N) |
| キースキーマ | chat_id (HASH), epoch_ms (RANGE) |
| BillingMode | PAY_PER_REQUEST |
| TTL設定 | 属性名: ttl_key, 有効: true |
| タグ | Name: run-melos-table-story_history |

## Lambda関数

### init

| パラメータ | 値 |
|------------|-----|
| 論理名 | initfunction |
| ハンドラ | lambda_function.lambda_handler |
| ランタイム | python3.11 |
| メモリサイズ | 512 MB |
| タイムアウト | 30秒 |
| ロール | initfunctionServiceRole |
| タグ | Name: run-melos-init-function |

#### 環境変数

| キー | 値 |
|------|-----|
| ACCESS_CONTROL_ALLOW_HEADERS | Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token |
| ACCESS_CONTROL_ALLOW_METHODS | * |
| ACCESS_CONTROL_ALLOW_ORIGIN | * |
| TTL_KEY | ttl_key |
| TTL_SECONDS | 3600 |
| MASTER_TABLE | マスターテーブルの参照 |
| STORY_HISTORY_TABLE | ストーリー履歴テーブルの参照 |

### story

| パラメータ | 値 |
|------------|-----|
| 論理名 | storyfunction |
| ハンドラ | lambda_function.lambda_handler |
| ランタイム | python3.11 |
| メモリサイズ | 512 MB |
| タイムアウト | 30秒 |
| ロール | storyfunctionServiceRole |
| タグ | Name: run-melos-story-function |

#### 環境変数

| キー | 値 |
|------|-----|
| ACCESS_CONTROL_ALLOW_HEADERS | Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token |
| ACCESS_CONTROL_ALLOW_METHODS | * |
| ACCESS_CONTROL_ALLOW_ORIGIN | * |
| TTL_KEY | ttl_key |
| TTL_SECONDS | 3600 |
| MASTER_TABLE | マスターテーブルの参照 |
| STORY_HISTORY_TABLE | ストーリー履歴テーブルの参照 |

## IAMロール

### 初期化関数用ロール

| パラメータ | 値 |
|------------|-----|
| 論理名 | initfunctionServiceRole |
| AssumeRolePolicyDocument | lambda.amazonaws.comからの引き受けを許可 |
| ManagedPolicyArns | AWSLambdaBasicExecutionRole |
| インラインポリシー | DynamoDBへの読み取り・書き込み権限 |
| タグ | Name: run-melos-init-function-ServiceRole |

### ストーリー関数用ロール

| パラメータ | 値 |
|------------|-----|
| 論理名 | storyfunctionServiceRole |
| AssumeRolePolicyDocument | lambda.amazonaws.comからの引き受けを許可 |
| ManagedPolicyArns | AWSLambdaBasicExecutionRole |
| インラインポリシー | DynamoDBへの読み取り・書き込み権限、Bedrockモデルの呼び出し権限 |
| タグ | Name: run-melos-story-function-ServiceRole |

## CloudWatch Logs

### 初期化関数用ロググループ

| パラメータ | 値 |
|------------|-----|
| 論理名 | initlogs |
| LogGroupName | /aws/lambda/初期化関数の参照 |
| RetentionInDays | 90 |
| タグ | Name: run-melos-init-logs |

### ストーリー関数用ロググループ

| パラメータ | 値 |
|------------|-----|
| 論理名 | storylogs |
| LogGroupName | /aws/lambda/ストーリー関数の参照 |
| RetentionInDays | 90 |
| タグ | Name: run-melos-story-logs |