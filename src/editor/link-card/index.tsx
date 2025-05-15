import { CSSProperties, ReactNode, useEffect, useState } from 'react';
import { Col, Row } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import empty from '@/assets/product/empty.png';
import styles from './index.less';

interface Props {
  blockProps: {
    url: string;
    title: string | ReactNode;
    style?: CSSProperties;
    id?: string;
  };
}
const getDomain = (url: string) => {
  let domain = '';
  const arr = url.split('/'); //以“/”进行分割
  if (url.includes('http')) {
    if (arr[2]) {
      domain = arr[2];
    }
  } else {
    domain = arr[0];
  }
  return domain ? 'https://' + domain + '/favicon.ico' : empty;
};

const LinkCard = (props: Props) => {
  const { blockProps } = props;
  const { title, url, style, id } = blockProps;
  const [domain, setDomain] = useState(empty);
  useEffect(() => {
    setDomain(getDomain(url));
  }, [url]);

  return (
    <div id={id} className={styles.content} style={style}>
      {/* 使用虚拟title 覆盖整个dom，继承编辑器自带的点击事件（模拟选中文本），并且只有在编辑器内需要整个虚拟dom */}
      {id && <div className={styles.virtualCard}>{title}</div>}
      <div className={styles.card}>
        <div className={styles.title}>{title}</div>
        <Row justify="space-between" wrap={false}>
          <Col flex={1}>
            <div className={styles.url}>
              <LinkOutlined className={styles.icon} /> {url}
            </div>
          </Col>
          <Col className={styles.img}>
            {/* 网址默认图标 */}
            <img
              src={domain}
              alt=""
              onError={(e) => {
                // @ts-ignore
                e.target.src = empty;
              }}
            ></img>
          </Col>
        </Row>
      </div>
    </div>
  );
};
export default LinkCard;
