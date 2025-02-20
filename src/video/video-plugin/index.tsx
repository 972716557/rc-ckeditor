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
import CustomReactComponent from "./video";
import { uniqueId } from "lodash";

/*
view.change
作用：主要用于在视图层（View）进行直接的、即时的更改操作。视图层负责处理用户在编辑器界面中实际看到的内容的呈现，
包括文本的格式、元素的样式、布局等。view.change 可以创建、修改或删除视图元素，直接影响编辑器的视觉效果。
场景：通常在命令执行时，根据具体的操作需求对视图进行调整，比如插入一个新的视图元素、修改某个元素的样式等。
editor.conversion.for("editingDowncast")
作用：用于定义模型层（Model）到视图层的转换规则，也就是将模型元素转换为视图元素的逻辑。
模型层是 CKEditor 5 内部对编辑器内容的抽象表示，独立于具体的 HTML 结构。
editingDowncast 转换规则确保在编辑过程中，模型的变化能够正确地反映在视图上。
场景：在插件初始化时，定义好模型元素和视图元素之间的映射关系，当模型发生变化时，CKEditor 5 会根据这些规则自动更新视图。
*/
class InsertCustomComponentCommand extends Command {
  // refresh 方法主要用于根据编辑器的当前状态来更新命令的可用性（isEnabled 属性）和其他相关状态。
  // 当编辑器的状态发生变化时（例如，用户选择了不同的文本区域、切换了编辑模式等），CKEditor 5 会自动调用命令的 refresh 方法，
  // 让命令有机会根据新的状态调整自身的属性。
  // 很多命令并不是在所有情况下都可以执行的，例如 “加粗” 命令，只有当有文本被选中时才应该可用。
  // 通过重写 refresh 方法，可以根据编辑器的选择状态来动态控制命令的可用性。
  // public refresh(): void {
  //   const model = this.editor.model;
  //   const schema = model.schema;
  //   const selection = model.document.selection;

  //   this.isEnabled = isESpaceVideoAllowedInParent(selection, schema, model);
  // }

  public execute({ message }: { message: string }): void {
    const model = this.editor.model;

    // view.change 是 CKEditor 5 的视图层（View）的核心方法，用于直接操作编辑器的 DOM 元素。
    // 视图层是用户实际看到的 HTML 内容，它与模型层通过双向绑定保持同步。
    // 直接操作 DOM：例如，修改样式、添加自定义元素等。
    // 执行视图相关的操作：例如，调整布局、显示提示信息等。
    // 与模型层分离：视图层的操作不会直接影响模型层，除非显式地触发同步。
    // view.change((writer) => {
    //   const div = writer.createContainerElement("div", {
    //     class: "custom-react-component",
    //   });
    //   const widget = toWidget(div, writer);

    //   writer.insert(
    //     writer.createPositionAt(viewDocument.selection.getFirstPosition(), 0),
    //     widget
    //   );
    // });

    // model.change会改变ckeditor内部的数据，然后其内部再去做转化
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

    // 正确模型注册示例,避免拖拽的时候dom消失
    editor.model.schema.register("customComponent", {
      inheritAllFrom: "$block",
      isObject: true, // 关键！声明为不可拆分对象
    });

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
        const id = uniqueId();
        const classNameId = `custom-react-component-${id}`;
        console.log(classNameId, "classNameId");
        const viewWrapper = writer.createContainerElement(
          "div",
          null,
          writer.createUIElement("div", {
            class: classNameId,
          })
        );
        // 在组件挂载后渲染 React 组件，并传递参数
        setTimeout(() => {
          const container = document.querySelector(`.${classNameId}`);
          if (container) {
            const root = ReactDOM.createRoot(container);
            root.render(<CustomReactComponent title={"11"} />);
          }
        });

        return toWidget(viewWrapper, writer);
      },
    });

    // 用于导出为富文本
    editor.conversion.for("dataDowncast").elementToElement({
      model: "customComponent",
      view: (modelElement, { writer: viewWriter }) => {
        const div = viewWriter.createContainerElement("div", {
          class: "custom-react-component",
        });

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
        return modelWriter.createElement("customComponent", { message: "11" });
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
