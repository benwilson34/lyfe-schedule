export default function Button({
  palette = "general",
  className = "",
  children,
  ...rest
}: React.HTMLProps<HTMLButtonElement> & {
  palette?: "general" | "general-500" | "general-200" | "accent" | "attention";
  className?: string;
  children: React.ReactNode;
}) {
  function getThemeClasses(): string {
    switch (palette) {
      case "general":
      case "general-500":
        return "bg-general text-ondark";
      case "general-200":
        return "bg-general-200 text-light";
      case "accent":
        return "bg-accent text-ondark";
      case "attention":
        return "bg-attention text-ondark";
      default:
        throw new Error(`No palette defined for ${palette}`);
    }
  }

  const classes = [
    "inline-flex justify-center items-center rounded-full px-5 py-1 text-sm font-semibold shadow-md ml-3 w-auto disabled:bg-gray-400 uppercase",
    getThemeClasses(),
    className,
  ].join(" ");

  return (
    <button {...rest} type="button" className={classes}>
      {children}
    </button>
  );
}
