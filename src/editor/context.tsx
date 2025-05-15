import { EditorState } from 'draft-js';
import { createContext } from 'react';
import { FileItem } from 'types';
import { BasicVideoData, UploadVideoDataType } from './interface';

export interface EditorContextProps {
  editorState?: EditorState;
  pureText: string;
  htmlText: string;
  imgList: FileItem[];
  uploadVideoData: UploadVideoDataType;
  onChangeUploadVideoData: (data: Pick<UploadVideoDataType, keyof UploadVideoDataType>) => void;
  videoData: BasicVideoData;
  onChangeVideoData: (data: Pick<BasicVideoData, keyof BasicVideoData>) => void;
}

export const EditorContext = createContext<EditorContextProps>({
  editorState: undefined,
  pureText: '',
  htmlText: '',
  imgList: [],
  uploadVideoData: {
    uploadVideoLoading: false,
    uploadVideoPercent: 0,
    isUploadedVideo: false,
  },
  videoData: {},
  onChangeVideoData: () => {},
  onChangeUploadVideoData: () => {},
});

export default EditorContext;
