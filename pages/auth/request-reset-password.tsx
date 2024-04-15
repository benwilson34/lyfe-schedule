import { delay } from "@/util/delay";
import { useState } from "react";
import { PulseLoader } from "react-spinners";

export default function RequestResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string|null>(null);

  const handleSubmitButtonClick = async () => {
    // prevent multiple simultaneous requests
    if (isLoading) return;
    try {
      setMessage(null);
      // TODO validate email
      if (!email) {
        setMessage('Email is required');
        return;
      }
      setIsLoading(true);
      const result = await fetch(`/api/users`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "request-reset-password",
          email,
        }),
      });
      // we don't want to give away whether the email was found or not, thus 401 response is ok
      if (result.status !== 200 && result.status !== 401) {
        throw new Error("Failed to complete operation.");
      }
      setMessage(`If ${email} was in our system, a password reset email was sent to that address. Check your inbox and/or spam folder.`);
    } catch (maybeError: any) {
      // TODO print generic error
      setMessage('The operation could not be completed. Please try again later or send a message to Ben if it keeps happening.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Reset Password
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          {/* <form className="space-y-6" action="#" method="POST"> */}
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
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
                onClick={handleSubmitButtonClick}
                disabled={isLoading || !email}
              >
                Send password reset email
              </button>
            </div>

            {isLoading && (
              <div className="flex justify-center">
                <PulseLoader color="#d5dedb" className="mt-4" />
              </div>
            )}

            {message && (
              <div>
                {message}
              </div>
            )}
          {/* </form> */}
          </div>
        </div>
      </div>
    </>
  )
}
