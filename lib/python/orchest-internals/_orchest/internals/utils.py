import logging
import os
import time
import uuid
from urllib.parse import unquote

import docker
import requests
from docker.types import DeviceRequest
from flask import Response


def get_mount(source, target, form="docker-sdk"):
    if form == "docker-sdk":
        return {source: {"bind": target, "mode": "rw"}}
    elif form == "docker-engine":
        return f"{source}:{target}"


def run_orchest_ctl(client, command):

    return client.containers.run(
        "orchest/orchest-ctl:latest",
        command,
        name="orchest-ctl-" + str(uuid.uuid4()),
        detach=True,
        auto_remove=True,
        mounts=[
            docker.types.Mount(
                source="/var/run/docker.sock",
                target="/var/run/docker.sock",
                type="bind",
            ),
            docker.types.Mount(
                source=os.environ.get("HOST_REPO_DIR"),
                target="/orchest-host",
                type="bind",
            ),
        ],
        environment={
            "HOST_CONFIG_DIR": os.environ.get("HOST_CONFIG_DIR"),
            "HOST_REPO_DIR": os.environ.get("HOST_REPO_DIR"),
            "HOST_USER_DIR": os.environ.get("HOST_USER_DIR"),
            "HOST_OS": os.environ.get("HOST_OS"),
        },
    )


def _proxy(request, new_host):

    resp = requests.request(
        method=request.method,
        url=unquote(request.url.replace(request.host_url, new_host)),
        headers={key: value for (key, value) in request.headers if key != "Host"},
        data=request.get_data(),
        cookies=request.cookies,
        allow_redirects=False,
    )

    excluded_headers = [
        "content-encoding",
        "content-length",
        "transfer-encoding",
        "connection",
    ]
    headers = [
        (name, value)
        for (name, value) in resp.raw.headers.items()
        if name.lower() not in excluded_headers
    ]

    response = Response(resp.content, resp.status_code, headers)
    return response


def get_device_requests(environment_uuid, project_uuid, form="docker-sdk"):

    device_requests = []

    capabilities = get_environment_capabilities(environment_uuid, project_uuid)

    if len(capabilities) > 0:

        if form == "docker-sdk":
            device_requests.append(DeviceRequest(count=-1, capabilities=[capabilities]))
        elif form == "docker-engine":
            device_requests.append(
                {"Driver": "nvidia", "Count": -1, "Capabilities": [capabilities]}
            )

    return device_requests


def get_environment_capabilities(environment_uuid, project_uuid):

    capabilities = []

    try:
        response = requests.get(
            "http://orchest-webserver/store/environments/%s/%s"
            % (project_uuid, environment_uuid)
        )
        response.raise_for_status()
    except Exception as e:
        logging.error(
            (
                "Failed to get environment for environment_uuid[%s]"
                " and project_uuid[%s]. Error: %s (%s)"
            )
            % (environment_uuid, project_uuid, e, type(e))
        )
        return capabilities

    environment = response.json()

    if environment["gpu_support"]:
        capabilities += ["gpu", "utility", "compute"]

    return capabilities


def get_orchest_mounts(
    project_dir, host_user_dir, host_project_dir, mount_form="docker-sdk"
):
    """
    Prepare all mounts that are needed to run Orchest.

    Args:
        mount_form: One of "docker-sdk" or "docker-engine". The former
            is used for the "docker-py" package and the latter for
            "aiodocker".

    """

    project_dir_mount = get_mount(
        source=host_project_dir, target=project_dir, form=mount_form
    )

    if mount_form == "docker-sdk":
        mounts = project_dir_mount
    else:
        mounts = [project_dir_mount]

    # Mount the /userdir/data directory.
    target_path = "/data"
    source = os.path.join(host_user_dir, "data")

    mount = get_mount(
        source=source,
        target=target_path,
        form=mount_form,
    )

    if mount_form == "docker-sdk":
        mounts[source] = mount[source]
    else:
        mounts.append(mount)

    return mounts


def docker_images_list_safe(docker_client, *args, attempt_count=10, **kwargs):

    for _ in range(attempt_count):
        try:
            return docker_client.images.list(*args, **kwargs)
        except docker.errors.ImageNotFound as e:
            logging.debug(
                "Internal race condition triggered in docker_client.images.list(): %s"
                % e
            )
        except Exception as e:
            logging.debug("Failed to call docker_client.images.list(): %s" % e)
            return None


def is_werkzeug_parent():
    # When Flask is running in dev mode, Werkzeug
    # starts a parent and child process to support hot reloading.

    # For code that needs to run non-concurrently we use this gate
    # to avoid concurrent exection.
    if os.environ.get("FLASK_ENV") != "development":
        return False
    elif os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        return True


def docker_images_rm_safe(docker_client, *args, attempt_count=10, **kwargs):

    for _ in range(attempt_count):
        try:
            return docker_client.images.remove(*args, **kwargs)
        except docker.errors.ImageNotFound as e:
            logging.debug("Failed to remove image: %s" % e)
            return
        except Exception as e:
            logging.debug("Failed to remove image: %s" % e)
        time.sleep(1)
