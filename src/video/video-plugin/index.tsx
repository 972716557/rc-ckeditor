// CustomPlugin.js
import React from "react";
import {
  Plugin,
  toWidget,
  Command,
  ButtonView,
  viewToModelPositionOutsideModelElement,
} from "ckeditor5";
import ReactDOM from "react-dom/client";
import CustomReactComponent from "./CustomReactComponent";

// 自定义命令类，继承自 Command
class InsertCustomComponentCommand extends Command {
  execute({ message }) {
    const editor = this.editor;
    const view = editor.editing.view;
    const viewDocument = view.document;
    const model = editor.model;

    // 使用 downcastWriter 创建视图元素
    view.change((writer) => {
      const div = writer.createContainerElement("div", {
        class: "custom-react-component",
      });
      const widget = toWidget(div, writer);

      writer.insert(
        writer.createPositionAt(viewDocument.selection.getFirstPosition(), 0),
        widget
      );
    });

    // 在组件挂载后渲染 React 组件，并传递参数
    setTimeout(() => {
      const container = document.querySelector(".custom-react-component");
      if (container) {
        const root = ReactDOM.createRoot(container);
        root.render(<CustomReactComponent message={message} />);
      }
    }, 0);

    // 更新模型以保持同步
    model.change((writer) => {
      const element = writer.createElement("customComponent", { message });
      writer.insert(element, model.document.selection.getFirstPosition());
    });
  }
}

// 自定义插件类
export default class CustomPlugin extends Plugin {
  static get pluginName() {
    return "CustomPlugin";
  }

  init() {
    const editor = this.editor;

    // 注册自定义命令
    editor.commands.add(
      "insertCustomComponent",
      new InsertCustomComponentCommand(editor)
    );

    // 创建按钮并绑定命令
    editor.ui.componentFactory.add("customCardButton", (locale) => {
      const buttonView = new ButtonView(locale);

      buttonView.set({
        label: "插入自定义组件",
        withText: true,
        tooltip: true,
      });

      // 绑定按钮点击事件到命令执行，并传递参数
      buttonView.on("execute", () => {
        editor.execute("insertCustomComponent", { message: 11 });
      });

      return buttonView;
    });

    // 用于在编辑器中渲染为html
    editor.conversion.for("editingDowncast").elementToElement({
      model: "customComponent",
      view: (modelElement, { writer }) => {
        const label = "插入视频";
        const viewWrapper = writer.createContainerElement(
          "div",
          null,
          writer.createUIElement("div", null, function (domDocument) {
            const domElement = this.toDomElement(domDocument);
            domElement.innerHTML = `<div class='custom-react-component'></div>`;

            return domElement;
          })
        );
        // 在组件挂载后渲染 React 组件，并传递参数
        setTimeout(() => {
          const container = document.querySelector(".custom-react-component");
          if (container) {
            const root = ReactDOM.createRoot(container);
            root.render(<CustomReactComponent title={"11"} />);
          }
        }, 0);

        return toWidget(viewWrapper, writer, { label });
      },
    });

    // 用于导出为富文本
    editor.conversion.for("dataDowncast").elementToElement({
      model: "customComponent",
      view: (modelElement, { writer: viewWriter }) => {
        const message = modelElement.getAttribute("message");
        const div = viewWriter.createContainerElement("div", {
          class: "custom-react-component",
        });
        const p = viewWriter.createContainerElement("p");
        const text = viewWriter.createText(message);
        viewWriter.insert(viewWriter.createPositionAt(p, 0), text);
        viewWriter.insert(viewWriter.createPositionAt(div, 0), p);
        return div;
      },
    });

    // 文本渲染dom
    editor.conversion.for("upcast").elementToElement({
      view: {
        name: "div",
        classes: "custom-react-component",
      },
      model: (viewElement, { writer: modelWriter }) => {
        const p = viewElement.getChild(0);
        const message = p.getChild(0).data;
        return modelWriter.createElement("customComponent", { message });
      },
    });

    // 配置选择器，以便在编辑器中正确处理自定义组件元素
    editor.editing.mapper.on(
      "viewToModelPosition",
      viewToModelPositionOutsideModelElement(editor.model, (viewElement) =>
        viewElement.hasClass("custom-react-component")
      )
    );
  }
}
