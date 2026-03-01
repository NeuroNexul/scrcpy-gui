import { useEffect, useState } from "react";
import { Copy, Minus, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import Logo from "@/components/icons/logo";

import {
  Quit,
  WindowIsMaximised,
  WindowMinimise,
  WindowToggleMaximise,
} from "../../wailsjs/runtime/runtime";

type AppBarProps = {
  title: string;
};

function AppBar({ title }: AppBarProps) {
  const [maximised, setMaximised] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const syncMaximisedState = async () => {
      try {
        const isMaximised = await WindowIsMaximised();
        if (isMounted) {
          setMaximised(isMaximised);
        }
      } catch {
      }
    };

    syncMaximisedState();
    window.addEventListener("resize", syncMaximisedState);

    return () => {
      isMounted = false;
      window.removeEventListener("resize", syncMaximisedState);
    };
  }, []);

  const handleToggleMaximise = () => {
    WindowToggleMaximise();
  };

  return (
    <header
      className="drag-region h-8 border-b bg-card select-none flex items-center"
      onDoubleClick={handleToggleMaximise}
    >
      <div className="w-full h-full flex items-center justify-between">
        {/* <div className="w-36" /> */}

        <div className="text-sm font-medium truncate px-2">
          <Logo className="h-4 w-4 mr-2 inline" />
          {title}
          </div>

        <ButtonGroup className="no-drag h-full">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Minimize"
            className="h-full w-12 rounded-none cursor-pointer border-0 shadow-none hover:bg-secondary"
            onClick={WindowMinimise}
          >
            <Minus size={14} strokeWidth={2} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={maximised ? "Restore" : "Maximize"}
            className="h-full w-12 rounded-none cursor-pointer border-0 shadow-none hover:bg-secondary"
            onClick={handleToggleMaximise}
          >
            {maximised ? <Copy size={12} strokeWidth={2} /> : <Square size={12} strokeWidth={2} />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close"
            className="h-full w-12 rounded-none cursor-pointer border-0 shadow-none hover:bg-destructive! hover:text-destructive-foreground!"
            onClick={Quit}
          >
            <X size={14} strokeWidth={2} />
          </Button>
        </ButtonGroup>
      </div>
    </header>
  );
}

export default AppBar;
