from pathlib import Path
from typing import Any, Self

import aws_cdk as cdk
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_logs as logs
from constructs import Construct

CORS = {
    "ACCESS_CONTROL_ALLOW_HEADERS": (
        "Content-Type,X-Amz-Date,Authorization,\
            X-Api-Key,X-Amz-Security-Token"
    ),
    "ACCESS_CONTROL_ALLOW_METHODS": "*",
    "ACCESS_CONTROL_ALLOW_ORIGIN": "*",
}


class FunctionConstruct(Construct):
    def __init__(
        self: Self,
        scope: Construct,
        construct_id: str,
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.function = lambda_.Function(
            scope=self,
            id="function",
            code=lambda_.Code.from_asset(
                str(Path.cwd() / "src" / "app" / construct_id),
            ),
            handler="lambda_function.lambda_handler",
            runtime=lambda_.Runtime.PYTHON_3_11,
            logging_format=lambda_.LoggingFormat.JSON,
            system_log_level_v2=lambda_.SystemLogLevel.INFO,
            application_log_level_v2=lambda_.ApplicationLogLevel.INFO,
            memory_size=512,
            timeout=cdk.Duration.seconds(30),
            environment=CORS,
        )

        self.logs = logs.LogGroup(
            scope=self,
            id="logs",
            log_group_name=f"/aws/lambda/{self.function.function_name}",
            retention=logs.RetentionDays.THREE_MONTHS,
            removal_policy=cdk.RemovalPolicy.DESTROY,
        )
