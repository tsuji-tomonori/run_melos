from __future__ import annotations

import datetime
import json
import logging
import os
import time
import urllib.parse
from decimal import Decimal
from operator import itemgetter
from typing import NamedTuple

import boto3
from boto3.dynamodb.conditions import Key

logger = logging.getLogger()


class Environ(NamedTuple):
    MASTER_TABLE: str
    STORY_HISTORY_TABLE: str
    ACCESS_CONTROL_ALLOW_HEADERS: str
    ACCESS_CONTROL_ALLOW_METHODS: str
    ACCESS_CONTROL_ALLOW_ORIGIN: str
    TTL_SECONDS: str
    TTL_KEY: str

    @classmethod
    def from_env(cls: type[Environ]) -> Environ:
        return Environ(**{key: os.environ[key] for key in Environ._fields})


class InternalServerError(Exception):
    def __init__(self: InternalServerError) -> None:
        super().__init__("internal server error")


def obtain_prompt_param(env: Environ) -> dict:
    table = boto3.resource("dynamodb").Table(env.MASTER_TABLE)
    res = table.get_item(
        Key={
            "command": "prompt_param",
            "version": "latest",
        },
    ).get("Item")
    return res["value"]  # type: ignore  # noqa: PGH003


def obtain_prompt_text(env: Environ) -> str:
    table = boto3.resource("dynamodb").Table(env.MASTER_TABLE)
    res = table.get_item(
        Key={
            "command": "prompt_text",
            "version": "latest",
        },
    ).get("Item")
    return res["value"]  # type: ignore  # noqa: PGH003


def obtain_loop_num(env: Environ) -> int:
    table = boto3.resource("dynamodb").Table(env.MASTER_TABLE)
    res = table.get_item(
        Key={
            "command": "loop_num",
            "version": "latest",
        },
    ).get("Item")
    return int(res["value"])  # type: ignore  # noqa: PGH003


def obtain_model_id(env: Environ) -> str:
    table = boto3.resource("dynamodb").Table(env.MASTER_TABLE)
    res = table.get_item(
        Key={
            "command": "model_id",
            "version": "latest",
        },
    ).get("Item")
    return res["value"]  # type: ignore  # noqa: PGH003


def retrieve_story_history(chat_id: str, env: Environ) -> str:
    table = boto3.resource("dynamodb").Table(env.STORY_HISTORY_TABLE)
    res = table.query(KeyConditionExpression=Key("chat_id").eq(chat_id))
    sorted_items: list[dict[str, str]] = sorted(
        res["Items"],  # type: ignore  # noqa: PGH003
        key=itemgetter("epoch_ms"),
    )
    return "\n".join(x["story"] for x in sorted_items)


def retrieve_memories(chat_id: str, env: Environ) -> list[str]:
    table = boto3.resource("dynamodb").Table(env.STORY_HISTORY_TABLE)
    res = table.query(KeyConditionExpression=Key("chat_id").eq(chat_id))
    sorted_items: list[dict[str, list[str]]] = sorted(
        res["Items"],  # type: ignore  # noqa: PGH003
        key=itemgetter("epoch_ms"),
    )
    return sorted_items[-1]["memories"]


def now_epoch_sec() -> int:
    return int(time.time())


def now_epoch_ms() -> int:
    return int(time.time() * 1000)


def to_isoformat(epoch_ms: int) -> str:
    return f"{datetime.datetime.fromtimestamp(epoch_ms / 1000).isoformat()}Z"


def put_story(
    story: str,
    memories: list[str],
    chat_id: str,
    env: Environ,
) -> None:
    table = boto3.resource("dynamodb").Table(env.STORY_HISTORY_TABLE)
    now = now_epoch_ms()
    table.put_item(
        Item={
            "chat_id": chat_id,
            "epoch_ms": now,
            "story": story,
            "memories": memories,
            "timestamp": to_isoformat(now),
            env.TTL_KEY: now_epoch_sec() + int(env.TTL_SECONDS),
        },
    )


def decimal_to_int(obj: Decimal) -> int:
    if isinstance(obj, Decimal):
        return int(obj)
    else:
        raise TypeError


class AiResponse(NamedTuple):
    story: str
    is_story_ended: bool
    memories: list[str]


def generate_story_and_choices(
    chat_id: str,
    memories: list[str],
    env: Environ,
) -> AiResponse:
    client = boto3.client("bedrock-runtime")
    prompt_text = obtain_prompt_text(env)
    formatted_prompt = prompt_text.format(
        current_story=retrieve_story_history(chat_id, env),
        memory=", ".join(memories),
    )

    prompt_params = obtain_prompt_param(env)
    prompt_params |= {
        "messages": [
            {
                "role": "user",
                "content": [{"type": "text", "text": formatted_prompt}],
            },
        ],
    }

    for loop_num in range(obtain_loop_num(env)):
        try:
            response = client.invoke_model(
                modelId=obtain_model_id(env),
                body=json.dumps(prompt_params, default=decimal_to_int),
            )
            generated_text = json.loads(
                response["body"].read(),
            )["content"][
                0
            ]["text"]
            result = json.loads(generated_text)
            return AiResponse(
                story=result["story_continuation"],
                is_story_ended=result["is_story_ended"],
                memories=result.get("new_memories", []) + memories,
            )
        except Exception as e:
            logger.exception("generate story error")
            if loop_num == obtain_loop_num(env):
                raise InternalServerError() from e
    raise InternalServerError()


class Story(NamedTuple):
    chat_id: str
    story: str
    memories: list[str]
    is_story_ended: bool

    @classmethod
    def from_db(
        cls: type[Story],
        env: Environ,
        chat_id: str,
        memories: list[str],
    ) -> Story:
        res = generate_story_and_choices(
            chat_id=chat_id,
            memories=memories,
            env=env,
        )
        return Story(
            chat_id=chat_id,
            story=res.story,
            memories=res.memories,
            is_story_ended=res.is_story_ended,
        )


def service(env: Environ, event: dict) -> Story:
    chat_id = event["pathParameters"]["chat-id"]
    result = Story.from_db(
        env=env,
        chat_id=urllib.parse.unquote(chat_id),
        memories=json.loads(event["body"])["memories"],
    )
    put_story(
        story=result.story,
        memories=result.memories,
        chat_id=result.chat_id,
        env=env,
    )
    return result


def response(status_code: int, body: dict, env: Environ) -> dict:
    # https://docs.aws.amazon.com/ja_jp/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
    # https://docs.aws.amazon.com/ja_jp/apigateway/latest/developerguide/how-to-cors.html
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Headers": env.ACCESS_CONTROL_ALLOW_HEADERS,
            "Access-Control-Allow-Methods": env.ACCESS_CONTROL_ALLOW_METHODS,
            "Access-Control-Allow-Origin": env.ACCESS_CONTROL_ALLOW_ORIGIN,
        },
        "body": json.dumps(body),
        "isBase64Encoded": False,
    }


def lambda_handler(event, context) -> dict:  # noqa: ANN001
    env = Environ.from_env()
    logger.info("start")
    try:
        result = service(env, event)
        logger.info(result)
        return response(200, result._asdict(), env)
    except Exception:
        logger.exception("internal server error")
        return response(500, {"error": "internal server error"}, env)
