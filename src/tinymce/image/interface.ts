import { RcFile as OriRcFile } from 'rc-upload/lib/interface';
import type { Editor as TinyMCEEditor } from 'tinymce';
import { FileItem } from 'types';
export interface ImageProps {
  editor?: TinyMCEEditor;
  onOk: (fileList: FileItem[]) => void;
  onCancel: () => void;
  isSaveImageWithFullPath?: boolean;
  open?: boolean;
}

export interface RcFile extends OriRcFile {
  readonly lastModifiedDate: Date;
}
export declare type UploadFileStatus = 'error' | 'success' | 'done' | 'uploading' | 'removed';
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
  fileList: UploadFile[];
  loading: boolean;
  previewOpen: boolean;
  previewTitle: string;
  previewImage: string;
}
