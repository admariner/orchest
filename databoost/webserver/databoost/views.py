from databoost import app, db
from flask import render_template, request, jsonify
from .models import AlchemyEncoder, Pipeline
import json
import os
import uuid


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


@app.route("/async/pipelines/delete/<pipeline_id>", methods=["POST"])
def pipelines_delete(pipeline_id):

    Pipeline.query.filter(Pipeline.id == int(pipeline_id)).delete()
    db.session.commit()

    return jsonify({"success": True})


@app.route("/async/pipelines/create", methods=["POST"])
def pipelines_create():

    pipeline = Pipeline()
    pipeline.name = request.form.get("name")
    pipeline.uuid = str(uuid.uuid4())

    db.session.add(pipeline)
    db.session.commit()

    return jsonify({"success": True})


@app.route("/async/pipelines/get", methods=["GET"])
def pipelines_get():

    pipelines = Pipeline.query.all()

    json_string = json.dumps({"success:": True, "result": pipelines}, cls=AlchemyEncoder)
    return json_string, 200, {'content-type': 'application/json'}


def get_pipeline_directory_by_uuid(uuid):

    pipeline_dir = os.path.join(app.config['ROOT_DIR'], "userdir/pipelines/" + uuid)

    # create pipeline dir if it doesn't exist
    os.makedirs(pipeline_dir, exist_ok=True)

    return pipeline_dir


def generate_ipynb_from_template(step):
    template_json = json.load(open(os.path.join(app.config['RESOURCE_DIR'], "ipynb_template.json"), "r"))

    # TODO: support additional languages to Python
    template_json["metadata"]["kernelspec"]["display_name"] = step["image"]["image_name"]
    template_json["metadata"]["kernelspec"]["name"] = step["image"]["display_name"]

    return json.dumps(template_json)


def create_pipeline_files(pipeline_json):

    pipeline_directory = get_pipeline_directory_by_uuid(pipeline_json["uuid"])

    # currently, we check per step whether the file exists. If not, we create it (empty by default).
    # In case the file has an .ipynb extension we generate the file from a template with a kernel based on the
    # kernel description in the JSON step.

    # iterate over steps
    steps = pipeline_json["steps"].keys()

    for key in steps:
        step = pipeline_json["steps"][key]

        file_name = step["file_path"]

        full_file_path = os.path.join(pipeline_directory, file_name)

        if not os.path.isfile(full_file_path):
            ext = file_name.split(".")[-1]

            file_content = ""

            if ext == "ipynb":
                file_content = generate_ipynb_from_template(step)

            file = open(full_file_path, "w")

            file.write(file_content)


@app.route("/async/pipelines/json/save", methods=["POST"])
def pipelines_json_save():

    pipeline_directory = get_pipeline_directory_by_uuid(request.form.get("pipeline_uuid"))

    # TODO: think properly about how to generate the pipeline files

    # parse JSON
    pipeline_json = json.loads(request.form.get("pipeline_json"))
    create_pipeline_files(pipeline_json)

    with open(os.path.join(pipeline_directory, "pipeline.json"), "w") as json_file:
        json_file.write(json.dumps(pipeline_json))

    return jsonify({"success": True})


@app.route("/async/pipelines/json/get/<pipeline_uuid>", methods=["GET"])
def pipelines_json_get(pipeline_uuid):

    pipeline_directory = get_pipeline_directory_by_uuid(pipeline_uuid)

    pipeline_json_path = os.path.join(pipeline_directory, "pipeline.json")
    if not os.path.isfile(pipeline_json_path):
        return jsonify({"success": False, "reason": "pipeline.json doesn't exist"})
    else:
        with open(pipeline_json_path) as json_file:
            return jsonify({"success": True, "pipeline_json": json_file.read()})
