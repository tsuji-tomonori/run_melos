from typing import Any, Self

import aws_cdk as cdk
from aws_cdk import Stack
from aws_cdk import aws_cloudfront as cloudfront
from aws_cdk import aws_cloudfront_origins as origins
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_s3_deployment as deployment
from constructs import Construct


class FrontEndStack(Stack):
    def __init__(
        self: Self,
        scope: Construct,
        construct_id: str,
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        static_bucket = s3.Bucket(
            self,
            "bucket",
            removal_policy=cdk.RemovalPolicy.DESTROY,
        )

        static_distribution = cloudfront.Distribution(
            self,
            "cloudfront_distribution",
            default_root_object="index.html",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin.with_origin_access_control(static_bucket),
            ),
        )

        deployment.BucketDeployment(
            self,
            "deploy",
            sources=[deployment.Source.asset("src/web/build")],
            destination_bucket=static_bucket,
            distribution=static_distribution,
            distribution_paths=["/*"],
        )

        # output
        cdk.CfnOutput(
            self,
            "static_web_url",
            value=f"https://{static_distribution.domain_name}",
        )

        cdk.Tags.of(self).add("Public", "True")
