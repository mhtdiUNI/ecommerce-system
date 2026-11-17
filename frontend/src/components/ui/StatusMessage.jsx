function StatusMessage({ type = 'info', children, className = '' }) {
  if (children == null || children === false || (typeof children === 'string' && children.trim() === '') || (Array.isArray(children) && children.length === 0)) {
    return null;
  }

  const classes = [`status-message`, `status-${type}`];

  if (className) {
    classes.push(className);
  }

  return <div className={classes.join(' ')}>{children}</div>;
}

export default StatusMessage;
