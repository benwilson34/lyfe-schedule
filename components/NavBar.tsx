import { useSidebarContext } from "@/contexts/sidebar-context";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function NavBar() {
  const { toggleVisibility: toggleSidebarVisibility } = useSidebarContext();

  return (
    <div className="fixed flex w-full justify-between text-lg leading-none top-0 p-2 z-10 bg-background sm:bg-transparent">
      <div className="">
        <FontAwesomeIcon
          icon={faBars}
          className="cursor-pointer hover:bg-gray-500/25"
          onClick={toggleSidebarVisibility}
        />
      </div>

      <a href="https://lyfeschedule.com/docs/getting-started" target="_blank">
        <FontAwesomeIcon
          icon={faCircleQuestion}
          className="cursor-pointer hover:bg-gray-500/25"
        />
      </a>
    </div>
  );
}
