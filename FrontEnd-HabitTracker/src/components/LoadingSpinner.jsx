function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="loading-spinner" role="status" aria-live="polite">
      <div className="loading-spinner__ring" />
      <p>{label}</p>
    </div>
  );
}

export default LoadingSpinner;
