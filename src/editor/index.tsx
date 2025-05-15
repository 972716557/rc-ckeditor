import React, {
  useImperativeHandle,
  CSSProperties,
  useEffect,
  useRef,
  forwardRef,
  useState,
  FC,
  ReactNode,
  useMemo,
} from 'react';
import { message, Divider } from 'antd';
import Editor, { composeDecorators } from '@draft-js-plugins/editor';
import {
  EditorState,
  RichUtils,
  CompositeDecorator,
  ContentState,
  DefaultDraftBlockRenderMap,
  DraftInlineStyle,
  getDefaultKeyBinding,
  ContentBlock,
  CharacterMetadata,
  DraftHandleValue,
  Modifier,
  EditorProps,
  SelectionState,
} from 'draft-js';
import { useDebounceFn, useSetState } from 'ahooks';
import { StrategyCallback } from '@draft-js-plugins/utils';
import { Map } from 'immutable';
import createFocusPlugin from '@draft-js-plugins/focus';
import createBlockDndPlugin from '@draft-js-plugins/drag-n-drop';
import classnames from 'classnames';
import 'draft-js/dist/Draft.css';

import { FileItem } from 'types';
import { RESPONSE_CODE_MAP } from '@/utils/request';
import { getApiHostname } from '@/utils/common';
import createImagePlugin, { createResizablePlugin } from './image-decorator';
import createVideoPlugin from './video-decorator';

import DividerWrapper from './divider';
import EditPopover from './edit-popover';
import { getCurrentBlock, isShowEditorPopover } from './edit-popover/utils';
import EditTable from './table';
import LinkCard from './link-card';
import LinkComponent from './link/link-component';

import EditorContext from './context';
import { uploadFile } from './picture/service';
import {
  convertFromHTML,
  pastedFiles,
  stateToHTML,
  addTable,
  removeCustomBlock,
  removeImage,
} from './utils';
import {
  DefaultShowControls,
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_ALIGN,
  CONTROLS_MAP,
  DefaultTabIndent,
} from './constant';
import { LinkType } from './link/interface';

import {
  RichEditorProps,
  EditorRef,
  BlockFromHtml,
  BasicVideoData,
  UploadVideoDataType,
} from './interface';
import './index.less';

const prefixCls = 'community-rich-editor';

const transformHtmlToState = (str?: string) => {
  const blocksFromHTML: BlockFromHtml = convertFromHTML(str || '') as unknown as BlockFromHtml;
  const state = ContentState.createFromBlockArray(
    blocksFromHTML.contentBlocks,
    blocksFromHTML.entityMap,
  );
  const tempState = EditorState.createWithContent(state, linkDecorator);
  return tempState;
};

function customStyleFn(style: DraftInlineStyle): CSSProperties {
  const temp: Record<string, string> = {};
  style.toArray()?.forEach((item: string) => {
    const colorIndex: number = item?.indexOf('color-') ?? -1;
    const fontIndex: number = item?.indexOf('fontsize-') ?? -1;
    if (colorIndex >= 0) {
      temp.color = item?.slice(6) || '';
    }
    if (fontIndex >= 0) {
      temp.fontSize = (item?.slice(9) || DEFAULT_FONT_SIZE) + 'px';
    }
  });
  return temp;
}

export function readFile(file: Blob) {
  let params = new FormData();
  params.append('file', file);
  return uploadFile(params)
    .then((data) => {
      if (data.code !== RESPONSE_CODE_MAP.INNER.SUCCESS) {
        return Promise.reject(new Error(data.message));
      }
      return Promise.resolve(data);
    })
    .catch((err) => {
      message.error(err.message);
    });
}

const getPlainText = (state: EditorState) => {
  const contentState = state.getCurrentContent();
  const plainText = contentState.getPlainText();
  const splitPlainText = plainText?.split('\u000A').join('');
  return splitPlainText;
};

const BlockWrapper: FC<{ children?: ReactNode }> = (props) => {
  return <div className={`${prefixCls}-wrapper`}>{props.children}</div>;
};

const blockRenderMap = Map({
  atomic: {
    element: 'figure',
    wrapper: <BlockWrapper />,
  },
});
const extendedBlockRenderMap = DefaultDraftBlockRenderMap.merge(blockRenderMap);

