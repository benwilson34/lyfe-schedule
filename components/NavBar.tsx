import { useSidebarContext } from "@/contexts/sidebar-context";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function NavBar() {
  const { toggleVisibility: toggleSidebarVisibility } = useSidebarContext();

  return (
    <div className="fixed flex w-full justify-between text-lg top-2 px-2">
      <div>
        <FontAwesomeIcon
          icon={faBars}
          className="cursor-pointer hover:bg-gray-500/25"
          onClick={toggleSidebarVisibility}
        ></FontAwesomeIcon>
      </div>

      <a
        href="https://docs.lyfeschedule.com/getting-started.html"
        target="_blank"
      >
        <FontAwesomeIcon
          icon={faCircleQuestion}
          className="cursor-pointer hover:bg-gray-500/25"
        ></FontAwesomeIcon>
      </a>
    </div>
  );
}
