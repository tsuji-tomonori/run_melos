from typing import Any, Self

import aws_cdk as cdk
from aws_cdk import aws_apigateway as apigw
from constructs import Construct


class ApigwConstruct(Construct):
    def __init__(
        self: Self,
        scope: Construct,
        construct_id: str,
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # APIGW
        self.api = apigw.RestApi(
            scope=self,
            id="api",
            rest_api_name="run-melos",
            description="run melos",
            deploy_options=apigw.StageOptions(
                logging_level=apigw.MethodLoggingLevel.ERROR,
                stage_name="v1",
            ),
            default_cors_preflight_options=apigw.CorsOptions(
                allow_origins=apigw.Cors.ALL_ORIGINS,
                allow_methods=apigw.Cors.ALL_METHODS,
            ),
        )

        # output
        cdk.CfnOutput(
            self,
            "api_url",
            value=self.api.url,
        )
