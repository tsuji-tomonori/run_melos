from typing import Any, Self

import aws_cdk as cdk
from aws_cdk import aws_dynamodb as dynamdb
from constructs import Construct

TTL_KEY = "ttl_key"


class DynamoDBConstruct(Construct):
    def __init__(
        self: Self,
        scope: Construct,
        construct_id: str,
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.master = dynamdb.Table(
            scope=self,
            id="master",
            partition_key=dynamdb.Attribute(
                name="command",
                type=dynamdb.AttributeType.STRING,
            ),
            sort_key=dynamdb.Attribute(
                name="version",
                type=dynamdb.AttributeType.STRING,
            ),
            billing_mode=dynamdb.BillingMode.PAY_PER_REQUEST,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            time_to_live_attribute=TTL_KEY,
        )

        self.story_history = dynamdb.Table(
            scope=self,
            id="story_history",
            partition_key=dynamdb.Attribute(
                name="chat_id",
                type=dynamdb.AttributeType.STRING,
            ),
            sort_key=dynamdb.Attribute(
                name="epoch_ms",
                type=dynamdb.AttributeType.NUMBER,
            ),
            billing_mode=dynamdb.BillingMode.PAY_PER_REQUEST,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            time_to_live_attribute=TTL_KEY,
        )
