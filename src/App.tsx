import React, { useEffect, useState } from "react";
import {
  BlockQuote,
  Bold,
  Heading,
  Image,
  ImageCaption,
  ImageStyle,
  ImageToolbar,
  Indent,
  Italic,
  Link,
  List,
  MediaEmbed,
  Paragraph,
  Alignment,
  AutoImage,
  AutoLink,
  Code,
  CodeBlock,
  Essentials,
  FindAndReplace,
  Font,
  Highlight,
  HorizontalLine,
  HtmlEmbed,
  ImageInsert,
  ImageResize,
  IndentBlock,
  GeneralHtmlSupport,
  LinkImage,
  ListProperties,
  TodoList,
  PageBreak,
  PasteFromOffice,
  PictureEditing,
  RemoveFormat,
  ShowBlocks,
  SourceEditing,
  SpecialCharacters,
  SpecialCharactersEssentials,
  Style,
  Strikethrough,
  Subscript,
  Superscript,
  TextTransformation,
  Underline,
  WordCount,
  ClassicEditor,
} from "ckeditor5";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import getSelectedContent from "@ckeditor/ckeditor5-engine/src/model/utils/getselectedcontent";
import translations from "ckeditor5/translations/zh-cn.js";

import ImageButton from "./image";
import VideoUpload from "./video";
import CustomVideoPlugin from "./video/video-plugin/index";
import ImageUploadPlugin from "./image/image-plugin";
import "tcplayer.js/dist/tcplayer.min.css";
import Toolbar from "./toolbar";
import LinkButton from "./link";
import {
  Bold as BoldIcon,
  Undo,
  Redo,
  Clear,
  Code as CodeIcon,
  Divider,
  Del,
  Ul,
  Ol,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
} from "./toolbar/icons";
import Color from "./color";
import FontSize from "./font-size";
import { DEFAULT_COLOR, DEFAULT_FONT_SIZE } from "./constant";
import Title from "./title";
import "ckeditor5/ckeditor5.css";
// 工具栏功能项配置
const editorConfig = {
  plugins: [
    BlockQuote,
    Bold,
    Heading,
    Image,
    ImageCaption,
    ImageStyle,
    ImageToolbar,
    Indent,
    Italic,
    Link,
    List,
    MediaEmbed,
    Paragraph,
    Alignment,
    AutoImage,
    AutoLink,
    Code,
    CodeBlock,
    Essentials,
    FindAndReplace,
    Font,
    Highlight,
    HorizontalLine,
    HtmlEmbed,
    ImageInsert,
    ImageResize,
    IndentBlock,
    GeneralHtmlSupport,
    LinkImage,
    ListProperties,
    TodoList,
    PageBreak,
    PasteFromOffice,
    PictureEditing,
    RemoveFormat,
    ShowBlocks,
    SourceEditing,
    SpecialCharacters,
    SpecialCharactersEssentials,
    Style,
    Strikethrough,
    Subscript,
    Superscript,
    TextTransformation,
    Underline,
    WordCount,
    // ImageUploadPlugin,
    // CustomVideoPlugin,
  ],
  initialData: "",
  image: {
    styles: ["alignCenter", "alignLeft", "alignRight"],
    toolbar: [
      "imageStyle:inline",
      "imageStyle:wrapText",
      "imageStyle:breakText",
    ],
  },
  fontSize: {
    options: [
      "8px",
      "10px",
      "12px",
      "14px",
      "16px",
      "18px",
      "20px",
      "22px",
      "24px",
      "28px",
      "36px",
      "48px",
      "72px",
    ],
    supportAllValues: true,
  },
  heading: {
    options: [
      {
        model: "paragraph",
        view: "p",
        title: "Paragraph",
        class: "ck-heading_paragraph",
      },
      {
        model: "heading1",
        view: "h1",
        title: "Heading 1",
        class: "ck-heading_heading1",
      },
      {
        model: "heading2",
        view: "h2",
        title: "Heading 2",
        class: "ck-heading_heading2",
      },
    ],
  },
  link: {
    decorators: {
      addTargetToExternalLinks: true,
      defaultProtocol: "https://",
    },
  },
  licenseKey: "GPL",
  language: "zh-cn",
  translations: [translations],
};

