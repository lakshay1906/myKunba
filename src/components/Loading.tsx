export default function Spinner() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        className="w-16 h-16 spinner-rotate"
        viewBox="0 0 66 66"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="spinner-path"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          cx="33"
          cy="33"
          r="30"
        />
      </svg>
    </div>
  )
}
