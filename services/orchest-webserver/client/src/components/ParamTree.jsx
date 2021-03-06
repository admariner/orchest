import React from "react";
import _ from "lodash";
import { Alert, IconLightBulb, Link } from "@orchest/design-system";

class ParamTree extends React.Component {
  truncateParameterValue(value) {
    // stringify non string values
    if (!_.isString(value)) {
      value = JSON.stringify(value);
    }

    let maxLength = 50;
    return value.length > maxLength
      ? value.substring(0, maxLength - 1) + "…"
      : value;
  }

  onEditParameter(parameterKey, key) {
    if (this.props.editParameter) {
      this.props.editParameter(parameterKey, key);
    }
  }

  generateParameterElement(stepStrategy, includeTitle) {
    let elements = [];

    if (includeTitle === undefined) {
      includeTitle = true;
    }

    if (includeTitle) {
      elements.push(<b key={stepStrategy.key}>{stepStrategy.title}</b>);
    }

    for (let parameterKey in stepStrategy.parameters) {
      let parameterValueClasses = ["parameter-value"];

      if (this.props.editParameter) {
        parameterValueClasses.push("editable");
      }

      elements.push(
        <div
          key={parameterKey + "-" + stepStrategy.key}
          className="parameter-row"
        >
          <div className="parameter-key">{parameterKey}:</div>
          <div
            className={parameterValueClasses.join(" ")}
            onClick={this.onEditParameter.bind(
              this,
              parameterKey,
              stepStrategy.key
            )}
          >
            {this.truncateParameterValue(stepStrategy.parameters[parameterKey])}
          </div>
        </div>
      );
    }

    return elements;
  }

  generateParameterTree(strategyJSON) {
    let pipelineParameterElement;
    let stepParameterElements = [];

    // first list pipeline parameters
    let pipelineParameterization =
      strategyJSON[orchest.config["PIPELINE_PARAMETERS_RESERVED_KEY"]];
    if (pipelineParameterization) {
      pipelineParameterElement = this.generateParameterElement(
        pipelineParameterization,
        false
      );
    }

    for (const stepUUID in strategyJSON) {
      if (stepUUID == orchest.config["PIPELINE_PARAMETERS_RESERVED_KEY"]) {
        continue;
      }

      stepParameterElements = stepParameterElements.concat(
        this.generateParameterElement(strategyJSON[stepUUID])
      );
    }

    return [pipelineParameterElement, stepParameterElements];
  }
  render() {
    let [
      pipelineParameterElement,
      stepParameterElements,
    ] = this.generateParameterTree(this.props.strategyJSON);

    return (
      <div className="parameter-tree">
        {(() => {
          if (Object.keys(this.props.strategyJSON).length == 0) {
            return (
              <Alert
                icon={<IconLightBulb />}
                status="info"
                title="This pipeline doesn't have any parameters defined"
                description={
                  <>
                    <Link
                      target="_blank"
                      href="https://orchest.readthedocs.io/en/stable/user_guide/jobs.html#parametrizing-your-pipeline-and-steps"
                    >
                      Learn more
                    </Link>{" "}
                    about parametrizing your pipelines and steps.
                  </>
                }
              />
            );
          }
        })()}

        {pipelineParameterElement !== undefined && (
          <div className="param-block">
            <h3>Pipeline: {this.props.pipelineName}</h3>
            {pipelineParameterElement}
          </div>
        )}

        {stepParameterElements.length > 0 && (
          <div className="param-block">
            <h3>Steps</h3>
            <div className="step-params">{stepParameterElements}</div>
          </div>
        )}
      </div>
    );
  }
}

export default ParamTree;
