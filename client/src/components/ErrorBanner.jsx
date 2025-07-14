const ErrorBanner = ({ error }) =>
  error ? <div className="text-red-600 text-center my-4">{error}</div> : null;

export default ErrorBanner;
