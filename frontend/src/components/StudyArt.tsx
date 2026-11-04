export default function StudyArt({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`study-art ${compact ? "compact-art" : ""}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 540 425" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="284" cy="204" r="165" fill="#e7e0f8" />
        <circle
          cx="284"
          cy="204"
          r="186"
          stroke="#c6b7e7"
          strokeDasharray="5 9"
        />
        <path
          d="M104 321c39-40 83-55 132-42 53 14 100-10 157 8l48 62H92l12-28Z"
          fill="#c3d9c7"
        />
        <rect
          x="178"
          y="106"
          width="195"
          height="142"
          rx="11"
          transform="rotate(-8 178 106)"
          fill="#fffcf7"
          stroke="#343431"
          strokeWidth="2"
        />
        <path
          d="m194 126 164-23M208 146l69-10m-66 29 91-13m-86 33 51-7"
          stroke="#b7a8de"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="m302 183 17-30 14 9 19-35"
          stroke="#7460bc"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="151" cy="224" r="29" fill="#c9815b" />
        <path
          d="M125 220c-8-24 12-44 33-34 11 0 23 14 19 28-11 3-23-5-28-11-3 10-14 14-24 17Z"
          fill="#343431"
        />
        <path
          d="M130 251c-28 16-31 56-24 86l66 2c5-35 3-69-20-87"
          fill="#7c68bd"
          stroke="#343431"
          strokeWidth="2"
        />
        <path
          d="m141 278 23 34 53-10"
          stroke="#c9815b"
          strokeWidth="17"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m116 338 6 49m37-49 27 48"
          stroke="#343431"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M111 390h24m41 0h29"
          stroke="#343431"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle cx="381" cy="224" r="28" fill="#e5a887" />
        <path
          d="M355 224c-8-21 3-40 27-40 28-1 38 32 22 50l-10-21c-12 7-24 5-34-2l-5 13Z"
          fill="#343431"
        />
        <path
          d="M365 251c-28 14-33 51-24 85h68c5-38 0-69-27-83"
          fill="#eebc62"
          stroke="#343431"
          strokeWidth="2"
        />
        <path
          d="m372 276-23 32-48-5"
          stroke="#e5a887"
          strokeWidth="17"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m354 339-18 47m60-47 9 47"
          stroke="#343431"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M325 390h23m48 0h24"
          stroke="#343431"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path d="M191 308h145v13H191z" fill="#343431" />
        <path
          d="m211 321-10 73m116-73 10 73"
          stroke="#343431"
          strokeWidth="5"
        />
        <path
          d="m227 303-10-48h72l12 48h-74Z"
          fill="#bcb0e0"
          stroke="#343431"
          strokeWidth="2"
        />
        <circle cx="259" cy="279" r="5" fill="#fffcf7" />
        <path
          d="m69 154 12-5 4-12 5 12 13 5-13 5-5 13-4-13-12-5Zm343-78 8-3 3-9 4 9 9 3-9 4-4 8-3-8-8-4Z"
          fill="#7460bc"
        />
        <path
          d="m449 256 9 9 18-23"
          stroke="#7460bc"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="465" cy="255" r="27" stroke="#7460bc" strokeWidth="2" />
        <path
          d="M108 93c-3-17 14-22 25-12 12-16 31-10 27 6-3 12-23 28-23 28s-26-9-29-22Z"
          fill="#df9e8d"
          transform="rotate(-12 133 94)"
        />
      </svg>
      {!compact && (
        <>
          <div className="art-label art-label-top">
            <span className="art-asterisk">✳</span> A little guidance goes a
            long way.
          </div>
          <div className="art-label art-label-bottom">
            <span className="dot green" /> Your next “aha!” starts here
          </div>
        </>
      )}
    </div>
  );
}
