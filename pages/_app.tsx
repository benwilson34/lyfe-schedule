import "@/styles/globals.css";
import "@/styles/CalendarPicker.css";
import type { AppProps } from "next/app";
import { Exo_2 } from "next/font/google";
import ModalContextProvider, {
  useModalContext,
} from "@/contexts/modal-context";
import SidebarContextProvider from "@/contexts/sidebar-context";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import Sidebar from "@/components/Sidebar";
import { EditTaskModal } from "@/components/editTaskModal";
import { CalendarPickerModal } from "@/components/CalendarPickerModal";
import { isPostponeDateValid } from "@/util/task";
import dayjs from "dayjs";
import { ConfirmActionModal } from "@/components/ConfirmActionModal";
import { SettingsModal } from "@/components/settingsModal";
import { useEffect } from "react";
import SettingsContextProvider, {
  useSettingsContext,
} from "@/contexts/settings-context";

const exo2 = Exo_2({ subsets: ["latin"] });

function Modals() {
  const {
    currentModal,
    setCurrentModal,
    selectedTask,
    onAddEdit,
    initialStartDate,
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
        <EditTaskModal
          isOpen={true}
          setIsOpen={() => setCurrentModal("none")}
          onAddEdit={onAddEdit}
          task={selectedTask}
          initialStartDate={initialStartDate}
        />
      )}

      {currentModal === "postponeTo" && (
        <CalendarPickerModal
          isOpen={true}
          setIsOpen={() => setCurrentModal("none")}
          onConfirm={onCalendarPickerConfirm}
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
            isPostponeDateValid(selectedTask!, day as Date)
          }
        />
      )}

      {currentModal === "completeOnAnotherDay" && (
        <CalendarPickerModal
          isOpen={true}
          setIsOpen={() => setCurrentModal("none")}
          onConfirm={onCalendarPickerConfirm}
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

// there's probably a better way
function Init() {
  const { setMonthInfoSettings, setDayInfoSettings } = useSettingsContext();

  useEffect(() => {
    const savedSettings = JSON.parse(
      localStorage.getItem("settings") || "null"
    );
    if (savedSettings) {
      setMonthInfoSettings(savedSettings.monthInfoSettings);
      setDayInfoSettings(savedSettings.dayInfoSettings);
    }
  }, []); // only read from localStorage on first load

  return <></>;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ModalContextProvider>
      <SidebarContextProvider>
        <SettingsContextProvider>
          <Init />

          <PanelGroup direction="horizontal" className={`max-h-screen flex`}>
            <Sidebar isAdmin={false} />

            <PanelResizeHandle className="w-2 border-l-2 border-gray-500/25" />

            <Panel minSize={50} order={2}>
              <main className={exo2.className}>
                <Component {...pageProps} />
              </main>
            </Panel>
          </PanelGroup>

          <Modals />
        </SettingsContextProvider>
      </SidebarContextProvider>
    </ModalContextProvider>
  );
}
