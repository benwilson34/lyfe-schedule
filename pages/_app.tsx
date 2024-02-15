import "@/styles/globals.css";
import "@/styles/CalendarPicker.css";
import type { AppProps } from "next/app";
import { Exo_2 } from "next/font/google";

const exo2 = Exo_2({ subsets: ["latin"] });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={exo2.className}>
      <Component {...pageProps} />
    </main>
  );
}
