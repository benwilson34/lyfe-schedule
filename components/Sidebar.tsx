import { Panel } from "react-resizable-panels";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faList,
  faTags,
  faArrowRightFromBracket,
  faGear,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { useSidebarContext } from "@/contexts/sidebar-context";
import { useModalContext } from "@/contexts/modal-context";
import { useAuthContext } from "@/contexts/auth-context";


export default function Sidebar() {
  const { isVisible } = useSidebarContext();
  const { setCurrentModal } = useModalContext();
  const { isAdmin } = useAuthContext();

  // const toggleSidebar = useCallback(
  //   () => setIsVisible(!isVisible),
  //   [isVisible, setIsVisible]
  // );

  const onSettingsButtonClick = () => {
    setCurrentModal("settings");
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Panel defaultSize={30} minSize={20} order={1}>
      <div className="h-full max-h-full overflow-auto p-2 flex flex-col">
        <div className="grow">
          <div className="text-4xl mb-2">LyfeSchedule</div>

          <div className="cursor-pointer">
            <FontAwesomeIcon
              icon={faCalendarDays}
              className="mr-2"
            ></FontAwesomeIcon>
            calendar
          </div>

          <div className="line-through">
            <FontAwesomeIcon icon={faList} className="mr-2"></FontAwesomeIcon>
            all tasks
          </div>

          <div className="line-through">
            <FontAwesomeIcon icon={faTags} className="mr-2"></FontAwesomeIcon>
            tags
          </div>
        </div>

        <div className="footer">
          {isAdmin && (
            <Link href="/auth/send-invitation">
              <div className="cursor-pointer hover:bg-gray-500/25">
                <FontAwesomeIcon
                  icon={faPaperPlane}
                  className="mr-2"
                ></FontAwesomeIcon>
                invite new user
              </div>
            </Link>
          )}

          <a
            href="https://docs.lyfeschedule.com/getting-started.html"
            target="_blank"
            className="cursor-pointer hover:bg-gray-500/25"
          >
            <FontAwesomeIcon
              icon={faCircleQuestion}
              className="mr-2"
            ></FontAwesomeIcon>
            need help?
          </a>

          <Link href="/api/auth/signout">
            <div className="cursor-pointer hover:bg-gray-500/25">
              <FontAwesomeIcon
                icon={faArrowRightFromBracket}
                className="mr-2"
              ></FontAwesomeIcon>
              log out
            </div>
          </Link>

          <div
            className="cursor-pointer hover:bg-gray-500/25"
            onClick={onSettingsButtonClick}
          >
            <FontAwesomeIcon icon={faGear} className="mr-2"></FontAwesomeIcon>
            settings
          </div>
        </div>
      </div>
    </Panel>
  );
}
