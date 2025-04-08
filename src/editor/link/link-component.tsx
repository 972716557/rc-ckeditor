import { LinkComponentProps } from '../interface';

const LinkComponent: React.FC<LinkComponentProps> = (props) => {
  const { entityKey, contentState, children } = props;

  const { url } = contentState.getEntity(entityKey).getData();

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => {
        e.preventDefault();
      }}
    >
      <span id={entityKey}>{children}</span>
    </a>
  );
};

export default LinkComponent;
