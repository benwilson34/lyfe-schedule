import React, { Dispatch, createContext, useContext, useState } from "react";
import { TaskViewModel as Task } from "@/types/task.viewModel";
import { Dayjs } from "dayjs";

export type Modal =
  | "none"
  | "edit"
  | "postponeTo"
  | "completeOnAnotherDay"
  | "delete"
  | "settings";
export type ModalContext = {
  currentModal: Modal;
  setCurrentModal: Dispatch<React.SetStateAction<Modal>>;
  // TODO maybe these could be packed into some `addEditModalProps`?
  selectedTask: Task | null;
  onAddEdit: ((task: Task, isAdding: boolean) => void) | null;
  initialStartDate: Dayjs | null;
  onCalendarPickerConfirm: ((selectedDay: Date) => void) | null;
  onConfirmActionConfirm: (() => void) | null;
  showAddEditModal: (
    selectedTask: Task | null,
    onAddEdit: (task: Task, isAdding: boolean) => void,
    initialStartDate?: Dayjs | null
  ) => void;
  showPostponeToModal: (
    selectedTask: Task,
    onConfirm: (selectedDay: Date) => void
  ) => void;
  showCompleteOnAnotherDayModal: (
    selectedTask: Task,
    onConfirm: (selectedDay: Date) => void
  ) => void;
  showDeleteModal: (selectedTask: Task, onConfirm: () => void) => void;
};

export const ModalContext = createContext<ModalContext | null>(null);

export default function ModalContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentModal, setCurrentModal] = useState<Modal>("none");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [onAddEdit, setOnAddEdit] = useState<
    ((task: Task, isAdding: boolean) => void) | null
  >(null);
  const [initialStartDate, setInitialStartDate] = useState<Dayjs | null>(null);
  const [onCalendarPickerConfirm, setOnCalendarPickerConfirm] = useState<
    ((selectedDay: Date) => void) | null
  >(null);
  const [onConfirmActionConfirm, setOnConfirmActionConfirm] = useState<
    (() => void) | null
  >(null);

  const showAddEditModal = (
    selectedTask: Task | null,
    onAddEdit: (task: Task, isAdding: boolean) => void,
    initialStartDate: Dayjs | null = null
  ) => {
    setCurrentModal("edit");
    setSelectedTask(selectedTask);
    setOnAddEdit(onAddEdit);
    setInitialStartDate(initialStartDate);
  };

  const showPostponeToModal = (
    selectedTask: Task,
    onConfirm: (selectedDay: Date) => void
  ) => {
    setCurrentModal("postponeTo");
    setSelectedTask(selectedTask);
    setOnCalendarPickerConfirm(onConfirm);
  };

  const showCompleteOnAnotherDayModal = (
    selectedTask: Task,
    onConfirm: (selectedDay: Date) => void
  ) => {
    setCurrentModal("completeOnAnotherDay");
    setSelectedTask(selectedTask);
    setOnCalendarPickerConfirm(onConfirm);
  };

  const showDeleteModal = (selectedTask: Task, onConfirm: () => void) => {
    setCurrentModal("delete");
    setSelectedTask(selectedTask);
    setOnConfirmActionConfirm(onConfirm);
  };

  return (
    <ModalContext.Provider
      value={{
        currentModal,
        setCurrentModal,
        selectedTask,
        onAddEdit,
        initialStartDate,
        onCalendarPickerConfirm,
        onConfirmActionConfirm,
        showAddEditModal,
        showPostponeToModal,
        showCompleteOnAnotherDayModal,
        showDeleteModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModalContext() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error(
      "useModalContext must be used within a ModalContextProvider"
    );
  }
  return context;
}
