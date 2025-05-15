import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import type { Editor as TinyMCEEditor } from 'tinymce';
import ReactDOM from 'react-dom';

import ImageModal from './image';
import VideoUpload from './video/video-upload';
import Video from './video';
import RemoveFormatSvg from './assets/remove-format-icon';
import UploadVideoIcon from './assets/upload-video-icon';
import UploadImgIcon from './assets/upload-img-icon';
import VideoLoading from './video/video-loading';
import { FontSizeOptions, TinymceEditorId } from './constant';
import { ESpaceEditorInitialVideo, ESpaceEditorLoading } from './video/constant';
import './index.less';

// 在项目中获取资源清单并传递给 TinyMCE

export default function App() {
  const editorRef = useRef<TinyMCEEditor>();
  const log = () => {
    if (editorRef.current) {
      let content = editorRef.current.getContent();
      // 转换自定义 Video 组件为普通 video 标签
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const customVideoWrappers = doc.querySelectorAll('.e-space-editor-video-content');
      customVideoWrappers.forEach((wrapper) => {
        const video = wrapper.querySelector('video');
        if (video) {
          wrapper.parentNode?.replaceChild(video, wrapper);
        }
      });
      content = doc.body.innerHTML;
      console.log(content);
    }
  };
  const [open, setOpen] = useState(false);
  const [isInit, setIsInit] = useState(false);
  const [percent, setPercent] = useState(0);

  const setup = (editor: TinyMCEEditor) => {
    let formatMenuButton: any;
    let fontSizeMenuButton: any; // 保存下拉框按钮的引用

    editor.ui.registry.addButton('custimage', {
      tooltip: '上传图片',
      icon: 'custom-upload-img',
      onAction: () => {
        setOpen(true);
      },
    });

    editor.ui.registry.addButton('custvideo', {
      text: 'video',
      onAction: () => {},
    });

    // 注册自定义下拉菜单
    editor.ui.registry.addMenuButton('fontSizeMenu', {
      text: '15px', // 默认显示文本
      fetch: (callback) => {
        // 生成菜单项
        const items = FontSizeOptions.map((option) => ({
          type: 'menuitem',
          text: option.text,
          onAction: () => {
            // 应用字体大小
            if (option.value === '') {
              editor.execCommand('removeFormat'); // 清除字号格式
            } else {
              editor.execCommand('fontSize', false, option.value);
            }
            fontSizeMenuButton.setText(option.text); // 更新下拉框显示文本
          },
        }));
        callback(items);
      },
      onSetup: (api) => {
        fontSizeMenuButton = api; // 保存按钮引用
        return () => {};
      },
    });

    editor.ui.registry.addIcon('custom-remove-format', RemoveFormatSvg);
    editor.ui.registry.addIcon('custom-upload-video', UploadVideoIcon);
    editor.ui.registry.addIcon('custom-upload-img', UploadImgIcon);

    // 覆盖默认的清除格式按钮
    editor.ui.registry.addButton('custRemoveFormat', {
      tooltip: '清除格式', // 按钮提示文本
      icon: 'custom-remove-format', // 使用自定义图标
      onAction: () => {
        editor.execCommand('removeFormat'); // 执行清除格式命令
      },
    });

    editor.ui.registry.addMenuButton('headingMenu', {
      text: '标题',
      fetch: (callback) => {
        callback([
          {
            type: 'menuitem',
            text: '标题一',
            onAction: () => {
              editor.execCommand('FormatBlock', false, 'h1');
              formatMenuButton.setText('标题一');
            },
          },
          {
            type: 'menuitem',
            text: '标题二',
            onAction: () => {
              editor.execCommand('FormatBlock', false, 'h2');
              formatMenuButton.setText('标题二');
            },
          },
          {
            type: 'menuitem',
            text: '正文',
            onAction: () => {
              editor.execCommand('FormatBlock', false, 'p');
              formatMenuButton.setText('正文');
            },
          },
        ]);
      },
      onSetup: (api) => {
        formatMenuButton = api; // 保存按钮引用
        return () => {}; // 清理函数
      },
    });

    // 监听光标位置变化
    editor.on('NodeChange', (e) => {
      // 监听光标位置变化，动态更新下拉框显示文本
      const currentFontSize = editor.dom.getStyle(e.element, 'font-size') || '';
      const matchedOption = FontSizeOptions.find((opt) => opt.value === currentFontSize);
      fontSizeMenuButton?.setText(matchedOption ? matchedOption.text : '15px');

      const blockTag = editor.dom.getParent(e.element, 'h1,h2,p'); // 获取当前块级标签
      if (blockTag) {
        const tagName = blockTag.tagName.toLowerCase(); // 获取标签名（如 h1、h2、p）
        let displayText = '正文'; // 默认显示文本
        if (tagName === 'h1') displayText = '标题一';
        else if (tagName === 'h2') displayText = '标题二';
        formatMenuButton?.setText(displayText); // 更新下拉框文本
      }
    });

    editor.on('click', (e) => {
      if (e.target.classList.contains('icon-delete2')) {
        const videoWrapper = e.target.closest('.e-space-editor-video-content');
        if (videoWrapper) {
          editor.dom.remove(videoWrapper);
        }
      }
    });

    editor.on('SetContent', () => {
      const contentDocument = editor.getDoc();
      const videos = contentDocument.querySelectorAll(`.${ESpaceEditorInitialVideo}`);
      const loadings = contentDocument.querySelectorAll(`.${ESpaceEditorLoading}`);

      videos.forEach((video) => {
        const src = video.getAttribute('data-mce-src') || '';
        const antdImageWrapper = document.createElement('div');
        const antdImage = <Video fileId={src} editor={editorRef.current} />;
        ReactDOM.render(antdImage, antdImageWrapper);
        video.parentNode?.replaceChild(antdImageWrapper, video);
      });

      loadings.forEach((loadingDom) => {
        const antdImageWrapper = document.createElement('div');
        const antdImage = <VideoLoading percent={percent} />;
        ReactDOM.render(antdImage, antdImageWrapper);
        loadingDom.parentNode?.replaceChild(antdImageWrapper, loadingDom);
      });
    });
  };

  useEffect(() => {
    const customVideoButton = editorRef.current
      ?.getContainer()
      .querySelector('.tox-tbtn[data-mce-name="custvideo"] .tox-tbtn__select-label');
    if (customVideoButton) {
      const videoButton = (
        <VideoUpload
          editor={editorRef.current}
          updataPercent={(data) => {
            setPercent(data);
          }}
        />
      );
      ReactDOM.render(videoButton, customVideoButton);
    }
  }, [isInit]);

  return (
    <>
      <Editor
        id={TinymceEditorId}
        onInit={(evt, editor) => {
          editorRef.current = editor;
          setIsInit(true);
        }}
        apiKey="8i4ht3vqi8kt619mtxxsexmikfmtow62hy04g4zags4mh738"
        initialValue="<p>This is the initial content of the editor.</p>"
        init={{
          height: 1000,
          language: 'zh_CN',
          menubar: false,
          content_css: [
            'https://web.sdk.qcloud.com/player/tcplayer/release/v5.2.0/tcplayer.min.css',
          ],
          toolbar:
            'undo redo custRemoveFormat | headingMenu fontSizeMenu styleselect formatselect | bold italic strikethrough underline | \
        alignleft aligncenter alignright alignjustify | \
        bullist numlist outdent indent | \
       custimage custvideo link',
          plugins: [
            'advlist autolink lists charmap print preview anchor',
            'searchreplace visualblocks code fullscreen',
            'insertdatetime media table paste code help strikethrough underline custRemoveFormat',
            'link',
            'wordcount',
            'fontsize fontSizeMenu',
            'custvideo',
          ],
          setup,
          promotion: false,
          branding: false,
        }}
      />
      <ImageModal
        open={open}
        editor={editorRef.current}
        onCancel={() => {
          setOpen(false);
        }}
        onOk={() => {
          setOpen(false);
        }}
      />
    </>
  );
}
