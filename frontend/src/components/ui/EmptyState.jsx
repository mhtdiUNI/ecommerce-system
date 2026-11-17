function EmptyState({ title, message, action, icon: Icon }) {
  return (
    <div className="panel panel-padding text-center">
      {Icon ? <div className="mb-md"><Icon size={32} /></div> : null}
      {title ? <h2 className="page-title">{title}</h2> : null}
      <p className="page-subtitle mb-lg">{message}</p>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export default EmptyState;
