import React, { CSSProperties, ReactNode } from 'react';
import { EditorState, ContentState, DraftEntityType, EditorProps, ContentBlock } from 'draft-js';
import { FileItem } from 'types';

export type ControlType =
  | 'undo'
  | 'redo'
  | 'clear'
  | 'font-size'
  | 'headline'
  | 'color'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'del'
  | 'ol'
  | 'ul'
  | 'blockquote'
  | 'code'
  | 'divider'
  | 'table'
  | 'link'
  | 'img'
  | 'align'
  | 'video'
  | '|';

export interface ShowControlType {
  text?: ReactNode;
}

export enum VideoType {
  // 本地视频
  Local = 1,
  //内容中台
  Online = 2,
}

export interface ConfigType {
  tooltip?: string | React.ReactDOM | React.ReactElement;
  type?: Exclude<ControlType, '|'>;
  icon?: string | React.ReactDOM | React.ReactElement;
  key: Exclude<ControlType, '|'>;
}

export type ShowControlsType = (Partial<ControlType> | ConfigType)[];

export interface DefaultControlProps {
  showTooltip?: boolean;
  showControls?: ShowControlsType;
  excludeControls?: ControlType[];
  tooltip?: ReactNode;
  icon?: ReactNode;
  type?: string;
}

export interface SaveDraftType {
  editorState: EditorState;
  pureText: string;
  html: string;
  imgList: FileItem[];
  videoData: BasicVideoData;
  isUploadedVideo?: boolean;
}

export interface OnChangeType {
  editorState: EditorState;
  pureText: string;
  htmlText: string;
}

export interface RichEditorProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  allowIndent?: boolean;
  className?: string;
  defaultValue?: string;
  draftTime?: string;
  header?: ReactNode;
  editorClassName?: string;
  editorProps?: EditorProps;
  editorType?: 'component' | 'page';
  excludeControls?: ControlType[];
  extraDom?: ReactNode;
  footer?: ReactNode;
  footerClassName?: string;
  html?: string;
  inputClassName?: string;
  isSaveImageWithFullPath?: boolean;
  isModal?: boolean;
  isReedit?: boolean;
  maxLength?: number;
  minLength?: number;
  onChange?: (data: OnChangeType) => void;
  onSaveDraft?: (data: SaveDraftType) => void;
  placeholder?: string;
  saveDraftLoading?: boolean;
  showControls?: ShowControlsType;
  showCount?: boolean;
  showTooltip?: boolean;
  style?: CSSProperties;
  tabIndent?: number;
  toolbarClassName?: string;
  toolbarPlacement?: 'top' | 'bottom';
  value?: string;
  videoData?: BasicVideoData;
}

export interface RichEditorData {
  html: string;
  pureText: string;
  title: string;
  imgList: FileItem[];
  videoData: BasicVideoData;
}

export interface LinkComponentProps {
  entityKey: DraftEntityType;
  contentState: ContentState;
  children: ReactNode;
}

export enum BlockType {
  Divider = 'divider',
  Atomic = 'atomic',
  LinkCard = 'link-card',
}

export interface BasicVideoData {
  videoFileId?: string;
  videoType?: VideoType;
  videoCoverUrl?: string;
}

export interface EditorData {
  editorState: EditorState;
  pureText: string;
  htmlText: string;
  imgList: FileItem[];
  videoData: BasicVideoData;
  uploadVideoData: UploadVideoDataType;
}
export interface EditorRef {
  stopProhibiting: () => void;
  startProhibiting: () => void;
  getEditorData: () => EditorData;
}

export interface MapType {
  dom: React.ElementType;
  icon?: string | React.ElementType;
  tooltip?: string | React.ElementType;
}

export type RenderFunction = () => ReactNode;

export interface BlockFromHtml {
  contentBlocks: ContentBlock[];
  entityMap: any[];
}

export interface UploadVideoDataType {
  isUploadedVideo?: boolean;
  uploadVideoLoading?: boolean;
  uploadVideoPercent?: number;
}
