from typing import Any, Self

import aws_cdk as cdk
from aws_cdk import Stack
from aws_cdk import aws_apigateway as apigw
from aws_cdk import aws_iam as iam
from constructs import Construct

from src.cdk.construct.api import ApigwConstruct
from src.cdk.construct.function import FunctionConstruct
from src.cdk.construct.table import DynamoDBConstruct


class BackendStack(Stack):
    def __init__(
        self: Self,
        scope: Construct,
        construct_id: str,
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.api = ApigwConstruct(self, "rest")
        self.table = DynamoDBConstruct(self, "table")

        # /init
        self.init = FunctionConstruct(self, "init")
        init_resource = self.api.api.root.add_resource("init")
        init_resource.add_method(
            http_method="POST",
            integration=apigw.LambdaIntegration(
                handler=self.init.function,
            ),
        )
        # iam
        assert self.init.function.role is not None
        self.table.master.grant_read_data(self.init.function.role)
        self.table.story_history.grant_write_data(self.init.function.role)
        # env
        self.init.function.add_environment(
            "MASTER_TABLE",
            self.table.master.table_name,
        )
        self.init.function.add_environment(
            "STORY_HISTORY_TABLE",
            self.table.story_history.table_name,
        )

        # /story/{chat_id}
        self.story = FunctionConstruct(self, "story")
        story_resource = self.api.api.root.add_resource("story")
        chat_id_resource = story_resource.add_resource("{chat-id}")
        chat_id_resource.add_method(
            http_method="POST",
            integration=apigw.LambdaIntegration(
                handler=self.story.function,
            ),
        )
        # iam
        assert self.story.function.role is not None
        self.table.master.grant_read_data(self.story.function.role)
        self.table.story_history.grant_read_write_data(
            self.story.function.role,
        )
        self.story.function.add_to_role_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "bedrock:InvokeModel",
                ],
                resources=[
                    f"arn:aws:bedrock:{cdk.Aws.REGION}::foundation-model/*",
                ],
            ),
        )
        # env
        self.story.function.add_environment(
            "MASTER_TABLE",
            self.table.master.table_name,
        )
        self.story.function.add_environment(
            "STORY_HISTORY_TABLE",
            self.table.story_history.table_name,
        )
