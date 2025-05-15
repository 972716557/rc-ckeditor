import { createContext } from 'react';
import { TinyMCE } from 'tinymce';

export enum VideoType {
  // 本地视频
  Local = 1,
  //内容中台
  Online = 2,
}

export interface BasicVideoData {
  videoFileId?: string;
  videoType?: VideoType;
  videoCoverUrl?: string;
}

export interface UploadVideoDataType {
  isUploadedVideo?: boolean;
  uploadVideoPercent?: number;
}

export interface EditorContextProps {
  uploadVideoData: UploadVideoDataType;
  onChangeUploadVideoData: (data: Pick<UploadVideoDataType, keyof UploadVideoDataType>) => void;
  editor?: TinyMCE;
}

export const EditorContext = createContext<EditorContextProps>({
  uploadVideoData: {
    uploadVideoPercent: 0,
    isUploadedVideo: false,
  },
  onChangeUploadVideoData: () => {},
  editor: undefined,
});

export default EditorContext;
