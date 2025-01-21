import type { AppProps } from "next/app";
import { Geologica } from "next/font/google";
import ModalContextProvider, {
  useModalContext,
} from "@/contexts/modal-context";
import SidebarContextProvider from "@/contexts/sidebar-context";
import Sidebar from "@/components/Sidebar";
import { AddEditTaskModal } from "@/components/AddEditTaskModal";
import { CalendarPickerModal } from "@/components/CalendarPickerModal";
import { isPostponeDateValid } from "@/util/task";
import dayjs from "@/lib/dayjs";
import { ConfirmActionModal } from "@/components/ConfirmActionModal";
import { SettingsModal } from "@/components/SettingsModal";
import { useEffect } from "react";
import SettingsContextProvider, {
  useSettingsContext,
} from "@/contexts/settings-context";
import AuthContextProvider, { useAuthContext } from "@/contexts/auth-context";
import { decryptJwt } from "@/services/api.service";
import Head from "next/head";
import { ToastContainer } from "@/components/ToastContainer";

import "@/styles/globals.css";
import "@/styles/react-toggle-style.css";
import "@/styles/CalendarPicker.css";
import "@/styles/ToastContainer.css";
import { DemoModeBanner } from "@/components/DemoModeBanner";

const geologica = Geologica({ subsets: ["latin"] });

function Modals() {
  const {
    currentModal,
    setCurrentModal,
    selectedTask,
    afterSave,
    initialStartDate,
    initialTags,
    onCalendarPickerConfirm,
    onConfirmActionConfirm,
  } = useModalContext();
  const {
    monthInfoSettings,
    setMonthInfoSettings,
    dayInfoSettings,
    setDayInfoSettings,
  } = useSettingsContext();

  return (
    <>
      {currentModal === "edit" && (
        <AddEditTaskModal
          isOpen={true}
          handleClose={() => setCurrentModal("none")}
          afterSave={afterSave!}
          task={selectedTask!}
          initialStartDate={initialStartDate}
          initialTags={initialTags}
        />
      )}

      {currentModal === "postponeTo" && (
        <CalendarPickerModal
          isOpen={true}
          setIsOpen={() => setCurrentModal("none")}
          onConfirm={onCalendarPickerConfirm!}
          title="Postpone to"
          body={
            <>
              <div>
                Select a day to postpone{" "}
                <span className="font-semibold">{selectedTask!.title}</span> to.
              </div>
              <div className="text-xs">
                Note that the selected day must be after the current day, the
                task&apos;s start date, AND the task&apos;s last postponement.
              </div>
            </>
          }
          confirmButtonText="Postpone"
          isDayValid={(day: any) =>
            isPostponeDateValid(selectedTask!, dayjs(day as Date), dayjs())
          }
        />
      )}

      {currentModal === "completeOnAnotherDay" && (
        <CalendarPickerModal
          isOpen={true}
          setIsOpen={() => setCurrentModal("none")}
          onConfirm={onCalendarPickerConfirm!}
          title="Complete on another day"
          body={
            <>
              <div>
                Forgot to mark this task complete the other day? No problem.
              </div>
              <div>
                Select a day to complete{" "}
                <span className="font-semibold">{selectedTask!.title}</span>.
              </div>
              {selectedTask!.repeatDays && (
                <div>
                  This task will repeat {selectedTask!.repeatDays} days after
                  the chosen day.
                </div>
              )}
            </>
          }
          confirmButtonText="Complete"
          dayFeedback={(day: Date) => {
            const dayIsAfterToday = dayjs(day)
              .startOf("day")
              .isAfter(dayjs().startOf("day"));
            if (!dayIsAfterToday) {
              return <></>;
            }
            return (
              <div className="text-attention leading-tight">
                The selected day in the future - it&apos;s recommended only to
                complete tasks on past days.
              </div>
            );
          }}
        />
      )}

      {currentModal === "delete" && (
        <ConfirmActionModal
          isOpen={true}
          setIsOpen={() => setCurrentModal("none")}
          onConfirm={onConfirmActionConfirm}
          title="Confirm delete"
          body={
            (selectedTask && (
              <div>
                Are you sure you want to delete{" "}
                <span className="font-bold">{selectedTask!.title}</span>?
                <br />
                This action cannot be undone.
              </div>
            )) ||
            undefined
          }
          confirmButtonText="delete"
          confirmButtonClasses="bg-attention text-ondark"
        />
      )}

      {currentModal === "settings" && (
        <SettingsModal
          isOpen={true}
          setIsOpen={() => setCurrentModal("none")}
          monthInfoSettings={monthInfoSettings}
          setMonthInfoSettings={setMonthInfoSettings}
          dayInfoSettings={dayInfoSettings}
          setDayInfoSettings={setDayInfoSettings}
        />
      )}
    </>
  );
}

// I think could do it this way with `getInitialProps`, but the details are annoying me so I'm just
//   going to make an API call on first load for now 🤷‍♂️
//   see: https://nextjs.org/docs/pages/building-your-application/routing/custom-app#getinitialprops-with-app
// export const getServerSideProps = (async (context: any) => {
//   // TODO this would be better as a util function
//   // auth
//   const token = await getToken({ req: context.req });
//   if (!token) {
//     // shouldn't be possible to get to this point
//     console.error(`Error initializing: authentication error!`);
//     return { props: {} };
//   }
//   const userId = token.sub!;

//   const isAdmin = ADMIN_USER_ID && userId === ADMIN_USER_ID;
//   return {
//     props: {
//       isAdmin,
//     },
//   };
// }) satisfies GetServerSideProps;

// there's probably a better way
function Init({ isDemoMode }: { isDemoMode: boolean }) {
  const { setMonthInfoSettings, setDayInfoSettings } = useSettingsContext();
  const { setIsAdmin } = useAuthContext();

  // set application-wide state only on first load
  useEffect(() => {
    async function load() {
      // user-configured settings
      const savedSettings = JSON.parse(
        localStorage.getItem("settings") || "null"
      );
      if (savedSettings) {
        setMonthInfoSettings(savedSettings.monthInfoSettings);
        setDayInfoSettings(savedSettings.dayInfoSettings);
      }

      if (isDemoMode) {
        return;
      }

      // auth payload
      try {
        const { isAdmin } = await decryptJwt();
        setIsAdmin(isAdmin);
      } catch (maybeError: any) {
        console.error(maybeError);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <></>;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>LyfeSchedule</title>
      </Head>

      <ModalContextProvider>
        <SidebarContextProvider>
          <SettingsContextProvider>
            <AuthContextProvider>
              <Init isDemoMode={pageProps.isDemoMode} />

              {/* needed in order to use a single font import across the whole app, see https://github.com/vercel/next.js/discussions/70724#discussioncomment-10824927 */}
              <style jsx global>{`
                :root {
                  --font-geologica: ${geologica.style.fontFamily};
                }
              `}</style>

              <main>
                <Component {...pageProps} />

                {pageProps.isDemoMode && <DemoModeBanner />}

                <Sidebar isDemoMode={pageProps.isDemoMode} />

                <Modals />

                <ToastContainer />
              </main>
            </AuthContextProvider>
          </SettingsContextProvider>
        </SidebarContextProvider>
      </ModalContextProvider>
    </>
  );
}
