import React from "react";
import { MDCTextFieldReact } from "@orchest/lib-mdc";
import {
  absoluteToRelativePath,
  collapseDoubleDots,
  RefManager,
} from "@orchest/lib-utils";

class FilePicker extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      focused: false,
      path: this.setInitialPath(props),
    };

    this.refManager = new RefManager();
  }

  setInitialPath(props) {
    let cwd = props.cwd ? props.cwd : "/";
    let fullPath = collapseDoubleDots(cwd + props.value);
    let directoryPath = fullPath.split("/").slice(0, -1).join("/") + "/";

    // check if directoryPath is in tree
    if (!this.validatePathInTree(directoryPath, props.tree)) {
      directoryPath = "/";
    }

    return directoryPath;
  }

  validatePathInTree(path, tree) {
    // path assumed to start with /

    // Valid inputs
    // /def/def
    // /def
    // /abc/

    // Invalid inputs:
    // //asd (empty directory component)
    // asd/asd.py (doesn't start with /)
    if (path === undefined || tree === undefined) {
      return false;
    }
    if (tree.type != "directory") {
      return false;
    }
    if (path[0] !== "/") {
      return false;
    }

    let pathComponents = path.split("/");
    let isFirstComponentDir = pathComponents.length > 2;

    if (isFirstComponentDir) {
      for (let x = 0; x < tree.children.length; x++) {
        let child = tree.children[x];
        if (child.name == pathComponents[1] && child.type == "directory") {
          // Path ends in directory
          if (pathComponents[2] == "") {
            return true;
          }
          return this.validatePathInTree(
            "/" + pathComponents.slice(2).join("/"),
            child
          );
        }
      }
      return false;
    } else {
      for (let x = 0; x < tree.children.length; x++) {
        let child = tree.children[x];
        if (child.name == pathComponents[1] && child.type == "file") {
          return true;
        }
      }
    }
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.cwd !== this.props.cwd ||
      prevProps.tree !== this.props.tree ||
      prevProps.value !== this.props.value
    ) {
      this.setInitialPath(this.props);
    }
  }

  componentWillUnmount() {
    clearTimeout(this.blurTimeout);
  }

  onChangeValue(value) {
    if (this.props.onChangeValue) {
      this.props.onChangeValue(value);
    }
  }

  directoryListFromNode(node) {
    let nodes = [];

    // handle edge case of no nodes
    if (!node.children) {
      return nodes;
    }

    // add create file and move up directory
    nodes.push(
      <li
        key="create"
        className="mdc-list-item"
        onClick={this.onCreateFile.bind(this)}
      >
        <i className="material-icons">add</i> New file
      </li>
    );

    if (node.root !== true) {
      nodes.push(
        <li
          key=".."
          className="mdc-list-item"
          onClick={this.onNavigateUp.bind(this)}
        >
          ..
        </li>
      );
    }

    for (let childNode of node.children) {
      nodes.push(
        <li
          key={childNode.name}
          className="mdc-list-item"
          onClick={this.onSelectListItem.bind(this, childNode)}
        >
          {childNode.type == "directory" && (
            <i className="material-icons">folder</i>
          )}
          {childNode.name + (childNode.type == "directory" ? "/" : "")}
        </li>
      );
    }

    return nodes;
  }

  onCreateFile() {
    if (this.props.onCreateFile) {
      this.props.onCreateFile(this.state.path);
    }
  }

  visualizePath(path, cwd) {
    return absoluteToRelativePath(path, cwd).slice(1);
  }

  onNavigateUp() {
    this.refManager.refs.filePathTextField.focusAtEnd();

    this.setState((state, _) => {
      let newPath = state.path.slice(
        0,
        state.path.slice(0, -1).lastIndexOf("/") + 1
      );

      this.onChangeValue(this.visualizePath(newPath, this.props.cwd));

      return {
        path: newPath,
      };
    });
  }

  onSelectListItem(node) {
    // override focus on list item click
    if (node.type == "directory") {
      this.refManager.refs.filePathTextField.focusAtEnd();

      this.setState((state, _) => {
        let newPath = state.path + node.name + "/";

        this.onChangeValue(this.visualizePath(newPath, this.props.cwd));

        return {
          path: newPath,
        };
      });
    } else {
      this.onChangeValue(
        this.visualizePath(this.state.path + node.name, this.props.cwd)
      );

      this.setState({
        focused: false,
      });
    }
  }

  nodeFromPath(path, tree) {
    // a path should always start with a root of "/"
    let pathComponents = path.split("/").slice(1);
    let currentNode = tree;

    // traverse to the right directory node
    for (let component of pathComponents) {
      for (let child of currentNode.children) {
        if (child.name == component) {
          currentNode = child;
          break;
        }
      }
    }

    return currentNode;
  }

  onBlurMenu(e) {
    this.setState({
      focused: false,
    });
  }

  onFocusTextField(e) {
    this.setState({
      focused: true,
    });
    if (this.props.onFocus) {
      this.props.onFocus();
    }
  }

  onBlurTextField(e) {
    clearTimeout(this.blurTimeout);
    this.blurTimeout = setTimeout(() => {
      if (document.activeElement !== this.refManager.refs.fileMenu) {
        this.setState({
          focused: false,
        });
      }
    });
  }

  render() {
    let directory_list = this.directoryListFromNode(
      this.nodeFromPath(this.state.path, this.props.tree)
    );

    return (
      <div className="dropdown-file-picker">
        <MDCTextFieldReact
          onFocus={this.onFocusTextField.bind(this)}
          onBlur={this.onBlurTextField.bind(this)}
          onChange={this.onChangeValue.bind(this)}
          value={this.props.value}
          label="File path"
          icon={this.props.icon}
          iconTitle={this.props.iconTitle}
          ref={this.refManager.nrefs.filePathTextField}
          classNames={["fullwidth"]}
        />
        {(() => {
          return (
            <div
              ref={this.refManager.nrefs.fileMenu}
              onBlur={this.onBlurMenu.bind(this)}
              // tabIndex is REQUIRED for proper blur/focus events
              // for the dropdown mdc-list.
              tabIndex="0"
              className={
                "mdc-menu mdc-menu-surface mdc-menu-surface--open " +
                (this.state.focused ? "" : "hidden")
              }
            >
              <ul className="mdc-list">{directory_list}</ul>
            </div>
          );
        })()}
      </div>
    );
  }
}

FilePicker.defaultProps = {
  tree: {
    name: "/",
    root: true,
    type: "directory",
    children: [],
  },
};

export default FilePicker;
