import React, {
  createContext,
  useContext,
  useState,
  PropsWithChildren,
} from "react";

/* ---------------------------------------------------------------
   Basit Drawer: Sheet – SheetTrigger – SheetContent
   --------------------------------------------------------------- */
interface Ctx {
  open: boolean;
  setOpen: (v: boolean) => void;
}
const SheetCtx = createContext<Ctx | null>(null);

export function Sheet({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  return (
    <SheetCtx.Provider value={{ open, setOpen }}>
      {children}
    </SheetCtx.Provider>
  );
}

/* Trigger çocuğu clone edip onClick ekler */
export function SheetTrigger({ children }: { children: JSX.Element }) {
  const ctx = useContext(SheetCtx)!;
  return React.cloneElement(children, {
    onClick: () => ctx.setOpen(true),
  });
}

/* Sağdan kayan panel + backdrop */
export function SheetContent({
  children,
  className = "",
}: PropsWithChildren<{ className?: string }>) {
  const ctx = useContext(SheetCtx)!;

  if (!ctx.open) return null;

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={() => ctx.setOpen(false)}
      />

      {/* drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-80 max-w-[90vw] transform-gpu
                    translate-x-full animate-[slideIn_.3s_ease-out_forwards]
                    bg-gray-50 shadow-xl ${className}`}
      >
        <button
          className="absolute top-3 right-4 text-2xl"
          onClick={() => ctx.setOpen(false)}
        >
          ×
        </button>
        <div className="pt-10 px-4 h-full flex flex-col">{children}</div>
      </aside>

      {/* basit keyframes */}
      <style jsx>{`
        @keyframes slideIn {
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
