import { tokenPayloadDaoToDto } from "@/types/tokenPayload.dao";
import { TokenPayloadDto } from "@/types/tokenPayload.dto";
import { GetServerSideProps } from "next";
import { getTokenPayload } from "../api/users";
import { ReactFragment, useState } from "react";
import { delay } from "@/util/delay";
import { PulseLoader } from "react-spinners";

export const getServerSideProps = (async (context) => {
  // TODO check token/fetch payload
  const { token } = context.query;
  if (!token || Array.isArray(token)) {
    // TODO initial error props
    return { props: {} };
  }

  const tokenPayload = await getTokenPayload(token, true);
  if (!tokenPayload) {
    // TODO handle invalid/expired token
    return { props: {} };
  }

  return {
    props: {
      tokenPayload,
    },
  };
}) satisfies GetServerSideProps;

export default function ResetPasswordPage({
  tokenPayload,
}: {
  tokenPayload?: TokenPayloadDto & { email: string };
}) {
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  type MajorMessage = {
    body: JSX.Element;
    isError: boolean;
  };
  const [majorMessage, setMajorMessage] = useState<MajorMessage | null>(
    tokenPayload
      ? null
      : {
          body: (
            <div className="flex flex-col justify-center">
              <div className="text-center">The token is invalid or expired.</div>
              <button 
                className="rounded-md bg-red-200"
                onClick={() => window.location.href = '/api/auth/signin'}
              >Try again</button>
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
      // check that password1 meets requirements
      if (password1.length < 8) {
        setFormErrorMessage("Password needs to be at least 8 characters long.");
        return;
      }
      // check that password1 matches password2
      if (password1 !== password2) {
        setFormErrorMessage("Passwords do not match.");
        return;
      }
      setIsLoading(true);
      await delay(2000); // TODO remove

      const result = await fetch(`/api/users`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "set-new-password",
          token: tokenPayload!.token,
          password: password1,
        }),
      });
      if (result.status !== 200) {
        const body = await result.json();
        console.error(body);
        throw new Error("Failed to complete operation.");
      }
      setMajorMessage({
        body: (
          <>
            <div>
              Your password has been successfully reset!
            </div>
            <button 
              className="rounded-md bg-green-200"
              onClick={() => window.location.href = '/auth/sign-in'}
            >Sign in</button>
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
          Email address
        </label>
        <div className="mt-2">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            value={tokenPayload!.email}
            readOnly
            disabled
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="password1"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            New password
          </label>
        </div>
        <div className="mt-2">
          <input
            id="password1"
            name="password1"
            type="password"
            autoComplete="current-password"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            value={password1}
            onChange={(e) => setPassword1(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="password2"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            New password again
          </label>
        </div>
        <div className="mt-2">
          <input
            id="password2"
            name="password2"
            type="password"
            autoComplete="current-password"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
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
          Submit
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
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Reset Password
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          {majorMessage ? renderMajorMessage(majorMessage) : renderForm()}
        </div>
      </div>
    </>
  );
}
