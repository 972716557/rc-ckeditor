import React, { ImgHTMLAttributes, ReactElement, useEffect, useState, CSSProperties } from 'react';
import { ContentBlock, ContentState, EditorState } from 'draft-js';
import classnames from 'classnames';
import { Tooltip } from 'antd';
import {
  PicCenterOutlined,
  PicRightOutlined,
  PicLeftOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import { round } from 'lodash';

import { ImagePluginTheme } from '.';
import { removeImage } from '../utils';
import './index.less';

export interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onChange'> {
  block: ContentBlock;
  className?: string;
  theme?: ImagePluginTheme;
  contentState: ContentState;
  style: CSSProperties;
  isDragging: boolean;
  entityKey: string;
  editorState: EditorState;
  //removed props
  blockStyleFn: unknown;
  blockProps: unknown;
  customStyleMap: unknown;
  customStyleFn: unknown;
  decorator: unknown;
  forceSelection: unknown;
  offsetKey: unknown;
  selection: unknown;
  tree: unknown;
  preventScroll: unknown;
  onChange: (state: EditorState) => void;
}
type TextAlign = 'left' | 'right' | 'center';

const Delete = () => <i className="icon-delete2 iconfont" style={{ fontSize: 18 }} />;

export default React.forwardRef<HTMLImageElement, ImageProps>(function Image(
  props,
  ref,
): ReactElement {
  const { block, className, theme = {}, ...otherProps } = props;

  const {
    blockProps,
    customStyleMap,
    customStyleFn,
    decorator,
    forceSelection,
    offsetKey,
    selection,
    tree,
    blockStyleFn,
    preventScroll,
    contentState,
    style: styles,
    isDragging,
    entityKey,
    editorState,
    onChange,
    ...elementProps
  } = otherProps;
  const combinedClassName = classnames(theme.image, className);
  const entityData = contentState.getEntity(entityKey)?.getData();
  const { src, style } = entityData;
  const [width, setWidth] = useState<string | number>('auto');
  const [visible, setVisible] = useState<boolean>(true);
  const [textAlign, setTextAlign] = useState<TextAlign>('left');
  const key = block?.getKey();
  const blockData = block.getData().toJS();

  useEffect(() => {
    if (style?.width) {
      setWidth(style.width);
    }
    if (style?.textAlign) {
      setTextAlign(style?.textAlign);
    }
  }, [style]);

  // 拖拽的宽度
  useEffect(() => {
    if (styles.width && !isDragging) {
      setWidth(styles.width);
    }
  }, [styles.width, isDragging]);

  useEffect(() => {
    if (blockData?.textAlign) {
      setTextAlign(blockData?.textAlign);
      onChangeImageData('align', blockData?.textAlign);
    }
  }, [blockData?.textAlign]);

  const onChangeImage = (type: string) => {
    switch (type) {
      case 'zoomIn':
        onChangeImageData('zoomIn');
        break;
      case 'zoomOut':
        onChangeImageData('zoomOut');
        break;
      case 'delete':
        const newEditorState = removeImage(editorState);
        if (newEditorState) {
          onChange(newEditorState);
        }
        break;
      default:
        setVisible(false);
        setTextAlign(type as unknown as TextAlign);
        onChangeImageData('align', type);
        break;
    }
  };

  useEffect(() => {
    setVisible(true);
  }, [textAlign]);

  const onChangeImageData = (type: 'zoomIn' | 'zoomOut' | 'align', alginType?: string) => {
    if (!key) {
      return;
    }
    const currentDom = document.getElementById(key);
    if (!currentDom) {
      return;
    }
    // 当设置width为auto时，计算真实宽度占比，然后进行缩小一半————当前编辑器宽度为840
    const currentWidth = parseInt(document.defaultView!.getComputedStyle(currentDom).width, 10);
    const percentWidth = round((100 / 840) * currentWidth) + '%';
    const stringWidth = width === 'auto' ? percentWidth : String(width);
    let numberWidth: number = Number(
      stringWidth?.includes('%') ? stringWidth.slice(0, stringWidth.length - 1) : width,
    );
    if (!isNaN(numberWidth)) {
      numberWidth = type === 'zoomIn' ? 2 * numberWidth : round(numberWidth / 2);
      numberWidth = numberWidth < 2 ? 2 : numberWidth;
      numberWidth = numberWidth > 100 ? 100 : numberWidth;
    }

    let imgData;
    if (type === 'align') {
      imgData = {
        ...entityData,
        style: { ...style, textAlign: alginType },
      };
      setTextAlign(alginType as unknown as TextAlign);
    } else {
      const _width = `${numberWidth}%`;
      imgData = {
        ...entityData,
        style: { ...style, width: _width },
        width: _width,
      };
      setWidth(_width);
    }
    contentState.mergeEntityData(entityKey, imgData);
  };

  const virtualImgStyle = {
    center: { left: '50%', transform: 'translateX(-50%)' },
    left: { left: 0 },
    right: { right: 0 },
  };

  const show = isDragging && virtualImgStyle[textAlign];

  return (
    <div
      {...elementProps}
      key={key}
      style={{
        textAlign,
        position: 'relative',
      }}
    >
      <Tooltip
        overlayClassName="image-decorator-tooltip"
        showArrow={false}
        placement="bottom"
        trigger="click"
        getPopupContainer={(triggerNode) => {
          return triggerNode.parentElement || triggerNode;
        }}
        title={
          <div className={`image-decorator-toolbar image-decorator-image`}>
            {[
              { Icon: ZoomOutOutlined, type: 'zoomOut' },
              { Icon: ZoomInOutlined, type: 'zoomIn' },
              { Icon: PicLeftOutlined, type: 'left' },
              { Icon: PicCenterOutlined, type: 'center' },
              { Icon: PicRightOutlined, type: 'right' },
              { Icon: Delete, type: 'delete' },
            ].map(({ Icon, type }) => (
              <span
                className={
                  textAlign === type || (!textAlign && type === 'left')
                    ? `image-decorator-button image-decorator-active`
                    : 'image-decorator-button'
                }
                key={type}
                onClick={() => {
                  onChangeImage(type);
                }}
              >
                <Icon />
              </span>
            ))}
          </div>
        }
      >
        {visible && (
          <img
            src={src}
            key={key}
            id={key}
            role="presentation"
            className={combinedClassName}
            alt="图片"
            ref={ref}
            style={{
              ...styles,
              position: 'relative',
              width,
            }}
          />
        )}
      </Tooltip>

      {/* 拖拽的隐藏图片 */}
      <img
        src={src}
        alt="图片"
        style={{
          ...styles,
          width: show ? styles.width : 0,
          position: 'absolute',
          top: 0,
          opacity: 0.7,
          visibility: show ? 'visible' : 'hidden',
          ...virtualImgStyle[textAlign],
        }}
      />
    </div>
  );
});
