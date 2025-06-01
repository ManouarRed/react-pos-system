import React from 'react';

interface DuplicateIconProps extends React.SVGProps<SVGSVGElement> {}

export const DuplicateIcon: React.FC<DuplicateIconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125V15L5.25 12.251m9.75 5.001V15M15 9.75h.008v.008H15V9.75zm.75 3.75h.008v.008H15.75v-.008zm.75 3.75h.008v.008H16.5v-.008z"
    />
  </svg>
);