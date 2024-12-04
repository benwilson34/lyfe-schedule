import { GetServerSideProps } from "next";
import { useState } from "react";
import { PulseLoader } from "react-spinners";
import { getToken } from "next-auth/jwt";
import { ADMIN_USER_ID, IS_DEMO_MODE } from "@/util/env";
import NavBar from "@/components/NavBar";
import { sendInvitation } from "@/services/api.service";

export const getServerSideProps = IS_DEMO_MODE
  ? undefined
  : ((async (context) => {
      // check session token to confirm it's an admin
      const authToken = await getToken({ req: context.req });
      if (!authToken) {
        // shouldn't be able to get here
        return { props: { isAdmin: false } };
      }
      const userId = authToken.sub!;
      return { props: { isAdmin: ADMIN_USER_ID && userId === ADMIN_USER_ID } };
    }) satisfies GetServerSideProps);

function SendInvitationPage({ isAdmin }: { isAdmin: boolean }) {
  const [email, setEmail] = useState("");
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  type MajorMessage = {
    body: JSX.Element;
    isError: boolean;
  };
  const [majorMessage, setMajorMessage] = useState<MajorMessage | null>(
    isAdmin
      ? null
      : {
          // TODO should just redirect instead of displaying a message?
          body: (
            <div className="flex flex-col justify-center">
              <div className="text-center">
                You are not authorized to view this page.
              </div>
              <button
                className="rounded-md bg-red-200"
                onClick={() => (window.location.href = "/")}
              >
                Return
              </button>
            </div>
          ),
          isError: true,
        }
  );

  const handleSubmitForm = async () => {
    // prevent multiple simultaneous requests
    if (isLoading) return;
    try {
      setFormErrorMessage(null);
      // TODO validate email
      setIsLoading(true);

      await sendInvitation(email);

      setMajorMessage({
        body: (
          <>
            <div>An invitation has been sent to {email}!</div>
            <button
              className="rounded-md bg-green-200"
              onClick={() => (window.location.href = "/")}
            >
              Return
            </button>
          </>
        ),
        isError: false,
      });
    } catch (maybeError: any) {
      // TODO display generic message
    } finally {
      setIsLoading(false);
    }
  };

  const renderForm = () => (
    // <form className="space-y-6" action="#" method="POST">
    <div className="space-y-6">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Email
        </label>
        <div className="mt-2">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <button
          className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          onClick={handleSubmitForm}
          disabled={isLoading}
        >
          Send invitation
        </button>
      </div>

      {formErrorMessage && (
        <div className="text-red-500">{formErrorMessage}</div>
      )}

      {isLoading && (
        <div className="flex justify-center">
          <PulseLoader color="#d5dedb" className="mt-4" />
        </div>
      )}
      {/* </form> */}
    </div>
  );

  const renderMajorMessage = ({ body, isError }: MajorMessage) => (
    // TODO replace with theme colors?
    <div className={isError ? "text-red-500" : "text-green-500"}>{body}</div>
  );

  return (
    <>
      <NavBar />

      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Send Invitation
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          {majorMessage ? renderMajorMessage(majorMessage) : renderForm()}
        </div>
      </div>
    </>
  );
}

export default IS_DEMO_MODE ? undefined : SendInvitationPage;
