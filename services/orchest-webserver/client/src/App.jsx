import React from "react";

import { RefManager, makeRequest } from "@orchest/lib-utils";

import { OrchestContext } from "@/hooks/orchest";

import Dialogs from "./components/Dialogs";
import HeaderBar from "./components/HeaderBar";
import MainDrawer from "./components/MainDrawer";
import Jupyter from "./jupyter/Jupyter";

import PipelineSettingsView from "./views/PipelineSettingsView";
import PipelineView from "./views/PipelineView";
import ProjectsView from "./views/ProjectsView";
import JupyterLabView from "./views/JupyterLabView";

import {
  nameToComponent,
  componentName,
  generateRoute,
  decodeRoute,
  pascalCaseToCapitalized,
  loadIntercom,
} from "./utils/webserver-utils";
import EnvironmentsView from "./views/EnvironmentsView";
import PipelinesView from "./views/PipelinesView";
import JobsView from "./views/JobsView";

import $ from "jquery";
import "./utils/overflowing";
window.$ = $;

class App extends React.Component {
  static contextType = OrchestContext;

  constructor(props, context) {
    super(props, context);

    this.KEEP_PIPELINE_VIEWS = [
      PipelineView,
      PipelineSettingsView,
      JupyterLabView,
    ];
    this.INJECT_PROJECT_UUID_VIEWS = [
      EnvironmentsView,
      PipelinesView,
      JobsView,
    ];

    // load server side config populated by flask template
    this.config = window.ORCHEST_CONFIG;
    this.user_config = window.ORCHEST_USER_CONFIG;

    if (this.config.FLASK_ENV === "development") {
      console.log("Orchest is running with --dev.");
    }

    if (this.config.CLOUD === true) {
      console.log("Orchest is running with --cloud.");

      loadIntercom(
        this.config["INTERCOM_APP_ID"],
        this.config["INTERCOM_USER_EMAIL"],
        this.config["INTERCOM_DEFAULT_SIGNUP_DATE"]
      );
    }

    this.sendEvent = function (event, properties) {
      if (!orchest.config["TELEMETRY_DISABLED"]) {
        makeRequest("POST", "/analytics", {
          type: "json",
          content: {
            event: event,
            properties: properties,
          },
        });
      }
    };

    window.onpopstate = (event) => {
      if (event.state !== null) {
        let conditionalBody = () => {
          this._loadView(
            nameToComponent(event.state.viewName),
            event.state.dynamicProps
          );
        };

        if (!this.unsavedChanges) {
          conditionalBody();
        } else {
          this.confirm(
            "Warning",
            "There are unsaved changes. Are you sure you want to navigate away?",
            () => {
              this.setUnsavedChanges(false);
              conditionalBody();
            }
          );
        }
      }
    };

    this.state = {
      activeViewName: "",
    };

    this.refManager = new RefManager();

    // Attach to window
    window.orchest = this;
  }

  _loadView(TagName, dynamicProps) {
    let viewName = componentName(TagName);

    // Analytics call
    this.sendEvent("view load", { name: viewName });

    if (this.config["CLOUD"] === true && window.Intercom !== undefined) {
      window.Intercom("update");
    }

    if (this.KEEP_PIPELINE_VIEWS.indexOf(TagName) === -1) {
      this.context.dispatch({ type: "pipelineClear" });
    }

    // select menu if menu tag is selected
    this.setState({
      TagName,
      dynamicProps,
      activeViewName: viewName,
    });
  }

  _generateView(TagName, dynamicProps) {
    // add selectedProject to ProjectBasedView
    if (this.INJECT_PROJECT_UUID_VIEWS.indexOf(TagName) !== -1) {
      dynamicProps.project_uuid = this.context.state.project_uuid;
    }

    return <TagName {...dynamicProps} />;
  }

  setUnsavedChanges(unsavedChanges) {
    if (unsavedChanges) {
      // Enable navigation prompt
      window.onbeforeunload = function () {
        return true;
      };
    } else {
      // Remove navigation prompt
      window.onbeforeunload = null;
    }

    this.unsavedChanges = unsavedChanges;
  }

