function SkeletonLine({ width = '100%', height = '0.9rem', className = '' }) {
  return <div className={`skeleton skeleton-text ${className || ''}`.trim()} style={{ width, height }} />;
}

function SkeletonBlock({ height = '120px', className = '' }) {
  return <div className={`skeleton ${className || ''}`.trim()} style={{ height }} />;
}

export { SkeletonLine, SkeletonBlock };
export default SkeletonLine;
