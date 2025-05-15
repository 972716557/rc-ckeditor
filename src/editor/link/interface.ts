import { EditorState } from 'draft-js';
import { DefaultControlProps } from '../interface';

export interface LinkProps extends DefaultControlProps {
  editorState: EditorState;
  onChange(editorState: EditorState): void;
}
export interface LinkState {
  visible: boolean;
}

// 链接形式 普通链接 链接卡片
export enum LinkType {
  Link = 'link',
  LinkCard = 'link-card',
}

export interface SaveType {
  url: string;
  title: string;
  entityKey: string;
}
export interface DrawerProps {
  initialTitle?: string;
  initialUrl?: string;
  visible: boolean;
  onOk: (data: SaveType) => void;
  onCancel: () => void;
}
