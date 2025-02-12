import { Plugin } from "ckeditor5/src/core.js";
import { toWidget } from "ckeditor5/src/widget.js";
import TCPlayer from "tcplayer.js";
import VideoCommand from "./video-command";
import { uniqueId } from "lodash";
import { getPlayVideoSign } from "../service";
import { APP_ID, LICENSE_URL } from "../../constant";

export default class ESpaceVideoEditing extends Plugin {
  public init(): void {
    const editor = this.editor;
    const schema = editor.model.schema;
    const t = editor.t;
    const conversion = editor.conversion;

    schema.register("espaceVideo", {
      inheritAllFrom: "$blockObject",
      allowAttributes: "fileID",
    });

    //  用于导出为富文本
    conversion.for("dataDowncast").elementToElement({
      model: "espaceVideo",
      view: (modelElement, conversionApi) => {
        const { writer } = conversionApi;
        return writer.createContainerElement("video", {
          fileID: modelElement.getAttribute("fileID"),
        });
      },
    });

    //  用于在编辑器中渲染为html
    conversion.for("editingDowncast").elementToStructure({
      model: {
        name: "espaceVideo",
        attributes: ["fileID"],
      },
      view: (modelElement, data) => {
        const { writer } = data;
        const fileID = modelElement.getAttribute("fileID") as string;
        const label = t("插入视频");
        const id = "espace" + uniqueId();
        const viewWrapper = writer.createContainerElement(
          "div",
          null,
          writer.createUIElement("div", null, function (domDocument) {
            const domElement = this.toDomElement(domDocument);
            domElement.innerHTML = `<video id='${id}'></video>`;

            return domElement;
          })
        );
        setTimeout(async () => {
          const data = await getPlayVideoSign({
            videoFileId: fileID,
          });
          const obj = {
            psign: data.data.videoSign,
            appID: APP_ID,
            fileID,
            licenseUrl: LICENSE_URL,
          };
          TCPlayer(id, obj);
        }, 200);
        writer.addClass("ck-horizontal-line", viewWrapper);
        writer.setCustomProperty("espaceVideo", true, viewWrapper);
        return toWidget(viewWrapper, writer, { label });
      },
    });

    conversion
      .for("upcast")
      .elementToElement({ view: "hr", model: "espaceVideo" });

    editor.commands.add("espaceVideo", new VideoCommand(editor));
  }
}
