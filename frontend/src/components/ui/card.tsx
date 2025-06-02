import { PropsWithChildren } from "react";

export function Card({ className='', ...p }:PropsWithChildren<any>) {
  return <div {...p} className={`bg-white rounded-2xl ${className}`} />;
}

export function CardContent({ className='', ...p }:PropsWithChildren<any>) {
  return <div {...p} className={className} />;
}
