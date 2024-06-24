import { Inter } from "next/font/google";
import "./globals.css";
import favicon from "./favicon.ico";
const inter = Inter({ subsets: ["latin"] });
import Head from "next/head";
export const metadata = {
  title: "QuickYtDigest",
  description: "Youtube video summarizer app",
  icon: favicon,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Head>
        <link rel="icon" href="./favicon.ico" />
      </Head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
