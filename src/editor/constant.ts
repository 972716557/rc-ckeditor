import { OrderedListOutlined, TableOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { EnvConfig } from '@/utils/common';

import { ControlType, MapType } from './interface';
import History from './history';
import Block from './block';
import Inline from './inline';
import Align from './align';
import Color from './color';
import Link from './link';
import Picture from './picture';
import Video from './video-upload';
import {
  Blockquote,
  Bold,
  Clear,
  Code,
  ColorIcon,
  Del,
  Divider,
  Italic,
  LinkIcon,
  PictureIcon,
  Redo,
  Underline,
  Undo,
  Video as VideoIcon,
} from './icon';
import Title from './title';
import FontSize from './font-size';

export const DefaultTabIndent = 4;
export const DEFAULT_FONT_SIZE = 15;
export const DEFAULT_TEXT_ALIGN = 'left';
export const DEFAULT_COLOR = '#1D2129';
export const DEFAULT_COLOR_RGB = 'rgb(29 33 41)';
export const DefaultShowControls: ControlType[] = [
  'undo',
  'redo',
  'clear',
  '|',
  'font-size',
  'headline',
  'color',
  'bold',
  'italic',
  'underline',
  'del',
  'align',
  '|',
  'ol',
  'ul',
  '|',
  'link',
  'img',
  'video',
];

export const CONTROLS_MAP: Record<Exclude<ControlType, '|'>, MapType> = {
  undo: { dom: History, icon: Undo, tooltip: '撤销' },
  redo: { dom: History, icon: Redo, tooltip: '还原' },
  clear: { dom: History, icon: Clear, tooltip: '清除格式' },
  'font-size': { dom: FontSize },
  headline: { dom: Title },
  color: { dom: Color, icon: ColorIcon },
  bold: { dom: Inline, icon: Bold, tooltip: '加粗' },
  italic: { dom: Inline, icon: Italic, tooltip: '倾斜' },
  underline: { dom: Inline, icon: Underline, tooltip: '下划线' },
  del: { dom: Inline, icon: Del, tooltip: '删除线' },
  align: { dom: Align },
  ol: { dom: Block, icon: OrderedListOutlined, tooltip: '有序列表' },
  ul: { dom: Block, icon: UnorderedListOutlined, tooltip: '无序列表' },
  blockquote: { dom: Block, icon: Blockquote, tooltip: '引用' },
  code: { dom: Block, icon: Code, tooltip: '代码块' },
  divider: { dom: Block, icon: Divider, tooltip: '分割线' },
  table: { dom: Block, icon: TableOutlined, tooltip: '表格' },
  link: { dom: Link, tooltip: '链接', icon: LinkIcon },
  img: { dom: Picture, tooltip: '图片', icon: PictureIcon },
  video: { dom: Video, tooltip: '视频', icon: VideoIcon },
};
export const APP_ID = EnvConfig.isProd ? '1500018532' : '1500018526';
export const LICENSE_URL =
  'https://license.vod2.myqcloud.com/license/v2/1252395407_1/v_cube.license';
