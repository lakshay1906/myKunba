function LoadingSpinner() {
  return (
    <div className="relative flex h-11 w-11">
      <div className="spinner-dot rotate-0 delay-0"></div>
      <div className="spinner-dot rotate-45 delay-1"></div>
      <div className="spinner-dot rotate-90 delay-2"></div>
      <div className="spinner-dot rotate-135 delay-3"></div>
      <div className="spinner-dot rotate-180 delay-4"></div>
      <div className="spinner-dot rotate-225 delay-5"></div>
      <div className="spinner-dot rotate-270 delay-6"></div>
      <div className="spinner-dot rotate-315 delay-7"></div>
    </div>
  )
}

export default LoadingSpinner
export { LoadingSpinner as Loading }
