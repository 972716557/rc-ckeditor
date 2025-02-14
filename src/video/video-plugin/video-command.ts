import type {
  DocumentSelection,
  Element,
  Model,
  Schema,
  Selection,
} from "ckeditor5";
import { Command } from "ckeditor5/src/core.js";
import { findOptimalInsertionRange } from "ckeditor5/src/widget.js";

export default class ESpaceVideoCommand extends Command {
  public refresh(): void {
    const model = this.editor.model;
    const schema = model.schema;
    const selection = model.document.selection;

    this.isEnabled = isESpaceVideoAllowedInParent(selection, schema, model);
  }

  public execute({ fileID }: { fileID: string }): void {
    const model = this.editor.model;
    model.change((writer) => {
      const horizontalElement = writer.createElement("espaceVideo");
      writer.setAttribute("fileID", fileID, horizontalElement);
      model.insertObject(horizontalElement, null, null, {
        setSelection: "after",
      });
    });
  }
}

function isESpaceVideoAllowedInParent(
  selection: Selection | DocumentSelection,
  schema: Schema,
  model: Model
): boolean {
  const parent = getInsertESpaceVideoParent(selection, model);

  return schema.checkChild(parent, "espaceVideo");
}

function getInsertESpaceVideoParent(
  selection: Selection | DocumentSelection,
  model: Model
): Element {
  const insertionRange = findOptimalInsertionRange(selection, model);
  const parent = insertionRange.start.parent;

  if (parent.isEmpty && !parent.is("element", "$root")) {
    return parent.parent! as Element;
  }

  return parent as Element;
}