const focusPlugin = createFocusPlugin();
const blockDndPlugin = createBlockDndPlugin();
const resizablePlugin = createResizablePlugin();
const videoPlugin = createVideoPlugin();

const decorator = composeDecorators(
  focusPlugin.decorator,
  blockDndPlugin.decorator,
  resizablePlugin.decorator,
);
const imagePlugin = createImagePlugin({ decorator });
const plugins = [blockDndPlugin, focusPlugin, imagePlugin, videoPlugin];

const linkDecorator = new CompositeDecorator([
  {
    strategy(contentBlock: ContentBlock, callback: StrategyCallback, contentState: ContentState) {
      contentBlock.findEntityRanges((character: CharacterMetadata) => {
        const entityKey = character.getEntity();
        return entityKey !== null && contentState.getEntity(entityKey).getType() === 'LINK';
      }, callback);
    },
    component: LinkComponent,
  },
]);

const RichEditor = forwardRef<EditorRef, RichEditorProps>((props, ref) => {
  const {
    allowIndent,
    className,
    defaultValue,
    editorClassName,
    editorProps,
    editorType = 'page',
    excludeControls,
    extraDom,
    footer,
    header,
    inputClassName,
    isSaveImageWithFullPath,
    maxLength = 6000,
    onChange,
    onSaveDraft,
    placeholder,
    showControls,
    showCount,
    showTooltip = true,
    tabIndent,
    toolbarClassName,
    toolbarPlacement,
    value,
    videoData: draftVideoData,
    ...rest
  } = props;

  const isToolbarBottom = toolbarPlacement === 'bottom';
  const isComponentType = editorType === 'component';
  const [editorState, setEditorState] = useState(transformHtmlToState(defaultValue || ''));
  // 链接编辑是否展示
  const [isShow, setShow] = useState<boolean>(false);
  const [textAlignment, setTextAlignment] =
    useState<EditorProps['textAlignment']>(DEFAULT_TEXT_ALIGN);
  const [readOnly, setReadOnly] = useState<boolean>(false);

  // 禁止输入 处理异步数据加载的过程中，编辑器多次调用onChange方法
  const [isProhibitedToInput, setIsProhibited] = useState(true);

  // 上传视频参数
  const [uploadVideoData, setUploadVideoData] = useSetState<UploadVideoDataType>({
    // 上传视频限制，只允许上传一个视频
    isUploadedVideo: false,
    // 全局上传视频loading
    uploadVideoLoading: false,
    // 上传进度
    uploadVideoPercent: 0,
  });

  // 视频参数
  const [videoData, setVideoData] = useSetState<BasicVideoData>({
    videoFileId: undefined,
    videoType: undefined,
    videoCoverUrl: undefined,
  });

  const selection = editorState.getSelection();
  const isStartOfLine = selection.getAnchorOffset() === 0 && selection.getEndOffset() === 0;
  const key = selection.getAnchorKey();
  const content = editorState.getCurrentContent();
  const block = content.getBlockForKey(key);
  const blockType = block?.getType();
  // 输入的是否是中文
  const isCompositionRef = useRef(false);
  const editorStateRef = useRef(editorState);
  // 输入中文时记录最新的state，解决视频播放时光标跑遍的问题
  const compositionEditorStateRef = useRef(editorState);
  const plainText = getPlainText(editorState);
  const plainTextLength = plainText.length;

  useEffect(() => {
    if (isProhibitedToInput) {
      const tempState = transformHtmlToState(value);
      setEditorState(tempState);
    }
  }, [value]);

  useEffect(() => {
    if (draftVideoData) {
      setVideoData(draftVideoData);
    }
  }, [draftVideoData?.videoFileId]);

  const blockRendererFn = (_block: ContentBlock) => {
    const blockData = _block.getData().toJS() || {};
    //  使用自定义组件的判断条件
    if (_block.getType() === 'divider') {
      return {
        // 自定义组件
        component: DividerWrapper,
        editable: false,
        props: {
          editorState,
          onChange: (state: EditorState) => {
            setEditorState(state);
          },
        },
      };
    }
    if (_block.getType() === 'table') {
      const { columns, dataSource } = blockData;
      const blockKey = _block.getKey();
      return {
        // 自定义组件
        component: EditTable,
        editable: false,
        props: {
          editorState,
          onStartEdit: () => {
            if (!readOnly) {
              setReadOnly(true);
            }
          },
          blockKey,
          readOnly,
          onFinishEdit: (contentState: ContentState, _editorState: EditorState) => {
            setReadOnly(false);
            // 异步更新
            setTimeout(() => {
              const newState = addTable(contentState, _editorState, linkDecorator);
              setEditorState(newState);
            });
          },
          dataSource,
          columns,
        },
      };
    }
    if (_block.getType() === LinkType.LinkCard) {
      const { url, title, id } = blockData;
      return {
        component: LinkCard,
        editable: false,
        props: { url, title, id },
      };
    }
    return null;
  };

  const getEditorData = (state?: EditorState) => {
    const imgList: FileItem[] = [];
    const options = {
      inlineStyleFn: (styles: {
        filter: (arg0: { (value: string): boolean }) => {
          last: () => EditorProps['textAlignment'];
        };
      }) => {
        const color = styles.filter((_value) => _value.startsWith('color-'))?.last();
        const fontSize = styles.filter((_value) => _value.startsWith('fontsize-'))?.last();
        const textAlign =
          styles.filter((_value) => _value.startsWith('textAlign'))?.last() || textAlignment;
        const tempStyle: Record<string, string> = {};
        if (color) {
          tempStyle.color = color?.replace('color-', '');
        }
        if (fontSize) {
          tempStyle.fontSize = fontSize?.replace('fontsize-', '');
        }
        if (textAlign) {
          tempStyle.textAlign = textAlign;
        }
        if (Object.keys(tempStyle).length > 0) {
          return {
            element: 'span',
            style: tempStyle,
          };
        }
      },
      defaultBlockTag: 'div',
      entityStyleFn: (entity: {
        get: (arg0: string) => string;
        getData: () => {
          name: string;
          src: string;
          width?: string;
          style?: CSSProperties;
          alignment: string;
        };
      }) => {
        const entityType = entity.get('type').toLowerCase();
        if (entityType === 'image') {
          const data = entity.getData();
          const width = !!data.width ? data.width : 'auto';
          imgList.push({ fileName: data.name, fileUrl: data.src });
          return {
            element: 'img',
            attributes: {
              src: data.src,
              width,
            },
            style: data?.alignment ? { textAlign: data?.alignment } : { ...data?.style, width },
          };
        }
        if (entityType === 'video') {
          const data = entity.getData();
          return {
            element: 'video',
            attributes: {
              src: data.src || videoData.videoFileId,
              width: 'auto',
            },
          };
        }
      },
      blockStyleFn: (_block: ContentBlock) => {
        const data = _block.getData().toJS();
        const type = _block.getType();
        const { url, title, id, dataSource, columns, textAlign } = data;

        if (type === LinkType.LinkCard || type === 'divider') {
          return {
            attributes: { url, title, type, id },
          };
        }
        if (type === 'table') {
          const tempStrDataSource = encodeURIComponent(JSON.stringify(dataSource));
          const tempStrColumns = encodeURIComponent(JSON.stringify(columns));
          return {
            attributes: {
              dataSource: tempStrDataSource,
              columns: tempStrColumns,
              type,
            },
          };
        }
        if (textAlign) {
          return {
            style: {
              textAlign,
            },
          };
        }
      },
    };
    const contentState = state ? state.getCurrentContent() : editorState.getCurrentContent();
    const pureText = contentState.getPlainText();
    // @ts-ignore
    const html = stateToHTML(contentState, options);
    return {
      htmlText: html,
      imgList,
      pureText,
      videoData,
      editorState: state || editorState,
      uploadVideoData,
    };
  };

  const extraChange = (tempState: EditorState) => {
    // 没有数据或超出最大长度的时候不调用onChange，同时避免表单没值和过长的时候赋值
    const { pureText, htmlText } = getEditorData(tempState);
    if (!isProhibitedToInput) {
      saveDraft.run(tempState);
    }
    if (!maxLength || pureText?.length < maxLength) {
      compositionEditorStateRef.current = tempState;
      setEditorState(tempState);
      if (plainTextLength > 0) {
        onChange?.({ editorState: tempState, pureText, htmlText });
      }
    }
  };

  useImperativeHandle(ref, () => ({
    stopProhibiting: () => {
      setIsProhibited(false);
    },
    startProhibiting: () => {
      setIsProhibited(true);
    },
    getEditorData,
  }));

  // editor获得焦点
  const onEditorFocus = () => {
    if (isProhibitedToInput) {
      setIsProhibited(false);
    }
  };

  const saveDraft = useDebounceFn(
    (tempState: EditorState) => {
      const { htmlText, imgList, pureText } = getEditorData();
      onSaveDraft?.({
        html: htmlText,
        pureText,
        imgList,
        editorState: tempState,
        videoData,
        isUploadedVideo: uploadVideoData.isUploadedVideo,
      });
    },
    { wait: 100 },
  );

  // 处理上传中video标签被覆盖为文字的问题
  const getVideoBlockKey = (tempEditorState: EditorState) => {
    const contentState = tempEditorState.getCurrentContent();
    const blockMap = contentState.getBlockMap();
    let videoBlockKey = null;
    blockMap.forEach((tempBlock, blockKey) => {
      const entityKey = tempBlock?.getEntityAt(0);
      if (tempBlock?.getType() === 'atomic' && entityKey) {
        const entity = contentState.getEntity(entityKey);
        const type = entity.getType();
        if (type === 'VIDEO') {
          videoBlockKey = blockKey;
          return videoBlockKey;
        }
      }
    });
    return videoBlockKey;
  };

  const onInternalChange = (tempState: EditorState) => {
    if (isCompositionRef.current === false) {
      let currentState = tempState;
      const videoBlockKey = getVideoBlockKey(editorState);
      let currentContent = tempState.getCurrentContent();
      if (videoBlockKey) {
        const preBlockContentState = editorState.getCurrentContent();
        const preBlock = preBlockContentState.getBlockForKey(videoBlockKey);
        const curBlock = currentContent.getBlockForKey(videoBlockKey);
        // 因为编辑器自带的问题，上传过程中会把视频转变成文字，此处为了处理这个问题
        if (curBlock?.getType() === 'atomic') {
          currentContent = currentContent.merge({
            blockMap: currentContent.getBlockMap().set(videoBlockKey, preBlock),
          }) as ContentState;
          currentState = EditorState.push(currentState, currentContent, 'insert-characters');
        }
      }
      extraChange(currentState);
    }
  };

  const mapKeyToEditorCommand: EditorProps['keyBindingFn'] = (e) => {
    if (e.code === 'Enter') {
      const blockMap = content.getBlockMap();
      const blockToSplit = blockMap.get(key);
      const text = blockToSplit.getText();
      if (blockType === 'blockquote' && !text) {
        const newState = RichUtils.toggleBlockType(editorState, 'blockquote');
        onInternalChange(newState);
        return null;
      }
    }
    return getDefaultKeyBinding(e);
  };

  const handlePastedFiles = (file: Blob[]): DraftHandleValue => {
    const url: FileItem[] = [];
    Promise.all(file.map(readFile))
      .then((files) => {
        files.forEach((item) => {
          if (item?.data) {
            url.push({
              ...item.data,
              fileUrl: isSaveImageWithFullPath
                ? getApiHostname() + item.data.fileUrl
                : item.data.fileUrl,
            });
          }
        });
      })
      .then(() => {
        pastedFiles(url, editorState, onInternalChange);
      });

    return 'not-handled';
  };

  const onTab: EditorProps['onTab'] = (event) => {
    if (handleKeyCommand('tab', editorState) === 'handled') {
      event.preventDefault();
    }
  };

  // 处理输入中文导致的问题
  const onCompositionStart = (event: React.CompositionEvent) => {
    const anchorKey = selection.getAnchorKey();
    const currentBlock = content.getBlockForKey(anchorKey);
    const offset = selection.getAnchorOffset();

    const entityKey = currentBlock.getEntityAt(offset - 1);
    // 处理新行的第一次输入和链接后面输入
    if (!isStartOfLine && !entityKey) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!readOnly && !isStartOfLine) {
      isCompositionRef.current = true;
    }
    editorStateRef.current = editorState;
  };

  // 异步处理覆盖onChange
  const onCompositionEnd = (event: React.CompositionEvent) => {
    if (isCompositionRef.current === true) {
      let newEditorState = editorStateRef.current;
      const _selection = newEditorState.getSelection();
      let tempContentState;
      if (!_selection.isCollapsed()) {
        tempContentState = Modifier.replaceText(
          newEditorState.getCurrentContent(),
          _selection,
          event.data,
          newEditorState.getCurrentInlineStyle(),
        );
      } else {
        tempContentState = Modifier.insertText(
          newEditorState.getCurrentContent(),
          _selection,
          event.data,
          newEditorState.getCurrentInlineStyle(),
        );
      }
      newEditorState = EditorState.push(newEditorState, tempContentState, 'insert-characters');
      extraChange(newEditorState);
      setTimeout(() => {
        isCompositionRef.current = false;
      }, 30);
      return;
    }
    setTimeout(() => {
      const tempSelection = editorStateRef.current.getSelection();
      const blockKey = tempSelection.getAnchorKey();
      const curSelection = new SelectionState({
        anchorKey: blockKey,
        anchorOffset: event.data.length,
        focusKey: blockKey,
        focusOffset: event.data.length,
      });
      const curEditorState = EditorState.forceSelection(
        compositionEditorStateRef.current,
        curSelection,
      );
      setEditorState(curEditorState);
    }, 50);
  };

  const handleKeyCommand = (command: string, state: EditorState) => {
    if (isCompositionRef.current) {
      return 'not-handled';
    }

    const contentState = state.getCurrentContent();
    const selectionState = state.getSelection();
    const currentBlock = getCurrentBlock(state);
    if (currentBlock.getType() === 'atomic') {
      const newEditorState = removeImage(state);
      setEditorState(newEditorState);
      return 'handled';
    }

    if (command === 'backspace' && (blockType === LinkType.LinkCard || blockType === 'divider')) {
      const newEditorState = removeCustomBlock(state);
      setEditorState(newEditorState);
      return 'handled';
    }

    if (command === 'tab' && allowIndent) {
      if (blockType === 'code-block' || blockType === 'blockquote') {
        setEditorState(
          EditorState.push(
            state,
            Modifier.insertText(
              contentState,
              selectionState,
              ' '.repeat(tabIndent || DefaultTabIndent),
            ),
            'insert-characters',
          ),
        );
        return 'handled';
      }
    }

    const nextEditorState = RichUtils.handleKeyCommand(editorState, command);
    if (nextEditorState) {
      setEditorState(nextEditorState);
      return 'handled';
    }

    return 'not-handled';
  };

  const onAlignChange = (state: EditorState, align: EditorProps['textAlignment']) => {
    onInternalChange(state);
    setTextAlignment(align);
    saveDraft.run(state);
  };

  const blockStyleFn = (_block: ContentBlock) => {
    const blockData = _block.getData() && _block.getData().toJS();
    let result = '';
    if (blockData.textAlign) {
      result = `${prefixCls}-${blockData.textAlign}`;
    }

    return result;
  };

  const toolbarClass = classnames(
    isToolbarBottom && `${prefixCls}-toolbar-bottom`,
    isComponentType ? `${prefixCls}-toolbar-component-top` : `${prefixCls}-toolbar-page-top`,
    toolbarClassName,
  );

  const inputClass = classnames(
    `${prefixCls}-input`,
    isComponentType && `${prefixCls}-input-component`,
    inputClassName,
  );

  const editorClass = classnames(
    `${prefixCls}-whole`,
    isComponentType && `${prefixCls}-component`,
    editorClassName,
  );

  useEffect(() => {
    const isCursor = isShowEditorPopover(editorState);
    setShow(isCursor);
  }, [editorState]);

  const tempToolbar: any[] = [];
  const renderShowControls = showControls?.filter((item) => {
    const isObject = typeof item === 'object';
    return !excludeControls?.some((filterItem) =>
      isObject ? item.key === filterItem : item === filterItem,
    );
  });
  renderShowControls?.forEach((item) => {
    const isObject = typeof item === 'object';
    if (item === '|') {
      tempToolbar.push(<Divider type="vertical" />);
    } else if (isObject) {
      const { key: _key, icon, type, ...restItem } = item;
      const controlData = CONTROLS_MAP[_key];
      const { dom: Dom, icon: Icon, ...restControlData } = controlData;
      const TempIcon = icon || Icon;
      if (Dom) {
        tempToolbar.push(
          <Dom
            {...restControlData}
            {...restItem}
            showTooltip={showTooltip}
            isSaveImageWithFullPath={isSaveImageWithFullPath}
            icon={TempIcon}
            type={_key}
            onChange={_key === 'align' ? onAlignChange : onInternalChange}
            editorState={editorState}
            textAlignment={textAlignment}
          />,
        );
      }
    } else {
      const controlData = CONTROLS_MAP[item];
      if (controlData) {
        const { dom: Dom, icon: Icon, ...restData } = controlData;
        tempToolbar.push(
          <Dom
            {...restData}
            icon={Icon && <Icon />}
            onChange={item === 'align' ? onAlignChange : onInternalChange}
            editorState={editorState}
            isSaveImageWithFullPath={isSaveImageWithFullPath}
            showTooltip={showTooltip}
            type={item}
            textAlignment={textAlignment}
          />,
        );
      }
    }
  });

  const editorData = getEditorData();
  useEffect(() => {
    // 通过判断富文本里面有没有video标签
    const isIncludeVideo = document.getElementsByTagName('video')?.length > 0;
    if (isIncludeVideo) {
      setUploadVideoData({ isUploadedVideo: isIncludeVideo });
    } else {
      setUploadVideoData({
        isUploadedVideo: isIncludeVideo,
        uploadVideoLoading: false,
        uploadVideoPercent: 0,
      });
      setVideoData({
        videoFileId: undefined,
        videoCoverUrl: undefined,
        videoType: undefined,
      });
    }
  }, [editorData?.htmlText]);

  const providerData = useMemo(
    () => ({
      ...editorData,
      uploadVideoData,
      videoData,
      onChangeVideoData(val: BasicVideoData) {
        setVideoData(val);
      },
      onChangeUploadVideoData(data: UploadVideoDataType) {
        setUploadVideoData(data);
      },
    }),

    [editorData, uploadVideoData, videoData],
  );
  return (
    <EditorContext.Provider value={providerData}>
      <div className={`${prefixCls}-body ${className}`} {...rest}>
        {!isToolbarBottom && (
          <div className={toolbarClass}>
            <div>{tempToolbar}</div>
          </div>
        )}
        <div className={inputClass}>
          {header}
          {isShow && <EditPopover editorState={editorState} onChange={onInternalChange} />}
          <div
            className={editorClass}
            onFocus={onEditorFocus}
            onCompositionStartCapture={onCompositionStart}
            onCompositionEndCapture={onCompositionEnd}
          >
            <Editor
              blockStyleFn={blockStyleFn}
              blockRendererFn={blockRendererFn}
              blockRenderMap={extendedBlockRenderMap}
              customStyleFn={customStyleFn}
              editorKey="editor"
              editorState={editorState}
              handleKeyCommand={handleKeyCommand}
              handlePastedFiles={handlePastedFiles}
              keyBindingFn={mapKeyToEditorCommand}
              onChange={onInternalChange}
              onTab={onTab}
              placeholder={
                blockType !== 'unstyled' || content.hasText() ? '' : placeholder || '请输入正文'
              }
              plugins={plugins}
              readOnly={readOnly}
              {...editorProps}
            />
            {showCount && !!maxLength && (
              <div className={`${prefixCls}-count`}>
                {plainTextLength}/{maxLength}
              </div>
            )}
          </div>
          {extraDom && (
            <div>
              <Divider />
              {extraDom}
            </div>
          )}
        </div>
        {isToolbarBottom && (
          <div className={toolbarClass}>
            <div>{tempToolbar}</div>
          </div>
        )}
        {footer}
      </div>
    </EditorContext.Provider>
  );
});

export default RichEditor;
export { linkDecorator };

RichEditor.defaultProps = {
  showControls: DefaultShowControls,
  excludeControls: [],
  toolbarPlacement: 'top',
  tabIndent: DefaultTabIndent,
  allowIndent: true,
};
