import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PropsWithChildren } from "react";
import ShoppingList from "./ShoppingList";

export function ShoppingListDrawer({ trigger }: { trigger: JSX.Element }) {
  return (
    <Sheet>
      <SheetTrigger>{trigger}</SheetTrigger>
      <SheetContent className="w-80 sm:w-96">
        <ShoppingList />
      </SheetContent>
    </Sheet>
  );
}
