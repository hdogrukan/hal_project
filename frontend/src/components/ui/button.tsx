import { PropsWithChildren } from "react";

export function Button({ variant='default', className='', ...p }:PropsWithChildren<any>) {
  const style =
    variant === 'ghost'
      ? 'border border-gray-300 text-gray-700'
      : 'bg-green-700 text-white';
  /*  ↓↓↓  \` ... ${className} \`   (ESCAPE YOK!) */
  return <button {...p} className={`${style} rounded px-3 py-1 ${className}`} />;
}
