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
    TTL_SECONDS: str
    TTL_KEY: str

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
    epoch_ms: int,
) -> None:
    table = boto3.resource("dynamodb").Table(env.STORY_HISTORY_TABLE)
    table.put_item(
        Item={
            "chat_id": chat_id,
            "epoch_ms": epoch_ms,
            "story": story,
            "memories": memories,
            "timestamp": to_isoformat(epoch_ms),
            env.TTL_KEY: now_epoch_sec() + int(env.TTL_SECONDS),
        },
    )


def create_chat_id() -> str:
    return f"{uuid.uuid4()}-{now_epoch_ms()}"


class Story(NamedTuple):
    chat_id: str
    story: str
    memories: dict[int, str]
    epoch_ms: int

    @classmethod
    def from_db(cls: type[Story], env: Environ) -> Story:
        memories = obtain_init_memories(env)
        return Story(
            chat_id=create_chat_id(),
            story=obtain_init_story(env),
            memories={str(i): v for i, v in enumerate(memories)},
            epoch_ms=now_epoch_ms(),
        )


def service(env: Environ) -> Story:
    result = Story.from_db(env)
    put_story(
        story=result.story,
        memories=result.memories,
        chat_id=result.chat_id,
        env=env,
        epoch_ms=result.epoch_ms,
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
