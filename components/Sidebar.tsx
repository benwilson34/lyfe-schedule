import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faList,
  faTags,
  faArrowRightFromBracket,
  faGear,
  faPaperPlane,
  faArrowLeft,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useOnClickOutside } from "usehooks-ts";
import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { useSidebarContext } from "@/contexts/sidebar-context";
import { useModalContext } from "@/contexts/modal-context";
import { useAuthContext } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import Overlay from "./Overlay";

export default function Sidebar() {
  const { isVisible, setIsVisible } = useSidebarContext();
  const { setCurrentModal } = useModalContext();
  const { isAdmin } = useAuthContext();
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, (e) => {
    setIsVisible(false);
  });
  const router = useRouter();

  const onSettingsButtonClick = () => {
    setCurrentModal("settings");
  };

  const handleCalendarClick = () => {
    // TODO use `useBreakpoint` hook to check screen size
    setIsVisible(false);
    router.push("/calendar");
  };

  const handleAllTasksClick = () => {
    // TODO use `useBreakpoint` hook to check screen size
    setIsVisible(false);
    router.push("/all-tasks");
  };

  const handleSendInvitationClick = () => {
    // TODO use `useBreakpoint` hook to check screen size
    setIsVisible(false);
    router.push("/auth/send-invitation");
  };

  const handleSignOutClick = () => {
    // TODO use `useBreakpoint` hook to check screen size
    setIsVisible(false);
    router.push("/api/auth/signout");
  };

  return (
    <>
      {/* <Panel defaultSize={30} minSize={20} order={1}> */}
      <div
        className={`h-full max-h-full px-2 pb-2 flex flex-col bg-general text-ondark top-0 z-20 fixed transition-transform duration-400 ease-in-out ${
          isVisible ? "" : "-translate-x-full"
        }`}
        ref={ref}
      >
        <section className="fixed flex w-full justify-between text-xl top-2">
          <div>
            <FontAwesomeIcon
              icon={faXmark}
              className="cursor-pointer hover:bg-gray-500/25"
              onClick={() => setIsVisible(false)}
            ></FontAwesomeIcon>
          </div>
        </section>

        <div className="grow">
          <div className="text-4xl mt-10 mb-4">
            <span className="font-bold">Lyfe</span>Schedule
          </div>

          <div className="cursor-pointer" onClick={handleCalendarClick}>
            <FontAwesomeIcon
              icon={faCalendarDays}
              className="mr-2"
            ></FontAwesomeIcon>
            calendar
          </div>

          <div className="cursor-pointer" onClick={handleAllTasksClick}>
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
            <div
              className="cursor-pointer hover:bg-gray-500/25"
              onClick={handleSendInvitationClick}
            >
              <FontAwesomeIcon
                icon={faPaperPlane}
                className="mr-2"
              ></FontAwesomeIcon>
              invite new user
            </div>
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

          <div
            className="cursor-pointer hover:bg-gray-500/25"
            onClick={handleSignOutClick}
          >
            <FontAwesomeIcon
              icon={faArrowRightFromBracket}
              className="mr-2"
            ></FontAwesomeIcon>
            log out
          </div>

          <div
            className="cursor-pointer hover:bg-gray-500/25"
            onClick={onSettingsButtonClick}
          >
            <FontAwesomeIcon icon={faGear} className="mr-2"></FontAwesomeIcon>
            settings
          </div>
        </div>
      </div>
      {/* </Panel> */}

      {/* TODO could just add an `onClick` handler here to close the sidebar instead of the `useOnClickOutside` hook */}
      <Overlay isVisible={isVisible} />
    </>
  );
}
