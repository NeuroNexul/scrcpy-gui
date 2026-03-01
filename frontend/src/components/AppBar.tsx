import { useEffect, useState } from "react";
import { Copy, Minus, Square, X } from "lucide-react";
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
      className="drag-region h-8 border-b bg-background select-none flex items-center"
      onDoubleClick={handleToggleMaximise}
    >
      <div className="w-full h-full flex items-center justify-between">
        <div className="w-36" />

        <div className="text-sm font-medium truncate px-2">{title}</div>

        <div className="no-drag h-full flex items-stretch">
          <button
            type="button"
            aria-label="Minimize"
            className="w-12 h-full inline-flex items-center justify-center text-base rounded-r hover:bg-slate-700 transition-colors"
            onClick={WindowMinimise}
          >
            <Minus size={14} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label={maximised ? "Restore" : "Maximize"}
            className="w-12 h-full inline-flex items-center justify-center text-sm hover:bg-slate-700 transition-colors"
            onClick={handleToggleMaximise}
          >
            {maximised ? <Copy size={12} strokeWidth={2} /> : <Square size={12} strokeWidth={2} />}
          </button>
          <button
            type="button"
            aria-label="Close"
            className="w-12 h-full inline-flex items-center justify-center text-base hover:bg-red-600 transition-colors"
            onClick={Quit}
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default AppBar;
