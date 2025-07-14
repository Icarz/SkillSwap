const LoadingSpinner = ({ text = "Loading..." }) => (
  <div className="flex justify-center items-center py-8">
    <span className="text-accent animate-pulse">{text}</span>
  </div>
);

export default LoadingSpinner;