export default function App() {
  const [editor, setEditor] = useState<ClassicEditor>();

  const [fontSize, setFontSize] = useState(`${DEFAULT_FONT_SIZE}`);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [title, setTitle] = useState("paragraph");
  const [selectedText, setSelectedText] = useState("");

  // 获取selection的纯文本
  const onChangeRange = (evt) => {
    if (!editor) return;
    const model = evt.source.model;
    const selectedContent = getSelectedContent(model, evt.source.selection);
    const viewFragment = editor.data.toView(selectedContent);
    const selectedText = editor.data.processor.toData(viewFragment);
    setSelectedText(selectedText);
  };

  useEffect(() => {
    if (editor) {
      editor.model.document.on("change", onChangeRange);
      return () => {
        editor.model.document.off("change", onChangeRange);
      };
    }
  }, [editor]);

  const onChange = (event, editor) => {
    setEditor(editor);
    const fontSizeCommand = editor.commands.get("fontSize")!;
    const fontColorCommand = editor.commands.get("fontColor")!;
    const selection = editor.model.document.selection;
    const selectedElement =
      selection.getSelectedElement() || selection?.focus?.parent;
    if (selectedElement?.name === "heading1") {
      setTitle("heading1");
    } else if (selectedElement?.name === "heading2") {
      setTitle("heading2");
    }
    const currentColorCommand = fontColorCommand.value;
    const currentFontSize = fontSizeCommand.value;
    setFontSize(
      currentFontSize
        ? currentFontSize.replace("px", "")
        : `${DEFAULT_FONT_SIZE}`
    );
    setColor(currentColorCommand ?? DEFAULT_COLOR);
  };

  const onExport = () => {
    const parser = new DOMParser();
    const data = editor.getData();
    // 获取富文本
    const doc = parser.parseFromString(data, "text/html");
    // 获取纯文本
    const plainText = doc.body.textContent || "";
    console.log(doc, plainText, "doc");
  };

  return (
    <>
      <Toolbar
        label={<Undo />}
        editor={editor}
        commandName="undo"
        tooltip="撤销"
      />
      <Toolbar
        label={<Redo />}
        editor={editor}
        commandName="redo"
        tooltip="还原"
      />
      <Toolbar
        label={<Clear />}
        editor={editor}
        commandName="removeFormat"
        tooltip="清除格式"
      />
      <FontSize editor={editor} fontSize={fontSize} />
      <Title editor={editor} title={title} />
      <Toolbar
        label={<BoldIcon />}
        editor={editor}
        commandName="bold"
        tooltip="加粗"
      />
      <Toolbar
        label={<ItalicIcon />}
        editor={editor}
        commandName="italic"
        tooltip="倾斜"
      />
      <Toolbar
        label={<UnderlineIcon />}
        editor={editor}
        commandName="underline"
        tooltip="下滑线"
      />
      <Toolbar
        label={<Del />}
        editor={editor}
        commandName="strikethrough"
        tooltip="删除线"
      />
      <Toolbar
        label={<CodeIcon />}
        editor={editor}
        commandName="blockQuote"
        tooltip="引用"
      />
      <Toolbar
        label={<Ul />}
        editor={editor}
        commandName="bulletedList"
        tooltip="无序列表"
      />
      <Toolbar
        label={<Ol />}
        editor={editor}
        commandName="numberedList"
        tooltip="有序列表"
      />
      <LinkButton editor={editor} text={selectedText} />
      <Color editor={editor} color={color} />
      {/* <ImageButton editor={editor} />
      <VideoUpload editor={editor} /> */}
      <CKEditor
        editor={ClassicEditor}
        onReady={(editor) => {
          setEditor(editor);
        }}
        onChange={onChange}
        config={editorConfig}
      />
    </>
  );
}
