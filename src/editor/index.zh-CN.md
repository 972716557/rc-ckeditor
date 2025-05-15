---
title: editor 编辑器
subtitle: 编辑器
group:
  title: 通用组件
---

## 普通编辑器

```jsx
import React from 'react';
import RichEditor from '@/components/editor';
const App = () => <RichEditor />;
export default App;
```

## 自定义头部配置项编辑器

```jsx
import React from 'react';
import RichEditor from '@/components/editor';
const App = () => (
  <RichEditor showControls={['link', 'img', '|', 'color', 'bold', '|', 'redo', 'clear']} />
);

export default App;
```

## 组件类型编辑器

```jsx
import React from 'react';
import RichEditor from '@/components/editor';
const App = () => (
  <RichEditor
    showControls={['link', 'img', '|', 'color', 'bold', '|', 'redo', 'clear']}
    editorType="component"
    toolbarPlacement="bottom"
  />
);
export default App;
```

## 配合 form 表单使用组件类型编辑器

```jsx
import React from 'react';
import RichEditor from '@/components/editor';
import { Button, Form } from 'antd';
const App = () => {
  const [form] = Form.useForm();
  return (
    <Form form={form}>
      <Form.Item name="editor" label="文章">
        <RichEditor
          editorType="component"
          showControls={['link', 'img', '|', 'color', 'bold', '|', 'redo', 'clear']}
          toolbarPlacement="bottom"
        />
      </Form.Item>
      <Form.Item name="button">
        <Button
          onClick={() => {
            console.log(form.getFieldValue('editor'), 'editorValue');
          }}
        >
          打印
        </Button>
      </Form.Item>
    </Form>
  );
};
export default App;
```

## 自定义配置项

```jsx
import React from 'react';
import RichEditor from '@/components/editor';
import { LinkedinOutlined, PictureFilled } from '@ant-design/icons';
import { Button, Form } from 'antd';
const App = () => {
  const [form] = Form.useForm();
  return (
    <Form form={form}>
      <Form.Item name="editor" label="文章">
        <RichEditor
          editorType="component"
          showControls={[
            {
              key: 'link',
              tooltip: '这是一个链接',
              icon: (
                <>
                  <LinkedinOutlined /> 这是一个链接
                </>
              ),
            },
            {
              key: 'img',
              tooltip: '这是一个图片',
              icon: (
                <>
                  <PictureFilled /> 这是一个图片
                </>
              ),
            },
            '|',
            'color',
            'bold',
            '|',
            'redo',
            'clear',
          ]}
          toolbarPlacement="bottom"
        />
      </Form.Item>
      <Form.Item name="button">
        <Button
          onClick={() => {
            console.log(form.getFieldValue('editor'), 'editorValue');
          }}
        >
          打印
        </Button>
      </Form.Item>
    </Form>
  );
};
export default App;
```

## 自定义头部跟尾部

```jsx
import React from 'react';
import RichEditor from '@/components/editor';
import { LinkedinOutlined, PictureFilled } from '@ant-design/icons';
import { Button, Form } from 'antd';
const App = () => {
  return (
    <RichEditor
      header={
        <div style={{ textAlign: 'center', height: '48px', border: '1px solid' }}>这是头部</div>
      }
      footer={
        <div style={{ textAlign: 'center', height: '48px', border: '1px solid' }}>这是尾部</div>
      }
      showControls={['color', 'bold', '|', 'redo', 'clear']}
      extraDom={
        <div style={{ textAlign: 'center', height: '48px', border: '1px solid' }}>
          这是额外想添加的
        </div>
      }
    />
  );
};
export default App;
```

## API

| 参数名 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| allowIndent | 是否允许缩进 | boolean |  | 1.0.0 |
| defaultValue | 默认值 | string |  | 1.0.0 |
| editorClassName | 编辑器类名 | string |  | 1.0.0 |
| editorProps | draftjs 自带属性的 props | EditorProps----Draftjs |  | 1.0.0 |
| editorType | 编辑器类型 | 'component' \| 'page' | ‘page’ | 1.0.0 |
| excludeControls | 不展示的配置 | ControlType[] | [] | 1.0.0 |
| extraDom | 编辑器下面的位置（关联话题、关联产品目前的位置） | ReactDom |  | 1.0.0 |
| footer | 编辑器底部，点击发布 | ReactDom |  | 1.0.0 |
| header | 编辑器头部位置（标题） | ReactDom |  | 1.0.0 |
| inputClassName | 输入区域类名 | string |  | 1.0.0 |
| isSaveImageWithFullPath | 保存的 html 字符串图片是否使用全路径保存 | boolean | false | 1.0.0 |
| maxLength | 编辑器输入最大长度 | number | 6000 | 1.0.0 |
| onChange | 改变编辑器内容触发的回调 | (data: OnChangeType) => void |  | 1.0.0 |
| onSaveDraft | 存草稿 | (data: SaveDraftType) => void; |  | 1.0.0 |
| placeholder | 输入提示 | string | 请输入正文 | 1.0.0 |
| showControls | 展示的配置 | ControlType[] | [ 'undo', 'redo', 'clear', '\|', 'font-size', 'headline', 'color', 'bold', 'italic', 'underline', 'del', 'align', '\|', 'ol', 'ul', '\|', 'link', 'img',] | 1.0.0 |
| showCount | 是否展示当前文章字数 | boolean |  | 1.0.0 |
| showTooltip | 是否展示配置提示 | boolean | true | 1.0.0 |
| tabIndent | 缩进大小 | number | 4 | 1.0.0 |
| toolbarClassName | 配置类名 | string |  | 1.0.0 |
| toolbarPlacement | 配置放置的位置 | 'top' \| 'bottom' | 'top' | 1.0.0 |
| value | 编辑器值 | string |  | 1.0.0 |
