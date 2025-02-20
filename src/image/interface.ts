import { RcFile as OriRcFile } from "rc-upload/lib/interface";

export interface ImageProps {
  editorState: EditorState;
  onChange(editorState: EditorState): void;
  isSaveImageWithFullPath?: boolean;
  imageUploadConfig?: {
    action: string;
    cdnUrl: string;
    getQnToken: (data: object) => Promise<any>;
  };
}

export interface RcFile extends OriRcFile {
  readonly lastModifiedDate: Date;
}
export declare type UploadFileStatus =
  | "error"
  | "success"
  | "done"
  | "uploading"
  | "removed";
export interface HttpRequestHeader {
  [key: string]: string;
}
export interface UploadFile<T = any> {
  uid: string;
  size?: number;
  name: string;
  fileName?: string;
  lastModified?: number;
  lastModifiedDate?: Date;
  url?: string;
  status?: UploadFileStatus;
  percent?: number;
  thumbUrl?: string;
  originFileObj?: RcFile;
  response?: T;
  error?: any;
  linkProps?: any;
  type?: string;
  xhr?: T;
  preview?: string;
}
export interface InternalUploadFile<T = any> extends UploadFile<T> {
  originFileObj: RcFile;
}
export interface UploadChangeParam<T = UploadFile> {
  file: T;
  fileList: UploadFile[];
  event?: {
    percent: number;
  };
}
export interface LocalPathConfig {
  uid: string;
  base64: string;
}

export interface StateProps {
  visible: boolean;
  fileList: UploadFile[];
  loading: boolean;
  previewOpen: boolean;
  previewTitle: string;
  previewImage: string;
}
