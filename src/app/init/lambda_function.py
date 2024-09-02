from __future__ import annotations

import datetime
import json
import logging
import os
import time
import uuid
from typing import NamedTuple

import boto3

logger = logging.getLogger()


class Environ(NamedTuple):
    MASTER_TABLE: str
    STORY_HISTORY_TABLE: str
    ACCESS_CONTROL_ALLOW_HEADERS: str
    ACCESS_CONTROL_ALLOW_METHODS: str
    ACCESS_CONTROL_ALLOW_ORIGIN: str

    @classmethod
    def from_env(cls: type[Environ]) -> Environ:
        return Environ(**{key: os.environ[key] for key in Environ._fields})


def obtain_init_story(env: Environ) -> str:
    table = boto3.resource("dynamodb").Table(env.MASTER_TABLE)
    res = table.get_item(
        Key={
            "command": "story",
            "version": "latest",
        },
    ).get("Item")
    return res["value"]  # type: ignore  # noqa: PGH003


def obtain_init_memories(env: Environ) -> list[str]:
    table = boto3.resource("dynamodb").Table(env.MASTER_TABLE)
    res = table.get_item(
        Key={
            "command": "memories",
            "version": "latest",
        },
    ).get("Item")
    return res["value"]  # type: ignore  # noqa: PGH003


def now_epoch_ms() -> int:
    return int(time.time() * 1000)


def to_isoformat(epoch_ms: int) -> str:
    return datetime.datetime.fromtimestamp(epoch_ms / 1000).isoformat()


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
        },
    )


def create_chat_id() -> str:
    return f"{uuid.uuid4()}-{now_epoch_ms()}"


class InitStory(NamedTuple):
    chat_id: str
    story: str
    memories: list[str]

    @classmethod
    def from_db(cls: type[InitStory], env: Environ) -> InitStory:
        return InitStory(
            chat_id=create_chat_id(),
            story=obtain_init_story(env),
            memories=obtain_init_memories(env),
        )


def service(env: Environ) -> InitStory:
    result = InitStory.from_db(env)
    put_story(
        story=result.story,
        memories=result.memories,
        chat_id=result.chat_id,
        env=env,
    )
    return result


def response(status_code: int, body: dict, env: Environ) -> dict:
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
        result = service(env)
        logger.info(result)
        return response(200, result._asdict(), env)
    except Exception:
        logger.exception("internal server error")
        return response(500, {"error": "internal server error"}, env)
