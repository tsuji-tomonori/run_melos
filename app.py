from pathlib import Path

import aws_cdk as cdk
import tomllib
from aws_cdk import Tags

from src.cdk.stack.backend import BackendStack


def add_name_tag(scope):  # noqa: ANN001, ANN201
    for child in scope.node.children:
        if cdk.Resource.is_resource(child):
            Tags.of(child).add("Name", child.node.path.replace("/", "-"))
        add_name_tag(child)


with (Path.cwd() / "pyproject.toml").open("rb") as f:
    project = tomllib.load(f)["project"]["name"]

app = cdk.App()

BackendStack(
    scope=app,
    construct_id=f"{project.replace('_', '-')}",
    env=cdk.Environment(
        region="ap-northeast-1",
    ),
)

Tags.of(app).add("Project", project)
Tags.of(app).add("ManagedBy", "cdk")
add_name_tag(app)

app.synth()
