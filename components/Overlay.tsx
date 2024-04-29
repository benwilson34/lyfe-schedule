/**
 * To be used "behind" modals, popovers, etc to:
 *   1. Communicate to the user that the UI is in a state where they cannot interact with other elements on the page
 *   2. Clicking on this area will "exit" the current UI state
 */

export default function Overlay({
  isVisible,
  durationMs = 400,
}: {
  isVisible: boolean;
  durationMs?: number;
}) {
  const intDurationMs = Math.max(0, Math.floor(durationMs));

  return (
    <div
      className={`task__overlay fixed inset-0 transition-colors z-10 duration-${intDurationMs} ${
        isVisible
          ? "bg-disabled-200/75 pointer-events-auto"
          : "bg-disabled-200/0 pointer-events-none"
      }`}
    ></div>
  );
}