  loadView(TagName, dynamicProps, onCancelled) {
    // dynamicProps default
    if (!dynamicProps) {
      dynamicProps = {};
    }

    let conditionalBody = () => {
      // This public loadView sets the state through the
      // history API.

      let [pathname, search] = generateRoute(TagName, dynamicProps);

      // Because pushState objects need to be serialized,
      // we need to store the string representation of the TagName.
      let viewName = componentName(TagName);
      window.history.pushState(
        {
          viewName,
          dynamicProps,
        },
        /* `title` argument for pushState was deprecated, 
      document.title should be used instead. */
        "",
        pathname + search
      );

      window.document.title =
        pascalCaseToCapitalized(viewName.replace("View", "")) + " · Orchest";

      this._loadView(TagName, dynamicProps);
    };

    if (!this.unsavedChanges) {
      conditionalBody();
    } else {
      this.confirm(
        "Warning",
        "There are unsaved changes. Are you sure you want to navigate away?",
        () => {
          this.setUnsavedChanges(false);
          conditionalBody();
        },
        onCancelled
      );
    }
  }

  loadDefaultView = function () {
    // if request view doesn't load, load default route
    this.loadView(ProjectsView);
  };

  initializeFirstView() {
    // handle default
    if (location.pathname == "/") {
      this.loadDefaultView();
    }
    try {
      let [TagName, dynamicProps] = decodeRoute(
        location.pathname,
        location.search
      );
      this.loadView(TagName, dynamicProps);
    } catch (error) {
      this.loadDefaultView();
    }
  }

  alert(title, content, onClose) {
    // Analytics call
    this.sendEvent("alert show", { title: title, content: content });

    this.refManager.refs.dialogs.alert(title, content, onClose);
  }

  confirm(title, content, onConfirm, onCancel) {
    // Analytics call
    this.sendEvent("confirm show", { title: title, content: content });

    this.refManager.refs.dialogs.confirm(title, content, onConfirm, onCancel);
  }

  requestBuild(
    project_uuid,
    environmentValidationData,
    requestedFromView,
    onBuildComplete,
    onCancel
  ) {
    // Analytics call
    this.sendEvent("build-request request", {
      requestedFromView: requestedFromView,
    });

    this.refManager.refs.dialogs.requestBuild(
      project_uuid,
      environmentValidationData,
      requestedFromView,
      onBuildComplete,
      onCancel
    );
  }

  componentDidMount() {
    // create Jupyter manager
    this.jupyter = new Jupyter(this.refManager.refs.jupyter);

    this.setUnsavedChanges(false);
    this.initializeFirstView();
  }

  getProject() {
    return new Promise((resolve, reject) => {
      // Use this to get the currently selected project outside
      // of a view that consumes it as props.
      // E.g. in the pipeline view that loads the selected project's
      // pipeline when no query arguments are passed.
      if (this.context.state.project_uuid) {
        resolve(this.context.state.project_uuid);
      } else {
        // No project selected yet, fetch from server
        makeRequest(
          "GET",
          "/async/projects?skip_discovery=true&session_counts=false"
        )
          .then((result) => {
            let projects = JSON.parse(result);
            if (projects.length == 0) {
              resolve(undefined);
            } else {
              resolve(projects[0].uuid);
            }
          })
          .catch(() => {
            reject();
          });
      }
    });
  }

  render() {
    let view;
    if (this.state.TagName) {
      view = this._generateView(this.state.TagName, this.state.dynamicProps);
    }

    return (
      <>
        <HeaderBar />
        <div className="app-container">
          <MainDrawer selectedElement={this.state.activeViewName} />
          <main className="main-content" id="main-content">
            {view}
            <div
              ref={this.refManager.nrefs.jupyter}
              className="persistent-view jupyter hidden"
            />
          </main>
        </div>
        <div className="dialogs">
          <Dialogs ref={this.refManager.nrefs.dialogs} />
        </div>
      </>
    );
  }
}

export default App;
