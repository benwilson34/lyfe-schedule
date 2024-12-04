"use client";

import { parseBoolean } from "@/util/parse-boolean";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";

const IS_SHOWING_KEY = "DemoModeBanner_isShowing";

export function DemoModeBanner() {
  const [isShowing, setIsShowing] = useState<boolean>(true);
  useEffect(() => {
    const storedIsShowing = parseBoolean(localStorage.getItem(IS_SHOWING_KEY));
    if (storedIsShowing !== null) {
      setIsShowing(storedIsShowing);
    }
  }, []);

  function handleDismissButtonClick() {
    setIsShowing(false);
    localStorage.setItem(IS_SHOWING_KEY, JSON.stringify(false));
  }

  if (!isShowing) {
    return null;
  }

  return (
    <div className="bg-accent text-ondark rounded-md sticky bottom-1 mx-2 px-2 py-1 flex flex-row gap-x-2 leading-tight">
      <div className="" onClick={handleDismissButtonClick}>
        <FontAwesomeIcon icon={faXmark} />
      </div>

      <div>
        Hi! 👋 You're currently using LyfeSchedule in demo mode. All data is
        stored local to this device. If you would like to sync your data between
        devices,{" "}
        <a
          className="underline"
          href="mailto:beta@lyfeschedule.com?subject=Request%20for%20beta%20access"
        >
          request full access to the beta
        </a>
        .
      </div>
    </div>
  );
}
