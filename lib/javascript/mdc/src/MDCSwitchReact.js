import React from "react";
import { MDCSwitch } from "@material/switch";
import { RefManager, uuidv4 } from "@orchest/lib-utils";

// used only in orchest-webserver
export class MDCSwitchReact extends React.Component {
  constructor() {
    super();

    this.refManager = new RefManager();
  }

  componentDidMount() {
    this.mdc = new MDCSwitch(this.refManager.refs.switch);
    this.mdc.foundation.handleChange = this.onChange.bind(this);
  }

  onChange(e) {
    if (this.props.onChange) {
      this.props.onChange(e);
    }
  }

  render() {
    let mdcClasses = ["mdc-switch"];
    if (this.props.on === true) {
      mdcClasses.push("mdc-switch--checked");
    }
    if (this.props.disabled === true) {
      mdcClasses.push("mdc-switch--disabled");
    }
    mdcClasses = mdcClasses.join(" ");

    let topClasses = ["mdc-switch-wrapper"];
    if (this.props.classNames) {
      topClasses = topClasses.concat(this.props.classNames);
    }
    topClasses = topClasses.join(" ");

    let randomFor = uuidv4();

    return (
      <div className={topClasses}>
        <div className={mdcClasses} ref={this.refManager.nrefs.switch}>
          <div className="mdc-switch__track" />
          <div className="mdc-switch__thumb-underlay">
            <div className="mdc-switch__thumb" />
            <input
              type="checkbox"
              id={randomFor}
              className="mdc-switch__native-control"
              role="switch"
              aria-checked={this.props.on === true ? "true" : "false"}
            />
          </div>
        </div>
        {this.props.label && (
          <label htmlFor={randomFor}>{this.props.label}</label>
        )}
      </div>
    );
  }
}
