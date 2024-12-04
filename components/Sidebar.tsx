import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faList,
  faTags,
  faArrowRightFromBracket,
  faGear,
  faPaperPlane,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useOnClickOutside } from "usehooks-ts";
import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { useSidebarContext } from "@/contexts/sidebar-context";
import { useModalContext } from "@/contexts/modal-context";
import { useAuthContext } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Overlay from "./Overlay";
import { getTagCounts } from "@/services/api.service";

type TagInfo = {
  name: string;
  count: number;
};

export default function Sidebar({ isDemoMode }: { isDemoMode: boolean }) {
  const { isVisible, setIsVisible } = useSidebarContext();
  const { setCurrentModal } = useModalContext();
  const { isAdmin } = useAuthContext();
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, (e) => {
    setIsVisible(false);
  });
  const router = useRouter();
  const [tagInfo, setTagInfo] = useState<TagInfo[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const tagInfo = Object.entries(await getTagCounts())
          .map(([tagName, tagCount]) => ({ name: tagName, count: tagCount }))
          .sort((a, b) => (b.name > a.name ? -1 : 1)) as TagInfo[];
        setTagInfo(tagInfo);
      } catch (maybeError) {
        console.error(maybeError);
        // TODO display some error message
      }
    };
    fetchData();
  }, []);

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

  const handleTagClick = (tagName: string) => {
    // TODO use `useBreakpoint` hook to check screen size
    setIsVisible(false);
    router.push(`/tagged/${tagName}`);
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

  const handleSettingsClick = () => {
    setIsVisible(false);
    setCurrentModal("settings");
  };

  return (
    <>
      {/* <Panel defaultSize={30} minSize={20} order={1}> */}
      <div
        className={`h-full max-h-full w-72 px-2 pb-2 flex flex-col bg-general text-ondark top-0 z-50 fixed transition-transform duration-400 ease-in-out ${
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
            />
          </div>
        </section>

        <div className="grow">
          <div className="text-4xl text-center mt-10 mb-4">
            <span className="font-bold">Lyfe</span>Schedule
          </div>

          {isDemoMode && (
            <div className="bg-accent text-ondark rounded-md mb-2 px-2 py-1 leading-tight">
              You're in demo mode!{" "}
              <a
                className="underline"
                href="mailto:beta@lyfeschedule.com?subject=Request%20for%20beta%20access"
              >
                Click here to request full access to the beta
              </a>
              .
            </div>
          )}

          <div className="cursor-pointer" onClick={handleCalendarClick}>
            <FontAwesomeIcon icon={faCalendarDays} className="mr-2" />
            calendar
          </div>

          <div className="cursor-pointer" onClick={handleAllTasksClick}>
            <FontAwesomeIcon icon={faList} className="mr-2" />
            all tasks
          </div>

          <div className="w-full">
            <FontAwesomeIcon icon={faTags} className="mr-2" />
            tags
            <div className="mx-4">
              {tagInfo.map(({ name, count }) => (
                <div
                  key={name}
                  className="flex justify-between gap-2 cursor-pointer"
                  onClick={() => handleTagClick(name)}
                >
                  <span className="truncate">#{name}</span>

                  <span className="italic">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="footer">
          {isAdmin && (
            <div
              className="cursor-pointer hover:bg-gray-500/25"
              onClick={handleSendInvitationClick}
            >
              <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
              invite new user
            </div>
          )}

          <a href="mailto:feedback@lyfeschedule.com?subject=LyfeSchedule%20Feedback&body=I%20have%20some%20feedback%20about%20LyfeSchedule%3A%0A%0A">
            <div className="cursor-pointer hover:bg-gray-500/25">
              <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
              send feedback
            </div>
          </a>

          <a
            href="https://docs.lyfeschedule.com/getting-started.html"
            target="_blank"
            className="cursor-pointer hover:bg-gray-500/25"
          >
            <FontAwesomeIcon icon={faCircleQuestion} className="mr-2" />
            need help?
          </a>

          {!isDemoMode && (
            <div
              className="cursor-pointer hover:bg-gray-500/25"
              onClick={handleSignOutClick}
            >
              <FontAwesomeIcon
                icon={faArrowRightFromBracket}
                className="mr-2"
              />
              log out
            </div>
          )}

          <div
            className="cursor-pointer hover:bg-gray-500/25"
            onClick={handleSettingsClick}
          >
            <FontAwesomeIcon icon={faGear} className="mr-2" />
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
